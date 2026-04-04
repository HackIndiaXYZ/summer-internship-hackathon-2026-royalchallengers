const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');
require('dotenv').config();

async function debugPipeline() {
  const inputData = { type: 'text', content: 'Maggi' };
  const userProfile = { riskFactors: ['Diabetes'], goals: ['Weight Loss'], restrictions: [] };

  console.log('Testing full pipeline for "Maggi"...');
  try {
    const result = await runAnalysisPipeline(inputData, userProfile);
    console.log('--- FINAL REPORT ---');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.claims && result.claims.length > 0) {
      console.log('✅ Claims Found:', result.claims.length);
    } else {
      console.log('❌ NO CLAIMS FOUND');
    }

    if (result.alternatives && result.alternatives.length > 0) {
      console.log('✅ Alternatives Found:', result.alternatives.length);
    } else {
      console.log('❌ NO ALTERNATIVES FOUND');
    }

    if (result.ingredients && result.ingredients.length > 0) {
      console.log('✅ Ingredients Found:', result.ingredients.length);
    } else {
      console.log('❌ NO INGREDIENTS FOUND');
    }

  } catch (err) {
    console.error('Pipeline Error:', err);
  }
}

debugPipeline();
