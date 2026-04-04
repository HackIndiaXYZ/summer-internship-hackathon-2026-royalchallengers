/**
 * Agent 9 — Assembly Agent (V4.0)
 * Logic: Strict JSON Mapping. NO LLM CALLS.
 * This ensures the frontend receives exactly what it expects.
 */
function assembleReport(data) {
  // Extract pieces from the 8-agent pipeline data
  const {
    product = {},
    ingredients = [],
    marketingClaims = [],
    persona = {},
    evidence = {},
    alternatives = {},
    verdict = {}
  } = data;

  // Final Schema Synthesis
  return {
    productName: product.productName || "Unknown Product",
    brand: product.brand || null,
    imageUrl: product.imageUrl || null,
    confidenceScore: verdict.confidenceScore || 0,
    overallVerdict: (verdict.overallVerdict || "limit").toLowerCase(),
    nutrition: {
      calories: product.nutrition?.calories || null,
      fat: product.nutrition?.fat || null,
      sugar: product.nutrition?.sugar || null,
      salt: product.nutrition?.salt || null,
      protein: product.nutrition?.protein || null,
      carbohydrates: product.nutrition?.carbohydrates || null
    },

    ingredients: (ingredients || []).map(ing => ({
      name: ing.name || "Unknown",
      standardGuideline: ing.standardGuideline || "None",
      status: ing.status || "Caution" // Acceptable | Caution | Harmful
    })),

    marketingClaims: (marketingClaims || []).map(claim => ({
      claim: claim.claim || "Unknown Claim",
      verdict: claim.verdict || "Misleading", // True | Misleading | False
      verdictLabel: claim.verdictLabel || (claim.verdict === "True" ? "CLAIM VERIFIED" : "MISLEADING CLAIM DETECTED"),
      reality: claim.reality || "Clinical analysis shows significant nutritional deviation."
    })),

    personaContext: {
      userRiskLevel: data.personaContext?.userRiskLevel || "Moderate",
      analysisLens: data.personaContext?.analysisLens || "Standard health review."
    },

    healthImpact: {
      dailyConsumptionImpact: persona.dailyConsumption?.impact || "Analysis pending.",
      impactLabel: persona.dailyConsumption?.impactLabel || "Impact Potential",
      impactValue: persona.dailyConsumption?.impactValue || "Calculating...",
      personalizedRiskScore: verdict.confidenceScore || 50,
      verdictReasoning: persona.dailyConsumption?.headline || "Based on general health guidelines.",
      warnings: persona.dailyConsumption?.warnings || []
    },

    adviceCard: {
      primaryAdvice: verdict.primaryAdvice || "Switch to Natural Alternatives",
      consumptionGuideline: verdict.consumptionGuideline || "Moderation advised.",
      safeIntake: verdict.safeIntake || "1-2 servings daily",
      frequency: verdict.frequency || "Daily",
      bestTime: verdict.bestTime || "Anytime",
      riskLevel: verdict.riskLevel || "Moderate"
    },

    clinicalEvidence: (evidence.guidelineMatches || []).map(f => ({
      ingredient: f.ingredient || "General",
      source: f.source || "WHO/FSSAI",
      guidelineText: f.guidemark || "Regulation matched."
    })),

    alternativeResources: {
      message: "Consider these better Indian alternatives:",
      items: (Array.isArray(alternatives) ? alternatives : []).map(item => ({
        name: item.name || "Healthy Alternative",
        price: item.priceRange || "Contact seller",
        whyBetter: item.reason || "Contains fewer processed ingredients.",
        imageUrl: item.imageUrl || null
      }))
    }
  };
}

module.exports = { assembleReport };
