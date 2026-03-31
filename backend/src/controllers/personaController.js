const { query } = require('../db/pool');

const setupProfile = async (req, res) => {
  const { user_id, age, gender, health_conditions, health_goals, dietary_preferences, weight, height } = req.body;
  try {
    const result = await query(
      `INSERT INTO personas (user_id, age, gender, health_conditions, health_goals, dietary_preferences, weight, height)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
       age = EXCLUDED.age,
       gender = EXCLUDED.gender,
       health_conditions = EXCLUDED.health_conditions,
       health_goals = EXCLUDED.health_goals,
       dietary_preferences = EXCLUDED.dietary_preferences,
       weight = EXCLUDED.weight,
       height = EXCLUDED.height,
       updated_at = NOW()
       RETURNING *`,
      [user_id, age, gender, health_conditions, health_goals, dietary_preferences, weight, height]
    );
    res.json({ persona: result.rows[0] });
  } catch (err) {
    console.error('Failed to setup persona:', err);
    res.status(400).json({ error: 'Failed to setup persona' });
  }
};

const getProfile = async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await query('SELECT * FROM personas WHERE user_id = $1', [userId]);
    res.json({ persona: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching persona' });
  }
};

module.exports = { setupProfile, getProfile };
