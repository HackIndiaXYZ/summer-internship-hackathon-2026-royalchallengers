require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixScansTable() {
  try {
    console.log('Fixing scans table schema...');
    
    // Add missing columns and remove strict constraints that might cause insertion failures
    await pool.query(`
      ALTER TABLE scans 
      ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS health_score NUMERIC;

      -- Remove constraints to prevent insertion failures on old IDs
      ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_overall_verdict_check;
      ALTER TABLE scans DROP CONSTRAINT IF EXISTS scans_input_method_check;
      
      ALTER TABLE scans ALTER COLUMN input_method TYPE VARCHAR(20);
      ALTER TABLE scans ALTER COLUMN overall_verdict TYPE VARCHAR(20);
    `);

    console.log('Scans table fixed successfully.');
  } catch (err) {
    console.error('Failed to fix scans table:', err.message);
  } finally {
    await pool.end();
  }
}

fixScansTable();
