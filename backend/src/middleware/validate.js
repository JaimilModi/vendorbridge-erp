'use strict';

/**
 * src/middleware/validate.js
 *
 * Zod Request Validation Middleware Factory.
 *
 * Validates req.body, req.params, and/or req.query against a Zod schema.
 * On failure, returns 400 Bad Request with structured field-level errors.
 *
 * Usage:
 *   const { z } = require('zod');
 *   const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
 *   router.post('/login', validate({ body: schema }), controller.login);
 */

const { z } = require('zod');
const { validationError } = require('../utils/response');

/**
 * Factory: returns validation middleware for body, params, and/or query.
 *
 * @param {{ body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }} schemas
 * @returns {Function} Express middleware
 */
const validate = (schemas = {}) => {
  return (req, res, next) => {
    const errors = [];

    // Validate each target (body, params, query) if a schema is provided
    for (const [target, schema] of Object.entries(schemas)) {
      if (!schema || typeof schema.safeParse !== 'function') continue;

      const result = schema.safeParse(req[target]);

      if (!result.success) {
        const fieldErrors = result.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        errors.push(...fieldErrors);
      } else {
        // Replace raw input with the coerced/transformed Zod output
        req[target] = result.data;
      }
    }

    if (errors.length > 0) {
      return validationError(res, errors);
    }

    next();
  };
};

/**
 * Common reusable Zod schema primitives.
 * Import these in module schema files to avoid repetition.
 */
const schemas = {
  uuid: z.string().uuid({ message: 'Must be a valid UUID' }),
  email: z.string().email({ message: 'Must be a valid email address' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must not exceed 128 characters' }),
  positiveInt: z.number().int().positive(),
  positiveDecimal: z.number().positive(),
  nonEmptyString: z.string().min(1, { message: 'Field is required' }).max(500),
  paginationQuery: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};

module.exports = { validate, schemas };
