require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    console.log('Starting migration: adding weight and height to personas...');
    
    await pool.query(`
      ALTER TABLE personas 
      ADD COLUMN IF NOT EXISTS weight NUMERIC,
      ADD COLUMN IF NOT EXISTS height NUMERIC;
    `);

    console.log('Migration successful: weight and height columns added to personas');
  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
