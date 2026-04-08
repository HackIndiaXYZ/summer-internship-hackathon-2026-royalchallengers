const { query } = require('../db/pool');
const { runAnalysisPipeline } = require('../pipeline/orchestrator');
const { getCache, setCache } = require('../lib/cache');
const crypto = require('crypto');

/**
 * CORE LOGIC: Perform analysis, handle persistence (DB + Redis), and handle caching.
 * Extracted to support both legacy and new Cloudinary unified paths.
 */
async function performScanAnalysis({ type, content, userId, imageUrl: imageUrlPromise, scanId = null }) {
  const isUUID = (str) => str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  // 1. Generate Cache Key early (using content hash)
  const contentHash = crypto.createHash('md5').update(content).digest('hex');
  const cacheKey = `scan:${userId}:${contentHash}`;

  // 2. Check Redis Cache First
  const cachedResult = await getCache(cacheKey);
  if (cachedResult) {
    console.log('[Specimen Analysis] Returning cached result for identifier:', contentHash);
    return {
      success: true,
      scanId: cachedResult.id,
      analysis: typeof cachedResult.analysis_result === 'string' ? JSON.parse(cachedResult.analysis_result) : cachedResult.analysis_result,
      cached: true
    };
  }

  // 3. Kick off AI pipeline immediately using original content (Base64 for images)
  // We pass the pending promises for imageUrl and persona for late-binding within the pipeline.
  const finalUserId = isUUID(userId) ? userId : null;
  const personaPromise = finalUserId
    ? query('SELECT * FROM personas WHERE user_id = $1', [finalUserId]).then(res => res.rows[0] || {})
    : Promise.resolve({});

  const pipelineResultPromise = runAnalysisPipeline(
    { type, content, imageUrl: imageUrlPromise },
    personaPromise,
    scanId
  );

  // 4. Resolve Cloudinary URL in parallel (with 15s backstop)
  const resolvedImagePromise = (imageUrlPromise instanceof Promise)
    ? Promise.race([
      imageUrlPromise,
      new Promise(resolve => setTimeout(() => resolve(null), 15000))
    ])
    : Promise.resolve(imageUrlPromise);

  // 5. Await AI result and resolved components together
  const [report, resolvedImageUrl] = await Promise.all([
    pipelineResultPromise,
    resolvedImagePromise
  ]);

  // Inject resolved image URL back into the report for consistent frontend consumption
  if (resolvedImageUrl) {
    report.imageUrl = resolvedImageUrl;
  }

  const verdictLabel = (report.overallVerdict || 'limit').toLowerCase();
  const healthScore = report.healthImpact?.personalizedRiskScore || 50;
  const productName = report.productName || (type === 'image' ? 'Product Scan' : 'Clinical Analysis');

  // 6. Persistence (PostgreSQL Archive)
  let dbScanId = null;
  let savedToDB = false;

  try {
    const insertResult = await query(
      `INSERT INTO scans (user_id, input_method, analysis_result, overall_verdict, product_name, health_score, input_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        finalUserId,
        type || 'text',
        JSON.stringify(report),
        verdictLabel,
        productName.slice(0, 200),
        healthScore,
        resolvedImageUrl || (type === 'image' && content ? `data:image/jpeg;base64,${content}` : null)
      ]
    );
    dbScanId = insertResult.rows[0].id;
    savedToDB = true;
    console.log(`[Persistence] Clinical record archived successfully: ${dbScanId}`);
  } catch (dbError) {
    console.error('[Persistence] DB Failure:', dbError.message);
    if (dbError.detail) console.error('[Persistence] DB Error Detail:', dbError.detail);
    dbScanId = `TEMP-SCAN-${contentHash.slice(0, 8)}-${Date.now()}`;
    console.warn(`[Persistence] Falling back to temporary ID: ${dbScanId}`);
  }

  // Use DB ID for long-term consistency, or fall back to the scanId (UUID) if needed
  const finalScanId = dbScanId || scanId;

  // 7. Persistence (Redis Hot-Store)
  const resultToCache = {
    id: finalScanId,
    user_id: finalUserId,
    input_method: type || 'text',
    analysis_result: report,
    overall_verdict: verdictLabel,
    product_name: productName,
    health_score: healthScore,
    input_image: resolvedImageUrl || (type === 'image' && content ? `data:image/jpeg;base64,${content}` : null),
    created_at: new Date().toISOString(),
    is_temporary: !savedToDB
  };

  try {
    await setCache(`scan:id:${finalScanId}`, resultToCache, 86400);
    await setCache(cacheKey, resultToCache, 86400);
  } catch (redisErr) {
    console.error('[Persistence] Redis Failure:', redisErr.message);
  }

  return {
    success: true,
    scanId: finalScanId,
    analysis: report,
    productName,
    imageUrl: resolvedImageUrl || null
  };
}

/**
 * Legacy/Standard Scan Creation
 */
/**
 * [UNIFIED MANUAL/TEXT SCAN — ASYNCHRONOUS POLLING VERSION]
 */
async function createScan(req, res) {
  const { type, content, userId, imageUrl } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Product content is required for analysis.' });
  }

  const { v4: uuidv4 } = require('uuid');
  const scanId = uuidv4();
  const { setStatus } = require('../lib/scanStatusStore');

  // 1. Respond Immediately
  setStatus(scanId, { step: 1, label: 'Initializing clinical session...', complete: false });
  res.status(202).json({ success: true, scanId, status: 'processing' });

  // 2. Background Processing
  (async () => {
    try {
      setStatus(scanId, { step: 2, label: 'Parsing botanical metadata...' });

      const result = await performScanAnalysis({ type, content, userId, imageUrl, scanId });

      setStatus(scanId, { step: 9, label: 'Analysis complete.', complete: true, result });
    } catch (err) {
      console.error('[Async Scan Error]', err);
      setStatus(scanId, { complete: true, error: err.message });
    }
  })();
}


async function getScanHistory(req, res) {
  const { userId } = req.params;
  const isUUID = (str) => str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  if (!isUUID(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const result = await query(
      'SELECT id, user_id, input_method, overall_verdict, product_name, health_score, created_at, analysis_result FROM scans WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('[Controller] getScanHistory error:', error.message || error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
}

async function getScanById(req, res) {
  const { id } = req.params;
  try {
    const cached = await getCache(`scan:id:${id}`);
    if (cached) {
      const data = typeof cached.analysis_result === 'string' ? { ...cached, analysis_result: JSON.parse(cached.analysis_result) } : cached;
      return res.json({ success: true, data });
    }

    const { getStatus } = require('../lib/scanStatusStore');
    const status = getStatus(id);

    if (status && status.complete) {
      return res.json({ success: true, data: status.result });
    }

    const { query } = require('../db/pool');
    const result = await query('SELECT * FROM scans WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      // If we have a processing status but not complete, return 202 instead of 404
      if (status && !status.complete) {
        return res.status(202).json({
          status: 'processing',
          message: 'Specimen analysis is currently in progress.'
        });
      }
      return res.status(404).json({
        error: 'Scan Record Expired',
        message: 'The clinical analysis for this specimen is no longer available.'
      });
    }

    const scan = result.rows[0];
    const reportData = {
      ...scan,
      analysis_result: typeof scan.analysis_result === 'string' ? JSON.parse(scan.analysis_result) : scan.analysis_result
    };

    try {
      await setCache(`scan:id:${id}`, reportData, 86400);
    } catch (e) { }

    return res.json({
      success: true,
      data: {
        ...reportData,
        analysis_result: typeof reportData.analysis_result === 'string'
          ? JSON.parse(reportData.analysis_result)
          : reportData.analysis_result
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Clinical Retrieval Failure.' });
  }
}

async function getScanStatus(req, res) {
  const { getStatus } = require('../lib/scanStatusStore');
  const status = getStatus(req.params.scanId);

  if (!status) {
    return res.json({
      step: 1,
      label: 'Initializing...',
      complete: false,
      error: null
    });
  }

  const { result, ...statusWithoutResult } = status;
  res.json({
    ...statusWithoutResult,
    hasResult: !!result
  });
}

async function getScanResult(req, res) {
  const { getStatus } = require('../lib/scanStatusStore');
  const status = getStatus(req.params.scanId);

  if (!status) {
    return res.status(404).json({ error: 'Scan not found.' });
  }
  if (!status.complete) {
    return res.status(202).json({ status: 'processing' });
  }
  if (status.error) {
    return res.status(500).json({ error: status.error });
  }

  res.json({ success: true, data: status.result });
}

module.exports = { createScan, getScanHistory, getScanById, performScanAnalysis, getScanStatus, getScanResult };
