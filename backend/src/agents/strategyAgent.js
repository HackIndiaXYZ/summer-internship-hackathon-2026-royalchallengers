const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Strategy Agent (V4.0) - Consolidated Health Strategy
 * Logic: Audit claims, generate recommendations, source evidence, and find alternatives in ONE clinical context.
 * Goal: Minimize latency by reducing round-trips to LLM.
 */
async function generateConsolidatedStrategy(product, persona, options = {}) {
  const systemPrompt = `[MODE: HEALTH_STRATEGY_CONSOLIDATED_V4.6]
    You are the Medo Veda Clinical Strategist.
    Using the PROMPT data, generate a high-fidelity comprehensive health strategy.
    
    ## CORE SECTIONS:
    1. **Claim Audit**: Audit marketing claims (Natural, No Sugar, etc.) against ingredients with molecular precision.
    2. **Clinical Strategy**: Personalized WHO-benchmarked health advice for the persona's status: ${persona.clinical_status || 'General'}.
    3. **Scientific Evidence**: Source-backed evidence from (WHO, NCBI, Mayo Clinic) for flagged ingredients.
    4. **Healthy Swaps**: specific product-type alternatives with 30%+ improvement in health score.
    
    ## SCHEMA:
    {
      "claim_analysis": {
        "claims": [ { "claim": "string", "verdict": "Verified | Unverified | Misleading", "reality": "string" } ],
        "score": number
      },
      "recommendation": {
        "primary_advice": "High-impact summary for this persona",
        "daily_limit_warning": "Immediate danger zones for ingredient consumption",
        "persona_specific_risk": "Why this specific specimen is risky for THIS persona",
        "action_plan": ["Specific clinical steps to take"],
        "health_verdict": "Safe | Caution | Avoid"
      },
      "evidence": [ { "ingredient": "string", "source": "WHO | NCBI | Mayo Clinic", "summary": "Clinical summary of risk" } ],
      "alternatives": [ { "name": "string", "why_better": "string", "health_score_boost": number } ]
    }
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.`;

  const prompt = `PRODUCT: ${product.name}
    CATEGORY: ${product.category}
    INGREDIENTS: ${product.ingredients}
    PERSONA_BIO: ${JSON.stringify(persona.bio || {})}
    GOALS: ${persona.goals?.join(', ') || 'General Health'}
    
    Analyze and output high-fidelity strategy JSON.`;

  return await runNvidiaAgent(prompt, systemPrompt, { 
    modelType: 'clinical', // 70B for synthesis
    ensureJSON: true,
    maxTokens: 3000,
    ...options 
  });
}

module.exports = { generateConsolidatedStrategy };
