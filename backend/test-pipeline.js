require('dotenv').config();
const { runAnalysisPipeline } = require('./src/pipeline/orchestrator');

const testInput = {
  type: 'text',
  content: 'Product: Maggi 2-Minute Noodles. Ingredients: Wheat flour (Maida), Salt, Edible vegetable oil (Palm), Thickeners (508), Acidity regulators (501), Colour (150d). Taste maker: Maltodextrin, Hydrolysed groundnut protein, Starch, Salt, Sugar, Spices.'
};

const testPersona = {
  riskFactors: ['Type 2 Diabetes'],
  goals: ['Reduce Sugar Intake', 'Manage Diabetes'],
  restrictions: []
};

console.log('🚀 Starting full 9-agent pipeline test...');
console.log('Input:', testInput.content.slice(0, 80) + '...');
console.log('Persona:', JSON.stringify(testPersona));
console.log('\n--- Pipeline Running ---\n');

const start = Date.now();

runAnalysisPipeline(testInput, testPersona)
  .then(result => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n✅ Pipeline complete in ${elapsed}s`);
    
    const report = result.report;
    
    console.log('\n--- VERDICT ---');
    console.log('Status:', report?.verdict_agent?.status);
    console.log('Score:', report?.verdict_agent?.score);
    console.log('Guidance:', report?.verdict_agent?.personalized_guidance?.slice(0, 150));
    
    console.log('\n--- PRODUCT ---');
    console.log('Name:', report?.product?.name);
    console.log('Brand:', report?.product?.brand);
    
    console.log('\n--- METRICS ---');
    const m = report?.presentation_agent?.metrics;
    console.log('Safety:', m?.safety);
    console.log('Absorption:', m?.absorption);
    console.log('Toxicity:', m?.toxicity);
    console.log('Confidence:', m?.confidence_score);
    
    console.log('\n--- INGREDIENTS ---');
    const ings = report?.ingredients_intelligence || [];
    console.log(`Total: ${ings.length}`);
    ings.slice(0, 3).forEach(i => console.log(` - ${i.name} [${i.risk}]: ${i.details?.slice(0, 80)}`));

    console.log('\n--- CLAIMS ---');
    const claims = report?.presentation_agent?.claims_verification || [];
    console.log(`Total: ${claims.length}`);
    claims.forEach(c => console.log(` - "${c.title}" → ${c.rating}`));

    console.log('\n--- SUMMARY ---');
    console.log(report?.presentation_agent?.actionable_takeaway?.slice(0, 200));

    console.log('\n✅ REAL-TIME AI RESULTS CONFIRMED — Pipeline is working!');
  })
  .catch(err => {
    console.error('\n❌ Pipeline FAILED:', err.message);
  });
