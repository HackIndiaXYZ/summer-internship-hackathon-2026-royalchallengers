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
      "primaryAdvice": "Specific 15-word advice for this product and persona",
      "consumptionGuideline": "Specific serving size e.g. '1 teaspoon per day' or '200ml per serving'",
      "safeIntake": "Exact safe amount e.g. '1-2 tsp/day' or '1 serving weekly'",
      "frequency": "Daily|Weekly|Occasional|Avoid — choose based on ingredients",
      "bestTime": "Specific time based on this product's composition e.g. 'Morning on empty stomach' or 'After workout' or 'Before bed'. NOT generic.",
      "riskLevel": "Low|Moderate|High"
    }
    
    Rules:
    - primaryAdvice must be unique to ${fullContext.product.productName}.
    - bestTime must be scientifically timed for these specific ingredients (e.g., "After dinner to avoid sugar spikes" or "Post-workout for protein absorption").
    - safeIntake must be an exact serving size (e.g., "Max 2 biscuits" or "100ml").
    - No chatter. No generic defaults like "Moderate" or "With meals" if more specific timing is relevant. Use agility (8B).`;

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
