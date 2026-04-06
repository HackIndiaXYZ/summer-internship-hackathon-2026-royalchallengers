const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 3 — Ingredient Classification Agent (V4.5 — Clinical Hardened)
 * Logic: Classify ingredients via WHO/FSSAI guidelines and persona lens.
 * 
 * TARGET: SUB-15S DELIVERY WITH 100% FORMAT COMPLIANCE.
 */
async function analyzeIngredients(ingredients, productData, persona, options = {}) {
  if (!ingredients || !productData) return [];

  const systemPrompt = `[MODE: SCIENTIFIC_AUDITOR_V4.5]
    Audit ingredients for Product: ${productData.productName}
    User Persona: ${JSON.stringify(persona)}
    
    CRITICAL FORMATTING RULE (NO EXCEPTIONS):
    The "standardGuideline" field MUST start with the authority (WHO or FSSAI) followed by a 5 to 6 word research-backed sentence inside parentheses explaining the clinical reason.
    
    VALID EXAMPLES:
    - "WHO (Acceptable: Within daily intake safety zone)"
    - "FSSAI (Caution: Potential long-term gut inflammation)"
    - "WHO (Harmful: Linked to increased cardiac risk)"
    
    INVALID EXAMPLES (DO NOT USE):
    - "WHO" (Too short)
    - "FSSAI (Caution: This is bad)" (Too short)
    - "WHO (Acceptable: This ingredient is generally considered safe for human consumption by most global authorities)" (Too long)
    
    TASK:
    1. Extract name exactly as on label.
    2. Classify: Acceptable | Caution | Harmful.
    3. Provide the 5-6 word clinical reason in the required format.
    
    Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>>.

    ## SCHEMA:
    [
      {
        "name": "string",
        "standardGuideline": "Authority (EXACTLY 5-6 word clinical reason in parentheses)",
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
