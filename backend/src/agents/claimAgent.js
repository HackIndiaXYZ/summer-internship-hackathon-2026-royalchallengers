const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 4 — Claim Verification Agent (V4.0)
 * Logic: Verify marketing claims against actual ingredient data.
 */
async function analyzeClaims(productName, ingredients, claimsList = [], options = {}) {
  // If claimsList is empty, we must infer the "Implicit Brand Positioning"
  // This prevents the UI from showing generic/hallucinated data like '100% Natural'
  const finalClaims = (claimsList && claimsList.length > 0) ? claimsList : [`Implicit product positioning for ${productName}`];

  const systemPrompt = `[MODE: CLAIM_AUDITOR_V5.0]
    Audit marketing claims for Product: ${productName}
    Ingredients List: ${ingredients}
    
    TASK: Cross-examine label "Perception" vs clinical "Reality".
    
    1. For each marketing claim (or implicit positioning): Compare it against actual ingredients and known health research.
    2. Framing: 
       - "Perception" is the brand message or positioning (e.g., "Weight Loss Support", "Natural", "High Protein").
       - "Reality" is the biological impact (e.g., "Contains 40g added sugar/serving which spikes insulin").
    3. Verdict: True (Matches data) | Misleading (Partially true but deceptive) | False (Contradicts data).
    4. verdictLabel: "CLAIM VERIFIED" | "MISLEADING CLAIM DETECTED" | "FALSE CLAIM".
    5. reality: Describe the clinical reality in EXACTLY ONE SHORT LINE (max 15 words).
    6. explanation: One clear technical reason why this reality exists (e.g., "Ingredient X is linked to metabolic distress").

    ## IMPORTANT:
    If no explicit claims are found, use the product's NAME and CATEGORY to define the "Perception" (e.g., A "Healthy" bar's perception is "Good for regular consumption").

    CRITICAL: Return ONLY valid JSON encapsulated between <<<JSON_START>>> and <<<JSON_END>>> symbols.

    ## SCHEMA (Array of objects):
    [
      {
        "claim": "string — exact claim OR inferred perception",
        "verdict": "True | Misleading | False",
        "verdictLabel": "string — from options above",
        "reality": "string — ONE LINE clinical truth, max 15 words",
        "explanation": "string — technical reason"
      }
    ]`;

  const result = await runNvidiaAgent(
    `Verify claims for: ${productName}. Claims Provided: ${JSON.stringify(claimsList)}`,
    systemPrompt,
    { modelType: 'agility', ensureJSON: true, ...options }
  );

  return result || [];
}

module.exports = { analyzeClaims };
