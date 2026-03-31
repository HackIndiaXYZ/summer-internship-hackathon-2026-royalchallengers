const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');

async function test() {
  const inputData = {
    type: 'text',
    content: 'Product: Oreo Cookies. Ingredients: Wheat Flour, Sugar, Palm Oil, Cocoa, High Fructose Corn Syrup, Leavening, Salt, Soy Lecithin, Vanillin, Chocolate.'
  };

  const userProfile = {
    weight: 70,
    height: 175,
    goal: 'Weight Loss',
    conditions: ['none']
  };

  try {
    console.log('Running analysis...');
    const result = await runAnalysisPipeline(inputData, userProfile);
    console.log('Analysis Result Nutrition:');
    console.log(JSON.stringify(result.report.nutrition_analysis, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
