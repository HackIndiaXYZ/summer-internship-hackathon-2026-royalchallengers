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
  maxSockets: 128, 
  keepAliveMsecs: 1000
});

const nvidiaClient = axios.create({
  baseURL: 'https://integrate.api.nvidia.com/v1',
  httpsAgent,
  timeout: 90000 
});

/**
 * HIGH-ACCURACY MODEL ROUTING (V3.2)
 */
const CLINICAL_MODEL = 'meta/llama-3.1-70b-instruct'; 
const AGILITY_MODEL = 'meta/llama-3.1-8b-instruct'; 
const VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct'; 

/**
 * PRODUCTION-GRADE JSON REPAIR ENGINE (V4.2)
 * Uses the jsonrepair package for deep structural fixes.
 */
function fixJson(str) {
  if (!str) return null;
  try {
    return jsonrepair(str);
  } catch (error) {
    // Advanced Regex Fallback for extremely mangled strings
    let fixed = str.trim();
    fixed = fixed.replace(/,\s*([}\]])/g, '$1'); // Trailing commas
    fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Unquoted keys (standard)
    fixed = fixed.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":'); // Aggeressive key quoting
    return fixed;
  }
}

/**
 * Robust JSON extraction from LLM text output.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;
  
  // LAYER 1: Strict Delimiter Extraction (Highest Priority)
  const startMarker = "<<<JSON_START>>>";
  const endMarker = "<<<JSON_END>>>";
  const startIdx = text.indexOf(startMarker);
  const endIdx = text.lastIndexOf(endMarker.substring(0, 10)); 

  if (startIdx !== -1) {
    let raw = "";
    if (endIdx !== -1 && endIdx > startIdx) {
      raw = text.substring(startIdx + startMarker.length, endIdx).trim();
    } else {
      // Fallback: If no end marker, try to find the last closing brace
      const contentAfterStart = text.substring(startIdx + startMarker.length);
      const lastBrace = contentAfterStart.lastIndexOf('}');
      if (lastBrace !== -1) {
         raw = contentAfterStart.substring(0, lastBrace + 1).trim();
      } else if (contentAfterStart.includes('":')) {
         raw = `{${contentAfterStart.trim()}}`; // Brute force wrap
      }
    }
    
    if (raw) {
      try { return JSON.parse(raw); } catch (_) { 
        try { return JSON.parse(fixJson(raw)); } catch (__) { }
      }
    }
  }

  // LAYER 2: Markdown Code Block Guard
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    const cleaned = jsonBlockMatch[1].trim();
    try { return JSON.parse(cleaned); } catch (_) { 
      try { return JSON.parse(fixJson(cleaned)); } catch (__) { }
    }
  }

  // LAYER 3: Aggressive Bracketing
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    try { return JSON.parse(jsonStr); } catch (_) {
      try { return JSON.parse(fixJson(jsonStr)); } catch (__) { }
    }
  }

  // LAYER 4: Final Naked Context Wrapper
  if (text.includes('":')) {
     const potential = `{${text.trim()}}`;
     try { return JSON.parse(potential); } catch (_) {
       try { return JSON.parse(fixJson(potential)); } catch (__) { }
     }
  }
  
  return null;
}

/**
 * Optimized NVIDIA API Call using Connection Pooling
 */
async function callNvidiaAPI(model, messages, maxTokens = 500) {
  return throttleRequest(async () => {
    const key = getNextKey();
    if (!key) throw new Error('NVIDIA_API_KEY is missing');

    try {
      const response = await nvidiaClient.post('/chat/completions', {
        model,
        messages,
        temperature: 0.01, // Near-zero for deterministic clinical mapping
        max_tokens: maxTokens,
        top_p: 0.7
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        }
      });

      return response.data.choices?.[0]?.message?.content || '{}';
    } catch (error) {
      if (error.response?.status === 429) {
        console.warn(`[NVIDIA_RATE_LIMIT] Key: ${key.substring(0, 8)}... hitting limit on ${model}`);
      }
      throw error;
    }
  });
}

/**
 * Run an AI agent with REFLECTIVE SELF-CORRECTION (V4.0)
 */
async function runNvidiaAgent(prompt, systemInstruction, options = {}) {
  const { 
    retries = 3, 
    maxTokens = 1500, 
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
    
    userContent = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageUrl } }
    ];
  }

  // ENFORCE DELIMITER PROTOCOL
  const systemSuffix = ensureJSON 
    ? "\n\nCRITICAL: Return ONLY valid, RFC-compliant JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> markers. Ensure every key is quoted, and there are NO trailing commas. Do not explain anything outside the markers."
    : "";

  const messages = [
    { role: 'system', content: `${systemInstruction}${systemSuffix}` },
    { role: 'user', content: userContent }
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    let model = AGILITY_MODEL;
    if (modelType === 'clinical') model = CLINICAL_MODEL;
    if (modelType === 'vision') model = VISION_MODEL;
    
    // MODEL FALLBACK
    if (attempt === retries && model !== AGILITY_MODEL) {
      console.log(`[NVIDIA] FALLBACK to 8B for final robustness check...`);
      model = AGILITY_MODEL;
    }

    try {
      console.log(`[NVIDIA] ${modelType.toUpperCase()} | ${model.split('/')[1]} | Try ${attempt + 1}/${retries + 1}`);
      const raw = await callNvidiaAPI(model, messages, maxTokens);
      
      if (!ensureJSON) return raw;

      const parsed = extractJSON(raw);
      if (parsed) return parsed;
      
      // LOG FAILURE TO FILE
      const logPath = path.join(__dirname, '../../tmp/llm_debug_dump.log');
      const logEntry = `\n[${new Date().toISOString()}] AGENT ERROR | Model: ${model} | JSON Parse Failed\nRAW OUTPUT:\n${raw}\n-------------------\n`;
      try { 
        if (!fs.existsSync(path.dirname(logPath))) fs.mkdirSync(path.dirname(logPath), { recursive: true });
        fs.appendFileSync(logPath, logEntry); 
      } catch (e) { console.error("Logger failed:", e.message); }

      // REFLECTIVE CORRECTION (Attempt 2+)
      if (attempt < retries) {
        console.warn(`[NVIDIA] Reflective Retry ${attempt + 1}: Prompting model to fix its own syntax error.`);
        messages.push({ role: 'assistant', content: raw });
        messages.push({ role: 'user', content: "CRITICAL ERROR: The output above was not valid JSON or was missing the markers. Please return ONLY the corrected JSON, starting with <<<JSON_START>>> and ending with <<<JSON_END>>>. Do not include any text before or after the markers." });
      }

    } catch (err) {
      const status = err.response?.status;
      if ((status === 429 || status >= 500) && attempt < retries) {
        const delay = (Math.pow(2, attempt) * 4000) + (Math.random() * 2000); 
        console.log(`[NVIDIA] Net Backoff: ${Math.round(delay/1000)}s...`);
        await new Promise(r => setTimeout(r, delay)); 
      } else if (attempt === retries) {
        return ensureJSON ? { error: true, message: `System error: ${err.message}` } : `Error: ${err.message}`;
      }
    }
  }

  return ensureJSON ? { error: true, message: "Maximum self-correction cycles exceeded. Pipeline stalled." } : "Error: Max retries";
}

module.exports = { runNvidiaAgent, extractJSON };
