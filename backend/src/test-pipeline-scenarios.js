const { runAnalysisPipeline } = require('./pipeline/orchestrator');

async function testScenarios() {
  const scenarios = [
    {
      name: "1. Muscle Gain + Peanut Butter",
      profile: { health_goals: ["Muscle Gain"], health_conditions: [], dietary_preferences: ["Active"] },
      input: { content: "Ingredients: Roasted Peanuts, Whey Protein, Salt. High in fat and protein.", type: "text" }
    },
    {
      name: "2. Diabetes + Cold Pressed Juice",
      profile: { health_goals: ["Diabetes Management"], health_conditions: ["Diabetes Type 2"], dietary_preferences: [] },
      input: { content: "Ingredients: Apple Juice, Orange Juice, Grapes. 45g of natural sugar per 200ml.", type: "text" }
    },
    {
      name: "3. Hypertension + Low Sodium Salt",
      profile: { health_goals: ["Blood Pressure Control"], health_conditions: ["Hypertension"], dietary_preferences: [] },
      input: { content: "Ingredients: Potassium Chloride (60%), Sodium Chloride (40%). Low sodium salt alternative.", type: "text" }
    },
    {
      name: "4. Weight Loss + Diet Coke",
      profile: { health_goals: ["Weight Loss"], health_conditions: [], dietary_preferences: [] },
      input: { content: "Ingredients: Carbonated Water, Caramel Color, Aspartame, Caffeine. Zero calories.", type: "text" }
    },
    {
      name: "5. Standard User + Instant Noodles",
      profile: { health_goals: ["General Health"], health_conditions: [], dietary_preferences: [] },
      input: { content: "Ingredients: Refined Wheat Flour, Palm Oil, Salt, MSG, TBHQ (Preservative). 12g saturated fat.", type: "text" }
    },
    {
      name: "6. Celiac/Allergy + Wheat Crackers",
      profile: { health_goals: ["General Health"], health_conditions: ["Celiac Disease"], dietary_preferences: ["Gluten-Free"] },
      input: { content: "Ingredients: Whole Wheat Flour, Vegetable Oil, Sugar, Salt.", type: "text" }
    }
  ];

  console.log('--- STARTING MEDO VEDA PIPELINE VERIFICATION ---\n');

  for (const scenario of scenarios) {
    console.log(`Testing Scenario: ${scenario.name}...`);
    try {
      const result = await runAnalysisPipeline(scenario.input, scenario.profile);
      console.log(`Verdict: ${result.report.verdict.label}`);
      console.log(`Advice Sample: ${result.report.personalized_advice.summary.slice(0, 80)}...`);
      console.log('---------------------------------------------\n');
    } catch (err) {
      console.error(`Error in Scenario ${scenario.name}:`, err.message);
    }
  }
}

testScenarios();
