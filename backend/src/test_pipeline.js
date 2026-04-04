const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { runAnalysisPipeline } = require('./pipeline/orchestrator');

/**
 * MEDO VEDA — PIPELINE VERIFICATION SCRIPT (V3.0)
 * Objective: Validate end-to-end clinical analysis for a known high-risk product.
 */
async function testPipeline() {
  console.log('🚀 [Test] Starting Medo Veda V3.0 Pipeline Verification...');

  // 1. Mock Data: High-Sodium Snack (Maggi Noodles case)
  const inputData = {
    type: 'text',
    content: "Maggi 2-Minute Noodles. Ingredients: Wheat Flour, Palm Oil, Salt, Sugar, Potassium Chloride, Monosodium Glutamate, Garlic, Spices. Nutrition: 350 kcal, 14g Fat, 2g Sugar."
  };

  // 2. Mock Persona: Diabetic Adult
  const userProfile = {
    age: 45,
    conditions: ["Diabetes"],
    goals: ["Blood Sugar Management", "Reduced Sodium"]
  };

  try {
    const start = Date.now();
    const result = await runAnalysisPipeline(inputData, userProfile);
    const duration = (Date.now() - start) / 1000;

    console.log('\n--- VERIFICATION RESULTS (V4.8) ---');
    console.log(`Duration: ${duration}s`);
    console.log(`Product: ${result.productName}`);
    console.log(`Brand: ${result.brand}`);
    console.log(`Verdict: ${result.overallVerdict?.toUpperCase()}`);
    console.log(`Confidence: ${result.confidenceScore}/100`);
    
    console.log('\n--- AGENT AUDIT ---');
    if (result.ingredients?.length > 0) {
        console.log('✅ Ingredient Agent: Success');
        console.log(`   Analyzed: ${result.ingredients.length} items`);
    }
    
    if (result.marketingClaims?.length > 0) {
        console.log('✅ Claims Agent: Success');
        console.log(`   Verified: ${result.marketingClaims.length} claims`);
    }

    if (result.healthImpact) {
        console.log('✅ Personalization Agent: Success');
        console.log(`   Verdict Reason: ${result.healthImpact.verdictReasoning}`);
    }

    if (result.clinicalEvidence?.length > 0) {
        console.log('✅ Evidence Agent: Success');
    }

    if (result.alternatives?.items?.length > 0) {
        console.log('✅ Alternatives Agent: Success');
    }

    console.log('\n--- FINAL STATUS ---');
    if (result.confidenceScore > 0 && result.productName !== 'Unknown Product') {
        console.log('🌟 PIPELINE HARDENING VERIFIED: SUCCESS');
    } else {
        console.log('⚠️ PIPELINE WARNING: Data may be incomplete.');
    }

  } catch (err) {
    console.error('❌ PIPELINE CRASH:', err.message);
  }
}

testPipeline();
