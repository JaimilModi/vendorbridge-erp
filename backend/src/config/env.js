'use strict';

/**
 * src/config/env.js
 *
 * Loads and validates required environment variables at startup.
 * The application will refuse to start if any required variable is missing.
 */

require('dotenv').config();

const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'JWT_EXPIRES_IN'];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`[ENV] FATAL: Missing required environment variable: ${varName}`);
    console.error(`[ENV] Copy .env.example to .env and fill in all values.`);
    process.exit(1);
  }
}

const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: process.env.NODE_ENV !== 'production',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
};

module.exports = env;
