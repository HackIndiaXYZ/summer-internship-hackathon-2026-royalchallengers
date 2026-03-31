const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');

async function test() {
  const inputData = {
    type: 'text',
    content: 'i am eating mountain dew. it has high fructose corn syrup, citric acid, natural flavor, caffeine, gum arabic, salt, and yellow 5.'
  };

  const userProfile = {
    weight: 70,
    height: 175,
    goal: 'General Health',
    conditions: ['none']
  };

  try {
    console.log('Running analysis for Mountain Dew (messy input)...');
    const result = await runAnalysisPipeline(inputData, userProfile);
    console.log('Analysis Result Nutrition:');
    console.log(JSON.stringify(result.report.nutrition_analysis, null, 2));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
