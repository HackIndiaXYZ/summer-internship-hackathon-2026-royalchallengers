const https = require('https');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

// Optimized model routing for high-speed performance (<20s target)
const CLINICAL_MODEL = 'meta/llama-3.1-70b-instruct'; // Upgraded from 8B for higher extraction reliability
const VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct'; // Keep high-accuracy for OCR
const AGILITY_MODEL = 'meta/llama-3.1-8b-instruct'; 

/**
 * Robust JSON extraction from LLM text output.
 */
function extractJSON(text) {
  if (!text || typeof text !== 'string') return null;
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try { return JSON.parse(cleaned); } catch (_) { }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch (_) {
      try { return JSON.parse(objMatch[0].replace(/,\s*([}\]])/g, '$1')); } catch (__) { }
    }
  }
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch (_) { } }
  return null;
}

/**
 * Make a raw HTTP call to NVIDIA API with timeout handling
 */
function callNvidiaAPI(model, messages, maxTokens = 1000) {
  return new Promise((resolve, reject) => {
    if (!NVIDIA_API_KEY) return reject(new Error('NVIDIA_API_KEY is missing'));

    const payload = JSON.stringify({
      model, messages, temperature: 0.1, max_tokens: maxTokens, top_p: 0.8
    });

    const options = {
      hostname: 'integrate.api.nvidia.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      },
      timeout: 120000 // 120s timeout for high-reasoning stability
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            resolve(json.choices?.[0]?.message?.content || '{}');
          } catch (e) { reject(new Error('Invalid JSON from NVIDIA')); }
        } else if (res.statusCode === 429) {
          const err = new Error('Rate Limited');
          err.status = 429;
          reject(err);
        } else if (res.statusCode === 413) {
          const err = new Error('Payload Too Large (413)');
          err.status = 413;
          reject(err);
        } else {
          reject(new Error(`API Error ${res.statusCode}`));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('NVIDIA API Timeout')); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Run an AI agent with intelligent model routing.
 * @param {string} prompt - The user prompt
 * @param {string} systemInstruction - System instruction
 * @param {Object} options - { modelType: 'clinical' | 'vision' | 'agility', retries: number, ensureJSON: boolean }
 */
async function runNvidiaAgent(prompt, systemInstruction, options = {}) {
  const { 
    retries = 2, 
    maxTokens = 2000, 
    modelType = 'clinical', 
    image = null,
    ensureJSON = true 
  } = options;
  
  let userContent = prompt;
  
  // Multi-modal support for Vision models
  if (modelType === 'vision' && image) {
    // Ensure image is in proper data URI format if it's base64
    const imageUrl = image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`;
    userContent = [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: imageUrl } }
    ];
  }

  const systemSuffix = ensureJSON 
    ? "\nIMPORTANT: Your response MUST be a single, valid JSON object. No conversational filler, no markdown blocks, no 'Here is your JSON'. START with { and END with }."
    : "";

  const messages = [
    { role: 'system', content: `${systemInstruction}${systemSuffix}` },
    { role: 'user', content: userContent }
  ];

  for (let attempt = 0; attempt <= retries; attempt++) {
    // Determine model based on type and attempt
    let model = AGILITY_MODEL;
    if (modelType === 'clinical') model = CLINICAL_MODEL;
    if (modelType === 'vision') model = VISION_MODEL;
    
    // Fallback to 8B on last attempt if not already using it
    if (attempt === retries && model !== AGILITY_MODEL) {
      console.log(`[NVIDIA] Falling back to high-agility text model for attempt ${attempt + 1}`);
      model = AGILITY_MODEL;
      // STRIP multi-modal content for text-only model fallback
      if (Array.isArray(messages[1].content)) {
        messages[1].content = messages[1].content.find(c => c.type === 'text')?.text || prompt;
      }
    }

    try {
      console.log(`[NVIDIA] Executing ${model.split('/')[1] || model} (${modelType}, Attempt ${attempt + 1})...`);
      const raw = await callNvidiaAPI(model, messages, maxTokens);
      
      if (!ensureJSON) return raw;

      const parsed = extractJSON(raw);
      if (parsed) return JSON.stringify(parsed);
      
      console.warn(`[NVIDIA] Retrying: Attempt ${attempt + 1} failed JSON parse. Raw length: ${raw.length}`);
      if (attempt === retries) {
        console.error(`[NVIDIA] Final attempt failed. Raw output snippet: ${raw.substring(0, 200)}`);
      }
    } catch (err) {
      if (err.status === 413) {
        console.error(`[NVIDIA] FATAL 413: Image payload too large. Forcing immediate text-only fallback.`);
        // Force immediate fallback by setting attempt = retries and stripping image
        attempt = retries;
        if (Array.isArray(messages[1].content)) {
          messages[1].content = messages[1].content.find(c => c.type === 'text')?.text || prompt;
        }
        continue; // Re-run as text-only immediately
      }

      console.error(`[NVIDIA] Error on ${model.split('/')?.[1] || model}:`, err.message);
      if (err.status === 429 && attempt < retries) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); 
      } else if (attempt === retries) {
        return ensureJSON ? JSON.stringify({ fallback: true, error: err.message }) : `Error: ${err.message}`;
      }
    }
  }
  return ensureJSON ? JSON.stringify({ fallback: true }) : "Error: Maximum retries exceeded";
}

// Aliasing for compatibility with legacy code
const runGeminiAgent = runNvidiaAgent;

module.exports = { runNvidiaAgent, runGeminiAgent, extractJSON };
