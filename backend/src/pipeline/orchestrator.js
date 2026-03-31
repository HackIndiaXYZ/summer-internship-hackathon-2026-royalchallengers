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
  const TIMEOUT_MS = 25000; // Drastic reduction for better UX
  
  const pipelinePromise = (async () => {
    try {
      console.log('[Pipeline] Starting Optimized Persona-Driven Analysis...');

      // ── WAVE 1: CONTEXT & IDENTITY (1 call) ──
      // Consolidating Persona extraction and Product Identity to save 15s.
      const contextRaw = await runNvidiaAgent(
        `Input Content: ${inputData.content}`,
        `You are a Clinical Data Architect.
        1. Extract the User's Primary Goal & Context based on: ${JSON.stringify(userProfile)}
        2. Extract Product Name, Brand, Category, and Raw Ingredients from the input.
        
        STRICT RULES:
        - NEVER return "title image extract" or placeholders.
        - If name is unclear, use the most prominent commercial noun.
        - Strip all OCR noise.
        
        Return JSON:
        {
          "persona": { "primaryGoal": "", "goalContext": "", "neverIgnore": [], "positiveIngredients": [] },
          "product": { "name": "Real Name", "brand": "", "category": "", "nutrition": { "calories": 0, "sugar_g": 0, "fat_g": 0, "protein_g": 0, "salt_g": 0 } },
          "rawIngredients": ["list", "of", "strings"]
        }`,
        { modelType: 'clinical', maxTokens: 1200 }
      );
      
      const context = extractJSON(contextRaw) || {};
      const personaContext = context.persona || { primaryGoal: "General Health", goalContext: "Standard assessment." };
      const product = context.product || { name: 'Unknown Product' };
      const rawIngredients = context.rawIngredients || [];

      console.log(`[Pipeline] Wave 1 Complete. Goal: ${personaContext.primaryGoal}. Product: ${product.name}`);

      // ── WAVE 2: MULTI-AGENT CLINICAL ANALYSIS (Parallel - 4 agents) ──
      // Running Ingredients, Claims, Recommendations, and Alternatives in one parallel burst.
      const [ingredRaw, claimRaw, recoRaw, altRaw] = await Promise.all([
        runNvidiaAgent(
          `Ingredients: ${JSON.stringify(rawIngredients)}`,
          getIngredientPrompt(rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 1000 }
        ),
        runNvidiaAgent(
          `Content: ${inputData.content}\nIngredients: ${JSON.stringify(rawIngredients)}`,
          getClaimPrompt([], rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 1000 }
        ),
        runNvidiaAgent(
          `Product: ${JSON.stringify(product)}\nIngredients: ${JSON.stringify(rawIngredients)}`,
          getRecommendationPrompt(product, rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 800 }
        ),
        runNvidiaAgent(
          `Ingredients: ${JSON.stringify(rawIngredients)}`,
          getAlternativesPrompt(rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 800 }
        )
      ]);

      const ingredData = extractJSON(ingredRaw) || { ingredients: [], topConcerns: [] };
      const claimData = extractJSON(claimRaw) || { claims: [] };
      const recoData = extractJSON(recoRaw) || { stance: "LIMIT", strategy: { intake: "Minimal", summary: "Cautious approach." } };
      const altData = extractJSON(altRaw) || { alternatives: [] };

      // ── WAVE 3: VERDICT & PRESENTATION (1 call) ──
      // Merging final summary and scoring to save another 15s.
      const finalRaw = await runNvidiaAgent(
        `Analysis Result: ${JSON.stringify(recoData)}`,
        `Synthesize the final clinical verdict and personalized summary.
        User Goal: ${personaContext.primaryGoal}
        Stance: ${recoData.stance}
        
        Return JSON:
        {
          "score": 0.0, 
          "confidence": 0, 
          "label": "SAFE|LIMIT|AVOID",
          "personalizedSummary": "Summary for user...",
          "clinicalAnalysis": "Deep dive for report..."
        }`,
        { modelType: 'clinical', maxTokens: 1000 }
      );

      const finalData = extractJSON(finalRaw) || { score: 5.0, label: recoData.stance };

      // ── FINAL REPORT MAPPING ──
      const report = {
        product: {
          name: product.name?.replace(/title image extract/gi, 'Product Analyzed') || 'Unknown Product',
          brand: product.brand || 'Detected',
          category: product.category || 'Consumer Good',
          source: inputData.type
        },
        verdict: {
          label: (finalData.label || recoData.stance || 'LIMIT').toUpperCase(),
          reason: finalData.clinicalAnalysis || recoData.strategy?.summary || 'Assessment complete.',
          score: parseFloat(finalData.score) || 5.0,
          confidence: parseInt(finalData.confidence) || 85
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
          summary: finalData.personalizedSummary || recoData.strategy?.summary || 'Proceed with caution.',
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
      console.warn('[Pipeline] TIMEOUT EXCEEDED - Return partial if possible');
      // Fallback response for extreme latency
      return { 
        timeout: true,
        report: {
          product: { name: "Analysis Optimized", brand: "System", category: "Timeout Fallback", source: inputData.type },
          verdict: { label: "LIMIT", reason: "The analysis is processing slower than usual. Please check back in history in 1 minute.", score: 5.0, confidence: 50 },
          highlights: ["System processing delay"],
          ingredient_analysis: [],
          nutrition_analysis: { risk_flags: [] },
          claim_vs_reality: [],
          personalized_advice: { summary: "Analysis taking longer than 25s. System is still working in background." },
          alternatives: []
        }
      };
    }
    throw err;
  }
}

module.exports = { runAnalysisPipeline };
