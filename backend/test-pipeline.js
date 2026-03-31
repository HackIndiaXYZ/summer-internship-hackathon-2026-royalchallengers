const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');
const { query } = require('./src/db/pool');

async function testPipeline() {
  console.log('--- MEDO VEDA PIPELINE TEST ---');
  
  // Real-world "Manual Text" example: Maggi Masala Noodles
  const testInput = {
    type: 'text',
    content: `
      Product: Maggi 2-Minute Noodles (Masala)
      Ingredients: Refined wheat flour (Maida), Palm oil, Salt, Wheat gluten, Mineral (Calcium carbonate), Thickeners (508 & 412), Acidity regulators (501(i) & 500(i)) and Humectant (451(i)).
      Masala Tastemaker: Hydrolysed groundnut protein, Mixed spices (23.6%) (Toasted onion powder, Coriander powder, Turmeric powder, Garlic powder, Cumin powder, Aniseed powder, Ginger powder, Fenugreek powder, Black pepper powder, Clove powder, Green cardamom powder, Nutmeg powder), Noodle powder, Sugar, Edible starch, Palm oil, Thickener (508), Caramel salt mix, Acidity regulators (330 & 500(ii)), Flavour enhancer (635) and Mineral (Ferric pyrophosphate).
      Contains Wheat, Nut, Soy & Milk.
    `,
    metadata: { source: 'manual_entry' }
  };

  const mockUserProfile = {
    age: 30,
    gender: 'male',
    health_conditions: ['Hypertension', 'High Sodium Sensitivity'],
    health_goals: ['Weight Loss', 'Heart Health'],
    weight: 85,
    height: 180
  };

  console.log('[Test] Input:', testInput.content.slice(0, 100) + '...');
  console.log('[Test] User Profile:', JSON.stringify(mockUserProfile));
  
  const start = Date.now();
  try {
    const result = await runAnalysisPipeline(testInput, mockUserProfile);
    const duration = Date.now() - start;

    console.log('\n--- TEST RESULTS ---');
    console.log(`Latency: ${(duration / 1000).toFixed(2)}s (Target: <20s)`);
    console.log(`Product Name: ${result.report.product.name}`);
    console.log(`Verdict Score: ${result.report.verdict.score}/10.0`);
    console.log(`Verdict Label: ${result.report.verdict.label}`);
    console.log(`Confidence: ${result.report.verdict.confidence}%`);
    
    console.log('\n--- NUTRITION EXTRACTED ---');
    console.log(JSON.stringify(result.report.nutrition_analysis, null, 2));

    console.log('\n--- PERSONALIZED ADVICE ---');
    console.log(JSON.stringify(result.report.personalized_advice, null, 2));

    if (duration < 20000) {
      console.log('\n✅ PERFORMANCE PASSED: Pipeline responded in under 20 seconds.');
    } else {
      console.log('\n⚠️ PERFORMANCE WARNING: Pipeline exceeded 20 seconds.');
    }

    if (result.report.product.name.toLowerCase().includes('maggi')) {
      console.log('✅ EXTRACTION PASSED: Product name correctly identified.');
    } else {
      console.log('❌ EXTRACTION FAILED: Product name is generic or missing.');
    }

  } catch (err) {
    console.error('❌ TEST FAILED WITH ERROR:', err);
  }
}

testPipeline();
