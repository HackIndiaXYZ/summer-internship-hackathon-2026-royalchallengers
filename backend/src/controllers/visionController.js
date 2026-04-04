const { processProductImage } = require('../services/visionService');
const { performScanAnalysis } = require('./scanController');
const cloudinary = require('../lib/cloudinary');
const fs = require('fs');

/**
 * [UNIFIED IMAGE PIPELINE — CLOUDINARY + AI ORCHESTRATOR]
 * 1. Receive file via Multer (Disk)
 * 2. Upload to Cloudinary (Primary Persistence)
 * 3. Perform Full 9-Agent Analysis via Orchestrator using Cloudinary URL
 * 4. Save to PostgreSQL and Redis
 * 5. Return scanId and URL for UI
 */
/**
 * [UNIFIED IMAGE PIPELINE — ASYNCHRONOUS POLLING VERSION]
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
    try {
      // Step 2: Cloudinary Upload
      setStatus(scanId, { step: 2, label: 'Syncing with medical database...' });
      const uploadResult = await cloudinary.uploader.upload(filePath, {
        folder: 'medo_veda_scans'
      });
      const imageUrl = uploadResult.secure_url;

      // Step 3: Global Orchestration
      setStatus(scanId, { step: 3, label: 'Initializing 9-agent clinical sequence...' });
      const result = await performScanAnalysis({
        type: 'image',
        content: imageUrl,
        userId: userId,
        imageUrl: imageUrl,
        scanId: scanId
      });

      // Step 9: Completion
      setStatus(scanId, { step: 9, label: 'Report ready.', complete: true, result });
      
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});

    } catch (err) {
      console.error('[Async Pipeline Error]', err);
      setStatus(scanId, { complete: true, error: err.message });
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => {});
    }
  })();
}


// Legacy support/OCR-only extraction
async function extractImageText(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
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
