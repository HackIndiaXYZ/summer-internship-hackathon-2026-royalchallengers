const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 8 — Verdict Agent (V4.0)
 * Logic: Final decisive health verdict and confidence scoring.
 */
async function generateVerdict(fullContext, options = {}) {
  // Defensive Guard
  if (!fullContext || !fullContext.product) {
    return {
      overallVerdict: "limit",
      confidenceScore: 50,
      finalVerdictLabel: "LIMIT CONSUMPTION"
    };
  }

  const systemPrompt = `[MODE: VERDICT_ENGINE_V4.1]
    Audit: ${fullContext.product.productName}
    Category: ${fullContext.product.brand || 'Food Product'}
    Ingredients: ${JSON.stringify(fullContext.ingredients?.slice(0, 5))}
    Persona: ${JSON.stringify(fullContext.persona)}
    
    TASK: Generate a precise verdict AND personalized consumption advice for THIS specific product.
    
    SCHEMA: {
      "overallVerdict": "safe|limit|avoid",
      "confidenceScore": number (0-100),
      "finalVerdictLabel": "string",
      "primaryAdvice": "Critically unique 15-word advice specific to ${fullContext.product.productName}",
      "consumptionGuideline": "Clinical serving size justified by composition (e.g., 'Limit to 15g due to saturated fat density')",
      "safeIntake": "Quantified safe amount (e.g. 'Max 2 units/day')",
      "frequency": "Scientific frequency based on ingredient severity",
      "bestTime": "Scientifically justified timing (e.g., 'Morning for metabolic activation' or 'Post-meal to dampen glucose spike'). NO GENERIC DEFAULTS.",
      "riskLevel": "Low|Moderate|High"
    }
    
    Rules:
    - primaryAdvice must NOT be generic. Mention a key ingredient.
    - bestTime must explain WHY based on ingredients.
    - safeIntake must be specific (ml, g, units).
    - No chatter. No JSON markdown wrappers. Use agility (8B).`;

  const result = await runNvidiaAgent(
    `Synthesize verdict for: ${fullContext.product.productName}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 400, ...options }
  );

  return result || {
    "overallVerdict": "limit",
    "confidenceScore": 50,
    "finalVerdictLabel": "LIMIT CONSUMPTION"
  };
}

module.exports = { generateVerdict };
