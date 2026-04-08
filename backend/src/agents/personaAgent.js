const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 1 — Persona Context Agent (V4.0)
 * Logic: Identify which ingredient types are HIGH RISK for this specific user.
 */
async function analyzePersona(userProfile, options = {}) {
  const profileString = JSON.stringify(userProfile || {});
  
  const systemPrompt = `[MODE: CLINICAL_IDENTITY_V4.0]
    Read the user profile: ${profileString}
    1. Identify which ingredient types or nutritional markers are HIGH RISK for this specific user (e.g., Sodium for Hypertension).
    2. Identify which types of marketing claims are most relevant to verify for this user.
    3. Set the 'personalization lens' for downstream agents.
    If no profile: use "general adult" defaults.

    ## SCHEMA:
    {
      "personaType": "string (e.g. Diabetic, Hypertensive, Athlete, or General)",
      "highRiskIngredients": ["string - specific to their condition"],
      "relevantClaimCategories": ["string - e.g. Sugar-Free, Low-Sodium, or Protein-Rich"],
      "personalizationLens": "string - one sentence explaining the focus for this user",
      "isDefault": boolean
    }
    
    IMPORTANT: Be extremely specific to the health conditions provided. Return ONLY the JSON between <<<JSON_START>>> and <<<JSON_END>>> markers. No generic placeholders.`;

  const result = await runNvidiaAgent(
    "Analyze user health persona and identify clinical risk factors for Agent 1.",
    systemPrompt,
    { modelType: 'agility', ensureJSON: true, ...options }
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
