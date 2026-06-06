'use strict';

/**
 * src/utils/response.js
 *
 * Standardized HTTP response helpers.
 *
 * All API responses follow this envelope:
 * Success: { success: true, data: any, message?: string }
 * Error:   { success: false, message: string, code?: string, errors?: array }
 *
 * Import named helpers in controllers to keep response formatting consistent.
 */

/**
 * 200 OK
 */
const ok = (res, data, message = 'Success') => {
  return res.status(200).json({ success: true, message, data });
};

/**
 * 201 Created
 */
const created = (res, data, message = 'Created successfully') => {
  return res.status(201).json({ success: true, message, data });
};

/**
 * 204 No Content (e.g. successful delete)
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * 400 Bad Request
 */
const badRequest = (res, message = 'Bad request') => {
  return res.status(400).json({ success: false, message, code: 'BAD_REQUEST' });
};

/**
 * 400 Validation Error — includes field-level error details
 */
const validationError = (res, errors = []) => {
  return res.status(400).json({
    success: false,
    message: 'Validation failed. Please check your input.',
    code: 'VALIDATION_ERROR',
    errors,
  });
};

/**
 * 401 Unauthorized
 */
const unauthorized = (res, message = 'Authentication required.') => {
  return res.status(401).json({ success: false, message, code: 'UNAUTHORIZED' });
};

/**
 * 403 Forbidden
 */
const forbidden = (res, message = 'You do not have permission to perform this action.') => {
  return res.status(403).json({ success: false, message, code: 'FORBIDDEN' });
};

/**
 * 404 Not Found
 */
const notFound = (res, resource = 'Resource') => {
  return res.status(404).json({
    success: false,
    message: `${resource} not found.`,
    code: 'NOT_FOUND',
  });
};

/**
 * 409 Conflict
 */
const conflict = (res, message = 'Conflict with existing data.') => {
  return res.status(409).json({ success: false, message, code: 'CONFLICT' });
};

/**
 * 422 Unprocessable Entity — business logic rejection
 */
const unprocessable = (res, message) => {
  return res.status(422).json({ success: false, message, code: 'UNPROCESSABLE' });
};

/**
 * 500 Internal Server Error
 */
const serverError = (res, message = 'Internal server error.', err = null) => {
  if (err) console.error('[SERVER_ERROR]', err);
  return res.status(500).json({ success: false, message, code: 'INTERNAL_ERROR' });
};

module.exports = {
  ok,
  created,
  noContent,
  badRequest,
  validationError,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  serverError,
};
