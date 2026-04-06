const { performScanAnalysis } = require('./scanController');
const cloudinary = require('../lib/cloudinary');
const fs = require('fs');

/**
 * [UNIFIED IMAGE PIPELINE — ASYNCHRONOUS POLLING VERSION V5.0]
 * 
 * FLOW:
 * 1. Receive file via Multer (disk)
 * 2. Upload to Cloudinary (primary persistence)
 * 3. Read file as base64 for AI vision processing
 * 4. Run full 9-agent analysis pipeline
 * 5. Return scanId for polling
 *
 * CRITICAL FIX (V5.0): Previously sent Cloudinary URL as `content` to the pipeline,
 * but the vision service needed base64. Now sends base64 as content AND imageUrl separately.
 */
async function analyzeImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No image detected.' });
  }

  const { v4: uuidv4 } = require('uuid');
  const scanId = uuidv4();
  const { setStatus } = require('../lib/scanStatusStore');
  const filePath = req.file.path;
  const userId = req.body.userId || 'GUEST';

  // 1. Respond Immediately
  setStatus(scanId, { step: 1, label: 'Uploading clinical specimen...', complete: false });
  res.status(202).json({ success: true, scanId, status: 'processing' });

  // 2. Background Processing
  (async () => {
    let imageUrl = null;
    try {
      // Read file as base64 FIRST (before it gets deleted)
      const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });
      console.log(`[Vision Controller] Image loaded: ${(base64Image.length / 1024).toFixed(0)}KB base64`);

      // Step 2: Cloudinary Upload (async, non-blocking for pipeline)
      setStatus(scanId, { step: 2, label: 'Syncing with medical database...' });
      
      // Start Cloudinary upload but DON'T wait for it — let it run in background
      const cloudinaryPromise = cloudinary.uploader.upload(filePath, {
        folder: 'medo_veda_scans'
      }).then(result => {
        imageUrl = result.secure_url;
        console.log(`[Vision Controller] Cloudinary upload complete: ${imageUrl}`);
        return imageUrl;
      }).catch(err => {
        console.error('[Vision Controller] Cloudinary upload failed (non-critical):', err.message);
        return null;
      });

      // Step 3: Start pipeline immediately with base64 content
      setStatus(scanId, { step: 3, label: 'Initializing 9-agent clinical sequence...' });
      
      // Wait for cloudinary URL (we need it for DB persistence)
      // But with a tight timeout — don't let it block the pipeline
      const cloudinaryUrl = await Promise.race([
        cloudinaryPromise,
        new Promise(resolve => setTimeout(() => resolve(null), 8000)) // 8s max wait
      ]);

      const result = await performScanAnalysis({
        type: 'image',
        content: base64Image,        // BASE64 for vision AI processing
        userId: userId,
        imageUrl: cloudinaryUrl,      // Cloudinary URL for DB persistence
        scanId: scanId
      });

      // Step 9: Completion
      setStatus(scanId, { step: 9, label: 'Report ready.', complete: true, result });

    } catch (err) {
      console.error('[Vision Controller] Pipeline Error:', err.message);
      console.error('[Vision Controller] Stack:', err.stack);
      setStatus(scanId, { complete: true, error: err.message });
    } finally {
      // Clean up temp file
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) { /* ignore cleanup errors */ }
    }
  })();
}


// Legacy support/OCR-only extraction
async function extractImageText(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    const { processProductImage } = require('../services/visionService');
    const filePath = req.file.path;
    const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });
    const { raw: rawText, structured: parsedResult } = await processProductImage(base64Image);
    
    fs.unlink(filePath, () => {});

    return res.status(200).json({ 
      success: true, 
      data: parsedResult,
      raw: rawText 
    });
  } catch (err) {
    console.error('[Vision Controller] extractImageText error:', err.stack);
    res.status(500).json({ error: 'Internal server error processing image' });
  }
}

module.exports = { extractImageText, analyzeImage };
