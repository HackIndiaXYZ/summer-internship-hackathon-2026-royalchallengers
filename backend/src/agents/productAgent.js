const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 2 — Product Extraction Agent (V4.0)
 * Logic: Extract EXACT product details, brand, ingredients, and marketing claims.
 */
async function analyzeProduct(inputData, options = {}) {
  // Defensive Guard
  if (!inputData) inputData = "Empty input.";

  const systemPrompt = `[MODE: PRODUCT_IDENTITY_V4.0]
    Extract product details from input:
    1. productName: exact name from label.
    2. brand: brand name or null.
    3. ingredients: complete list exactly as printed.
    4. marketingClaims: ALL marketing claims/selling points printed on pack (e.g. '100% Organic', 'No Trans Fat').
    5. nutrition: calories, fat, sugar, protein per 100g/serving.
    
    CRITICAL: Never guess ingredients not visible. If image data is provided (inline or as OCR), read small print.
    
    CRITICAL: Always Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA:
    {
      "productName": "string",
      "brand": "string | null",
      "ingredients": "string",
      "marketingClaims": ["string"],
      "nutrition": { "calories": number, "fat": number, "sugar": number, "protein": number },
      "category": "string",
      "isValid": boolean
    }`;

  const result = await runNvidiaAgent(
    "Extract exact product identity and marketing claims for Agent 2.",
    `INPUT_DATA: ${inputData}\n\n${systemPrompt}`,
    { modelType: 'agility', ensureJSON: true, ...options }
  );

  return result || {
    "productName": "Unknown Product",
    "brand": null,
    "ingredients": "",
    "marketingClaims": [],
    "nutrition": { "calories": 0, "fat": 0, "sugar": 0, "protein": 0 },
    "category": "General",
    "isValid": false
  };
}

module.exports = { analyzeProduct };
