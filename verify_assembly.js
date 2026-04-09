const { assembleReport } = require('./backend/src/agents/assemblyAgent');

const mockData = {
  product: { productName: "Test Juice", brand: "BioPure", imageUrl: "https://test.com/img.jpg" },
  verdict: {
    overallVerdict: "limit",
    confidenceScore: 92,
    primaryAdvice: "Limit intake due to high sodium content.",
    consumptionGuideline: "Maximum 150ml per serving.",
    safeIntake: "150ml once per day",
    frequency: "Daily",
    bestTime: "With breakfast",
    riskLevel: "Moderate"
  },
  ingredients: [
    { name: "Sodium Benzoate", standardGuideline: "Potential allergen for sensitive skin.", status: "Caution" }
  ],
  persona: {
    dailyConsumption: {
      impact: "Clinical impact on hydration.",
      impactLabel: "Daily Impact:",
      impactValue: "Slightly High",
      headline: "High mineral content detected for your profile.",
      warnings: ["Monitor sodium levels."]
    }
  }
};

const result = assembleReport(mockData);
console.log('--- ASSEMBLED REPORT MOCK TEST ---');
console.log('Product:', result.productName);
console.log('Overall Verdict:', result.overallVerdict);
console.log('Ingredient Standard Guideline:', result.ingredients[0].standardGuideline);
console.log('Personal Advice - Safe Intake:', result.adviceCard.safeIntake);
console.log('Personal Advice - Frequency:', result.adviceCard.frequency);
console.log('Personal Advice - Best Time:', result.adviceCard.bestTime);

if (result.ingredients[0].standardGuideline.includes('WHO')) {
  console.error('FAIL: Hardcoded WHO fallback still present!');
} else {
  console.log('SUCCESS: Dynamic clinical reasoning preserved.');
}

if (result.adviceCard.safeIntake === '150ml once per day') {
  console.log('SUCCESS: Dynamic advice correctly mapped.');
} else {
  console.error('FAIL: Advice still hardcoded!');
}
