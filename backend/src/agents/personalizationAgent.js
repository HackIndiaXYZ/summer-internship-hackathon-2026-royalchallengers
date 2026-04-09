const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 5 — Personalization Agent (V4.0)
 * Logic: Re-score risks and calculate daily impact based on user persona.
 */
async function analyzePersonalization(ingredientsAnalysis, persona, options = {}) {
  // Defensive Guard
  if (!ingredientsAnalysis || !persona) {
    return {
      dailyConsumption: { headline: "Impact analysis pending", impact: "0%", warnings: [] },
      rescoredIngredients: ingredientsAnalysis || []
    };
  }

  const harmfulIngredients = Array.isArray(ingredientsAnalysis)
    ? ingredientsAnalysis.filter(i => i.status !== 'Acceptable').map(i => i.name)
    : [];

  const systemPrompt = `[MODE: CLINICAL_PERSONALIZATION_V4.0]
    User Persona: ${JSON.stringify(persona)}
    Product Ingredients (analyzed): ${JSON.stringify(ingredientsAnalysis?.slice(0, 8))}
    Harmful/Caution Ingredients: ${harmfulIngredients.join(', ') || 'None identified'}
    
    TASK: Calculate exactly what clinical impact occurs if the user consumes this SPECIFIC product daily.
    
    Steps:
    1. Identify the PRIMARY health risk specific to this product's ingredient profile.
    2. Write the impactLabel based on the DOMINANT concern (e.g., "Sugar Overload:" for high-sugar products, "Trans Fat Risk:" for processed snacks). NOT always sodium.
    3. Write the impactValue as a realistic quantitative stat (e.g., "180% RDA", "3x sugar limit", "2.5x Safe Limit"). Base it on actual ingredient quantities if known.
    4. Write a detailed impact description specific to this product.
    5. Write 2-3 specific warnings relevant to THIS user's health conditions.
    6. Write one short-term effect line (days to weeks) and one long-term effect line (months to years) for regular intake.
    
    CRITICAL: The impactLabel and impactValue MUST reflect the actual dominant ingredients of this product. Do NOT default to "Sodium Intake Increase: 150%" unless sodium is genuinely the main concern.
    
    CRITICAL: **FORBIDDEN**: Do NOT include any references to "dental caries" or general "dental health" boilerplate. Focus on metabolic and cardiovascular impacts.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA:
    {
      "dailyConsumption": {
        "headline": "string — high level risk specific to this product",
        "impactLabel": "string — based on dominant ingredient concern",
        "impactValue": "string — realistic quantitative stat for this product",
        "impact": "string — detailed reasoning specific to this product",
        "shortTermEffect": "string — one concise near-term impact line",
        "longTermEffect": "string — one concise long-term impact line",
        "warnings": ["string — precise bullet points for this user persona"]
      },
      "rescoredIngredients": [
        {
          "name": "string",
          "status": "Acceptable | Limit | Caution | Harmful"
        }
      ]
    }`;

  const result = await runNvidiaAgent(
    "Calculate personalized health impact and re-score risks for Agent 5.",
    systemPrompt,
    { modelType: 'clinical', ensureJSON: true, ...options }
  );

  return result || {
    dailyConsumption: { headline: "Daily Impact", impact: "Calculating...", warnings: [] },
    rescoredIngredients: ingredientsAnalysis
  };
}

module.exports = { analyzePersonalization };
