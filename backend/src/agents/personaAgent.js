const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 1 — Persona Context Agent (V4.0)
 * Logic: Identify which ingredient types are HIGH RISK for this specific user.
 */
async function analyzePersona(userProfile) {
  const profileString = JSON.stringify(userProfile || {});
  
  const systemPrompt = `[MODE: CLINICAL_IDENTITY_V4.0]
    Read the user profile: ${profileString}
    1. Identify which ingredient types or nutritional markers are HIGH RISK for this specific user (e.g., Sodium for Hypertension).
    2. Identify which types of marketing claims are most relevant to verify for this user.
    3. Set the 'personalization lens' for downstream agents.
    If no profile: use "general adult" defaults.

    ## SCHEMA:
    {
      "personaType": "string",
      "highRiskIngredients": ["string"],
      "relevantClaimCategories": ["string"],
      "personalizationLens": "string",
      "isDefault": boolean
    }
    
    IMPORTANT: Return ONLY the JSON between <<<JSON_START>>> and <<<JSON_END>>> markers.`;

  const result = await runNvidiaAgent(
    "Analyze user health persona and identify clinical risk factors for Agent 1.",
    systemPrompt,
    { modelType: 'agility', ensureJSON: true }
  );

  return result || {
    "personaType": "General Adult",
    "highRiskIngredients": [],
    "relevantClaimCategories": ["Nutritional Integrity"],
    "personalizationLens": "General wellness and nutritional balance.",
    "isDefault": true
  };
}

module.exports = { analyzePersona };
