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
 * Orchestrates specialized agents for personalized clinical reasoning.
 * Optimized for performance and reliability.
 */
async function runAnalysisPipeline(inputData, userProfile) {
  const startTotal = Date.now();
  const TIMEOUT_MS = 60000; // Increased to 60s for industrial reliability
  const isImage = inputData.type === 'image';

  try {
    console.log(`[Pipeline] Starting Analysis via ${inputData.type}...`);

    // ── WAVE 1: CONTEXT & IDENTITY ──
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
      - If nutritional data is missing, you MUST INFER/ESTIMATE it (per 100g). NEVER return empty or placeholder values.
      - Ensure all nutritional values are purely NUMERIC strings (e.g. "450", not "450 kcal"). Use "0" ONLY if it actually has zero (like water).
      
      Return JSON:
      {
        "persona": { "primaryGoal": "", "goalContext": "" },
        "product": { 
          "name": "", "brand": "", "category": "", 
          "nutrition": { "calories": "0", "sugar_g": "0", "fat_g": "0", "protein_g": "0", "salt_g": "0" } 
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
    if (!context.product) throw new Error('WAVE1_EXTRACTION_FAILED');

    const personaContext = context.persona || { primaryGoal: "General Health" };
    const product = context.product || { name: 'Unknown Product' };
    const rawIngredients = context.rawIngredients || [];

    console.log(`[Pipeline] Wave 1 Done. Product Identified: ${product.name}`);

    // Create a High-Confidence Base Report using Wave 1 Data (Nutrition/Identity)
    // This serves as the fallback if clinical analysis (Wave 2) is slow.
    const baseReport = {
      product: {
        name: product.name || 'Detected Product',
        brand: product.brand || 'Known Brand',
        category: product.category || 'Food/Beverage',
        source: inputData.type
      },
      verdict: { label: "ANALYZING", reason: "Identifying specific risk markers...", score: 50.0, confidence: 60 },
      highlights: ["Initial screening complete"],
      ingredient_analysis: rawIngredients.map(name => ({ name, risk: 'medium', reason: 'Analyzing...', function: 'Component' })),
      nutrition_analysis: {
        ...product.nutrition,
        risk_flags: []
      },
      claim_vs_reality: [],
      personalized_advice: { summary: "Preliminary analysis ready. Deep clinical scan in progress..." },
      alternatives: [],
      personalization: personaContext
    };

    // ── WAVE 2: CLINICAL CONSENSUS (Parallel - 4 agents) ──
    const runWave2 = (async () => {
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

      return {
        product: baseReport.product,
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
    })();

    // Calculate remaining time for Wave 2
    const timeUsed = Date.now() - startTotal;
    const remainingTime = Math.max(1, TIMEOUT_MS - timeUsed);

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), remainingTime)
    );

    try {
      const finalReport = await Promise.race([runWave2, timeoutPromise]);
      console.log(`[Pipeline] FULL COMPLETED in ${Date.now() - startTotal}ms`);
      return { report: finalReport };
    } catch (err) {
      if (err.message === 'TIMEOUT') {
        console.warn(`[Pipeline] Wave 2 Timed out after ${TIMEOUT_MS}ms. Returning Wave 1 data.`);
        return { report: baseReport, partial: true };
      }
      throw err;
    }

  } catch (error) {
    console.error('PIPELINE FAILURE:', error);
    // Ultimate fallback if Wave 1 fails or other crash
    return {
      success: false,
      report: {
        product: { name: "System Busy", brand: "Retry", category: "Error", source: inputData.type },
        verdict: { label: "ERROR", reason: "Critical system delay. Please try a simpler entry.", score: 0, confidence: 0 },
        nutrition_analysis: { calories: "----", sugar_g: "----", risk_flags: [] },
        personalized_advice: { summary: "The AI is currently under high load. Please try again in 30 seconds." }
      }
    };
  }
}

module.exports = { runAnalysisPipeline };
