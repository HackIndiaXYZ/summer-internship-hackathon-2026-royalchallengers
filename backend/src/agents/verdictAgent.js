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

  const systemPrompt = `[MODE: VERDICT_ENGINE_V4.0]
    Analyze the full clinical context for Product: ${fullContext.product.productName}
    Ingredient Analysis: ${JSON.stringify(fullContext.ingredients)}
    Claim Verifications: ${JSON.stringify(fullContext.marketingClaims)}
    Persona Context: ${JSON.stringify(fullContext.persona)}
    
    1. Make one decisive decision: SAFE | LIMIT | AVOID.
    2. SAFE: product is appropriate for this user with normal usage.
    3. LIMIT: product has concerns but is acceptable in controlled amounts.
    4. AVOID: product has significant risks for this user specifically.
    
    CRITICAL RULES:
    - The verdict MUST align with the ingredient classifications and claim verdicts.
    - If any ingredient is Harmful AND directly conflicts with the user's health condition (e.g., Sugar for Diabetic): verdict cannot be SAFE.
    - If all ingredients are Acceptable: verdict cannot be AVOID.
    
    5. Set confidenceScore: 85-95 if full label data was available, 60-75 if partial data.
    
    6. finalVerdictLabel: "SAFE TO CONSUME" | "LIMIT CONSUMPTION" | "AVOID".
    7. advice: {
       "primaryAdvice": "string — one line critical advice (e.g. 'Switch to Jaggery Instead')",
       "consumptionGuideline": "string — exact serving size and frequency recommendation",
       "safeIntake": "string — e.g. '1-2 teaspoons daily'",
       "frequency": "string — e.g. 'Daily' | 'Occasional' | 'Avoid'",
       "bestTime": "string — e.g. 'Morning or with meals'",
       "riskLevel": "Low | Moderate | High"
    }
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA:
    {
      "overallVerdict": "safe | limit | avoid",
      "confidenceScore": number (0-100),
      "finalVerdictLabel": "string — from options above",
      "primaryAdvice": "string",
      "consumptionGuideline": "string",
      "safeIntake": "string",
      "frequency": "string",
      "bestTime": "string",
      "riskLevel": "string"
    }`;

  const result = await runNvidiaAgent(
    `Synthesize final decisive medical verdict and confidence score.`,
    systemPrompt,
    { modelType: 'clinical', ensureJSON: true, ...options }
  );

  return result || {
    "overallVerdict": "limit",
    "confidenceScore": 50,
    "finalVerdictLabel": "LIMIT CONSUMPTION"
  };
}

module.exports = { generateVerdict };
