'use strict';

/**
 * src/middleware/index.js
 *
 * Central re-export of all middleware for convenient importing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * HOW TO USE THESE IN FEATURE MODULES:
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Import pattern in any module's routes file:
 *
 *   const { authenticate }  = require('../../middleware/auth');
 *   const { allowRoles }    = require('../../middleware/roleGuard');
 *   const { validate, schemas } = require('../../middleware/validate');
 *   const { z }             = require('zod');
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * MIDDLEWARE CHAIN PATTERNS:
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Public route — no auth needed:
 *    router.post('/signup', validate({ body: schema }), controller.create);
 *
 * 2. Any authenticated user:
 *    router.get('/me', authenticate, controller.me);
 *
 * 3. Single role:
 *    router.post('/rfqs', authenticate, allowRoles('procurement_officer'), controller.create);
 *
 * 4. Multiple roles:
 *    router.get('/rfqs', authenticate, allowRoles('admin', 'procurement_officer', 'manager'), controller.getAll);
 *
 * 5. With body validation:
 *    const bodySchema = z.object({ title: z.string().min(1) });
 *    router.post('/', authenticate, allowRoles('admin'), validate({ body: bodySchema }), controller.create);
 *
 * 6. With params validation:
 *    const paramsSchema = z.object({ id: schemas.uuid });
 *    router.get('/:id', authenticate, validate({ params: paramsSchema }), controller.getById);
 *
 * 7. With query validation (pagination):
 *    router.get('/', authenticate, validate({ query: schemas.paginationQuery }), controller.getAll);
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ROLE REFERENCE:
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  'admin'                — Full system access
 *  'procurement_officer'  — Creates RFQs, views quotations, requests approvals
 *  'manager'              — Approves/rejects approval requests, views reports
 *  'vendor'               — Submits quotations, generates invoices from own POs
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ERROR HANDLER — register LAST in app.js:
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  app.use(errorHandler);  // must be AFTER all routes
 *
 *  Any service can throw:  throw new AppError('message', 422, 'CODE');
 *  The errorHandler will format it as: { success: false, message, code }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { authenticate } = require('./auth');
const { allowRoles, VALID_ROLES } = require('./roleGuard');
const { validate, schemas } = require('./validate');
const { errorHandler } = require('./errorHandler');

module.exports = {
  authenticate,
  allowRoles,
  VALID_ROLES,
  validate,
  schemas,
  errorHandler,
};
