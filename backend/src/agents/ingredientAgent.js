const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 3 — Ingredient Classification Agent (V4.0)
 * Logic: Classify ingredients via WHO/FSSAI guidelines and persona lens.
 */
async function analyzeIngredients(ingredients, productData, persona, options = {}) {
  // Defensive Guard
  if (!ingredients || !productData) {
    return [];
  }

  const systemPrompt = `[MODE: SCIENTIFIC_AUDITOR_V4.0]
    Audit ingredients: ${ingredients} for Product: ${productData.productName}
    User Persona Context: ${JSON.stringify(persona)}
    
    3. Formatting: Guidelines must be extremely concise (e.g., "FSSAI (2011)", "WHO (2020)"). Never use full regulatory names or long titles.
    4. Clinical Precision: Ensure guidelines are relevant to the ingredient's risk profile (e.g., Sodium -> WHO/FSSAI salt limits).
    4. Classify: Acceptable (safe) | Caution (limit) | Harmful (avoid).
    5. Apply the persona lens: an ingredient may be Caution for this user but Acceptable for others.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA (Array of objects):
    [
      {
        "name": "string — ingredient name exactly as on label",
        "standardGuideline": "string — short WHO/FSSAI reference",
        "status": "Acceptable | Caution | Harmful"
      }
    ]`;

  const result = await runNvidiaAgent(
    `Classify clinical ingredients for: ${productData.productName}`,
    systemPrompt,
    { modelType: 'clinical', ensureJSON: true, ...options }
  );

  return result || [];
}

module.exports = { analyzeIngredients };
