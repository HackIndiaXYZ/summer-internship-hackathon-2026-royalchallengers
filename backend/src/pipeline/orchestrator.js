const { processProductImage } = require('../services/visionService');
const { validatePipelineOutput } = require('../lib/validator');

// Import 9-Agent Protocol (V4.8)
const { analyzePersona } = require('../agents/personaAgent');
const { analyzeProduct } = require('../agents/productAgent');
const { analyzeIngredients } = require('../agents/ingredientAgent');
const { analyzeClaims } = require('../agents/claimAgent');
const { analyzePersonalization } = require('../agents/personalizationAgent');
const { fetchEvidence } = require('../agents/evidenceAgent');
const { findAlternatives } = require('../agents/alternativesAgent');
const { generateVerdict } = require('../agents/verdictAgent');
const { assembleReport } = require('../agents/assemblyAgent');

/**
 * MEDO VEDA — CLINICAL PROTOCOL ORCHESTRATOR (V4.8)
 * 9-Agent reasoning pipeline for high-fidelity clinical reports.
 */
async function runAnalysisPipeline(inputData, userProfile, scanId = null) {
  const { setStatus } = require('../lib/scanStatusStore');
  const updateStatus = (step, label) => {
    console.log(`[Pipeline Status] Step ${step}: ${label}`);
    if (scanId) setStatus(scanId, { step, label });
  };

  const pipelineStart = Date.now();
  console.log('[PIPELINE START]', new Date().toISOString());
  const isImage = inputData.type === 'image';

  try {
    // ── STEP 1: PERSONA CONTEXT (8B AGILITY) ──
    updateStatus(1, 'Extracting user health profile & risk lens...');
    const persona = await analyzePersona(userProfile, { modelType: 'agility' });
    console.log('[WAVE_1_DONE/Persona]', Date.now() - pipelineStart, 'ms');

    // ── STEP 2: PRODUCT EXTRACTION (VISION OR AGILITY) ──
    let product;
    if (isImage) {
      updateStatus(2, 'Deconstructing specimen via 90B Vision Engine...');
      const visionRes = await processProductImage(inputData.content);
      
      // Safety Guard: Abort if living being detected
      if (visionRes.living_being) {
         return {
          productName: "Non-Edible Specimen",
          overallVerdict: "avoid",
          healthImpact: { verdictReasoning: "No clinical data available for this specimen type." },
          status: 'ABORTED'
        };
      }

      const vStruct = visionRes.structured || {};
      product = {
        productName: vStruct.product_name || "Unknown Product",
        brand: vStruct.brand || null,
        ingredients: vStruct.ingredients || "",
        nutrition: vStruct.nutrition || null,
        marketingClaims: vStruct.marketing_claims || [],
        imageUrl: inputData.imageUrl || visionRes.image_url || null,
        raw_ocr: visionRes.raw
      };
    } else {
      updateStatus(2, 'Analyzing product metadata...');
      const pRes = await analyzeProduct(inputData.content, { modelType: 'agility' });
      product = {
        productName: pRes.productName || inputData.content,
        brand: pRes.brand || null,
        ingredients: pRes.ingredients || "",
        nutrition: pRes.nutrition || null,
        marketingClaims: pRes.marketingClaims || [],
        imageUrl: null
      };
    }
    console.log('[WAVE_2_DONE/Vision]', Date.now() - pipelineStart, 'ms');

    // ── WAVE 3: CORE CLINICAL AUDIT (70B PARALLEL) ──
    updateStatus(4, 'Executing multi-agent clinical audit (70B)...');
    
    // Run independent clinical agents in parallel
    const [ingredientsData, claimsData] = await Promise.all([
      analyzeIngredients(product.ingredients, product, persona, { modelType: 'agility' }),
      analyzeClaims(product.productName, product.ingredients, product.marketingClaims, { modelType: 'agility' })
    ]);
    console.log('[WAVE_3_DONE/Clinical Audit]', Date.now() - pipelineStart, 'ms');

    // ── WAVE 4: PERSONALIZATION & EVIDENCE (REQUIRES WAVE 3) ──
    updateStatus(7, 'Synthesizing personalized health impact...');
    
    const [evidenceData, alternativesData, personalizedData] = await Promise.all([
      fetchEvidence(ingredientsData, !isImage, false, { modelType: 'agility' }),
      findAlternatives(product, ingredientsData, persona, { modelType: 'agility' }),
      analyzePersonalization(ingredientsData, persona, { modelType: 'agility' })
    ]);
    console.log('[WAVE_4_DONE/Deep Reason]', Date.now() - pipelineStart, 'ms');

    // ── STEP 8: FINAL VERDICT (70B CLINICAL) ──
    updateStatus(8, 'Determining clinical verdict...');
    const verdictData = await generateVerdict(
      { product, ingredients: ingredientsData, marketingClaims: claimsData, persona: personalizedData },
      { modelType: 'agility' }
    );
    console.log('[VERDICT_DONE]', Date.now() - pipelineStart, 'ms');

    // ── STEP 9: ASSEMBLY (JAVASCRIPT) ──
    updateStatus(9, 'Assembling high-fidelity report...');
    const rawReport = {
      product,
      ingredients: ingredientsData,
      marketingClaims: claimsData,
      persona: personalizedData,
      evidence: evidenceData,
      alternatives: alternativesData,
      verdict: verdictData
    };

    const finalReport = assembleReport(rawReport);
    
    console.log(`[PIPELINE_TOTAL] Protocol complete in ${((Date.now() - pipelineStart)/1000).toFixed(2)}s`);
    return validatePipelineOutput(finalReport);

  } catch (err) {
    console.error('[Pipeline] Critical Protocol Failure:', err);
    updateStatus(0, 'System failure during clinical analysis.');
    throw err;
  }
}

module.exports = { runAnalysisPipeline };
