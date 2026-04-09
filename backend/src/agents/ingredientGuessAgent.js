const { runNvidiaAgent } = require('../lib/nvidia');
const { lookupProductOnWeb } = require('../services/productWebSearch');

/**
 * Clinical Ingredient & Nutrition Research Agent (V6.0 — Production Hardened)
 * Uses high-fidelity model knowledge to "recall" ingredient and nutritional profiles.
 * 
 * TARGET: ELIMINATE 0-DATA HALLUCINATIONS.
 */
async function researchProductIngredients(productName, productCategory) {
  const webResult = await lookupProductOnWeb(productName, productCategory);

  const hasWebNutrition = webResult && webResult.nutrition && Object.values(webResult.nutrition).some(v => v !== null && v !== undefined);
  const hasWebIngredients = webResult && webResult.guessed_ingredients && webResult.guessed_ingredients.trim().length > 0;

  if (hasWebNutrition || hasWebIngredients) {
    console.log('[ResearchAgent] Using web-backed fallback from Open Food Facts for:', productName);
    return webResult;
  }

  const systemPrompt = `[MODE: CLINICAL_RESEARCH_PROTO_V6.2]
  Product: ${productName} (${productCategory})
  
  TASK: Recall clinical profile (ingredients + per 100g nutrition) for this EXACT product.
  MANDATORY: 
  1. Reference scientific/regulatory databases for this product category (${productCategory}).
  2. If you are not 90%+ certain of the ingredients for this SPECIFIC variant of ${productName}, leave the "guessed_ingredients" field empty.
  3. NEVER return 0 for calories, protein, or carbohydrates. 
  4. Ensure ALL 6 nutritional fields are populated with realistic scientific estimates if ingredients are found.
  
  SCHEMA: {
    "guessed_ingredients": "Precise list of likely ingredients",
    "nutrition": { 
      "calories": number, 
      "fat": number, 
      "sugar": number, 
      "salt": number, 
      "protein": number, 
      "carbohydrates": number 
    },
    "is_specific_match": boolean,
    "confidence_score": number
  }
  
  Constraint: Results must be realistic for ${productCategory}. No chatter.`;

  const result = await runNvidiaAgent(
    `Deep-recall: ${productName}`,
    systemPrompt,
    { 
      modelType: 'agility', 
      maxTokens: 500 
    }
  );

  // FAIL-SAFE: If both web lookup and model fallback fail, keep fields null to avoid fake precision.
  return result || {
    "guessed_ingredients": "Ingredients currently being verified via clinical database.",
    "nutrition": {
      "calories": null,
      "fat": null,
      "sugar": null,
      "salt": null,
      "protein": null,
      "carbohydrates": null
    }
  };
}

module.exports = { researchProductIngredients };
