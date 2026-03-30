const pool = require('./src/db/pool');

const migrate = async () => {
  console.log('🚀 Starting Medo Veda Database Shielding...');
  
  try {
    // 1. Drop existing tables if they are broken (Optional, but safe for hackathon restart)
    // await pool.query('DROP TABLE IF EXISTS scans, personas, users CASCADE;');

    // 2. Create Schema / Alter Existing
    const schema = `
      -- Users Transition
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT UNIQUE,
        password_hash TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Ensure password_hash is nullable for this demo
      ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

      -- Personas (Health Profiles)
      CREATE TABLE IF NOT EXISTS personas (
        id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        health_conditions TEXT[],
        health_goals TEXT[],
        dietary_preferences TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_user_persona UNIQUE(user_id)
      );

      -- Scans (Analysis History)
      CREATE TABLE IF NOT EXISTS scans (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID,
        input_method TEXT,
        analysis_result JSONB,
        overall_verdict TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await pool.query(schema);
    console.log('✅ Basic Schema Applied/Migrated.');

    // 3. Forcibly Bootstrap Rishit Bingi
    const bootstrapUser = `
      INSERT INTO users (id, name, email) 
      VALUES ('b5a300be-cf0a-4f21-a1e5-6b37b01647dd', 'Rishit Bingi', 'rishit@example.com')
      ON CONFLICT (id) DO NOTHING;
    `;
    await pool.query(bootstrapUser);
    
    const bootstrapPersona = `
      INSERT INTO personas (user_id, health_conditions, health_goals, dietary_preferences)
      VALUES ('b5a300be-cf0a-4f21-a1e5-6b37b01647dd', 
        ARRAY['High Sugar', 'Nut Allergy'], 
        ARRAY['Weight Loss', 'Heart Health'], 
        ARRAY['Vegetarian'])
      ON CONFLICT (user_id) DO NOTHING;
    `;
    await pool.query(bootstrapPersona);

    console.log('✅ Rishit Bingi Identity Active.');
    console.log('🎉 Database Shielding COMPLETE.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Database Shielding FAILED:', err);
    process.exit(1);
  }
};

migrate();
