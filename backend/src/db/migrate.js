require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const schema = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(100),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personas (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  age                  INT,
  gender               VARCHAR(20),
  health_conditions    TEXT[],
  health_goals         TEXT[],
  dietary_preferences  TEXT[],
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barcode         VARCHAR(50) UNIQUE,
  product_name    VARCHAR(255),
  brand           VARCHAR(100),
  ingredients     JSONB,
  nutrition_data  JSONB,
  source          VARCHAR(50),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES products(id),
  input_method      VARCHAR(10) CHECK (
                      input_method IN ('barcode', 'image', 'text', 'voice')
                    ),
  persona_snapshot  JSONB,
  analysis_result   JSONB NOT NULL,
  overall_verdict   VARCHAR(10) CHECK (
                      overall_verdict IN ('safe', 'limit', 'avoid')
                    ),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_user_id ON scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
`;

async function migrate() {
  try {
    console.log('Starting migration...');
    await pool.query(schema);
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
