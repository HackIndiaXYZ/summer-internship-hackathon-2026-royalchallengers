const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * REASONING AGENT (V4.0 - Advanced Clinical Logic)
 * Combines Deep Reasoning (Molecular Contradictions) and Goal-based Analysis.
 */
async function analyzeReasoning(product, persona, options = {}) {
  const prompt = `[MODE: CLINICAL_DEEP_REASONING_V4]
  Analyze the following product specimen for this persona:
  
  PRODUCT: ${JSON.stringify(product)}
  PERSONA: ${JSON.stringify(persona)}
  
  OBJECTIVE:
  1. DEEP REASONING: Identify hidden molecular contradictions. (e.g. "Low Fat" claim vs high processed starch).
  2. GOAL ALIGNMENT: Check if this specimen supports the persona's goal: "${persona.bio?.health_goal || 'General Health'}".
  3. CLINICAL LOGIC: Explain WHY the health score was assigned based on chemical synthesis.

  RETURN JSON SCHEMA:
  {
    "deep_reasoning": "Detailed 2-3 sentence clinical insight about contradictions vs reality",
    "goal_alignment": {
      "status": "Optimal | Neutral | Counter-Productive",
      "reason": "Specific reason relative to persona goal"
    },
    "logical_path": "Step-by-step clinical derivation of final score"
  }
  
  CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.`;

  try {
    const result = await runNvidiaAgent(
      "Perform deep reasoning and goal alignment on this clinical profile.",
      prompt,
      { modelType: 'clinical', ensureJSON: true, maxTokens: 2500, ...options }
    );
    return result || { 
      deep_reasoning: "Analysis pending deeper molecular synthesis.",
      goal_alignment: { status: "Neutral", reason: "Insufficient data for goal-specific mapping." },
      logical_path: "Direct score derivation based on ingredient safety profile."
    };
  } catch (err) {
    console.error('[Reasoning Agent] Failed:', err);
    return null;
  }
}

module.exports = { analyzeReasoning };
