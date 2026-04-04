
require('dotenv').config({ path: 'frontend/.env' });
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scans'
    `);
    console.log('--- SCANS TABLE COLUMNS ---');
    res.rows.forEach(row => console.log(`${row.column_name}: ${row.data_type}`));
    
    const countRes = await pool.query('SELECT COUNT(*) FROM scans');
    console.log(`\nTotal scans in DB: ${countRes.rows[0].count}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Schema check failed:', err.message);
    process.exit(1);
  }
}

checkSchema();
