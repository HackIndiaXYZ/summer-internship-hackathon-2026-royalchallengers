const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');
require('dotenv').config();

async function debugPipeline() {
  const inputData = { type: 'text', content: 'Maggi' };
  const userProfile = { riskFactors: ['Diabetes'], goals: ['Weight Loss'], restrictions: [] };

  console.log('Testing full pipeline for "Maggi"...');
  try {
    const result = await runAnalysisPipeline(inputData, userProfile);
    console.log('--- FINAL REPORT ---');
    console.log(JSON.stringify(result.report, null, 2));
    
    if (result.report.claim_vs_reality.length > 0) {
      console.log('✅ Claims Found:', result.report.claim_vs_reality.length);
    } else {
      console.log('❌ NO CLAIMS FOUND');
    }

    if (result.report.alternatives.length > 0) {
      console.log('✅ Alternatives Found:', result.report.alternatives.length);
    } else {
      console.log('❌ NO ALTERNATIVES FOUND');
    }

    if (result.report.highlights.length > 0) {
      console.log('✅ Highlights Found:', result.report.highlights.length);
    } else {
      console.log('❌ NO HIGHLIGHTS FOUND');
    }

  } catch (err) {
    console.error('Pipeline Error:', err);
  }
}

debugPipeline();
