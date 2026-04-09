const https = require('https');
const axios = require('axios');
const { jsonrepair } = require('jsonrepair');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load Multi-Key Pool (V3.2)
const NVIDIA_KEYS = [
  process.env.NVIDIA_API_KEY,
  process.env.NVIDIA_API_KEY_2,
  process.env.NVIDIA_API_KEY_3
].filter(Boolean);

let currentKeyIndex = 0;

/**
 * Get the next API key in the rotation (Round-Robin)
 */
function getNextKey() {
  if (NVIDIA_KEYS.length === 0) return null;
  const key = NVIDIA_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % NVIDIA_KEYS.length;
  return key;
}

// CONCURRENCY GUARD: Simple Semaphore to limit parallel bursts
let activeRequests = 0;
const MAX_CONCURRENT = 12; // Optimized for 3-key rotation (4 per key) to handle 9-agent parallel bursts
const requestQueue = [];

async function throttleRequest(fn) {
  if (activeRequests < MAX_CONCURRENT) {
    activeRequests++;
    try {
      return await fn();
    } finally {
      activeRequests--;
      if (requestQueue.length > 0) {
        const next = requestQueue.shift();
        next();
      }
    }
  } else {
    return new Promise((resolve) => {
      requestQueue.push(() => {
        resolve(throttleRequest(fn));
      });
    });
  }
}

// Shared HTTPS Agent for Connection Pooling (Keep-Alive)
const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 128,          // Boosted for high-parallel 9-agent bursts
  keepAliveMsecs: 1500,     // Slightly longer for pipeline reuse
  scheduling: 'fifo'        // Ensure predictable wave execution
});

const nvidiaClient = axios.create({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  httpsAgent,
  timeout: 30000   // Reduced to 30s for faster failover/fallback
});

/**
 * HIGH-ACCURACY MODEL ROUTING (V3.3)
 */
const CLINICAL_MODEL = 'meta/llama-3.1-8b-instruct'; // Defaulting to 8B for <15s target
const AGILITY_MODEL = 'meta/llama-3.1-8b-instruct';
const VISION_MODEL = 'meta/llama-3.2-11b-vision-instruct'; // Switch to 11B (10x faster than 90B)

/**
 * PRODUCTION-GRADE JSON REPAIR ENGINE (V5.0)
 */
function fixJson(str) {
  if (!str) return null;
  try {
    return jsonrepair(str);
  } catch (error) {
    let fixed = str.trim();
    // Rapid regex fixes for common LLM truncation/syntax errors
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    // Ensure it ends with a brace if truncated
    if (fixed.startsWith('{') && !fixed.endsWith('}')) fixed += '}';
    return fixed;
  }
}

/**
 * Rapid JSON extraction from LLM text output.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;

  // FAST PATH: Try for exact markers first
  const markers = [
    { start: "<<<JSON_START>>>", end: "<<<JSON_END>>>" },
    { start: "```json", end: "```" },
    { start: "{", end: "}" } // Logical fallback
  ];

  for (const m of markers) {
    const sIdx = text.indexOf(m.start);
    const eIdx = text.lastIndexOf(m.end);

    if (sIdx !== -1) {
      let raw = "";
      if (eIdx !== -1 && eIdx > sIdx) {
        // If marker is '{', include it
        const offset = m.start === "{" ? 0 : m.start.length;
        const endOffset = m.end === "}" ? 1 : 0;
        raw = text.substring(sIdx + offset, eIdx + endOffset).trim();
      } else {
        const offset = m.start === "{" ? 0 : m.start.length;
        raw = text.substring(sIdx + offset).trim();
      }

      if (raw) {
        try { return JSON.parse(raw); } catch (_) {
          try { return JSON.parse(fixJson(raw)); } catch (__) { }
        }
      }
    }
  }

  // 2. Fallback: Regex for largest JSON block (V5.1 - Resilient to conversational text)
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    const raw = match[0];
    try { return JSON.parse(raw); } catch (_) {
      try { return JSON.parse(fixJson(raw)); } catch (__) { }
    }
  }

  // 3. Last effort: Partial repair if it starts with { but never ended
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1 && text.lastIndexOf('}') < firstBrace) {
    const raw = text.substring(firstBrace);
    try { return JSON.parse(fixJson(raw)); } catch (_) { }
  }

  return null;
}

/**
 * Optimized NVIDIA API Call
 */
async function callNvidiaAPI(model, messages, maxTokens = 400) {
  return throttleRequest(async () => {
    const key = getNextKey();
    if (!key) throw new Error('NVIDIA_API_KEY is missing');

    try {
      const response = await nvidiaClient.post('/chat/completions', {
        model,
        messages,
        temperature: 0.01,
        max_tokens: maxTokens,
        top_p: 1.0 // Faster sampling
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        }
      });

      return response.data.choices?.[0]?.message?.content || '{}';
    } catch (error) {
      throw error;
    }
  });
}

/**
 * Run an AI agent with REFLECTIVE SELF-CORRECTION (V4.1)
 */
async function runNvidiaAgent(prompt, systemInstruction, options = {}) {
  const {
    retries = 1,       // Reduced to 1 for speed
    maxTokens = 600,   // Reduced from 1200
    modelType = 'clinical',
    image = null,
    ensureJSON = true
  } = options;

  let userContent = prompt;
  if (image) {
    const isUrl = typeof image === 'string' && image.startsWith('http');
    const imageUrl = (isUrl || (typeof image === 'string' && image.startsWith('data:')))
      ? image
      : `data:image/jpeg;base64,${image}`;

    // VISION-FIRST: Place image before text to prime the model's visual context
    userContent = [
      { type: 'image_url', image_url: { url: imageUrl } },
      { type: 'text', text: prompt }
    ];
  }

  const systemSuffix = ensureJSON
    ? "\n\nReturn ONLY raw JSON between <<<JSON_START>>> and <<<JSON_END>>>. No markdown. No chatter."
    : "";

  const messages = [
    { role: 'system', content: `${systemInstruction}${systemSuffix}` },
    { role: 'user', content: userContent }
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    let model = AGILITY_MODEL;
    if (modelType === 'clinical') model = CLINICAL_MODEL;
    if (modelType === 'vision') model = VISION_MODEL;

    // FALLBACK
    if (attempt === retries && model === CLINICAL_MODEL) model = AGILITY_MODEL;

    // DIAGNOSTIC: Log model and prompt summary
    const promptSummary = typeof prompt === 'string' ? prompt.substring(0, 120) : 'multi-content';
    console.log(`[NVIDIA] model=${model} | attempt=${attempt} | prompt="${promptSummary}..."`);
    if (modelType === 'vision' && image) {
      const imgType = typeof image === 'string' && image.startsWith('http') ? 'URL' : 'base64';
      console.log(`[NVIDIA] Vision image type: ${imgType}, length: ${typeof image === 'string' ? image.length : 'N/A'}`);
    }

    try {
      const raw = await callNvidiaAPI(model, messages, maxTokens);

      // DIAGNOSTIC: Log raw response summary
      console.log(`[NVIDIA] Raw response (first 300 chars): ${typeof raw === 'string' ? raw.substring(0, 300) : JSON.stringify(raw).substring(0, 300)}`);

      if (!ensureJSON) return raw;

      const parsed = extractJSON(raw);
      if (parsed) {
        // DIAGNOSTIC: Log key fields from parsed result
        if (modelType === 'vision') {
          console.log(`[NVIDIA] Parsed vision result — product_name: "${parsed.product_name}", ingredients length: ${parsed.ingredients?.length || 0}, claims: ${parsed.marketing_claims?.length || 0}`);
        }
        return parsed;
      }

      console.warn(`[NVIDIA] JSON extraction failed for attempt ${attempt}. Raw length: ${raw?.length || 0}`);
      // Log failure but continue
      if (attempt < retries) {
        messages.push({ role: 'assistant', content: raw });
        messages.push({ role: 'user', content: "Fix JSON syntax. Markers only." });
      }
    } catch (err) {
      console.error(`[NVIDIA] API error on attempt ${attempt}: ${err.message}`);
      if (attempt === retries) return ensureJSON ? { error: true, message: err.message } : `Error: ${err.message}`;
      await new Promise(r => setTimeout(r, 1000)); // Fast wait
    }
  }

  return ensureJSON ? { error: true, message: "Pipeline extraction failed" } : "Error";
}

module.exports = { runNvidiaAgent, extractJSON };
