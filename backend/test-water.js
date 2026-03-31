const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');

async function test() {
  const inputData = {
    type: 'text',
    content: 'PRODUCT_NAME: Pure Water\nINGREDIENTS_LIST: Reverse Osmosis Water, Minerals for Taste.'
  };

  const userProfile = {
    weight: 70,
    height: 175,
    goal: 'General Health',
    conditions: ['none']
  };

  try {
    console.log('Running analysis for Pure Water...');
    const result = await runAnalysisPipeline(inputData, userProfile);
    console.log('Analysis Result Nutrition:');
    console.log(JSON.stringify(result.report.nutrition_analysis, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
