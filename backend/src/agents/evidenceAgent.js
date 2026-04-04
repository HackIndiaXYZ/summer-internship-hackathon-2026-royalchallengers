const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 6 — WHO/FSSAI Evidence Agent (V4.0)
 * Logic: Find specific guidelines for risky ingredients and set data source flags.
 */
async function fetchEvidence(ingredientsAnalysis, isManualInput, isFromCuratedDb, options = {}) {
  // Defensive Guard
  if (!ingredientsAnalysis || !Array.isArray(ingredientsAnalysis) || ingredientsAnalysis.length === 0) {
    return {
      dataSourceFlags: {
        manualInputData: isManualInput,
        curatedSampleData: isFromCuratedDb,
        evidenceLayer: false,
        fssai: false
      }
    };
  }

  const riskyIngredients = ingredientsAnalysis.filter(i => i.status === 'Caution' || i.status === 'Harmful');

  const systemPrompt = `[MODE: SCIENTIFIC_RESEARCH_V4.0]
    Verify ingredients: ${JSON.stringify(riskyIngredients)}
    
    1. For each ingredient marked as 'Caution' or 'Harmful': State the specific WHO or FSSAI guideline that applies.
    2. If no specific guideline exists, write "None".
    3. Set the data source flags accurately:
       - evidenceLayer: true if you found real scientific guidelines for the ingredients.
       - fssai: true if an FSSAI-specific regulation was found.
    
    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA:
    {
      "dataSourceFlags": {
        "evidenceLayer": boolean,
        "fssai": boolean
      },
      "guidelineMatches": [
        {
          "ingredient": "string",
          "guidemark": "string — e.g., 'WHO limit on saturated fat < 10%'"
        }
      ]
    }`;

  const result = await runNvidiaAgent(
    `Verify clinical evidence and FSSAI standards.`,
    systemPrompt,
    { modelType: 'clinical', ensureJSON: true, ...options }
  );

  const finalResult = result || { dataSourceFlags: { evidenceLayer: false, fssai: false }, guidelineMatches: [] };
  
  return {
    dataSourceFlags: {
      manualInputData: isManualInput,
      curatedSampleData: isFromCuratedDb,
      evidenceLayer: finalResult.dataSourceFlags.evidenceLayer,
      fssai: finalResult.dataSourceFlags.fssai
    },
    guidelineMatches: finalResult.guidelineMatches
  };
}

module.exports = { fetchEvidence };
