/**
 * Ingredient Agent: Evaluates ingredients based on the user's goal.
 */
function getIngredientPrompt(ingredients, personaContext) {
  return `
    You are a Molecular Toxicologist.
    User Profile Context: ${JSON.stringify(personaContext)}
    Product Ingredients: ${JSON.stringify(ingredients)}

    Task:
    Map every ingredient and classify as:
    1. Goal-Supportive: (e.g., Whey Protein for Muscle Gain).
    2. Neutral: (e.g., Water, Salt).
    3. Goal-Harming: (e.g., Added Sugar for Weight Loss).

    Evaluate molecular function and risk levels (Low, Medium, High).
    Identify top 3 critical molecular concerns.

    Return ONLY JSON:
    {
      "ingredients": [
        { "name": "", "classification": "goal-supportive|neutral|goal-harming", "risk": "low|medium|high", "function": "", "concern": "" }
      ],
      "topConcerns": [""]
    }
  `;
}

module.exports = { getIngredientPrompt };
