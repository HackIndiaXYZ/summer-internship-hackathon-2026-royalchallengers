const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 7 — Alternatives Agent (V6.0 — Category-Locked Indian Market)
 * 
 * Generates exactly 3 healthier alternatives that:
 * 1. Are in the SAME product category as the scanned product
 * 2. Are genuinely available in India
 * 3. Include at least one homemade/whole-food option
 * 4. Address the specific concerns found in ingredient analysis
 */
async function findAlternatives(productData, ingredientsAnalysis, persona, options = {}) {
  // EXIT EARLY: If we couldn't even read the product name, don't guess alternatives.
  if (productData.productName === "UNREADABLE_SPECIMEN" || !productData.productName) {
    return [];
  }

  const ingredientsList = Array.isArray(ingredientsAnalysis) ? ingredientsAnalysis : [];
  const concerns = ingredientsList
    .filter(i => i.status !== 'Acceptable')
    .map(i => `${i.name} (${i.status})`)
    .join(', ') || 'general health improvement';

  const productName = productData.productName || 'Unknown Product';
  const brand = productData.brand || '';

  const systemPrompt = `[MODE: HEALTHY_SWAP_V6.0]
Original Product: ${productName} ${brand ? `by ${brand}` : ''}
Ingredient Concerns: ${concerns}
User Profile: ${JSON.stringify(persona?.personaType || 'General Adult')}

TASK: Generate exactly 3 alternatives to "${productName}".

The alternatives MUST follow these rules:

Rule 1 — STRICT CATEGORY MATCH: The alternatives must be in the same product category as "${productName}".
- If the scanned product is a health drink powder, suggest other healthier drink powders.
- If the scanned product is a snack, suggest other healthier snacks.
- If the scanned product is instant noodles, suggest other quick meal alternatives.
- If the scanned product is a beverage, suggest other healthy beverages.
- NEVER suggest salt, butter, ghee, or any raw ingredient as an alternative to a packaged food product.
- Alternatives must be complete food products that serve the same purpose as the scanned product.

Rule 2 — GENUINELY BETTER: Each alternative must be healthier than "${productName}" in a specific measurable way. State that specific way in the reason field.

Rule 3 — INDIAN MARKET ONLY: Every alternative must be available in India. Use brand names that Indian consumers recognize. All prices must be realistic INR amounts.

Rule 4 — ADDRESS THE CONCERN: The alternative should address the main concern found in the ingredient analysis. If the scanned product has high sugar, suggest lower-sugar alternatives in the same category. If the scanned product has artificial colors, suggest alternatives without artificial colors.

Rule 5 — AT LEAST ONE HOMEMADE OPTION: One of the three alternatives must be a homemade or whole-food option that replaces the product's function.

SCHEMA (Array of exactly 3 objects):
[
  {
    "rank": 1,
    "name": "specific product/dish name available in India",
    "priceRange": "realistic INR price, e.g. '₹50-₹150 per pack'",
    "reason": "precise reason why it's better, mentioning the specific improvement"
  }
]

Rules:
- Return ONLY the JSON array of 3 objects.
- Never suggest generic raw ingredients (salt, butter, ghee) unless the scanned product IS a raw ingredient.
- Every alternative must be something an Indian consumer would buy from a grocery store, kirana shop, BigBasket, or Blinkit as a direct replacement for "${productName}".`;

  const result = await runNvidiaAgent(
    `Find 3 healthier Indian market alternatives for "${productName}" (category-matched, addressing: ${concerns})`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 500, ensureJSON: true, ...options }
  );

  // Ensure we return an array
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && !result.error) {
    if (Array.isArray(result.alternatives)) return result.alternatives;
  }
  return [];
}

module.exports = { findAlternatives };
