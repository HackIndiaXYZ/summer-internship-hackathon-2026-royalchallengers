const { query } = require('../db/pool');
const { runAnalysisPipeline } = require('../pipeline/orchestrator');

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
    // 1. Resolve user ID
    let finalUserId = isUUID(userId) ? userId : null;

    // 2. Fetch user's persona for personalized analysis
    let persona = {
      riskFactors: ['General Health'],
      goals: ['General Wellness'],
      restrictions: []
    };

    if (finalUserId) {
      try {
        const personaRes = await query(
          'SELECT * FROM personas WHERE user_id = $1',
          [finalUserId]
        );
        if (personaRes.rows[0]) {
          const p = personaRes.rows[0];
          persona = {
            riskFactors: p.health_conditions || ['General Health'],
            goals: p.health_goals || ['General Wellness'],
            restrictions: p.dietary_preferences || []
          };
        }
      } catch (dbErr) {
        console.warn('[Controller] Could not fetch persona, using defaults:', dbErr.message);
      }
    }

    // 3. Run the AI pipeline
    let analysis;
    let productName = typeof content === 'string' ? content : 'Unknown Product';

    try {
      console.log('[Controller] Invoking 9-Agent AI Pipeline...');
      const pipelineResult = await runAnalysisPipeline(
        { type, content },
        persona
      );
      analysis = pipelineResult.report;

      // Extract product name from the new schema
      productName =
        analysis?.product?.name ||
        (typeof content === 'string' ? content : 'Unknown Product');

    } catch (aiError) {
      console.error('[Controller] AI Pipeline error:', aiError.message);
      // Return a proper error — no fake fallback reports
      return res.status(500).json({
        error: 'Analysis pipeline is currently unavailable. Please try again in a moment.',
        detail: aiError.message
      });
    }

    // 4. Determine overall verdict for DB indexing
    const overallVerdict = (
      analysis?.verdict?.label ||
      'LIMIT'
    ).toLowerCase();

    const validVerdict = ['safe', 'limit', 'avoid'].includes(overallVerdict)
      ? overallVerdict
      : 'limit';

    // 5. Persist to DB
    const insertResult = await query(
      `INSERT INTO scans (user_id, input_method, analysis_result, overall_verdict, product_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        finalUserId,
        type || 'text',
        JSON.stringify(analysis),
        validVerdict,
        productName.slice(0, 200) // cap at 200 chars
      ]
    );

    const scanId = insertResult.rows[0].id;

    console.log(`[Controller] Scan ${scanId} saved. Verdict: ${validVerdict}`);

    res.status(201).json({
      success: true,
      scanId,
      analysis
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
      'SELECT id, user_id, input_method, overall_verdict, product_name, created_at FROM scans WHERE user_id = $1 ORDER BY created_at DESC',
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
