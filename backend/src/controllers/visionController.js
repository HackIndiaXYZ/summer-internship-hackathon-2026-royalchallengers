const path = require('path');
const { runNvidiaAgent } = require('../lib/nvidia');

// Process the uploaded image to extract text for the pipeline
async function extractImageText(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    const systemPrompt = `You are a clinical-grade OCR and visual evidence specialist.
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
    
    Important: If the image is blurry, do your absolute best to infer the chemical names. Do not hallucinate, but do not ignore text.`;

    const userPrompt = `Analyze this image and return the extracted product details including brand, name, and ingredients.`;

    console.log('[Vision Controller] Delegating OCR to Unified NVIDIA Agent...');

    const result = await runNvidiaAgent(userPrompt, systemPrompt, {
      modelType: 'vision',
      image: base64Image,
      maxTokens: 2000,
      retries: 2
    });

    const parsedResult = JSON.parse(result);

    if (parsedResult.fallback) {
      console.warn('[Vision Controller] Agent triggered fallback. Image analysis may be degraded.');
      // If we fall back to text-only, we might get an error message or empty string
      const errorMessage = parsedResult.error || 'Vision analysis failed, falling back to manual entry.';
      return res.status(200).json({ 
        success: true, 
        text: `IMAGE_EXTRACTION_FAILED: ${errorMessage}. Please use manual entry.`,
        fallback: true 
      });
    }

    // Convert JSON back to the flat text format the frontend expects for simple parsing
    const content = typeof parsedResult === 'object' 
      ? Object.entries(parsedResult).map(([k, v]) => `[${k}]: ${v}`).join('\n')
      : String(parsedResult);

    console.log('[Vision Controller] Extraction Successful. Chars:', content.length);
    return res.status(200).json({ success: true, text: content });

  } catch (err) {
    console.error('[Vision Controller] Critical error:', err.stack);
    res.status(500).json({ error: 'Internal server error processing image' });
  }
}

module.exports = { extractImageText };
