/**
 * Verdict Agent: Calculates goal-weighted score and final label.
 */
function getVerdictPrompt(recommendation, ingredients, personaContext) {
  return `
    You are a Senior Health Strategist.
    User Profile Context: ${JSON.stringify(personaContext)}
    Recommendation: ${JSON.stringify(recommendation)}
    Ingredients: ${JSON.stringify(ingredients)}

    Task:
    Calculate a Global Health Score (1.0 - 10.0) based on how well the product supports the primary goal.
    Scores must be goal-aware (e.g., high sugar = 1.0 for diabetes, high protein = 9.5 for muscle gain).
    Set a Confidence Score (1-100).

    Return JSON (decide on exactly ONE label):
    {
      "score": 0.0,
      "label": "RECOMMENDED", // Pick exactly ONE from: RECOMMENDED, LIMIT, or AVOID
      "confidence": 0
    }
  `;
}

module.exports = { getVerdictPrompt };
