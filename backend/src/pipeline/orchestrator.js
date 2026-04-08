const { processProductImage } = require('../services/visionService');
const { validatePipelineOutput } = require('../lib/validator');

// Import 9-Agent Protocol (V8.0 — Production Hardened)
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
 * MEDO VEDA — CLINICAL PROTOCOL ORCHESTRATOR (V8.0 — Production Hardened)
 * 
 * ARCHITECTURE:
 *   Wave 1: Vision + Persona (parallel)        — ~5-12s
 *   Wave 2: Ingredients + Claims + Research     — ~5-8s
 *   Wave 3: Personalization + Evidence + Alts   — ~3-5s
 *   Wave 4: Verdict + Assembly                  — ~2-3s
 *   Total expected: 15-28s
 *   Safety timeout: 60s (backstop only — user already has scanId via polling)
 */
async function runAnalysisPipeline(inputData, userProfile, scanId = null) {
  const { setStatus } = require('../lib/scanStatusStore');
  const updateStatus = (step, label) => {
    console.log(`[Pipeline Step ${step}] ${label}`);
    if (scanId) setStatus(scanId, { step, label });
  };

  const pipelineStart = Date.now();
  const elapsed = () => `${((Date.now() - pipelineStart) / 1000).toFixed(1)}s`;
  console.log('[PIPELINE START]', new Date().toISOString(), '| scanId:', scanId);
  const isImage = inputData.type === 'image';

  // SAFETY BACKSTOP — 45s. The user is already polling via scanId, so this
  // is only here to prevent infinite hangs. NOT a user-facing constraint.
  const pipelineTimeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Pipeline safety timeout: 60s exceeded')), 60000)
  );

  try {
    const pipelineWork = async () => {
      // ══════════════════════════════════════════════════════════════
      // WAVE 1: DISCOVERY (Vision + Persona)
      // ══════════════════════════════════════════════════════════════
      updateStatus(1, 'Fast-tracking discovery...');
      const w1Start = Date.now();

      const [persona, discoveryResult] = await Promise.all([
        safeAgentCall(() => analyzePersona(userProfile, { modelType: 'agility' }), 'PersonaAgent', { personaType: 'General' }, 15000),
        isImage
          ? safeAgentCall(() => processProductImage(inputData.content), 'VisionService', { living_being: false, category: 'Food', structured: {} }, 25000)
          : safeAgentCall(() => analyzeProduct(inputData.content, { modelType: 'agility' }), 'ProductAgent', { productName: inputData.content }, 15000)
      ]);

      console.log(`[WAVE 1] ${((Date.now() - w1Start) / 1000).toFixed(1)}s`);

      if (discoveryResult.living_being === true || discoveryResult.category === 'Non-Food') {
        return assembleReport({
          product: { productName: discoveryResult.structured?.product_name || "Non-Food Item", imageUrl: inputData.imageUrl },
          status: 'N/A'
        });
      }

      const isMostlyZero = (nut) => {
        if (!nut) return true;
        const values = [nut.calories, nut.fat, nut.sugar, nut.salt, nut.protein, nut.carbohydrates];
        return values.every(v => v === 0 || v === null || v === undefined);
      };

      let product = isImage ? {
        productName: discoveryResult.structured?.product_name || "Unknown Product",
        brand: discoveryResult.structured?.brand || null,
        ingredients: discoveryResult.structured?.ingredients || "",
        nutrition: discoveryResult.structured?.nutrition || null,
        marketingClaims: discoveryResult.structured?.marketing_claims || [],
        imageUrl: inputData.imageUrl || discoveryResult.image_url || null,
        needsResearch: discoveryResult.needs_research || 
                       (!discoveryResult.structured?.ingredients) || 
                       isMostlyZero(discoveryResult.structured?.nutrition)
      } : { 
        ...discoveryResult, 
        needsResearch: (!discoveryResult.ingredients) || isMostlyZero(discoveryResult.nutrition)
      };

      // ══════════════════════════════════════════════════════════════
      // WAVE 2: ANALYSIS & RESEARCH (Parallel)
      // ══════════════════════════════════════════════════════════════
      updateStatus(4, 'Clinical audit in progress...');
      const w2Start = Date.now();

      // Kick off Research early if needed
      const researchPromise = product.needsResearch
        ? safeAgentCall(() => researchProductIngredients(product.productName, discoveryResult.category || 'Food'), 'ResearchAgent', null, 15000)
        : Promise.resolve(null);

      const [ingredientsData, claimsData, researchData] = await Promise.all([
        safeAgentCall(() => analyzeIngredients(product.ingredients, product, persona, { modelType: 'agility' }), 'IngredientAgent', [], 15000),
        safeAgentCall(() => analyzeClaims(product.productName, product.ingredients, product.marketingClaims, { modelType: 'agility' }), 'ClaimAgent', [], 10000),
        researchPromise
      ]);

      console.log(`[WAVE 2] ${((Date.now() - w2Start) / 1000).toFixed(1)}s`);

      // Merge Research
      let finalIngredients = Array.isArray(ingredientsData) ? ingredientsData : [];
      if (researchData && !researchData.error) {
        if (researchData.guessed_ingredients) product.ingredients = researchData.guessed_ingredients;
        if (researchData.nutrition) product.nutrition = { ...(product.nutrition || {}), ...researchData.nutrition };
        // Quick re-check if initial extraction was empty
        if (finalIngredients.length < 2 && researchData.guessed_ingredients) {
          finalIngredients = await safeAgentCall(() => analyzeIngredients(product.ingredients, product, persona, { modelType: 'agility' }), 'IngredientAgent_Retry', [], 10000);
        }
      }

      // ══════════════════════════════════════════════════════════════
      // WAVE 3: SYNTHESIS & VERDICT (Max Parallel)
      // ══════════════════════════════════════════════════════════════
      updateStatus(7, 'Synthesizing verdict...');
      const w3Start = Date.now();

      // Resolve persona if passed as a promise (Late-binding optimization)
      const resolvedPersona = (persona instanceof Promise) ? await persona : (persona || {});

      const [personaData, evidence, alts, verdict] = await Promise.all([
        safeAgentCall(() => analyzePersonalization(finalIngredients, resolvedPersona, { modelType: 'agility' }), 'Personalization', {}, 10000),
        safeAgentCall(() => fetchEvidence(finalIngredients, false, false, { modelType: 'agility' }), 'Evidence', {}, 10000),
        safeAgentCall(() => findAlternatives(product, finalIngredients, resolvedPersona, { modelType: 'agility' }), 'Alts', [], 10000),
        safeAgentCall(() => generateVerdict({ product, ingredients: finalIngredients, persona: resolvedPersona }, { modelType: 'agility' }), 'Verdict', { overallVerdict: "caution" }, 10000)
      ]);

      console.log(`[WAVE 3] ${((Date.now() - w3Start) / 1000).toFixed(1)}s`);

      // ══════════════════════════════════════════════════════════════
      // WAVE 4: ASSEMBLY
      // ══════════════════════════════════════════════════════════════
      const finalReport = assembleReport({
        product, ingredients: finalIngredients, marketingClaims: claimsData,
        persona: personaData, evidence, alternatives: alts, verdict
      });

      console.log(`[PIPELINE_TOTAL] ${elapsed()}`);
      return validatePipelineOutput(finalReport);
    };

    return await Promise.race([pipelineWork(), pipelineTimeout]);

  } catch (err) {
    console.error(`[Pipeline] Fatal:`, err.message);
    updateStatus(0, 'Returning fail-safe report.');
    return assembleReport({ product: { productName: "Analysis Interrupted", brand: "System Busy" }, status: 'N/A' });
  }
}

async function safeAgentCall(agentFn, agentName, fallbackData, timeoutMs = 30000) {
  const start = Date.now();
  try {
    const result = await Promise.race([
      agentFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error(`${agentName} timeout after ${timeoutMs}ms`)), timeoutMs))
    ]);
    console.log(`[${agentName}] OK in ${Date.now() - start}ms`);
    return result;
  } catch (err) {
    console.error(`[${agentName}] FAILED in ${Date.now() - start}ms:`, err.message);
    return fallbackData;
  }
}

module.exports = { runAnalysisPipeline };
