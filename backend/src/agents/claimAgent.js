const { runNvidiaAgent } = require('../lib/nvidia');

/**
 * Agent 4 — Claim Verification Agent (V5.1 — Clinical Hardened)
 * Logic: Verify marketing claims against actual ingredient data.
 * 
 * TARGET: NO AI-BOILERPLATE. ONLY CLINICAL TRUTH.
 */
async function analyzeClaims(productName, ingredients, claimsList = [], options = {}) {
  const finalClaims = (claimsList && claimsList.length > 0) ? claimsList : [`Implicit product positioning for ${productName}`];

  const systemPrompt = `[MODE: CLAIM_AUDITOR_V5.2]
    Audit: ${productName}
    Data: ${ingredients}
    
    TASK: Truth vs Label. Research the actual ingredients and verify each product claim.
    
    SCHEMA: [
      {
        "claim": "Exact marketing claim text from the product",
        "verdict": "True|False",
        "verdictLabel": "VERIFIED|MISLEADING|FALSE",
        "reality": "Specific clinical truth about this claim in 12 words max",
        "research_context": "Scientific reason why claim is accurate or misleading, 15 words max"
      }
    ]
    
    Rules:
    - verdict MUST be "True" only if scientifically backed. Otherwise "False".
    - Be specific to ${productName}. No generic boilerplate.
    - Max 3 claims. Use agility (8B).`;

  const result = await runNvidiaAgent(
    `Verify: ${productName} | Claims: ${finalClaims.join(', ')}`,
    systemPrompt,
    { modelType: 'agility', maxTokens: 400, ...options }
  );

  return result || [];
}

module.exports = { analyzeClaims };
