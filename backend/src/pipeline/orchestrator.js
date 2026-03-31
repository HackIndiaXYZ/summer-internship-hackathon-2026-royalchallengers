const { runNvidiaAgent, extractJSON } = require('../lib/nvidia');
const { getPersonaPrompt } = require('../agents/personaAgent');
const { getIngredientPrompt } = require('../agents/ingredientAgent');
const { getClaimPrompt } = require('../agents/claimAgent');
const { getRecommendationPrompt } = require('../agents/recommendationAgent');
const { getAlternativesPrompt } = require('../agents/alternativesAgent');
const { getVerdictPrompt } = require('../agents/verdictAgent');
const { getPresentationPrompt } = require('../agents/presentationAgent');

/**
 * Medo Veda Goal-Aware AI Pipeline
 * Orchestrates 7 specialized agents for personalized clinical reasoning.
 */
async function runAnalysisPipeline(inputData, userProfile) {
  const startTotal = Date.now();
  const TIMEOUT_MS = 45000;
  
  const pipelinePromise = (async () => {
    try {
      console.log('[Pipeline] Starting Persona-Driven Analysis...');

      // 1. IDENTITY & GOAL EXTRACTION (Persona Agent)
      const personaRaw = await runNvidiaAgent(
        `Input Content: ${inputData.content}`,
        getPersonaPrompt(userProfile),
        { modelType: 'clinical', maxTokens: 800 }
      );
      const personaContext = extractJSON(personaRaw) || { 
        primaryGoal: "General Health", 
        goalContext: "Maintain overall well-being.",
        neverIgnore: [],
        positiveIngredients: []
      };

      // 2. PARALLEL ANALYSIS (Ingredients & Claims)
      console.log(`[Pipeline] Analyzing for Goal: ${personaContext.primaryGoal}`);
      
      // First, get a basic extraction of product/nutrition (Step A1 from old pipeline for consistency)
      const identityRaw = await runNvidiaAgent(`
          Analyze input text: ${inputData.content}
          Extract Product Name, Brand, Category, and Nutritional values.
          Return JSON:
          {
            "product": { "name": "Real Name", "brand": "", "category": "", "nutrition": { "calories": 0, "sugar_g": 0, "fat_g": 0, "protein_g": 0, "salt_g": 0 } },
            "detectedIngredients": ["list", "of", "strings"]
          }
      `, "Extract identity and raw ingredient list.", { modelType: 'clinical', maxTokens: 800 });
      const identity = extractJSON(identityRaw);
      const product = identity?.product || {};
      const rawIngredients = identity?.detectedIngredients || [];

      const [ingredRaw, claimRaw] = await Promise.all([
        runNvidiaAgent(
          `Detected Ingredients: ${JSON.stringify(rawIngredients)}`,
          getIngredientPrompt(rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 1200 }
        ),
        runNvidiaAgent(
          `Analyze claims in: ${inputData.content}`,
          getClaimPrompt([], rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 1000 }
        )
      ]);

      const ingredData = extractJSON(ingredRaw) || { ingredients: [], topConcerns: [] };
      const claimData = extractJSON(claimRaw) || { claims: [] };

      // 3. RECOMMENDATION & ALTERNATIVES
      const [recoRaw, altRaw] = await Promise.all([
        runNvidiaAgent(
          `Product Data: ${JSON.stringify(product)}`,
          getRecommendationPrompt(product, ingredData.ingredients, personaContext),
          { modelType: 'clinical', maxTokens: 1000 }
        ),
        runNvidiaAgent(
          `Ingredients Analysis: ${JSON.stringify(ingredData.ingredients)}`,
          getAlternativesPrompt(ingredData.ingredients, personaContext),
          { modelType: 'clinical', maxTokens: 800 }
        )
      ]);

      const recoData = extractJSON(recoRaw) || { stance: "LIMIT", strategy: { intake: "Minimal", frequency: "Occasional", summary: "Insufficient data.", warnings: [] } };
      const altData = extractJSON(altRaw) || { alternatives: [] };

      // 4. VERDICT & PRESENTATION
      const [verdRaw, presRaw] = await Promise.all([
        runNvidiaAgent(
          `Recommendation: ${JSON.stringify(recoData)}`,
          getVerdictPrompt(recoData, ingredData.ingredients, personaContext),
          { modelType: 'clinical', maxTokens: 800 }
        ),
        runNvidiaAgent(
          `Summary: ${recoData.strategy?.summary}`,
          getPresentationPrompt(product, recoData.stance, recoData.strategy, personaContext),
          { modelType: 'clinical', maxTokens: 1000 }
        )
      ]);

      const verdData = extractJSON(verdRaw) || { score: 5.0, label: recoData.stance, confidence: 85 };
      const presData = extractJSON(presRaw) || { personalizedSummary: recoData.strategy?.summary, clinicalAnalysis: "Goal-aware assessment completed." };

      // FINAL REPORT MAPPING
      const report = {
        product: {
          name: product.name || 'Unknown Product',
          brand: product.brand || 'Detected',
          category: product.category || 'Consumer Good',
          source: inputData.type
        },
        verdict: {
          label: (verdData.label || recoData.stance || 'LIMIT').toUpperCase(),
          reason: presData.clinicalAnalysis || recoData.strategy?.summary || 'Assessment complete.',
          score: parseFloat(verdData.score) || 5.0,
          confidence: parseInt(verdData.confidence) || 85
        },
        highlights: [
          ...(ingredData.topConcerns || []),
          ...(recoData.strategy?.warnings || [])
        ].filter(Boolean).slice(0, 3),
        ingredient_analysis: (ingredData.ingredients || []).map(i => ({
          name: i.name,
          risk: i.risk || 'medium',
          reason: i.concern || 'Analyzed relative to goal.',
          function: i.function || 'Additive',
          classification: i.classification
        })),
        nutrition_analysis: {
          ...product.nutrition,
          risk_flags: (ingredData.topConcerns || []).map(c => ({ type: c, severity: 'medium' }))
        },
        claim_vs_reality: claimData.claims,
        personalized_advice: {
          intake: recoData.strategy?.intake || 'Standard serving',
          frequency: recoData.strategy?.frequency || 'Occasional',
          summary: presData.personalizedSummary || recoData.strategy?.summary || 'Proceed with caution.',
          warnings: recoData.strategy?.warnings || []
        },
        alternatives: altData.alternatives,
        personalization: personaContext
      };

      console.log(`[Pipeline] SUCCESS in ${Date.now() - startTotal}ms for Goal: ${personaContext.primaryGoal}`);
      return { report };

    } catch (error) {
      console.error('PIPELINE STEP FAILURE:', error);
      throw error;
    }
  })();

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );

  try {
    return await Promise.race([pipelinePromise, timeoutPromise]);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.warn('[Pipeline] TIMEOUT EXCEEDED');
      return { 
        partial: true, 
        message: "Analysis timed out — showing available results",
        report: {
          product: { name: "Analysis Timeout", brand: "System", category: "Unknown", source: inputData.type },
          verdict: { label: "LIMIT", reason: "Analysis took too long.", score: 5.0, confidence: 50 },
          highlights: ["Processing delay detected"],
          ingredient_analysis: [],
          nutrition_analysis: { calories: 0, sugar_g: 0, fat_g: 0, protein_g: 0, salt_g: 0, risk_flags: [] },
          claim_vs_reality: [],
          personalized_advice: { intake: "Minimal", frequency: "None", summary: "The analysis timed out. Please try again.", warnings: ["Processing Timeout"] },
          alternatives: []
        }
      };
    }
    throw err;
  }
}

module.exports = { runAnalysisPipeline };
