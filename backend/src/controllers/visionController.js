const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

if (!NVIDIA_API_KEY) {
  console.error('[Vision Controller] FATAL: NVIDIA_API_KEY is missing from environment. PATH:', path.resolve(__dirname, '../../.env'));
}

// Process the uploaded image to extract text for the pipeline
async function extractImageText(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const payload = JSON.stringify({
      model: "meta/llama-3.2-90b-vision-instruct", // High-accuracy 90B Vision model
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a clinical-grade OCR and visual evidence specialist.
              Extract ALL data from this product label with 100% fidelity.
              
              Tasks:
              1. Transcribe the BRAND and exact PRODUCT NAME.
              2. Transcribe the ENTIRE INGREDIENT LIST (even if small). Do not skip any chemical names or numbers.
              3. Identify any NUTRITIONAL VALUES (Calories, Sugar, Salt, Fat, Protein).
              4. Identify any CLAIMS made on the label (e.g. "Natural", "High Protein").
              
              Format:
              [Brand]: ...
              [Name]: ...
              [Ingredients]: ...
              [Nutrition]: ...
              [Claims]: ...
              
              Important: If the image is blurry, do your absolute best to infer the chemical names. Do not hallucinate, but do not ignore text.`
            },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.1
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
      timeout: 60000 // 60s timeout for vision
    };

    console.log('[Vision Controller] Requesting OCR from NVIDIA 90B Vision...');

    const reqApi = https.request(options, (resApi) => {
      let data = '';
      resApi.on('data', chunk => data += chunk);
      resApi.on('end', () => {
        if (resApi.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            const content = json.choices?.[0]?.message?.content || '';
            console.log('[Vision Controller] Extraction Successful. Chars:', content.length);
            return res.status(200).json({ success: true, text: content });
          } catch (e) {
            console.error('[Vision Controller] JSON Parse Error:', e.message);
            return res.status(500).json({ error: 'Failed to interpret vision model output' });
          }
        } else {
          console.error(`[Vision Controller] NVIDIA API Error ${resApi.statusCode}:`, data.slice(0, 500));
          const message = resApi.statusCode === 429 ? 'Rate limit reached on vision engine' : 'Vision analysis failed';
          return res.status(resApi.statusCode).json({ error: message });
        }
      });
    });

    reqApi.on('error', (e) => {
      console.error('[Vision Controller] Network/Request Error:', e.message);
      res.status(500).json({ error: 'Connection failed — check NVIDIA API availability' });
    });

    // Set a 45 second timeout for large images/complex extraction
    reqApi.setTimeout(45000, () => {
      console.warn('[Vision Controller] Request timed out');
      reqApi.destroy();
      if (!res.headersSent) res.status(504).json({ error: 'Vision analysis timed out' });
    });

    reqApi.write(payload);
    reqApi.end();

  } catch (err) {
    console.error('[Vision Controller] Critical error:', err);
    res.status(500).json({ error: 'Internal server error processing image' });
  }
}

module.exports = { extractImageText };
