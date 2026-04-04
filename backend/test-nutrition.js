const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');

async function test() {
  const inputData = {
    type: 'text',
    content: 'Product: Oreo Cookies. Nutrition per 100g: Energy 480kcal, Fat 20g, Sugar 38g, Sodium 500mg, Protein 5g, Carbohydrates 70g. Ingredients: Wheat Flour, Sugar, Palm Oil, Cocoa.'
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
    console.log(JSON.stringify(result.nutrition, null, 2));
    console.log('\nIngredient Analysis (Research context):');
    result.ingredients.forEach(i => console.log(`${i.name}: ${i.standardGuideline}`));
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
