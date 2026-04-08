const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 3 — Ingredient Classification Agent (V4.5 — Clinical Hardened)
 * Logic: Classify ingredients via WHO/FSSAI guidelines and persona lens.
 * 
 * TARGET: SUB-15S DELIVERY WITH 100% FORMAT COMPLIANCE.
 */
async function analyzeIngredients(ingredients, productData, persona, options = {}) {
  if (!ingredients || !productData) return [];

  // Safety: normalize ingredients to a readable string
  const ingredientList = typeof ingredients === 'string'
    ? ingredients
    : Array.isArray(ingredients)
      ? ingredients.join(', ')
      : JSON.stringify(ingredients);

  const systemPrompt = `[MODE: SCIENTIFIC_AUDITOR_V4.6]
    Product: ${productData.productName}
    Persona Risk Lens: ${persona?.personaType || 'General'}

    TASK: Scientifically classify each ingredient listed below using WHO/FSSAI standards.
    FORMAT per item: "[Authority]: [Brief 8-word biological/clinical reason]"
    
    SCHEMA: [
      {
        "name": "Exact ingredient name from the list",
        "standardGuideline": "WHO: Reason OR FSSAI: Reason — must be specific to this ingredient",
        "status": "Acceptable|Caution|Harmful"
      }
    ]
    
    Rules:
    - Classify ONLY the ingredients provided. Do NOT invent new ones.
    - standardGuideline must name a real authority (WHO, FSSAI, EFSA, ICMR).
    - Max 10 items. No generic text. No boilerplate. No chatter.`;

  const result = await runNvidiaAgent(
    `Classify these ingredients for ${productData.productName}: ${ingredientList}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 600, ...options }
  );

  return result || [];
}

module.exports = { analyzeIngredients };
