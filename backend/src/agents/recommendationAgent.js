/**
 * Recommendation Agent: Determines stance and gives advice based on goal alignment.
 */
function getRecommendationPrompt(product, ingredients, personaContext) {
  return `
    You are a Senior Clinical Strategist.
    User Profile Context: ${JSON.stringify(personaContext)}
    Product: ${JSON.stringify(product)}
    Ingredients: ${JSON.stringify(ingredients)}

    Task:
    1. Determine the Stance (RECOMMENDED, LIMIT, AVOID) based on the user's Primary Goal.
    2. Check the "Never Ignore" list first. If any ingredient matches, it must be AVOID.
    3. Frame advice based on the goal (e.g., "This fits your muscle gain goal because...").

    Return JSON (decide on EXACTLY ONE stance):
    {
      "stance": "RECOMMENDED", // Use RECOMMENDED, LIMIT, or AVOID
      "strategy": { "intake": "", "frequency": "", "summary": "", "warnings": [""] }
    }
  `;
}

module.exports = { getRecommendationPrompt };
