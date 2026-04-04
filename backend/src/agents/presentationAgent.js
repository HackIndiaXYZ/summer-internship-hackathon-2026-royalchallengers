const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Presentation Agent (V4.2) - UX Synthesis Protocol
 * Logic: Translate complex clinical data into user-friendly dashboard JSON.
 */
async function preparePresentation(context, options = {}) {
  // Defensive Guard
  if (!context) {
    return {
      product_name: "Analysis Pending",
      health_score: 0,
      health_label: "LIMIT",
      summary: "Clinical analysis could not be visualized due to data integrity issues."
    };
  }

  const systemPrompt = `[MODE: UX_SYNTHESIS_V4.2]
    You are the Medo Veda Lead Designer & Clinical UX Strategist.
    1. Mapping Task: Synthesize all provided context into the final UI schema.
    2. Data Integrity: Ensure 'image_url' (from vision) and 'health_score' are prioritized.
    3. Formatting: Map 'claims', 'evidence', and 'alternatives' from their respective agents.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA:
    {
      "product_name": "string",
      "image_url": "string | null",
      "ingredients": [ { "name": "string", "risk": "High|Medium|Low", "reason": "string", "function": "string", "standard_limit": "string" } ],
      "analysis": { 
          "ingredient_audit": { "flagged": ["string"], "summary": "string" },
          "nutritional_profile": { "calories": number, "sugar": number, "fat": number, "protein": number }
      },
      "claims": [ { "claim": "string", "verdict": "True|False", "reality": "string" } ],
      "recommendation": "string",
      "safe_intake": "string",
      "frequency": "string",
      "alternatives": [ { "name": "string", "why_better": "string", "health_score_boost": number } ],
      "evidence": [ { "ingredient": "string", "source": "string", "summary": "string" } ],
      "final_verdict": { "label": "SAFE | LIMIT | AVOID", "score": number, "summary": "string" },
      "summary_2_line": "string",
      "long_term_effects": { "impact_percentage": "string", "risks": ["string"] }
    }`;

  const result = await runNvidiaAgent(
    "Synthesize and map final data into the 12-field clinical dashboard schema.",
    `CONTEXT DATA: ${JSON.stringify(context).substring(0, 5000)}\n\nINSTRUCTION: ${systemPrompt}`,
    { modelType: 'clinical', ensureJSON: true, maxTokens: 2500, ...options }
  );

  return result || {
    product_name: context.product?.name || "Specimen Analysis",
    image_url: context.product?.image_url || null,
    ingredients: [],
    analysis: { ingredient_audit: { flagged: [], summary: "Synthesis pending." }, nutritional_profile: { calories: 0, sugar: 0, fat: 0, protein: 0 } },
    claims: [],
    recommendation: "Clinical data synthesis incomplete.",
    safe_intake: "N/A",
    frequency: "N/A",
    alternatives: [],
    evidence: [],
    final_verdict: { label: "LIMIT", score: 50, summary: "Analysis complete with partial data integrity." },
    summary_2_line: "Data integrity verification in progress.",
    long_term_effects: { impact_percentage: "0%", risks: [] }
  };
}

module.exports = { preparePresentation };
