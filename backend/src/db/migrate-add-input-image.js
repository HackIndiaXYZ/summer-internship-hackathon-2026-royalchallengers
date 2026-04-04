require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log('Running migration: Adding input_image to scans...');

    await pool.query(`
      ALTER TABLE scans 
      ADD COLUMN IF NOT EXISTS input_image TEXT;
    `);

    console.log('Migration successful: input_image added to scans');
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    await pool.end();
  }
}

migrate();
