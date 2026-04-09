const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 2 — Product Extraction Agent (V6.0 — Text Input Only)
 * 
 * Used ONLY for text-based product lookups (not image scans).
 * For image scans, the visionService handles extraction directly.
 * 
 * No hardcoded examples in the schema to prevent model copying.
 */
async function analyzeProduct(inputData, options = {}) {
  if (!inputData) inputData = "Empty input.";

  const systemPrompt = `[MODE: PRODUCT_EXTRACT_V6.0]
You are given a product name or description as text input. Extract the most accurate clinical data for this product.

FIELDS TO EXTRACT:
1. productName — the full recognized product name
2. brand — the manufacturer or brand
3. ingredients — known ingredient list for this product (use your knowledge base)
4. marketingClaims — known marketing claims for this product
5. nutrition — per 100g nutritional values (calories in kcal, fat in g, sugar in g, salt in g, protein in g, carbohydrates in g). Use null for unknown values, never use 0 as a default.

Return ONLY the JSON object:
{
  "productName": "string",
  "brand": "string",
  "ingredients": "string — comma-separated list",
  "marketingClaims": ["string"],
  "nutrition": {
    "calories": number or null,
    "fat": number or null,
    "sugar": number or null,
    "salt": number or null,
    "protein": number or null,
    "carbohydrates": number or null
  }
}

Rules:
- Use your knowledge of real products to provide accurate data.
- If you don't know a specific value, use null — never guess with 0.
- No markdown. No chatter. Start with { and end with }.`;

  const result = await runNvidiaAgent(
    `Extract product data for: ${inputData}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 500, ...options }
  );

  return result || {
    "productName": inputData,
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
