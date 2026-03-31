/**
 * Claim Agent: Verifies marketing claims against ingredient evidence.
 */
function getClaimPrompt(claims, ingredients, personaContext) {
  return `
    You are an Evidence Specialist.
    User Profile Context: ${JSON.stringify(personaContext)}
    Product Ingredients: ${JSON.stringify(ingredients)}
    Marketing Claims: ${JSON.stringify(claims)}

    Task:
    Analyze marketing claims (e.g., "sugar-free", "high protein") against the ingredients.
    Return JSON:
    {
      "claims": [
        { "claim": "Claim text", "status": "verified|misleading", "reality": "Clinical reality check..." }
      ]
    }
  `;
}

module.exports = { getClaimPrompt };
