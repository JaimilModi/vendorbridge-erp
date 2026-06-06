'use strict';

/**
 * src/middleware/errorHandler.js
 *
 * Global Express Error Handler.
 *
 * Must be registered LAST in app.js after all routes.
 * Catches any error passed via next(err) from controllers or middleware.
 *
 * Returns a consistent error envelope:
 * { success: false, message: string, code: string }
 *
 * In development, the stack trace is included in the response.
 * In production, internal details are hidden from the client.
 */

const env = require('../config/env');
const { serverError } = require('../utils/response');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log every error server-side
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);
  if (env.isDev) {
    console.error(`  Stack: ${err.stack}`);
  }

  // ── 1. AppError — application-level error with explicit statusCode ──────────
  // These are thrown deliberately by services (e.g. throw new AppError('...', 404))
  // Must be checked FIRST because AppError.code contains strings like 'VENDOR_NOT_FOUND'
  // which must not be confused with Postgres driver numeric codes.
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code || 'APP_ERROR',
      ...(env.isDev && { stack: err.stack }),
    });
  }

  // ── 2. Postgres driver errors — err.code is a 5-char alphanumeric string ────
  // Only reach here if the error was NOT an intentional AppError.
  if (err.code && typeof err.code === 'string' && /^[0-9A-Z]{5}$/.test(err.code)) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          message: 'A record with this value already exists.',
          code: 'DUPLICATE_ENTRY',
        });
      case '23503': // foreign_key_violation
        return res.status(409).json({
          success: false,
          message: 'Referenced record does not exist.',
          code: 'FOREIGN_KEY_VIOLATION',
        });
      case '23502': // not_null_violation
        return res.status(400).json({
          success: false,
          message: `Required field missing: ${err.column || 'unknown'}`,
          code: 'NULL_VIOLATION',
        });
      case '22P02': // invalid_text_representation (e.g., bad UUID)
        return res.status(400).json({
          success: false,
          message: 'Invalid data format (e.g., malformed UUID).',
          code: 'INVALID_FORMAT',
        });
      default:
        break;
    }
  }

  // ── 3. Unhandled errors — 500 Internal Server Error ──────────────────────────
  return serverError(res, env.isDev ? err.message : 'An unexpected server error occurred.', err);
};

module.exports = { errorHandler };
