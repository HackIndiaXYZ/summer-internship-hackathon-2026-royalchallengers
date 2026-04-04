const { Pool } = require('pg');
require('dotenv').config();

/**
 * Medo Veda Core Persistence Engine
 * ───
 * Hardened PostgreSQL Pool with Neon-specific connection lifecycle management.
 * Silent mock fallbacks have been removed to ensure absolute data consistency.
 */

const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

const pool = new Pool(poolConfig);

// Immediate Error Handling: Capture backend-level connection drops
pool.on('error', (err) => {
  console.error('[CORE DB ERROR] Unexpected error on idle client:', err.message);
});

// Warmup Sync
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('[CRITICAL DB FAILURE] Database is UNREACHABLE:', err.message);
  } else {
    console.log('[CORE DB] Connected successfully to Medo-Veda Primary Instance.');
  }
});

// Keep-Alive Loop: Prevent cold-starts
setInterval(() => {
  pool.query('SELECT 1').catch(() => {});
}, 40000);

/**
 * Transparent Query Wrapper
 * Returns the exact result or throws to allow controller error handling.
 */
const transparentQuery = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error(`[DB ERROR] ${err.message} | Query: ${text.substring(0, 50)}...`);
    throw err; 
  }
};

module.exports = {
  query: transparentQuery,
  originalPool: pool
};
