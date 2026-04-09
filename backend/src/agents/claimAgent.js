const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 4 — Claim Verification Agent (V7.0 — Perception vs Reality)
 * 
 * Cross-references marketing claims against actual ingredients.
 * This is the core differentiator of Medo Veda — it must actually
 * verify each claim using the real ingredient data, not generate placeholders.
 */
async function analyzeClaims(productName, ingredients, claimsList = [], options = {}) {
  // EXIT EARLY: If we couldn't even read the product name, don't guess claims.
  if (productName === "UNREADABLE_SPECIMEN" || !productName) {
    return [];
  }

  const hasClaims = claimsList && claimsList.length > 0 &&
    !claimsList.every(c => c.startsWith('Implicit'));

  const claimsString = hasClaims
    ? claimsList.join(', ')
    : `No explicit claims extracted — analyze the product name "${productName}" for implicit health positioning`;

  const ingredientString = typeof ingredients === 'string'
    ? ingredients
    : Array.isArray(ingredients)
      ? ingredients.join(', ')
      : JSON.stringify(ingredients);

  const systemPrompt = `[MODE: PERCEPTION_VS_REALITY_V7.0]
Product: ${productName}
Actual ingredients from label: ${ingredientString}
Marketing claims from label: ${claimsString}

TASK: For each claim found on this product's label, verify it against the actual ingredient data.

For each claim, follow this reasoning process:
1. State the exact claim text as printed on the label.
2. Look at the actual ingredients and nutrition data. Does the claim match the data?
3. Decide the verdict:
   - True: the claim is fully supported by the ingredient list and nutrition data
   - Misleading: the claim is technically worded to avoid being a lie but creates a false impression. Examples:
     * "No Added Sugar" when the product contains maltodextrin or dextrose (sugars under different names)
     * "Natural" when the ingredient list contains artificial preservatives
     * "Health Drink" when sugar is a primary ingredient
   - False: the claim directly contradicts the ingredient list or nutrition data
4. Write the reality — one sentence describing what the ingredient data actually shows, contrasting with what the claim suggests.
5. Write the explanation — one sentence on why this verdict was given.

SCHEMA: [
  {
    "claim": "exact marketing claim text from the product label",
    "verdict": "True|False",
    "verdictLabel": "VERIFIED|MISLEADING|FALSE",
    "reality": "what the ingredients actually show, max 20 words",
    "research_context": "clinical reason for this verdict, max 20 words"
  }
]

Rules:
- This section must never be empty if there are any claims on the label.
- If the product name itself implies a health benefit (e.g. "Health Drink", "Fitness"), treat that as an implicit claim and verify it.
- Do not verify generic claims that are not on this specific label.
- Do not fabricate claims. Only verify what was actually found on the label or in the product name.
- Maximum 5 claims. Focus on the most significant ones.
- For "verdict": use "True" or "False" only. Map Misleading to "False".
- For "verdictLabel": use "VERIFIED", "MISLEADING", or "FALSE".
- No generic boilerplate. Be specific to ${productName} and its actual ingredients.
- FORBIDDEN: Any mention of skincare, dermatological benefits, or cosmetic results.`;

  const result = await runNvidiaAgent(
    `Verify marketing claims for ${productName} against its actual ingredients: ${ingredientString}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 600, ...options }
  );

  // Ensure we return an array
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && !result.error) {
    if (Array.isArray(result.claims)) return result.claims;
  }
  return [];
}

module.exports = { analyzeClaims };
