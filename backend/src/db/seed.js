const pool = require('./pool');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const userId = uuidv4();
  
  try {
    // 1. Create User
    const insertUser = `
      INSERT INTO users (id, name, email, password_hash)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;
    await pool.query(insertUser, [userId, 'Rishit Bingi', 'bingi@example.com', 'hashed_pass']);

    // 2. Create Persona
    const insertPersona = `
      INSERT INTO personas (user_id, age, gender, health_conditions, health_goals, dietary_preferences)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    const conditions = ['Hypertension', 'Pre-diabetic'];
    const goals = ['Weight Loss', 'Heart Health'];
    const prefs = ['Vegetarian'];

    await pool.query(insertPersona, [userId, 25, 'Male', conditions, goals, prefs]);

    console.log('Seed Successful. User ID:', userId);
    process.exit(0);
  } catch (err) {
    console.error('Seed Failed:', err);
    process.exit(1);
  }
}

seed();
