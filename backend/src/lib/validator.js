/**
 * Medo Veda — Schema Validation Layer (V8.0 — Aligned with Assembly Agent)
 * Ensures final pipeline output matches the required UI schema.
 * 
 * CRITICAL: Field names MUST match assemblyAgent.js output AND AnalysisReport.jsx consumption.
 */
function validatePipelineOutput(output) {
  if (!output || typeof output !== 'object') {
    console.error('[Validation] Pipeline returned non-object:', typeof output);
    return getEmptyReport();
  }

  const schema = {
    productName: "string",
    brand: "string|null",
    imageUrl: "string|null",
    confidenceScore: "number",
    overallVerdict: "string",
    nutrition: "object",
    ingredients: "array",
    marketingClaims: "array",
    personaContext: "object",
    healthImpact: "object",
    adviceCard: "object",
    clinicalEvidence: "array",
    alternativeResources: "object"
  };

  const errors = [];

  Object.keys(schema).forEach(key => {
    if (!(key in output) || output[key] === undefined) {
      errors.push(`Missing field: ${key}`);
      // Self-Healing: Assign type-appropriate default
      if (schema[key] === "string") output[key] = "";
      if (schema[key] === "number") output[key] = 0;
      if (schema[key] === "array") output[key] = [];
      if (schema[key] === "object") output[key] = {};
      if (schema[key] === "string|null") output[key] = null;
    }
  });

  // Critical Value Normalization
  if (output.overallVerdict) {
    output.overallVerdict = output.overallVerdict.toLowerCase();
    if (!['safe', 'limit', 'avoid', 'n/a'].includes(output.overallVerdict)) {
      output.overallVerdict = 'limit';
    }
  }

  // Ensure ingredients is always an array
  if (!Array.isArray(output.ingredients)) {
    output.ingredients = [];
  }

  // Ensure marketingClaims is always an array
  if (!Array.isArray(output.marketingClaims)) {
    output.marketingClaims = [];
  }

  if (errors.length > 0) {
    console.warn(`[Validation] Self-healed ${errors.length} schema gaps:`, errors.join(', '));
  }

  return output;
}

function getEmptyReport() {
  return {
    productName: "Analysis Error",
    brand: null,
    imageUrl: null,
    confidenceScore: 0,
    overallVerdict: "limit",
    nutrition: {},
    ingredients: [],
    marketingClaims: [],
    personaContext: {},
    healthImpact: {},
    adviceCard: {},
    clinicalEvidence: [],
    alternativeResources: { message: "", items: [] }
  };
}

module.exports = { validatePipelineOutput };
