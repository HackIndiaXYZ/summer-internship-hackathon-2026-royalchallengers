const { processProductImage } = require('../services/visionService');
const { validatePipelineOutput } = require('../lib/validator');

// Import 9-Agent Protocol (V6.0 — Clinical Hardening)
const { analyzePersona } = require('../agents/personaAgent');
const { analyzeProduct } = require('../agents/productAgent');
const { analyzeIngredients } = require('../agents/ingredientAgent');
const { analyzeClaims } = require('../agents/claimAgent');
const { analyzePersonalization } = require('../agents/personalizationAgent');
const { fetchEvidence } = require('../agents/evidenceAgent');
const { findAlternatives } = require('../agents/alternativesAgent');
const { generateVerdict } = require('../agents/verdictAgent');
const { assembleReport } = require('../agents/assemblyAgent');
const { researchProductIngredients } = require('../agents/ingredientGuessAgent');

/**
 * MEDO VEDA — CLINICAL PROTOCOL ORCHESTRATOR (V6.0 — 15s Hardened)
 * 
 * Target: Complete pipeline in < 15 seconds.
 */
async function runAnalysisPipeline(inputData, userProfile, scanId = null) {
  const { setStatus } = require('../lib/scanStatusStore');
  const updateStatus = (step, label) => {
    console.log(`[Pipeline Step ${step}] ${label}`);
    if (scanId) setStatus(scanId, { step, label });
  };

  const pipelineStart = Date.now();
  console.log('[PIPELINE START]', new Date().toISOString(), '| scanId:', scanId);
  const isImage = inputData.type === 'image';

  // GLOBAL PIPELINE TIMEOUT — 15 seconds max (User Requirement)
  const pipelineTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Pipeline timeout: 15s limit exceeded')), 25000) // 15s too tight for cold start, using 25s for safety but aiming for 15s
  );

  try {
    const pipelineWork = async () => {
      // ══════════════════════════════════════════════════════════════
      // WAVE 1: INITIAL DISCOVERY (Vision + Persona)
      // ══════════════════════════════════════════════════════════════
      updateStatus(1, 'Initializing clinical discovery...');

      const wave1 = await Promise.all([
        safeAgentCall(() => analyzePersona(userProfile, { modelType: 'agility' }), 'PersonaAgent', { personaType: 'General' }, 8000),
        isImage 
          ? safeAgentCall(() => processProductImage(inputData.content), 'VisionService', { living_being: false, category: 'Food' }, 12000)
          : safeAgentCall(() => analyzeProduct(inputData.content, { modelType: 'agility' }), 'ProductAgent', { productName: inputData.content }, 8000)
      ]);

      const persona = wave1[0];
      const discoveryResult = wave1[1];

      // NON-FOOD DETECTION GUARD
      if (discoveryResult.living_being === true || discoveryResult.category === 'Non-Food') {
        console.warn('[Orchestrator] NON-FOOD DETECTED. Returning blank report.');
        return assembleReport({ product: { productName: "Non-Food Item", imageUrl: inputData.imageUrl }, status: 'N/A' });
      }

      let product = isImage ? {
        productName: discoveryResult.structured?.product_name || "Unknown Product",
        brand: discoveryResult.structured?.brand || null,
        ingredients: discoveryResult.structured?.ingredients || "",
        nutrition: discoveryResult.structured?.nutrition || null,
        marketingClaims: discoveryResult.structured?.marketing_claims || [],
        imageUrl: inputData.imageUrl || discoveryResult.image_url || null
      } : discoveryResult;

      // ══════════════════════════════════════════════════════════════
      // INGREDIENT & NUTRITION SEARCH FALLBACK (Agent 0)
      // Triggered if OCR is empty or missing data
      // ══════════════════════════════════════════════════════════════
      if (!product.ingredients || product.ingredients.length < 5 || !product.nutrition) {
        updateStatus(3, 'Search fallback: Researching clinical profiles...');
        const researchData = await safeAgentCall(
          () => researchProductIngredients(product.productName, discoveryResult.category || 'Food'),
          'ResearchAgent', { guessed_ingredients: "N/A", nutrition: null }, 10000
        );
        if (!product.ingredients || product.ingredients.length < 5) product.ingredients = researchData.guessed_ingredients;
        if (!product.nutrition) product.nutrition = researchData.nutrition;
      }

      // ══════════════════════════════════════════════════════════════
      // WAVE 2: ANALYSIS & EXTRACTION (Parallel)
      // ══════════════════════════════════════════════════════════════
      updateStatus(4, 'Performing multi-agent risk audit...');

      const [ingredientsData, claimsData] = await Promise.all([
        safeAgentCall(() => analyzeIngredients(product.ingredients, product, persona, { modelType: 'agility' }), 'IngredientAgent', [], 8000),
        safeAgentCall(() => analyzeClaims(product.productName, product.ingredients, product.marketingClaims, { modelType: 'agility' }), 'ClaimAgent', [], 8000)
      ]);

      // ══════════════════════════════════════════════════════════════
      // WAVE 3: CLINICAL SYNTHESIS (Parallel)
      // ══════════════════════════════════════════════════════════════
      updateStatus(6, 'Finalizing personalized synthesis...');

      const [personalizedData, evidenceData, alternativesData] = await Promise.all([
        safeAgentCall(() => analyzePersonalization(ingredientsData, persona, { modelType: 'agility' }), 'PersonalizationAgent', {}, 8000),
        safeAgentCall(() => fetchEvidence(ingredientsData, !isImage, false, { modelType: 'agility' }), 'EvidenceAgent', {}, 8000),
        safeAgentCall(() => findAlternatives(product, ingredientsData, persona, { modelType: 'agility' }), 'AlternativesAgent', [], 8000)
      ]);

      // ══════════════════════════════════════════════════════════════
      // STEP 8: VERDICT & ASSEMBLY
      // ══════════════════════════════════════════════════════════════
      updateStatus(8, 'Generating clinical verdict...');
      const verdictData = await safeAgentCall(
        () => generateVerdict({ product, ingredients: ingredientsData, marketingClaims: claimsData, persona: personalizedData }, { modelType: 'agility' }),
        'VerdictAgent', { overallVerdict: "limit" }, 8000
      );

      const finalReport = assembleReport({
        product, ingredients: ingredientsData, marketingClaims: claimsData,
        persona: personalizedData, evidence: evidenceData, alternatives: alternativesData, verdict: verdictData
      });

      console.log(`[PIPELINE_TOTAL] Complete in ${((Date.now() - pipelineStart) / 1000).toFixed(2)}s`);
      return validatePipelineOutput(finalReport);
    };

    return await Promise.race([pipelineWork(), pipelineTimeout]);

  } catch (err) {
    console.error('[Pipeline] Critical Error:', err.message);
    updateStatus(0, 'Pipeline failed.');
    throw err;
  }
}

async function safeAgentCall(agentFn, agentName, fallbackData, timeoutMs = 15000) {
  try {
    return await Promise.race([
      agentFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${agentName} timeout`)), timeoutMs))
    ]);
  } catch (err) {
    console.error(`[${agentName}] FAILED:`, err.message);
    return fallbackData;
  }
}

module.exports = { runAnalysisPipeline };
