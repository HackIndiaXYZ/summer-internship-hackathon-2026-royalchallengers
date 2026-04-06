const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 4 — Claim Verification Agent (V5.1 — Clinical Hardened)
 * Logic: Verify marketing claims against actual ingredient data.
 * 
 * TARGET: NO AI-BOILERPLATE. ONLY CLINICAL TRUTH.
 */
async function analyzeClaims(productName, ingredients, claimsList = [], options = {}) {
  const finalClaims = (claimsList && claimsList.length > 0) ? claimsList : [`Implicit product positioning for ${productName}`];

  const systemPrompt = `[MODE: CLAIM_AUDITOR_V5.1]
    Audit marketing claims for Product: ${productName}
    Actual Ingredients: ${ingredients}
    
    TASK: Contrast label "Perception" with clinical "Reality".
    
    STRICT PROHIBITIONS:
    - NEVER use the phrase "AI detected ingredients".
    - NEVER use the phrase "contradict global health standards".
    - NEVER use generic opening statements.
    
    1. Framing: 
       - "Perception" is the brand message/positioning.
       - "Reality" is the biological/clinical impact.
    2. Reality Field: Describe the clinical truth in EXACTLY ONE SHORT LINE (max 15 words). Focus on specific ingredients (e.g., "Maltodextrin spikes blood sugar level rapidly," instead of "AI detected bad things").
    3. Explanation: One clear technical reason (e.g., "High fructose corn syrup linked to non-alcoholic fatty liver disease").
    4. Research Context: 15-20 word scientific reasoning based on physiological impact.
 
    Return ONLY valid JSON between <<<JSON_START>>> and <<<JSON_END>>>.

    ## SCHEMA:
    [
      {
        "claim": "string",
        "verdict": "True | Misleading | False",
        "verdictLabel": "CLAIM VERIFIED | MISLEADING CLAIM | FALSE CLAIM",
        "reality": "string — SPECIFIC CLINICAL TRUTH (15 words max)",
        "explanation": "string — technical reason",
        "research_context": "string — 15-20 word science background"
      }
    ]`;

  const result = await runNvidiaAgent(
    `Verify claims for: ${productName}`,
    systemPrompt,
    { modelType: 'agility', ensureJSON: true, ...options }
  );

  return result || [];
}

module.exports = { analyzeClaims };
