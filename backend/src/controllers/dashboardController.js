const { query } = require('../db/pool');
const { runNvidiaAgent, extractJSON } = require('../lib/nvidia');

const getDashboardSummary = async (req, res) => {
  const { userId } = req.params;

  try {
    // 1. Fetch Profile
    const profileResult = await query('SELECT * FROM personas WHERE user_id = $1', [userId]);
    const profile = profileResult.rows[0] || {};

    // 2. Fetch Scans
    const scansResult = await query('SELECT * FROM scans WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10', [userId]);
    const scans = scansResult.rows;

    // 3. Calculate Risk-Aware Health Score (V5.0)
    let healthScore = 75; // Baseline
    if (scans.length > 0) {
      const recommendedCount = scans.filter(s => s.overall_verdict === 'recommended' || s.overall_verdict === 'safe').length;
      const avoidCount = scans.filter(s => s.overall_verdict === 'avoid').length;
      const total = scans.length;

      // Persona-Condition mapping (e.g., Sodium for Hypertension)
      const healthConditions = profile.health_conditions || [];
      const hasHighRiskProfile = healthConditions.some(c => 
        ['Hypertension', 'Diabetes', 'Cholesterol', 'PCOS'].includes(c)
      );

      // Base Calculation
      const base = 70;
      
      // If user has high-risk conditions, double the penalty for 'avoid' products
      const penaltyMultiplier = hasHighRiskProfile ? 2 : 1;
      
      const adjustment = (recommendedCount * 10) - (avoidCount * 15 * penaltyMultiplier) - ((total - recommendedCount - avoidCount) * 5);
      healthScore = Math.min(Math.max(base + adjustment, 15), 100);
    }

    // 4. Generate AI Insight using Gemini
    const systemInstruction = `
      You are Medo Veda AI, a clinical grade health assistant. 
      Analyze the user's profile and scan history to provide ONE short, highly personalized health insight (max 40 words).
      If the user has specific medical conditions, mention how their recent scans relate to them.
      Return a JSON object with:
      - insight: string (the short summary)
      - suggestion: string (one specific recommended action, max 10 words)
      - scoreColor: string (hex color for the score based on health, e.g., #006b5b for good, #ff4d4d for bad)
    `;

    const recentProducts = scans.map(s => `${s.product_name} (${s.overall_verdict})`).join(', ');
    const userPrompt = `
      User Profile: 
      - Age: ${profile.age || 'Unknown'}
      - Gender: ${profile.gender || 'Unknown'}
      - Conditions: ${JSON.stringify(profile.health_conditions || [])}
      - Goals: ${JSON.stringify(profile.health_goals || [])}
      
      Recent Scans: ${recentProducts || 'No scans recorded yet.'}
      Current Calculated Health Score: ${healthScore}/100
    `;

    let aiInsight = {
      insight: "Initialize your first clinical scan to generate personalized biological insights.",
      suggestion: "Perform a quick scan lab test.",
      scoreColor: "#006b5b"
    };

    try {
      const aiResponseRaw = await runNvidiaAgent(userPrompt, systemInstruction);
      const parsed = extractJSON(aiResponseRaw);
      if (parsed && parsed.insight) {
        aiInsight = parsed;
      }
    } catch (aiErr) {
      console.error("AI Insight Generation Error:", aiErr);
    }

    res.json({
      healthScore,
      aiInsight,
      profileComplete: !!profile.user_id,
      stats: {
        totalScans: scans.length,
        vitals: Math.min(90 + (healthScore / 20), 100).toFixed(0) + "%",
        sleep: (70 + (Math.random() * 20)).toFixed(0) + "%",
        recovery: (healthScore * 0.9 + 5).toFixed(0) + "%",
        activity: profile.dietary_preferences?.includes('active') ? "88%" : "64%"
      }
    });

  } catch (err) {
    console.error("Dashboard Summary Error:", err);
    res.status(500).json({ error: 'Failed to generate dashboard summary' });
  }
};

module.exports = { getDashboardSummary };
