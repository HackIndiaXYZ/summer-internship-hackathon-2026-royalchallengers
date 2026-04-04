const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Clinical Health Strategist (V3.1) - WHO/FSSAI Anchored
 * Logic: Generate actionable health advice based on the synthesized clinical profile.
 * Protective Strategy: Ensure analysis data exists before strategy generation.
 */
async function generateRecommendations(analysisResults, persona, options = {}) {
  // Defensive Guard
  if (!analysisResults || !persona) {
    return {
      primary_advice: "Perform whole-food analysis manually due to specimen clarity issues.",
      health_verdict: "Caution",
      action_plan: ["Scan clearer product label for final verdict."]
    };
  }

  const systemPrompt = `[MODE: CLINICAL_STRATEGIST_V3.1]
  You are a Clinical Nutritionist. 
  Based on the comprehensive chemical analysis provided, generate PERSONALIZED, EVIDENCE-BACKED health advice for the user persona.
  
  ---
  ## CORE DIRECTIVES:
  1. **Strict Benchmarking**: Use WHO/FSSAI guidelines as the absolute source of truth.
  2. **Actionable Alternates**: Provide specific, concrete "Better Alternatives" if hazardous.
  3. **Persona Alignment**: Map advice directly to ${persona.persona_type}.
  
  ---
  ## OUTPUT SCHEMA:
  {
    "primary_advice": "string",
    "daily_limit_warning": "string",
    "persona_specific_risk": "string",
    "action_plan": ["string", "string"],
    "health_verdict": "Safe | Caution | Avoid"
  }`;

  const result = await runNvidiaAgent(
    "Generate personalized clinical health strategy.",
    `ANALYSIS_DATA: ${JSON.stringify(analysisResults)}\n\nUSER_PERSONA: ${persona.persona_type}\n\n${systemPrompt}`,
    { modelType: 'clinical', ensureJSON: true, ...options }
  );

  return result;
}

module.exports = { generateRecommendations };
