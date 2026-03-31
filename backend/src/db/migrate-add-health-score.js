const { query } = require('./pool');

async function migrate() {
  console.log('Running health_score migration...');
  try {
    // Add health_score column if it doesn't exist
    await query(`
      ALTER TABLE scans 
      ADD COLUMN IF NOT EXISTS health_score DECIMAL(3,1) DEFAULT 5.0;
    `);
    console.log('Successfully added health_score column to scans table.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
