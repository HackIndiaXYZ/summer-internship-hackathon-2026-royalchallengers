require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Adds product_name column to scans table if it doesn't exist
async function migrate() {
  try {
    console.log('Running migration...');

    await pool.query(`
      ALTER TABLE scans 
      ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)
    `);

    console.log('Migration successful: product_name column added to scans');
  } catch (err) {
    if (err.message?.includes('already exists')) {
      console.log('Column already exists — no action needed.');
    } else {
      console.error('Migration error:', err.message);
    }
  } finally {
    await pool.end();
  }
}

migrate();
