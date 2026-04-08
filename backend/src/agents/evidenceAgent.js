const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 6 — WHO/FSSAI Evidence Agent (V4.0)
 * Logic: Find specific guidelines for risky ingredients and set data source flags.
 */
async function fetchEvidence(ingredientsAnalysis, isManualInput, isFromCuratedDb, options = {}) {
  // Defensive Guard — coerce to array
  const ingredientsList = Array.isArray(ingredientsAnalysis) ? ingredientsAnalysis : [];

  if (ingredientsList.length === 0) {
    return {
      dataSourceFlags: {
        manualInputData: isManualInput,
        curatedSampleData: isFromCuratedDb,
        evidenceLayer: false,
        fssai: false
      },
      guidelineMatches: []
    };
  }

  const riskyIngredients = ingredientsList.filter(i => i.status === 'Caution' || i.status === 'Harmful');

  const systemPrompt = `[MODE: SCIENTIFIC_RESEARCH_V4.1]
    Audit: ${JSON.stringify(riskyIngredients)}
    
    TASK: Find WHO/FSSAI guideline marks.
    
    SCHEMA: {
      "dataSourceFlags": { "evidenceLayer": boolean, "fssai": boolean },
      "guidelineMatches": [ { "ingredient": "string", "guidemark": "string" } ]
    }
    
    Constraint: Max 3 matches. If no specific guidelines exist for these ingredients, return an empty array []. DO NOT invent or use generic placeholders. No chatter. Use Llama 3.1 8B.`;

  const result = await runNvidiaAgent(
    `Verify: ${JSON.stringify(riskyIngredients)}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 300, ...options }
  );

  const finalResult = (result && typeof result === 'object' && !result.error)
    ? result
    : { dataSourceFlags: { evidenceLayer: false, fssai: false }, guidelineMatches: [] };

  return {
    dataSourceFlags: {
      manualInputData: isManualInput,
      curatedSampleData: isFromCuratedDb,
      evidenceLayer: finalResult.dataSourceFlags?.evidenceLayer ?? false,
      fssai: finalResult.dataSourceFlags?.fssai ?? false
    },
    guidelineMatches: finalResult.guidelineMatches || []
  };
}

module.exports = { fetchEvidence };
