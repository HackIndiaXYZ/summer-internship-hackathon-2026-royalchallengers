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
  const TIMEOUT_MS = 25000;
  
  const pipelinePromise = (async () => {
    try {
      const isImage = inputData.type === 'image';
      console.log(`[Pipeline] Starting Analysis via ${inputData.type}...`);

      // ── WAVE 1: CONTEXT & IDENTITY (1 call) ──
      // Use VISION_MODEL if input is an image, CLINICAL otherwise.
      const contextRaw = await runNvidiaAgent(
        `Input Content: ${isImage ? 'Extracted from image' : inputData.content}`,
        `You are a Clinical Data Architect.
        User Profile: ${JSON.stringify(userProfile)}
        
        INPUT ANALYSIS:
        - Content: ${inputData.content} 
        (Note: Content may contain PRODUCT_NAME, INGREDIENTS_LIST, and RAW_EXTRACTION_CONTEXT from OCR).

        TASK:
        1. Extract the User's Primary Goal & Profile Context.
        2. Identify the Product Name, Brand, Category, and Ingredients.
        3. NUTRITION: Extract or Estimate precisely (calories, sugar_g, fat_g, protein_g, salt_g per 100g).
        
        STRICT RULES:
        - If nutritional data is missing from the input, you MUST INFER/ESTIMATE it based on the ingredients list and product category. NEVER return empty values or 0 if the product has calories.
        - Ensure all nutritional values are purely NUMERIC strings (e.g. "450", not "450 kcal").
        - Identify the TRUE commercial product name from the context.
        
        Return JSON:
        {
          "persona": { "primaryGoal": "", "goalContext": "" },
          "product": { 
            "name": "", "brand": "", "category": "", 
            "nutrition": { "calories": "", "sugar_g": "", "fat_g": "", "protein_g": "", "salt_g": "" } 
          },
          "rawIngredients": ["list", "of", "strings"]
        }`,
        { 
          modelType: isImage ? 'vision' : 'clinical', 
          maxTokens: 1000,
          image: isImage ? inputData.content : null 
        }
      );
      
      const context = extractJSON(contextRaw) || {};
      const personaContext = context.persona || { primaryGoal: "General Health" };
      const product = context.product || { name: 'Unknown Product' };
      const rawIngredients = context.rawIngredients || [];

      console.log(`[Pipeline] Wave 1 Done. Product Identified: ${product.name}`);

      // ── WAVE 2: CLINICAL CONSENSUS (Parallel - 3 agents) ──
      // Merged Verdict synthesis into Recommendation to eliminate Wave 3.
      const [ingredRaw, claimRaw, recoRaw, altRaw] = await Promise.all([
        runNvidiaAgent(
          `Ingredients: ${JSON.stringify(rawIngredients)}`,
          getIngredientPrompt(rawIngredients, personaContext),
          { modelType: 'agility', maxTokens: 800 }
        ),
        runNvidiaAgent(
          `Product Content: ${inputData.content}\nIngredients: ${JSON.stringify(rawIngredients)}`,
          getClaimPrompt([], rawIngredients, personaContext),
          { modelType: 'agility', maxTokens: 800 }
        ),
        runNvidiaAgent(
          `Analyze Product: ${JSON.stringify(product)}\nIngredients: ${JSON.stringify(rawIngredients)}`,
          getRecommendationPrompt(product, rawIngredients, personaContext),
          { modelType: 'clinical', maxTokens: 1000 }
        ),
        runNvidiaAgent(
          `Alternatives for: ${product.category}\nIngredients: ${JSON.stringify(rawIngredients)}`,
          getAlternativesPrompt(rawIngredients, personaContext),
          { modelType: 'agility', maxTokens: 800 }
        )
      ]);

      const ingredData = extractJSON(ingredRaw) || { ingredients: [] };
      const claimData = extractJSON(claimRaw) || { claims: [] };
      const recoData = extractJSON(recoRaw) || { stance: "LIMIT", score: 50 };
      const altData = extractJSON(altRaw) || { alternatives: [] };

      // ── FINAL REPORT MAPPING ──
      const report = {
        product: {
          name: product.name || 'Detected Product',
          brand: product.brand || 'Known Brand',
          category: product.category || 'Food/Beverage',
          source: inputData.type
        },
        verdict: {
          label: (recoData.stance || 'LIMIT').toUpperCase(),
          reason: recoData.clinicalAnalysis || recoData.strategy?.summary || 'Analysis complete.',
          score: parseFloat(recoData.score) || 50.0,
          confidence: parseInt(recoData.confidence) || 85
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
        claim_vs_reality: claimData.claims || [],
        personalized_advice: {
          intake: recoData.strategy?.intake || 'Standard serving',
          frequency: recoData.strategy?.frequency || 'Occasional',
          summary: recoData.personalizedSummary || recoData.strategy?.summary || 'Proceed with caution.',
          warnings: recoData.strategy?.warnings || []
        },
        alternatives: altData.alternatives || [],
        personalization: personaContext
      };

      console.log(`[Pipeline] COMPLETED in ${Date.now() - startTotal}ms`);
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
