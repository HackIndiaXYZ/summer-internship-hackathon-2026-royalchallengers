/**
 * Recommendation Agent: Determines stance and gives advice based on goal alignment.
 * Optimized to return the full verdict synthesis.
 */
function getRecommendationPrompt(product, ingredients, personaContext) {
  return `
    You are a Senior Clinical Strategist & Health Analyst.
    User Profile Context: ${JSON.stringify(personaContext)}
    Product: ${JSON.stringify(product)}
    Ingredients: ${JSON.stringify(ingredients)}

    Task:
    1. Determine the Stance (RECOMMENDED, LIMIT, AVOID) following the user's primary goal.
    2. Check "Never Ignore" list first. If any ingredient matches, it MUST be AVOID.
    3. Calculate a Clinical Health Score (0.0 - 100.0) based on goal alignment.
    4. Provide a Personalized Summary addressing the user's specifics.
    5. Draft a detailed Clinical Analysis for the technical report.

    Return JSON:
    {
      "stance": "RECOMMENDED", // RECOMMENDED, LIMIT, or AVOID
      "score": "0.0 - 100.0",
      "confidence": "0 - 100",
      "personalizedSummary": "Summary addressing the user's clinical profile...",
      "clinicalAnalysis": "Deep dive into the health implications...",
      "strategy": { 
        "intake": "Recommended intake level", 
        "frequency": "Recommended frequency", 
        "summary": "Overall strategy summary", 
        "warnings": ["List of warnings"] 
      }
    }
  `;
}

module.exports = { getRecommendationPrompt };
