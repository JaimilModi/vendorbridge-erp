'use strict';

/**
 * server.js
 *
 * Entry point for the VendorBridge API server.
 * - Verifies database connectivity before accepting requests
 * - Starts the HTTP server
 * - Handles graceful shutdown on SIGTERM / SIGINT
 */

const app = require('./app');
const env = require('./src/config/env');
const { testConnection, pool } = require('./src/config/db');

const PORT = env.port;

const startServer = async () => {
  // Verify DB is reachable before binding to port
  await testConnection();

  const server = app.listen(PORT, () => {
    console.log(`\n🚀 VendorBridge API running on http://localhost:${PORT}`);
    console.log(`   Environment : ${env.nodeEnv}`);
    console.log(`   CORS origin : ${env.cors.origin}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Graceful shutdown
  // ─────────────────────────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`\n[server] ${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      console.log('[server] HTTP server closed.');
      await pool.end();
      console.log('[server] Database pool closed.');
      process.exit(0);
    });

    // Force-exit after 10 seconds if shutdown hangs
    setTimeout(() => {
      console.error('[server] Forced exit after timeout.');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Catch unhandled promise rejections
  process.on('unhandledRejection', (reason) => {
    console.error('[server] Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[server] Uncaught Exception:', err.message);
    process.exit(1);
  });
};

startServer();
