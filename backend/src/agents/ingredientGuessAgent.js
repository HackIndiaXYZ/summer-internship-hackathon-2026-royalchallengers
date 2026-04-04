const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Clinical Ingredient Research Agent (V4.6)
 * Uses high-fidelity model knowledge to "guess" or "recall" ingredient profiles
 * based on brand and product metadata when OCR is obscured.
 */
async function researchProductIngredients(productName, productCategory) {
  const systemPrompt = `[MODE: CLINICAL_RESEARCH_PROTO]
  Task: Provide the most likely ingredient profile for a high-fidelity clinical audit.
  Target: ${productName} (Category: ${productCategory})

  CRITICAL: If you recognize this specific product/brand, provide its actual global ingredient list. 
  If not, provide the industry-standard ingredient profile for this specific product type.

  Return ONLY valid JSON between <<<JSON_START>>> and <<<JSON_END>>> symbols.

  {
    "guessed_ingredients": "Comma separated string of ALL ingredients",
    "is_specific_match": boolean (true if you know THIS exact brand),
    "confidence_score": number (0-100),
    "common_additives": ["list", "of", "likely", "E-numbers", "/preservatives"]
  }`;

  const result = await runNvidiaAgent(
    `Synthesize clinical ingredient profile for ${productName}`,
    systemPrompt,
    { 
      modelType: 'clinical', // Use 70B for high-fidelity brand recall
      ensureJSON: true,
      maxTokens: 1000 
    }
  );

  return result || {
    "guessed_ingredients": "Ingredients currently obscured. Clinical fallback pending.",
    "is_specific_match": false,
    "confidence_score": 0,
    "common_additives": []
  };
}

module.exports = { researchProductIngredients };
