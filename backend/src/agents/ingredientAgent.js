const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 3 — Ingredient Classification Agent (V6.0 — Anti-Hallucination)
 * 
 * Classifies ONLY the ingredients extracted from the actual label image.
 * Never uses example data. Never adds ingredients not in the list.
 * Personalizes risk classification based on user health profile.
 */
async function analyzeIngredients(ingredients, productData, persona, options = {}) {
  if (!ingredients || !productData) return [];

  // Normalize ingredients to a readable string
  const ingredientList = typeof ingredients === 'string'
    ? ingredients
    : Array.isArray(ingredients)
      ? ingredients.join(', ')
      : JSON.stringify(ingredients);

  if (!ingredientList || ingredientList.trim() === '' || ingredientList === '[]') {
    console.warn('[IngredientAgent] Empty ingredient list received');
    return [];
  }

  const personaString = persona?.personaType || persona?.personalizationLens || 'General Adult';

  const systemPrompt = `[MODE: INGREDIENT_CLASSIFIER_V6.0]
Product: ${productData.productName}
User health profile: ${personaString}

TASK: Classify each ingredient in the list below. These ingredients were extracted from an actual product label. Classify ONLY the ingredients provided — do not add any ingredients that are not in this list.

Apply the user's health profile when classifying. The same ingredient can be "Caution" for a diabetic but "Acceptable" for a healthy adult.

For each ingredient, provide:
- name: the exact ingredient name from the list
- status: one of "Acceptable", "Limit", "Caution", "Harmful"
- standardGuideline: if a verified WHO/FSSAI/EFSA rule exists, use "[Authority]: ...". If no verified authority rule exists, return either "None" or "[General Caution]: ...". Do NOT use WHO/FSSAI/EFSA labels for unverified guidance.
- riskLevel: "low", "medium", or "high"
- concern: one sentence about why this ingredient matters for this user's health profile

Status definitions:
- Acceptable: Safe, natural, or generally healthy in normal consumption amounts.
- Limit: Generally safe but requiring moderation per WHO/FSSAI guidelines (common for added sugars, sodium, saturated fats).
- Caution: Requires careful attention — artificial additives, high-risk preservatives, or ingredients specifically risky for this user's health conditions.
- Harmful: Banned substances, clinically toxic at normal consumption levels, or ingredients strictly contra-indicated for this user's specific medical conditions.

Rules:
- Classify ONLY ingredients from the provided list. Do not add ingredients.
- Return a JSON array. Minimum 3 items if the list has 3+ ingredients.
- No generic text. No boilerplate. No commentary outside the JSON array.

SCHEMA: [
  {
    "name": "string",
    "standardGuideline": "string",
    "status": "Acceptable|Limit|Caution|Harmful",
    "riskLevel": "low|medium|high",
    "concern": "string"
  }
]`;

  const result = await runNvidiaAgent(
    `Classify these ingredients extracted from ${productData.productName} label: ${ingredientList}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 800, ...options }
  );

  // Ensure we return an array
  if (Array.isArray(result)) return result;
  if (result && typeof result === 'object' && !result.error) {
    // Sometimes the model wraps in an object
    if (Array.isArray(result.ingredients)) return result.ingredients;
  }
  return [];
}

module.exports = { analyzeIngredients };
