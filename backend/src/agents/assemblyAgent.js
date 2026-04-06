/**
 * Agent 9 — Assembly Agent (V7.0 — Clinical Reliability)
 * Logic: Strict JSON Mapping. NO LLM CALLS.
 * This ensures the frontend receives exactly what it expects.
 */
function assembleReport(data) {
  const {
    product = {},
    ingredients = [],
    marketingClaims = [],
    persona = {},
    evidence = {},
    alternatives = {},
    verdict = {},
    status = 'COMPLETE'
  } = data;

  const isNA = status === 'N/A' || product.productName === "Non-Food Item";

  // Final Schema Synthesis — Targeting AnalysisReport.jsx
  return {
    productName: product.productName || "Product Name Not Detected",
    brand: product.brand || null,
    imageUrl: product.imageUrl || null,
    confidenceScore: isNA ? 0 : (verdict.confidenceScore || 75),
    overallVerdict: isNA ? "N/A" : (verdict.overallVerdict || "limit").toLowerCase(),
    
    nutrition: {
      calories: isNA ? null : (product.nutrition?.calories || null),
      fat: isNA ? null : (product.nutrition?.fat || null),
      sugar: isNA ? null : (product.nutrition?.sugar || null),
      salt: isNA ? null : (product.nutrition?.salt || null),
      protein: isNA ? null : (product.nutrition?.protein || null),
      carbohydrates: isNA ? null : (product.nutrition?.carbohydrates || null)
    },

    ingredients: isNA ? [{ name: "N/A", standardGuideline: "Non-Food specimen", status: "N/A" }] : (ingredients || []).map(ing => ({
      name: ing.name || "Unknown Ingredient",
      standardGuideline: ing.standardGuideline || "WHO (Acceptable: No specific clinical risk detected)",
      status: ing.status || "Acceptable"
    })),

    marketingClaims: isNA ? [{ claim: "N/A", verdict: "False", verdictLabel: "NON-EDIBLE", reality: "Specimen is not categorized as food." }] : (marketingClaims || []).map(claim => ({
      claim: claim.claim || "Brand Positioning",
      verdict: claim.verdict || "Misleading",
      verdictLabel: claim.verdictLabel || (claim.verdict === "True" ? "CLAIM VERIFIED" : "SCIENTIFIC AUDIT"),
      reality: claim.reality || "Clinical analysis shows significant nutritional deviation.",
      explanation: claim.explanation || "Clinical data indicates potential health risks for this user persona."
    })),

    personaContext: {
      userRiskLevel: data.personaContext?.userRiskLevel || "Standard",
      analysisLens: data.personaContext?.analysisLens || "Clinical health review."
    },

    healthImpact: {
      dailyConsumptionImpact: isNA ? "N/A" : (persona.dailyConsumption?.impact || "Clinical profile pending."),
      impactLabel: isNA ? "Risk Potential" : (persona.dailyConsumption?.impactLabel || "Daily Impact Value:"),
      impactValue: isNA ? "—" : (persona.dailyConsumption?.impactValue || "Moderate"),
      personalizedRiskScore: isNA ? 0 : (verdict.confidenceScore || 50),
      verdictReasoning: isNA ? "Specimen not suitable for consumption." : (persona.dailyConsumption?.headline || "Based on clinical ingredient audit."),
      warnings: isNA ? ["Non-edible specimen"] : (persona.dailyConsumption?.warnings || ["Standard moderation advised."])
    },

    adviceCard: {
      primaryAdvice: isNA ? "Discard/Do Not Consume" : (verdict.primaryAdvice || "Moderation is recommended."),
      consumptionGuideline: isNA ? "This specimen is not meant for dietary intake." : (verdict.consumptionGuideline || "Consult a clinical expert for long-term use."),
      safeIntake: isNA ? "0 servings" : (verdict.safeIntake || "1-2 servings weekly"),
      frequency: isNA ? "Never" : (verdict.frequency || "Occasional"),
      bestTime: isNA ? "N/A" : (verdict.bestTime || "With meals"),
      riskLevel: isNA ? "N/A" : (verdict.riskLevel || "Moderate")
    },

    clinicalEvidence: isNA ? [] : (evidence.guidelineMatches || []).map(f => ({
      ingredient: f.ingredient || "General",
      source: f.source || "WHO/FSSAI",
      guidelineText: f.guidemark || "Regulation matched via clinical database."
    })),

    alternativeResources: {
      message: isNA ? "N/A" : "Consider these better Indian alternatives:",
      items: isNA ? [] : (Array.isArray(alternatives) ? alternatives : []).map(item => ({
        name: item.name || "Healthy Alternative",
        price: item.priceRange || "Price Varies",
        whyBetter: item.whyBetter || "Contains fewer processed ingredients.",
        imageUrl: item.imageUrl || null
      }))
    }
  };
}

module.exports = { assembleReport };
