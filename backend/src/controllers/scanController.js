const { query } = require('../db/pool');
const { runAnalysisPipeline } = require('../pipeline/orchestrator');
const { getCache, setCache } = require('../lib/cache');
const crypto = require('crypto');

/**
 * Scan Controller — robust scan creation, history, and retrieval
 */
async function createScan(req, res) {
  const { type, content, userId } = req.body;
  console.log(`[Controller] Starting Analysis. Method: ${type}, User: ${userId}`);

  const isUUID = (str) => str && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(str);

  if (!content) {
    return res.status(400).json({ error: 'Product content is required for analysis.' });
  }

  try {
    // 1. Generate Cache Key (Fingerprint of the content)
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    const cacheKey = `scan:${userId}:${contentHash}`;

    // 2. Check Redis Cache First
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      console.log('[Scan] Returning cached result for user:', userId);
      return res.json({
        success: true,
        scanId: cachedResult.id,
        analysis: typeof cachedResult.analysis_result === 'string' ? JSON.parse(cachedResult.analysis_result) : cachedResult.analysis_result,
        cached: true
      });
    }

    // 3. Resolve user ID
    let finalUserId = isUUID(userId) ? userId : null;

    // 4. Fetch user's persona for personalized analysis
    let persona = {};
    if (finalUserId) {
      const personaRes = await query('SELECT * FROM personas WHERE user_id = $1', [finalUserId]);
      persona = personaRes.rows[0] || {};
    }

    // 5. Run the AI pipeline
    const { report } = await runAnalysisPipeline(
      { type, content },
      persona
    );

    // 6. Determine overall verdict for DB indexing
    const overallVerdict = (report.verdict?.label || 'LIMIT').toLowerCase();
    const productName = report.product?.name || (typeof content === 'string' ? content : 'Unknown Product');

    // 7. Persist to DB
    const insertResult = await query(
      `INSERT INTO scans (user_id, input_method, analysis_result, overall_verdict, product_name, health_score)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        finalUserId,
        type || 'text',
        JSON.stringify(report),
        overallVerdict,
        productName.slice(0, 200),
        report.verdict.score || 5.0
      ]
    );

    const savedScan = insertResult.rows[0];
    console.log(`[Controller] Scan ${savedScan.id} saved. Verdict: ${overallVerdict}`);

    // 8. Cache the result for 24 hours
    await setCache(cacheKey, savedScan, 86400);

    res.status(201).json({
      success: true,
      scanId: savedScan.id,
      analysis: report
    });

  } catch (error) {
    console.error('[CRITICAL] Scan Controller failure:', error);
    res.status(500).json({ error: 'System processing failure. Please try again.' });
  }
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
    console.error('[Controller] getScanHistory error:', error);
    res.status(500).json({ error: 'Failed to fetch scan history' });
  }
}

async function getScanById(req, res) {
  const { id } = req.params;
  try {
    const result = await query('SELECT * FROM scans WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Scan not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[Controller] getScanById error:', error);
    res.status(500).json({ error: 'Failed to fetch scan' });
  }
}

module.exports = { createScan, getScanHistory, getScanById };
