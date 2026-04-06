const { processProductImage } = require('../services/visionService');
const { validatePipelineOutput } = require('../lib/validator');

// Import 9-Agent Protocol (V7.0 — 15s Hardened)
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
 * MEDO VEDA — CLINICAL PROTOCOL ORCHESTRATOR (V7.0 — 15s Hardened)
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

  // GLOBAL PIPELINE TIMEOUT — Strictly enforced for frontend responsiveness
  const pipelineTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Pipeline timeout: 15s limit exceeded')), 16000)
  );

  try {
    const pipelineWork = async () => {
      // ══════════════════════════════════════════════════════════════
      // WAVE 1: INITIAL DISCOVERY (Parallel)
      // ══════════════════════════════════════════════════════════════
      updateStatus(1, 'Initializing clinical discovery...');

      const wave1 = await Promise.all([
        safeAgentCall(() => analyzePersona(userProfile, { modelType: 'agility' }), 'PersonaAgent', { personaType: 'General' }, 5000),
        isImage 
          ? safeAgentCall(() => processProductImage(inputData.content), 'VisionService', { living_being: false, category: 'Food' }, 10000)
          : safeAgentCall(() => analyzeProduct(inputData.content, { modelType: 'agility' }), 'ProductAgent', { productName: inputData.content }, 5000)
      ]);

      const persona = wave1[0];
      const discoveryResult = wave1[1];

      // NON-FOOD DETECTION GUARD (Early Exit)
      if (discoveryResult.living_being === true || discoveryResult.category === 'Non-Food') {
        console.warn('[Orchestrator] NON-FOOD DETECTED. Returning N/A report.');
        return assembleReport({ 
          product: { productName: discoveryResult.structured?.product_name || "Non-Food Item", imageUrl: inputData.imageUrl }, 
          status: 'N/A' 
        });
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
      // WAVE 2: RESEARCH & ANALYSIS (Trigger Research in Parallel with Agents)
      // ══════════════════════════════════════════════════════════════
      const needsResearch = !product.ingredients || 
                           product.ingredients.length < 15 || 
                           !product.nutrition || 
                           Object.keys(product.nutrition).length < 3 ||
                           (product.nutrition?.calories === 0 && product.productName !== "Water");

      updateStatus(4, 'Performing clinical audit...');

      // Start Research if needed, but don't block yet
      let researchPromise = Promise.resolve(null);
      if (needsResearch) {
        console.log('[Orchestrator] Triggering Research Path (Incomplete OCR data)');
        researchPromise = safeAgentCall(
          () => researchProductIngredients(product.productName, discoveryResult.category || 'Food'),
          'ResearchAgent', 
          null, 
          7000
        );
      }

      // Execute Wave 2 Analysis
      const [ingredientsData, claimsData, researchData] = await Promise.all([
        safeAgentCall(() => analyzeIngredients(product.ingredients, product, persona, { modelType: 'agility' }), 'IngredientAgent', [], 6000),
        safeAgentCall(() => analyzeClaims(product.productName, product.ingredients, product.marketingClaims, { modelType: 'agility' }), 'ClaimAgent', [], 6000),
        researchPromise
      ]);

      // If research found better data, re-run Analysis with improved context (only if we have time)
      let finalIngredients = ingredientsData;
      let finalClaims = claimsData;

      if (researchData) {
        console.log('[Orchestrator] Merging Research Data into Clinical Report');
        product.ingredients = researchData.guessed_ingredients || product.ingredients;
        product.nutrition = researchData.nutrition || product.nutrition;
        
        // Re-analyze ingredients with new data if OCR was poor
        if (!ingredientsData || ingredientsData.length < 3) {
          finalIngredients = await safeAgentCall(() => analyzeIngredients(product.ingredients, product, persona, { modelType: 'agility' }), 'IngredientAgent_Retry', [], 5000);
        }
      }

      // ══════════════════════════════════════════════════════════════
      // WAVE 3: SYNTHESIS (Parallel)
      // ══════════════════════════════════════════════════════════════
      updateStatus(7, 'Finalizing clinical synthesis...');

      const [personalizedData, evidenceData, alternativesData] = await Promise.all([
        safeAgentCall(() => analyzePersonalization(finalIngredients, persona, { modelType: 'agility' }), 'PersonalizationAgent', {}, 5000),
        safeAgentCall(() => fetchEvidence(finalIngredients, !isImage, false, { modelType: 'agility' }), 'EvidenceAgent', {}, 5000),
        safeAgentCall(() => findAlternatives(product, finalIngredients, persona, { modelType: 'agility' }), 'AlternativesAgent', [], 5000)
      ]);

      // ══════════════════════════════════════════════════════════════
      // WAVE 4: VERDICT & ASSEMBLY
      // ══════════════════════════════════════════════════════════════
      updateStatus(9, 'Generating clinical verdict...');
      const verdictData = await safeAgentCall(
        () => generateVerdict({ product, ingredients: finalIngredients, marketingClaims: finalClaims, persona: personalizedData }, { modelType: 'agility' }),
        'VerdictAgent', { overallVerdict: "limit" }, 5000
      );

      const finalReport = assembleReport({
        product, ingredients: finalIngredients, marketingClaims: finalClaims,
        persona: personalizedData, evidence: evidenceData, alternatives: alternativesData, verdict: verdictData
      });

      console.log(`[PIPELINE_TOTAL] Complete in ${((Date.now() - pipelineStart) / 1000).toFixed(2)}s`);
      return validatePipelineOutput(finalReport);
    };

    return await Promise.race([pipelineWork(), pipelineTimeout]);

  } catch (err) {
    console.error('[Pipeline] Critical Error:', err.message);
    updateStatus(0, 'Pipeline stalled. Returning fail-safe report.');
    return assembleReport({ product: { productName: "Analysis Timeout", brand: "External Search Recommended" }, status: 'N/A' });
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
