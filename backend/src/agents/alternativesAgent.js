const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 7 — Alternatives Agent (V4.0)
 * Logic: Suggest 3 Indian alternatives (Kirana, Online, or Homemade).
 */
async function findAlternatives(productData, ingredientsAnalysis, persona, options = {}) {
  // Defensive Guard
  if (!productData) {
    return [];
  }

  const systemPrompt = `[MODE: HEALTH_SWAP_V4.0]
    Original Product: ${productData.productName} (${productData.brand})
    Ingredient Concerns: ${JSON.stringify(ingredientsAnalysis.filter(i => i.status !== 'Acceptable'))}
    User Persona: ${JSON.stringify(persona)}
    
    1. Produce EXACTLY 3 alternatives from the Indian market (Kirana stores, online like BigBasket/Blinkit, or Homemade).
    2. At least one MUST be a homemade or whole food option (e.g., "Homemade Curd" instead of packaged yogurt).
    3. Each alternative must be genuinely available in India.
    4. PriceRange must be in INR with realistic ranges (e.g., "₹300-₹700 for 500g").
    5. The reason must specifically address the main concern with the original product.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA (Array of exactly 3 objects):
    [
      {
        "rank": number (1, 2, 3),
        "name": "string — Indian product name",
        "priceRange": "string — e.g. '₹300-₹700 for 500g'",
        "reason": "string — one sentence why it is better"
      }
    ]`;

  const result = await runNvidiaAgent(
    `Finding 3 Indian healthy swaps for: ${productData.productName}`,
    systemPrompt,
    { modelType: 'agility', ensureJSON: true, ...options }
  );

  return result || [];
}

module.exports = { findAlternatives };
