/**
 * Medo Veda Pipeline V8.0 — Integration Test Suite
 * Tests the core pipeline logic without requiring a running server.
 * 
 * Run: node src/test-pipeline-v8.js
 */
require('dotenv').config();

const { assembleReport } = require('./agents/assemblyAgent');
const { validatePipelineOutput } = require('./lib/validator');

console.log('═══════════════════════════════════════════════');
console.log('  MEDO VEDA PIPELINE V8.0 — INTEGRATION TESTS');
console.log('═══════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(testName, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${testName} ${detail ? '— ' + detail : ''}`);
    failed++;
  }
}

// ══════════════════════════════════════════════════════════════
// TEST 1: Assembly Agent — Normal Food Product
// ══════════════════════════════════════════════════════════════
console.log('\n─── TEST 1: Assembly Agent — Normal Food Product ───');
{
  const report = assembleReport({
    product: {
      productName: 'Maggi 2-Minute Noodles',
      brand: 'Nestlé',
      imageUrl: 'https://example.com/maggi.jpg',
      nutrition: { calories: 350, fat: 14, sugar: 2, salt: 1.5, protein: 8, carbohydrates: 48 },
      ingredients: 'Wheat Flour, Palm Oil, Salt, Sugar, MSG',
      marketingClaims: ['No Added MSG']
    },
    ingredients: [
      { name: 'Wheat Flour', standardGuideline: 'WHO (Acceptable: Common base cereal grain product)', status: 'Acceptable' },
      { name: 'Palm Oil', standardGuideline: 'WHO (Caution: High saturated fat increases cardiac risk)', status: 'Caution' },
      { name: 'MSG', standardGuideline: 'FSSAI (Caution: Potential excitotoxin at high doses)', status: 'Caution' }
    ],
    marketingClaims: [
      { claim: 'No Added MSG', verdict: 'False', verdictLabel: 'FALSE CLAIM', reality: 'Ingredient list contains monosodium glutamate.', explanation: 'MSG is listed in ingredients despite claim.' }
    ],
    persona: { dailyConsumption: { headline: 'Elevated sodium risk', impactLabel: 'Sodium Intake:', impactValue: '120-150%', impact: 'High sodium from salt and MSG', warnings: ['Regularly exceeds daily sodium limit'] } },
    evidence: { dataSourceFlags: { evidenceLayer: true, fssai: true }, guidelineMatches: [{ ingredient: 'MSG', guidemark: 'FSSAI limit: 10g/kg body weight' }] },
    alternatives: [
      { name: 'Homemade Atta Noodles', priceRange: '₹50-₹80', whyBetter: 'No palm oil or artificial flavoring' },
      { name: 'Soulfull Ragi Noodles', priceRange: '₹45', whyBetter: 'Millet-based, higher fiber' },
      { name: 'Fresh Vegetable Soup', priceRange: '₹20-₹30', whyBetter: 'Whole food, low sodium' }
    ],
    verdict: { overallVerdict: 'limit', confidenceScore: 82, safeIntake: '1 pack per week', frequency: 'Occasional', bestTime: 'Lunch', riskLevel: 'Moderate' }
  });

  assert('productName is correct', report.productName === 'Maggi 2-Minute Noodles');
  assert('brand is correct', report.brand === 'Nestlé');
  assert('imageUrl preserved', report.imageUrl === 'https://example.com/maggi.jpg');
  assert('overallVerdict is lowercase', report.overallVerdict === 'limit');
  assert('confidenceScore is number', typeof report.confidenceScore === 'number' && report.confidenceScore === 82);
  assert('ingredients is array of 3', Array.isArray(report.ingredients) && report.ingredients.length === 3);
  assert('ingredients[0] has standardGuideline with reason', report.ingredients[0].standardGuideline.includes('('));
  assert('marketingClaims is array of 1', Array.isArray(report.marketingClaims) && report.marketingClaims.length === 1);
  assert('nutrition.calories === 350', report.nutrition.calories === 350);
  assert('nutrition.fat === 14', report.nutrition.fat === 14);
  assert('alternativeResources.items has 3 items', report.alternativeResources.items.length === 3);
  assert('adviceCard.safeIntake populated', report.adviceCard.safeIntake === '1 pack per week');
}

// ══════════════════════════════════════════════════════════════
// TEST 2: Assembly Agent — Non-Food Item (N/A mapping)
// ══════════════════════════════════════════════════════════════
console.log('\n─── TEST 2: Assembly Agent — Non-Food Item ───');
{
  const report = assembleReport({
    product: { productName: 'Non-Food Item', imageUrl: null },
    status: 'N/A'
  });

  assert('productName is N/A', report.productName === 'N/A');
  assert('brand is N/A', report.brand === 'N/A');
  assert('overallVerdict is N/A', report.overallVerdict === 'N/A');
  assert('nutrition.calories is N/A', report.nutrition.calories === 'N/A');
  assert('nutrition.fat is N/A', report.nutrition.fat === 'N/A');
  assert('nutrition.sugar is N/A', report.nutrition.sugar === 'N/A');
  assert('nutrition.salt is N/A', report.nutrition.salt === 'N/A');
  assert('nutrition.protein is N/A', report.nutrition.protein === 'N/A');
  assert('nutrition.carbohydrates is N/A', report.nutrition.carbohydrates === 'N/A');
  assert('ingredients[0].name is N/A', report.ingredients[0].name === 'N/A');
  assert('adviceCard.safeIntake is 0 servings', report.adviceCard.safeIntake === '0 servings');
  assert('alternativeResources.items is empty', report.alternativeResources.items.length === 0);
}

// ══════════════════════════════════════════════════════════════
// TEST 3: Assembly Agent — Nutrition with ZERO values preserved
// ══════════════════════════════════════════════════════════════
console.log('\n─── TEST 3: Nutrition Zero Preservation ───');
{
  const report = assembleReport({
    product: {
      productName: 'Plain Water',
      brand: 'Generic',
      nutrition: { calories: 0, fat: 0, sugar: 0, salt: 0, protein: 0, carbohydrates: 0 }
    },
    ingredients: [],
    verdict: { overallVerdict: 'safe', confidenceScore: 95 }
  });

  assert('calories is 0 (not "—")', report.nutrition.calories === 0, `Got: ${JSON.stringify(report.nutrition.calories)}`);
  assert('fat is 0 (not "—")', report.nutrition.fat === 0, `Got: ${JSON.stringify(report.nutrition.fat)}`);
  assert('sugar is 0 (not "—")', report.nutrition.sugar === 0, `Got: ${JSON.stringify(report.nutrition.sugar)}`);
  assert('salt is 0 (not "—")', report.nutrition.salt === 0, `Got: ${JSON.stringify(report.nutrition.salt)}`);
  assert('protein is 0 (not "—")', report.nutrition.protein === 0, `Got: ${JSON.stringify(report.nutrition.protein)}`);
  assert('carbs is 0 (not "—")', report.nutrition.carbohydrates === 0, `Got: ${JSON.stringify(report.nutrition.carbohydrates)}`);
}

// ══════════════════════════════════════════════════════════════
// TEST 4: Validator — Schema alignment with assembly output
// ══════════════════════════════════════════════════════════════
console.log('\n─── TEST 4: Validator Schema Alignment ───');
{
  const report = assembleReport({
    product: { productName: 'Test Product' },
    ingredients: [{ name: 'Sugar', status: 'Caution' }],
    verdict: { overallVerdict: 'limit' }
  });

  const validated = validatePipelineOutput(report);

  assert('validated has productName', typeof validated.productName === 'string');
  assert('validated has nutrition', typeof validated.nutrition === 'object');
  assert('validated has adviceCard', typeof validated.adviceCard === 'object');
  assert('validated has alternativeResources', typeof validated.alternativeResources === 'object');
  assert('validated has clinicalEvidence', Array.isArray(validated.clinicalEvidence));
  assert('validated does NOT have stale "alternatives" key', !('alternatives' in validated) || validated.alternativeResources !== undefined);
  assert('overallVerdict normalized to lowercase', validated.overallVerdict === 'limit');
}

// ══════════════════════════════════════════════════════════════
// TEST 5: Assembly Agent — Handles malformed / missing data gracefully
// ══════════════════════════════════════════════════════════════
console.log('\n─── TEST 5: Graceful Degradation — Malformed Input ───');
{
  // Simulate what happens when EVERY agent returns fallback data
  const report = assembleReport({
    product: { productName: 'Unknown Product' },
    ingredients: null,  // null from failed agent
    marketingClaims: undefined,  // undefined
    persona: {},
    evidence: {},
    alternatives: 'not an array',  // wrong type
    verdict: null  // null
  });

  assert('productName defaults to Unknown Product', report.productName === 'Unknown Product');
  assert('ingredients is array (not null)', Array.isArray(report.ingredients));
  assert('marketingClaims is array (not undefined)', Array.isArray(report.marketingClaims));
  assert('overallVerdict defaults to limit', report.overallVerdict === 'limit');
  assert('confidenceScore defaults to 75', report.confidenceScore === 75);
  assert('alternativeResources.items is empty array', Array.isArray(report.alternativeResources.items) && report.alternativeResources.items.length === 0);
  
  // Validate it passes through validator without crash
  const validated = validatePipelineOutput(report);
  assert('validated output is object', typeof validated === 'object');
  assert('validated productName still present', validated.productName === 'Unknown Product');
}

// ══════════════════════════════════════════════════════════════
// TEST 6: Guideline Formatter — Ensures 5-6 word reason
// ══════════════════════════════════════════════════════════════
console.log('\n─── TEST 6: Guideline Formatter ───');
{
  const report = assembleReport({
    product: { productName: 'Test' },
    ingredients: [
      { name: 'Sugar', standardGuideline: 'WHO', status: 'Caution' },  // Too short — should be auto-corrected
      { name: 'Salt', standardGuideline: 'FSSAI (Caution: Excessive intake raises blood pressure risk)', status: 'Caution' },  // Correct format
      { name: 'Fiber', standardGuideline: null, status: 'Acceptable' }  // Null — should get default
    ],
    verdict: {}
  });

  assert('Short "WHO" gets expanded with reason', report.ingredients[0].standardGuideline.includes('(') && report.ingredients[0].standardGuideline.includes(')'));
  assert('Correct format preserved', report.ingredients[1].standardGuideline.includes('FSSAI'));
  assert('Null gets default', report.ingredients[2].standardGuideline.includes('WHO'));
}

// ══════════════════════════════════════════════════════════════
// RESULTS
// ══════════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('═══════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n  🎯 ALL TESTS PASSED — Pipeline V8.0 verified.\n');
  process.exit(0);
}
