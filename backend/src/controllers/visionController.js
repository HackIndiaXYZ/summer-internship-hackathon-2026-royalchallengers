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

  // 2. Background Processing (Zero-Wait Parallelization V6.0)
  (async () => {
    let base64Image = null;
    try {
      // Step 2.1: Immediate File Read
      base64Image = fs.readFileSync(filePath, { encoding: 'base64' });
      console.log(`[Vision Controller] Starting clinical sequence: ${(base64Image.length / 1024).toFixed(0)}KB`);

      // Step 2.2: Launch Pipeline AND Cloudinary in Parallel
      // We don't wait for Cloudinary to START the pipeline.
      const cloudinaryPromise = cloudinary.uploader.upload(filePath, {
        folder: 'medo_veda_scans',
        resource_type: 'image'
      }).then(res => res.secure_url).catch(err => {
        console.warn('[Vision Controller] Cloudinary sync failed:', err.message);
        return null;
      });

      // Pass the cloudinaryPromise (or just let the pipeline run and we'll attach the URL later)
      // Actually, performScanAnalysis expects imageUrl. We'll wait for Cloudinary 
      // but ONLY for the DB record, while the AI vision starts immediately with base64.

      setStatus(scanId, { step: 2, label: 'Dual-path clinical processing...' });

      const result = await performScanAnalysis({
        type: 'image',
        content: base64Image,        // Start AI immediately with base64
        userId: userId,
        imageUrl: cloudinaryPromise, // Pass PROMISE to scanController (will be awaited inside)
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

    fs.unlink(filePath, () => { });

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
