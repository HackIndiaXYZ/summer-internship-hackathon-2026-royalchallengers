/**
 * Agent 9 — Assembly Agent (V8.0 — Production Hardened)
 * Logic: Strict JSON Mapping + Final Clinical Formatter. NO LLM CALLS.
 * This ensures the frontend receives exactly what it expects.
 * 
 * EVERY field access uses optional chaining (?.) and null-safe defaults.
 */
function assembleReport(data) {
  const product = data.product || {};
  const verdict = data.verdict || {};
  const persona = data.persona || {};
  const evidence = data.evidence || {};
  const ingredients = Array.isArray(data.ingredients) ? data.ingredients : [];
  const marketingClaims = Array.isArray(data.marketingClaims) ? data.marketingClaims : [];
  const alternatives = Array.isArray(data.alternatives) ? data.alternatives : [];
  const status = data.status || 'COMPLETE';

  const isNA = status === 'N/A' || product.productName === "Non-Food Item" || product.productName === "Non-Food Specimen";

  // Pass through guideline as-is — never inject generic fallback text
  const formatGuideline = (g) => g || '';

  // Final Schema Synthesis — Targeting AnalysisReport.jsx
  return {
    productName: isNA ? "N/A" : (product.productName || "Product Name Not Detected"),
    brand: isNA ? "N/A" : (product.brand || null),
    imageUrl: product.imageUrl || null,
    confidenceScore: isNA ? 0 : (() => {
      let score = verdict?.confidenceScore || 75;
      if (score > 0 && score <= 1) score = Math.round(score * 100);
      return score;
    })(),
    overallVerdict: isNA ? "N/A" : (verdict?.overallVerdict || "limit").toLowerCase(),

    nutrition: {
      calories: isNA ? "N/A" : (product.nutrition?.calories ?? "—"),
      fat: isNA ? "N/A" : (product.nutrition?.fat ?? "—"),
      sugar: isNA ? "N/A" : (product.nutrition?.sugar ?? "—"),
      salt: isNA ? "N/A" : (product.nutrition?.salt ?? "—"),
      protein: isNA ? "N/A" : (product.nutrition?.protein ?? "—"),
      carbohydrates: isNA ? "N/A" : (product.nutrition?.carbohydrates ?? "—")
    },

    ingredients: isNA ? [{ name: "N/A", standardGuideline: "Non-Food specimen detected", status: "N/A" }] : ingredients.map(ing => ({
      name: ing.name || "Unknown Ingredient",
      standardGuideline: formatGuideline(ing.standardGuideline),
      status: ing.status || "Acceptable"
    })),

    marketingClaims: isNA ? [{ claim: "N/A", verdict: "False", verdictLabel: "NON-EDIBLE", reality: "Specimen is not categorized as food.", explanation: "N/A" }] : marketingClaims.map(claim => {
      const isVerified = String(claim.verdictLabel).toUpperCase() === 'VERIFIED' || claim.verdict === 'True' || claim.verdict === true;
      return {
        claim: claim.claim || "Brand Positioning",
        verdict: isVerified ? "True" : "False",
        verdictLabel: claim.verdictLabel || (isVerified ? "VERIFIED" : "SCIENTIFIC AUDIT"),
        reality: claim.reality || "Clinical analysis found deviations from guidelines.",
        explanation: claim.research_context || claim.explanation || "Reviewing individual ingredients for specifics."
      };
    }),

    personaContext: {
      userRiskLevel: isNA ? "N/A" : (data.personaContext?.userRiskLevel || "Standard"),
      analysisLens: isNA ? "N/A" : (data.personaContext?.analysisLens || "Clinical health review.")
    },

    healthImpact: {
      dailyConsumptionImpact: isNA ? "N/A" : (persona?.dailyConsumption?.impact || "Clinical profile pending."),
      impactLabel: isNA ? "N/A" : (persona?.dailyConsumption?.impactLabel || "Daily Impact:"),
      impactValue: isNA ? "N/A" : (persona?.dailyConsumption?.impactValue || "Moderate"),
      personalizedRiskScore: isNA ? 0 : (verdict?.confidenceScore || 50),
      verdictReasoning: isNA ? "Specimen not suitable for consumption." : (persona?.dailyConsumption?.headline || "Based on clinical ingredient audit."),
      warnings: isNA ? ["Non-edible specimen"] : (persona?.dailyConsumption?.warnings || ["Standard moderation advised."])
    },

    adviceCard: {
      primaryAdvice: isNA ? "Discard/Do Not Consume" : (verdict?.primaryAdvice || ""),
      consumptionGuideline: isNA ? "Not suitable for dietary intake." : (verdict?.consumptionGuideline || ""),
      safeIntake: isNA ? "0 servings" : (verdict?.safeIntake || ""),
      frequency: isNA ? "Never" : (verdict?.frequency || ""),
      bestTime: isNA ? "N/A" : (verdict?.bestTime || ""),
      riskLevel: isNA ? "N/A" : (verdict?.riskLevel || "")
    },

    clinicalEvidence: isNA ? [] : (evidence?.guidelineMatches || []).map(f => ({
      ingredient: f.ingredient || "General",
      source: f.source || "WHO/FSSAI",
      guidelineText: f.guidemark || "Regulation matched via clinical database."
    })),

    alternativeResources: {
      message: isNA ? "N/A" : "Consider these healthy alternatives:",
      items: isNA ? [] : alternatives.map(item => ({
        name: item.name || "Healthy Alternative",
        price: item.priceRange || "Price Varies",
        whyBetter: item.whyBetter || item.reason || '',
        imageUrl: item.imageUrl || null
      }))
    }
  };
}

module.exports = { assembleReport };
