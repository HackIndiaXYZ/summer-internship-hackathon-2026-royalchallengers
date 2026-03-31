const { processProductImage } = require('../services/visionService');

// Process the uploaded image to extract text for the pipeline
async function extractImageText(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;

    console.log('[Vision Controller] Delegating analysis to high-fidelity vision service...');
    
    const { raw: rawText, structured: parsedResult } = await processProductImage(base64Image);

    if (parsedResult.fallback) {
      console.warn('[Vision Controller] Agent triggered fallback during structuring.');
      return res.status(200).json({ 
        success: true, 
        text: `IMAGE_EXTRACTION_PARTIAL: ${rawText.substring(0, 500)}...`,
        fallback: true 
      });
    }

    console.log('[Vision Controller] Successful Extraction. Product:', parsedResult.name);
    
    return res.status(200).json({ 
      success: true, 
      data: parsedResult,
      raw: rawText 
    });

  } catch (err) {
    console.error('[Vision Controller] Critical error:', err.stack);
    res.status(500).json({ error: 'Internal server error processing image' });
  }
}

module.exports = { extractImageText };
