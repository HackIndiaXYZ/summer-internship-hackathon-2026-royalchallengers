/**
 * Medo Veda — Schema Validation Layer (V4.2)
 * Ensures final pipeline output matches the required 9-field UI schema.
 */
function validatePipelineOutput(output) {
  const schema = {
    productName: "string",
    brand: "string|null",
    imageUrl: "string|null",
    confidenceScore: "number",
    overallVerdict: "string",
    ingredients: "array",
    marketingClaims: "array",
    personaContext: "object",
    healthImpact: "object",
    clinicalEvidence: "array",
    alternatives: "object"
  };

  const errors = [];
  
  // Basic Structural Check
  Object.keys(schema).forEach(key => {
    if (!(key in output)) {
      errors.push(`Missing field: ${key}`);
      // Self-Healing: Assign default
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
    if (!['safe', 'limit', 'avoid'].includes(output.overallVerdict)) {
      output.overallVerdict = 'limit';
    }
  }

  if (errors.length > 0) {
    console.warn(`[Validation] Self-healed ${errors.length} schema gaps:`, errors.join(', '));
  }

  return output;
}

module.exports = { validatePipelineOutput };
