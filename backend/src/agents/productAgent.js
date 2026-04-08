const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 2 — Product Extraction Agent (V4.0)
 * Logic: Extract EXACT product details, brand, ingredients, and marketing claims.
 */
async function analyzeProduct(inputData, options = {}) {
  // Defensive Guard
  if (!inputData) inputData = "Empty input.";

  const systemPrompt = `[MODE: PRODUCT_EXTRACT_V4.1]
    Extract:
    1. productName
    2. brand
    3. ingredients (literal)
    4. marketingClaims (list)
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
