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
    1. Identify the DOMINANT biochemical risk (e.g., specific chemical additive, high HFCS, trans-fats).
    2. impactLabel MUST be specific (e.g., "Maltodextrin Load:", "Artificial Color Burden:", "Palm Oil Accumulation:").
    3. impactValue MUST be a clinical stat or comparison (e.g., "22g over WHO limit", "150% Daily Intake for Kids", "3x Recommended Max").
    4. impact description must name both the ingredient and the persona's health condition.
    5. warnings must be 2-3 clinical bullet points.
    
    CRITICAL: No generic "Sodium" defaults. Be hyper-specific to ${JSON.stringify(ingredientsAnalysis?.slice(0, 3))}.
    
    Return ONLY valid raw JSON. No chatter. No markdown code blocks.

    ## SCHEMA:
    {
      "dailyConsumption": {
        "headline": "string — high level risk specific to this product",
        "impactLabel": "string — based on dominant ingredient concern",
        "impactValue": "string — realistic quantitative stat for this product",
        "impact": "string — detailed reasoning specific to this product",
        "warnings": ["string — precise bullet points for this user persona"]
      },
      "rescoredIngredients": [
        {
          "name": "string",
          "status": "Acceptable | Caution | Harmful"
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
