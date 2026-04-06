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
    
    3. Formatting: Guidelines must include the authority (WHO or FSSAI) followed by 4-5 words of research-backed context inside parentheses explaining why it is acceptable/caution/limit (e.g., "WHO (Acceptable: Within daily intake safety zone)", "FSSAI (Caution: Potential long-term gut inflammation)").
    4. Clinical Precision: Ensure guidelines are relevant to the ingredient's risk profile (e.g., Sodium -> WHO/FSSAI salt limits).
    5. Classify: Acceptable (safe) | Caution (limit) | Harmful (avoid).
    6. Apply the persona lens: an ingredient may be Caution for this user but Acceptable for others.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA (Array of objects):
    [
      {
        "name": "string — ingredient name exactly as on label",
        "standardGuideline": "string — WHO/FSSAI + (4-5 words research context)",
        "status": "Acceptable | Caution | Harmful"
      }
    ]`;

  const result = await runNvidiaAgent(
    `Classify clinical ingredients for: ${productData.productName}`,
    systemPrompt,
    { modelType: 'agility', ensureJSON: true, ...options }
  );

  return result || [];
}

module.exports = { analyzeIngredients };
