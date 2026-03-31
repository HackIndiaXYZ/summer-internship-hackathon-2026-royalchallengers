/**
 * Presentation Agent: Formats the final report with personalized, goal-aware tone.
 */
function getPresentationPrompt(product, verdict, advice, personaContext) {
  return `
    You are a Personalized Health Assistant.
    Goal: ${personaContext.primaryGoal}
    Context: ${personaContext.goalContext}
    Verdict: ${JSON.stringify(verdict)}
    Advice: ${JSON.stringify(advice)}

    Task:
    Finalize the Report Presentation with a clinical but human tone.
    The report should explicitly mention how this product impacts the user's specific health target.
    
    Return JSON:
    {
      "personalizedSummary": "Personalized advice explicitly mentioning the goal...",
      "clinicalAnalysis": "Clinical analysis of the product for this persona..."
    }
  `;
}

module.exports = { getPresentationPrompt };
