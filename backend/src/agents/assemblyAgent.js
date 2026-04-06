/**
 * Agent 9 — Assembly Agent (V7.2 — Clinical Reliability)
 * Logic: Strict JSON Mapping + Final Clinical Formatter. NO LLM CALLS.
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

  const isNA = status === 'N/A' || product.productName === "Non-Food Item" || product.productName === "Non-Food Specimen";

  // Helper to ensure 5-6 word guideline reason
  const formatGuideline = (g) => {
    if (!g) return "WHO (Acceptable: Within standard clinical safety limits)";
    // If it already looks correct, return it
    if (g.includes('(') && g.includes(')')) {
      const reason = g.match(/\(([^)]+)\)/)?.[1] || "";
      const wordCount = reason.split(/\s+/).filter(Boolean).length;
      if (wordCount >= 5 && wordCount <= 7) return g;
    }
    // Fail-safe formatting for clinical consistency
    const authority = g.includes('FSSAI') ? 'FSSAI' : 'WHO';
    return `${authority} (Acceptable: Within standard clinical safety limits)`;
  };

  // Final Schema Synthesis — Targeting AnalysisReport.jsx
  return {
    productName: isNA ? "N/A" : (product.productName || "Product Name Not Detected"),
    brand: isNA ? "N/A" : (product.brand || "—"),
    imageUrl: product.imageUrl || null,
    confidenceScore: isNA ? 0 : (verdict.confidenceScore || 75),
    overallVerdict: isNA ? "N/A" : (verdict.overallVerdict || "limit").toLowerCase(),
    
    nutrition: {
      calories: isNA ? "N/A" : (product.nutrition?.calories || "—"),
      fat: isNA ? "N/A" : (product.nutrition?.fat || "—"),
      sugar: isNA ? "N/A" : (product.nutrition?.sugar || "—"),
      salt: isNA ? "N/A" : (product.nutrition?.salt || "—"),
      protein: isNA ? "N/A" : (product.nutrition?.protein || "—"),
      carbohydrates: isNA ? "N/A" : (product.nutrition?.carbohydrates || "—")
    },

    ingredients: isNA ? [{ name: "N/A", standardGuideline: "Non-Food specimen detected", status: "N/A" }] : (ingredients || []).map(ing => ({
      name: ing.name || "Unknown Ingredient",
      standardGuideline: formatGuideline(ing.standardGuideline),
      status: ing.status || "Acceptable"
    })),

    marketingClaims: isNA ? [{ claim: "N/A", verdict: "False", verdictLabel: "NON-EDIBLE", reality: "Specimen is not categorized as food.", explanation: "N/A" }] : (marketingClaims || []).map(claim => ({
      claim: claim.claim || "Brand Positioning",
      verdict: claim.verdict || "Misleading",
      verdictLabel: claim.verdictLabel || (claim.verdict === "True" ? "CLAIM VERIFIED" : "SCIENTIFIC AUDIT"),
      reality: claim.reality || "Clinical analysis shows significant nutritional deviation.",
      explanation: claim.explanation || "Clinical data indicates potential health risks for this user persona."
    })),

    personaContext: {
      userRiskLevel: isNA ? "N/A" : (data.personaContext?.userRiskLevel || "Standard"),
      analysisLens: isNA ? "N/A" : (data.personaContext?.analysisLens || "Clinical health review.")
    },

    healthImpact: {
      dailyConsumptionImpact: isNA ? "N/A" : (persona.dailyConsumption?.impact || "Clinical profile pending."),
      impactLabel: isNA ? "N/A" : (persona.dailyConsumption?.impactLabel || "Daily Impact:"),
      impactValue: isNA ? "N/A" : (persona.dailyConsumption?.impactValue || "Moderate"),
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
      message: isNA ? "N/A" : "Consider these healthy alternatives:",
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
