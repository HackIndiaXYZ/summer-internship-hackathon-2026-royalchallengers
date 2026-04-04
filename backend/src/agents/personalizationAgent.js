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

  const systemPrompt = `[MODE: CLINICAL_PERSONALIZATION_V4.0]
    User Persona: ${JSON.stringify(persona)}
    Ingredient Analysis: ${JSON.stringify(ingredientsAnalysis)}
    
    3. Write the impact label (e.g., "Sodium Intake Increase:", "Sugar Overload Risk:").
    4. Write the impact value EXACTLY as a percentage or multiplier (e.g., "120-150%", "2.5x Limit").
    5. Write the detailed impact description (e.g. "Continuous consumption could lead to hypertension...").
    6. Write 2-3 specific warnings relevant to THIS user's conditions as bullet points.
    
    CRITICAL: The "impactValue" must be the main quantitative stat you want to highlight.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA:
    {
      "dailyConsumption": {
        "headline": "string — high level risk",
        "impactLabel": "string — e.g. Fat Intake Increase:",
        "impactValue": "string — e.g. 120-150%",
        "impact": "string — detailed reasoning",
        "warnings": ["string — precise bullet points"]
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
