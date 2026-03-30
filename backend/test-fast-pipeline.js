const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');

const testInput = {
  type: 'manual',
  content: 'Maggi 2-Minute Noodles'
};

const testUser = {
  riskFactors: ['T2 Diabetes', 'Hypertension'],
  focusGoals: ['Heart Health']
};

async function runTest() {
  console.log('🚀 TESTING NEW FAST PIPELINE...');
  const start = Date.now();
  try {
    const result = await runAnalysisPipeline(testInput, testUser);
    const end = Date.now();
    console.log('\n✅ TEST COMPLETE');
    console.log(`⏱️ Total Time: ${(end - start) / 1000}s`);
    console.log('\n--- REPORT PREVIEW ---');
    console.log('Product:', result.report.product.name);
    console.log('Verdict:', result.report.verdict.label);
    console.log('Advice Intake:', result.report.personalized_advice.intake);
    console.log('Ingredients Count:', result.report.ingredient_analysis.length);
    console.log('\nAll agents passed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runTest();
