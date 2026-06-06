'use strict';

/**
 * src/config/db.js
 *
 * Neon PostgreSQL connection pool.
 * Uses the `pg` library with SSL required for Neon connections.
 * Exports a pool instance and a `query` helper for parameterized queries.
 */

const { Pool } = require('pg');
const env = require('./env');

const pool = new Pool({
  connectionString: env.database.url,
  ssl: {
    // Neon requires SSL. In production set rejectUnauthorized: true.
    rejectUnauthorized: false,
  },
  // Sensible pool limits for a hackathon / Neon serverless instance
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Log pool errors to prevent silent failures
pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

/**
 * Execute a parameterized SQL query.
 *
 * @param {string} text - The SQL query string with $1, $2 placeholders
 * @param {Array} [params] - Ordered parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = (text, params) => pool.query(text, params);

/**
 * Verify that the database connection is alive.
 * Called once at server startup.
 */
const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() AS now');
    console.log(`[DB] Connected to Neon PostgreSQL. Server time: ${result.rows[0].now}`);
  } catch (err) {
    console.error('[DB] FATAL: Could not connect to database:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, query, testConnection };
