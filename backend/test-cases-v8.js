const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');
require('dotenv').config();

const testCases = [
  {
    name: "Case 1: Clear Food (Maggi)",
    input: {
      type: 'text',
      content: "Product: Maggi Masala Noodles. Ingredients: Wheat flour, Palm oil, Salt, Spices, Sugar, Flavor enhancer 635.",
      metadata: { source: 'manual_entry' }
    },
    profile: { health_conditions: ['Hypertension'], goals: ['Weight Loss'] }
  },
  {
    name: "Case 2: Health Conflict (Sugar for Diabetic)",
    input: {
      type: 'text',
      content: "Product: Hershey's Milk Chocolate. Ingredients: Sugar, Milk, Cocoa Butter, Lactose, Soy Lecithin.",
      metadata: { source: 'manual_entry' }
    },
    profile: { health_conditions: ['Diabetes'], goals: ['Blood Sugar Control'] }
  },
  {
    name: "Case 3: Non-Food Item (Early Exit)",
    input: {
      type: 'text',
      content: "Product: iPhone 15 Pro. Blue Titanium, 256GB. It has a great camera and A17 chip.",
      metadata: { source: 'manual_entry' }
    },
    profile: { health_conditions: [], goals: [] }
  },
  {
    name: "Case 4: Supplement (High Protein)",
    input: {
      type: 'text',
      content: "Product: Whey Protein Isolate. Ingredients: Whey Protein Isolate, Natural Flavors, Stevia.",
      metadata: { source: 'manual_entry' }
    },
    profile: { health_conditions: [], goals: ['Muscle Gain'] }
  },
  {
    name: "Case 5: Blurry/Low Quality Simulation (Needs Research)",
    input: {
      type: 'text',
      content: "Product name blurry... Ingredien... palm... salt... yellow pack...",
      metadata: { source: 'vision_fail_retry' }
    },
    profile: { health_conditions: ['Celiac'], goals: ['Gluten Free'] }
  }
];

async function runTests() {
  console.log('--- MEDO VEDA V8.1 BATCH TEST ---');
  let totalStartTime = Date.now();
  
  for (const tc of testCases) {
    console.log(`\n[RUNNING] ${tc.name}`);
    const start = Date.now();
    try {
      const result = await runAnalysisPipeline(tc.input, tc.profile);
      const duration = (Date.now() - start) / 1000;
      console.log(`[DONE] Time: ${duration.toFixed(2)}s`);
      console.log(`[VERDICT] ${result.overallVerdict} (Confidence: ${result.confidenceScore}%)`);
      if (result.productName === "N/A" || result.productName === "Non-Food Item") {
          console.log(`[STATUS] Correctly identified as Non-Food.`);
      }
    } catch (err) {
      console.error(`[ERROR] ${tc.name} failed:`, err.message);
    }
  }

  const totalDuration = (Date.now() - totalStartTime) / 1000;
  console.log('\n--- FINAL SUMMARY ---');
  console.log(`Total Time for 5 Cases: ${totalDuration.toFixed(2)}s`);
  console.log(`Average Time per Case: ${(totalDuration / testCases.length).toFixed(2)}s`);
  console.log(`Performance Target: <15s per case`);
}

runTests();
