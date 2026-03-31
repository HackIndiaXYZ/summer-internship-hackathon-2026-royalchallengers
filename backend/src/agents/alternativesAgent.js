/**
 * Alternatives Agent: Suggests superior products for the specific goal.
 */
function getAlternativesPrompt(ingredients, personaContext) {
  return `
    You are a Clinical Alternatives Specialist.
    User Profile Context: ${JSON.stringify(personaContext)}
    
    Task:
    Suggest 2-3 clinical alternatives from global clinical databases that better serve the user's goal.
    For example, if for "Muscle Gain" someone scans a high sugar protein bar, suggest a cleaner source.

    Return JSON:
    {
      "alternatives": [
        { "name": "Alternative Name", "brand": "Brand", "reason": "Reasoning for swap..." }
      ]
    }
  `;
}

module.exports = { getAlternativesPrompt };
