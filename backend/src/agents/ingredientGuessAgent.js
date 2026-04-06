const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Clinical Ingredient & Nutrition Research Agent (V5.0)
 * Uses high-fidelity model knowledge to "recall" ingredient and nutritional profiles
 * based on brand and product metadata when OCR is obscured.
 */
async function researchProductIngredients(productName, productCategory) {
  const systemPrompt = `[MODE: CLINICAL_RESEARCH_PROTO_V5.0]
  Task: Provide the most likely ingredient and nutritional profile for a clinical audit.
  Target: ${productName} (Category: ${productCategory})

  CRITICAL: If you recognize this specific product, provide its actual global ingredient list and nutrition facts.
  If not, provide the industry-standard profile for this specific product type.

  Return ONLY valid JSON between <<<JSON_START>>> and <<<JSON_END>>> symbols.

  {
    "guessed_ingredients": "Comma separated string of ALL ingredients",
    "nutrition": {
      "calories": number,
      "fat": number,
      "sugar": number,
      "salt": number,
      "protein": number,
      "carbohydrates": number
    },
    "is_specific_match": boolean,
    "confidence_score": number,
    "common_additives": ["list"]
  }`;

  const result = await runNvidiaAgent(
    `Researching clinical profile for ${productName}`,
    systemPrompt,
    { 
      modelType: 'clinical', 
      ensureJSON: true,
      maxTokens: 1200 
    }
  );

  return result || {
    "guessed_ingredients": "Ingredients currently obscured.",
    "nutrition": null,
    "is_specific_match": false,
    "confidence_score": 0,
    "common_additives": []
  };
}

module.exports = { researchProductIngredients };
