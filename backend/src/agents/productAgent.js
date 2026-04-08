const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 2 — Product Extraction Agent (V4.0)
 * Logic: Extract EXACT product details, brand, ingredients, and marketing claims.
 */
async function analyzeProduct(inputData, options = {}) {
  // Defensive Guard
  if (!inputData) inputData = "Empty input.";

  const systemPrompt = `[MODE: PRODUCT_EXTRACT_V4.2]
    Extract the most clinical and recognizable name for the product.
    
    FIELDS:
    1. productName (e.g., "Maggi 2-Minute Noodles", "Amul Butter")
    2. brand
    3. ingredients (full literal list)
    4. marketingClaims (all claims like "No Preservatives")
    5. nutrition (per 100g: calories, fat, sugar, salt, protein, carbohydrates)
    
    SCHEMA: {
      "productName": "string",
      "brand": "string",
      "ingredients": "string",
      "marketingClaims": [],
      "nutrition": { "calories":0, "fat":0, "sugar":0, "salt":0, "protein":0, "carbohydrates":0 }
    }`;

  const result = await runNvidiaAgent(
    "Extract product data.",
    `INPUT: ${inputData}\n\n${systemPrompt}`,
    { modelType: 'agility', maxTokens: 500, ...options }
  );

  return result || {
    "productName": "Unknown Product",
    "brand": null,
    "ingredients": "",
    "marketingClaims": [],
    "nutrition": {
      "calories": null,
      "fat": null,
      "sugar": null,
      "salt": null,
      "protein": null,
      "carbohydrates": null
    },
    "category": "General",
    "isValid": false
  };
}

module.exports = { analyzeProduct };
