'use strict';

/**
 * src/utils/AppError.js
 *
 * Custom application error class.
 * Allows services to throw business-logic errors with HTTP status codes
 * that the global error handler will pick up and format correctly.
 *
 * Usage:
 *   throw new AppError('RFQ is not in published status.', 422, 'INVALID_STATE');
 *   throw new AppError('Vendor not found.', 404);
 */

class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code='APP_ERROR'] - Machine-readable error code
   */
  constructor(message, statusCode = 500, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;

    // Capture stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

module.exports = { AppError };
