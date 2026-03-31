const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Medo Veda Optimized Clinical Pipeline
 * Collapses 9 agents into 3 high-powered parallel reasoning steps.
 * Execution Time: Target < 20s
 */
async function runAnalysisPipeline(inputData, userProfile) {
  const startTotal = Date.now();
  
  // OPTIMIZATION 4: Wrap entire pipeline in a 45-second timeout (Safe Buffer)
  const TIMEOUT_MS = 45000;
  
  const pipelinePromise = (async () => {
    const context = { input: inputData, user: userProfile };

    try {
      // --- CYCLE 1: PARALLEL PRODUCT & MOLECULAR INTELLIGENCE ---
      // OPTIMIZATION 1.A: Run Step 1 (Product/Category) and Step 2 (Ingredient Deep-Dive) in parallel
      // Also addresses BUG 2 (Product Name) and BUG 3 (Nutrition)
      console.log('[Pipeline] Starting Step A: Parallel Identification & Extraction...');
      
      const stepAPromises = [
        // Agent 1 & 2 combined: Product, Brand, Category, and Nutritional Extraction
        runNvidiaAgent(`
          You are a clinical molecular analyst.
          Analyze input for user: ${JSON.stringify(userProfile)}.
          Input: ${inputData.content}
          
          Tasks:
          1. Extract EXACT Product Name, Brand, and Category.
             - BUG FIX: Return the actual name from the text. NEVER return "product name".
          2. Extract detailed Nutritional values (Calories, Sugar, Fat, Protein, Salt).
             - BUG FIX: If seen in text, use it. If not, perform high-fidelity CLINICAL ESTIMATION.
             - NEVER default to 0 for these macronutrients. Use null ONLY if truly unknown.
          
          Return JSON:
          {
            "product": { "name": "Real Name", "brand": "", "category": "", "nutrition": { "calories": 0, "sugar_g": 0, "fat_g": 0, "protein_g": 0, "salt_g": 0 } }
          }
        `, "Extract product identity and nutrition. Be precise.", { modelType: 'clinical', maxTokens: 800 }), // OPTIMIZATION 2: Reduced tokens

        // Agent 3 & 4 combined: Detailed Ingredient & Risk Mapping
        runNvidiaAgent(`
          You are a molecular toxicologist.
          Review ingredients in: ${inputData.content}
          For user profile: ${JSON.stringify(userProfile)}
          
          Tasks:
          1. Map every ingredient to its Molecular Function.
          2. Map every ingredient to a Risk Level (low, medium, high) specific to this user profile.
          3. Identify top 3 critical Molecular Concerns.
          
          Return JSON:
          {
            "ingredients": [{ "name": "", "risk": "low|medium|high", "function": "", "concern": "" }],
            "topConcerns": [""]
          }
        `, "Detailed ingredient analysis. Be clinical.", { modelType: 'clinical', maxTokens: 1200 }) // OPTIMIZATION 2: 1200 for deep dive
      ];

      const [stepA1Raw, stepA2Raw] = await Promise.all(stepAPromises);
      const stepA1 = JSON.parse(stepA1Raw);
      const stepA2 = JSON.parse(stepA2Raw);
      
      context.product = stepA1.product;
      context.ingredients = stepA2.ingredients;
      context.topConcerns = stepA2.topConcerns;

      // --- CYCLE 2: PARALLEL CLAIMS, EVIDENCE & STRATEGY ---
      // OPTIMIZATION 1.B/C: Combined Evidence + Strategy parallel execution
      console.log('[Pipeline] Starting Step B: Parallel Evidence & Strategy...');
      
      // OPTIMIZATION 3: Combined query for web evidence to minimize latency
      const ingredientsForSearch = (context.ingredients || []).slice(0, 2).map(i => i.name).join(' and ');
      const searchTerms = ingredientsForSearch ? `focusing on ${ingredientsForSearch}` : 'general markers';

      const stepBPromises = [
        // Agent 6 & 7: Evidence, Marketing Verification & Alternatives
        runNvidiaAgent(`
          You are an Evidence Evidence Specialist.
          Analyze claims in: ${inputData.content}
          Against molecular data: ${JSON.stringify(context.ingredients)}
          Search Context: WHO and FSSAI guidelines for ${searchTerms} daily limits.
          
          Tasks:
          1. Verify if marketing claims are verified or misleading. Give a reality check.
          2. Suggest 2-3 healthier alternatives from global clinical databases.
          
          Return JSON:
          {
            "claims": [{ "claim": "", "status": "verified|misleading", "reality": "" }],
            "alternatives": [{ "name": "", "brand": "", "reason": "" }]
          }
        `, "Clinical evidence verification.", { modelType: 'clinical', maxTokens: 1000 }),

        // Agent 5 & 8: Serving size, Frequency, Scoring
        runNvidiaAgent(`
          You are a Senior Clinical Strategist.
          User: ${JSON.stringify(userProfile)}
          Product: ${JSON.stringify(context.product)}
          Risks: ${JSON.stringify(context.topConcerns)}
          
          Tasks:
          1. Set biometric strategy: Safe Intake Limit, Frequency, and Warnings.
          2. Set a precise Global Health Score (1.0 - 10.0) based on molecular risks.
          3. Set a Confidence Score (1-100).
          
          Return JSON:
          {
            "strategy": { "intake": "", "frequency": "", "summary": "", "warnings": [""] },
            "verdict": { "score": 0.0, "label": "SAFE|LIMIT|AVOID", "confidence": 0 }
          }
        `, "Final clinical strategy.", { modelType: 'clinical', maxTokens: 800 })
      ];

      const [stepB1Raw, stepB2Raw] = await Promise.all(stepBPromises);
      const stepB1 = JSON.parse(stepB1Raw);
      const stepB2 = JSON.parse(stepB2Raw);

      // --- FINAL MAPPING (Agent 9: Presentation) ---
      const report = {
        product: {
          name: stepA1.product?.name || inputData.content?.slice(0, 50) || 'Unknown Product',
          brand: stepA1.product?.brand || 'Detected',
          category: stepA1.product?.category || 'Consumer Good',
          source: inputData.type
        },
        verdict: {
          label: (stepB2.verdict?.label || 'LIMIT').toUpperCase(),
          reason: stepB2.strategy?.summary || 'Assessment complete.',
          score: parseFloat(stepB2.verdict?.score) || 5.0,
          confidence: parseInt(stepB2.verdict?.confidence) || 85
        },
        highlights: [
          ...(context.topConcerns || []),
          ...(stepB2.strategy?.warnings || [])
        ].filter(Boolean).slice(0, 3),
        ingredient_analysis: (context.ingredients || []).map(i => ({
          name: i.name,
          risk: i.risk || 'medium',
          reason: i.concern || 'Analyzed.',
          function: i.function || 'Additive'
        })),
        nutrition_analysis: {
          calories: stepA1.product?.nutrition?.calories || 0,
          sugar_g: stepA1.product?.nutrition?.sugar_g || 0,
          fat_g: stepA1.product?.nutrition?.fat_g || 0,
          protein_g: stepA1.product?.nutrition?.protein_g || 0,
          salt_g: stepA1.product?.nutrition?.salt_g || 0,
          risk_flags: (context.topConcerns || []).map(c => ({ type: c, severity: 'medium' }))
        },
        claim_vs_reality: (stepB1.claims || []).map(c => ({
          claim: c.claim,
          status: c.status,
          reality: c.reality
        })),
        personalized_advice: {
          intake: stepB2.strategy?.intake || 'Standard serving',
          frequency: stepB2.strategy?.frequency || 'Occasional',
          summary: stepB2.strategy?.summary || 'Proceed with caution.',
          warnings: stepB2.strategy?.warnings || []
        },
        alternatives: (stepB1.alternatives || []).map(a => ({
          name: a.name,
          brand: a.brand || 'Recommended Alternative',
          reason: a.reason || 'Clinically superior profile'
        }))
      };

      console.log(`[Pipeline] SUCCESS in ${Date.now() - startTotal}ms`);
      return { report, raw: context };

    } catch (error) {
      console.error('PIPELINE STEP FAILURE:', error);
      throw error;
    }
  })();

  // Race between pipeline and timeout
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );

  try {
    return await Promise.race([pipelinePromise, timeoutPromise]);
  } catch (err) {
    if (err.message === 'TIMEOUT') {
      console.warn('[Pipeline] TIMEOUT EXCEEDED - Returning partial recovery');
      return { 
        partial: true, 
        message: "Analysis timed out — showing available results",
        report: {
          product: { name: "Analysis Timeout", brand: "System", category: "Unknown", source: inputData.type },
          verdict: { label: "LIMIT", reason: "Analysis took too long. Showing partial results.", score: 5.0, confidence: 50 },
          highlights: ["Processing delay detected", "System timeout triggered"],
          ingredient_analysis: [],
          nutrition_analysis: { calories: 0, sugar_g: 0, fat_g: 0, protein_g: 0, salt_g: 0, risk_flags: [] },
          claim_vs_reality: [],
          personalized_advice: { intake: "Minimal", frequency: "None", summary: "The analysis timed out. Please try again with a clearer image or shorter text.", warnings: ["Processing Timeout"] },
          alternatives: []
        }
      };
    }
    throw err;
  }
}

module.exports = { runAnalysisPipeline };
