const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Medo Veda Optimized Clinical Pipeline
 * Collapses 9 agents into 2 high-powered reasoning cycles.
 * Uses Llama 3.3 70B for maximum clinical accuracy.
 */
async function runAnalysisPipeline(inputData, userProfile) {
  const startTotal = Date.now();
  const context = { input: inputData, user: userProfile };

  try {
    // --- CYCLE 1: PRODUCT & MOLECULAR INTELLIGENCE ---
    console.log('[Pipeline] Starting Cycle 1: Molecular Intelligence...');
    const cycle1Prompt = `
      You are the lead Molecular Intelligence Agent.
      Analyze the following product input for a user with these biometrics: ${JSON.stringify(userProfile)}.
      
      Input Source: ${inputData.type}
      Input Content: ${inputData.content}

      Tasks:
      1. Extract correct Product Name, Brand, and Category.
      2. Identify the FULL list of ingredients.
      3. For each ingredient, determine its specific risk level (high, medium, low) relative to the USER'S health profile.
      4. List the primary function of each ingredient.
      5. Identify the top 3 molecular concerns for this specific user.
      6. CRITICAL: Extract detailed Nutritional values (Calories, Sugar, Fat, Protein). 
         If values are present in the text/image, extract them exactly.
         If NOT explicitly found, perform a high-fidelity CLINICAL ESTIMATION based on the product type. 
         NEVER return 0 if the product naturally contains these macronutrients.

      Return JSON ONLY:
      {
        "product": { 
          "name": "", "brand": "", "category": "", 
          "nutrition": { "calories": 0, "sugar_g": 0, "fat_g": 0, "protein_g": 0 } 
        },
        "ingredients": [{ "name": "", "risk": "low|medium|high", "concern": "", "function": "" }],
        "claims": [{ "claim": "", "status": "misleading|verified" }],
        "topConcerns": [""]
      }
    `;

    const cycle1Res = await runNvidiaAgent(cycle1Prompt, "You are a clinical molecular analyst. Be precise and always provide estimated nutritional values if missing.", { modelType: 'clinical' });
    const cycle1Data = JSON.parse(cycle1Res);
    context.step1 = cycle1Data;

    // --- CYCLE 2: CLINICAL STRATEGY & VERDICT ---
    console.log('[Pipeline] Starting Cycle 2: Clinical Strategy...');
    const cycle2Prompt = `
      You are the lead Clinical Strategist.
      Based on the molecular intelligence below, finalize the clinical verdict and biometric strategy for the user.
      
      User Profile: ${JSON.stringify(userProfile)}
      Molecular Data: ${JSON.stringify(cycle1Data)}

      Tasks:
      1. Verify each marketing claim against the molecular reality. Provide a blunt reality check.
      2. Set a Biometric Strategy: safe serving size, consumption frequency, and specific warnings.
      3. Global Health Score (1-10) - strictly derived from ingredient risks.
      4. Confidence Score (0-100) - reflect how complete the input data was.
      5. Suggest 3 healthier alternatives.

      Return JSON ONLY:
      {
        "claims_verification": [{ "claim": "", "status": "verified|misleading", "reality": "" }],
        "biometric_strategy": { "summary": "", "intake_limit": "", "frequency": "", "warnings": [""] },
        "final_verdict": { 
          "score": 0, 
          "verdict": "SAFE|LIMIT|AVOID", 
          "summary": "", 
          "primary_reason": "",
          "confidence": 0
        },
        "alternatives": [{ "name": "", "brand": "", "reason": "" }]
      }
    `;

    const cycle2Res = await runNvidiaAgent(cycle2Prompt, "You are a senior clinical consultant. Be direct, authoritative, and provide high-fidelity medical-grade advice.", { modelType: 'clinical' });
    const cycle2Data = JSON.parse(cycle2Res);
    context.step2 = cycle2Data;

    // --- FINAL MAPPING ---
    const ingredients = cycle1Data.ingredients || [];
    const highCount = ingredients.filter(i => i.risk === 'high').length;
    const medCount = ingredients.filter(i => i.risk === 'medium').length;

    // Dynamic Score Calculation
    let finalScore = cycle2Data.final_verdict?.score;
    if (!finalScore || finalScore === 0) {
      finalScore = Math.max(1, 10 - (highCount * 3) - (medCount * 1));
    }

    // Dynamic Confidence
    let confidence = cycle2Data.final_verdict?.confidence;
    if (!confidence || confidence === 0) {
      confidence = Math.max(50, 95 - (ingredients.length === 0 ? 30 : 0));
    }

    const report = {
      product: {
        name: cycle1Data.product?.name || inputData.content?.slice(0, 50) || 'Product',
        brand: cycle1Data.product?.brand || 'Detected',
        category: cycle1Data.product?.category || 'Consumer Good',
        source: inputData.type
      },
      verdict: {
        label: (cycle2Data.final_verdict?.verdict || 'LIMIT').toUpperCase(),
        reason: cycle2Data.final_verdict?.summary || 'Assessment complete.',
        score: finalScore,
        confidence: confidence
      },
      highlights: [
        cycle2Data.final_verdict?.primary_reason,
        ...cycle1Data.topConcerns
      ].filter(Boolean).slice(0, 3),
      ingredient_analysis: ingredients.map(i => ({
        name: i.name,
        risk: i.risk || 'medium',
        reason: i.concern || 'Analyzed.',
        function: i.function || 'Additive'
      })),
      nutrition_analysis: {
        calories: cycle1Data.product?.nutrition?.calories || 0,
        sugar_g: cycle1Data.product?.nutrition?.sugar_g || cycle1Data.product?.nutrition?.sugar || 0,
        fat_g: cycle1Data.product?.nutrition?.fat_g || cycle1Data.product?.nutrition?.fat || 0,
        protein_g: cycle1Data.product?.nutrition?.protein_g || cycle1Data.product?.nutrition?.protein || 0,
        risk_flags: (cycle1Data.topConcerns || []).map(c => ({ type: c, severity: 'medium' }))
      },
      claim_vs_reality: (cycle2Data.claims_verification || []).map(c => ({
        claim: c.claim,
        status: (c.status === 'verified' || c.status === 'true') ? 'verified' : 'misleading',
        reality: c.reality
      })),
      personalized_advice: {
        intake: cycle2Data.biometric_strategy?.intake_limit || 'Standard serving',
        frequency: cycle2Data.biometric_strategy?.frequency || 'Occasional',
        summary: cycle2Data.biometric_strategy?.summary || 'Proceed with caution.',
        warnings: cycle2Data.biometric_strategy?.warnings || []
      },
      alternatives: (cycle2Data.alternatives || []).map(a => ({
        name: a.name,
        brand: a.brand || 'Recommended Alternative',
        reason: a.reason || 'Clinically superior profile'
      }))
    };

    console.log(`[Pipeline] SUCCESS in ${Date.now() - startTotal}ms | Score: ${finalScore} | Conf: ${confidence}`);
    return { report, raw: context };

  } catch (error) {
    console.error('CRITICAL PIPELINE FAILURE:', error);
    throw error;
  }
}

module.exports = { runAnalysisPipeline };
