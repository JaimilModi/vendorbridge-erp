'use strict';

/**
 * src/modules/vendors/vendor.routes.js
 *
 * GET    /api/vendors              → list all (admin, proc_officer, manager)
 * GET    /api/vendors/:id          → get one (admin, proc_officer, manager)
 * POST   /api/vendors              → create (admin only)
 * PUT    /api/vendors/:id          → update (admin only)
 * PATCH  /api/vendors/:id/status   → change status (admin only)
 * DELETE /api/vendors/:id          → soft delete (admin only)
 *
 * Query params for GET /:
 *   ?search=<text>   — searches company_name, contact_name, email
 *   ?status=active|pending|inactive
 *   ?category=<text>
 *   ?page=1&limit=20
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./vendor.controller');

const router = Router();
router.use(authenticate);

// ── Zod schemas ─────────────────────────────────────────────────────────────

const createSchema = z.object({
  companyName:  z.string().trim().min(2).max(255),
  contactName:  z.string().trim().min(1).max(255).nullable().optional(),
  email:        schemas.email.nullable().optional(),
  phone:        z.string().trim().max(50).nullable().optional(),
  address:      z.string().trim().max(1000).nullable().optional(),
  category:     z.string().trim().max(100).nullable().optional(),
  gstNumber:    z.string().trim().max(100).nullable().optional(),
  rating:       z.number().min(0).max(5).nullable().optional(),
  status:       z.enum(['active', 'pending', 'inactive']).default('pending'),
});

const updateSchema = createSchema.partial();

const statusSchema = z.object({
  status: z.enum(['active', 'pending', 'inactive'], {
    errorMap: () => ({ message: 'Status must be: active, pending, or inactive' }),
  }),
});

const idParams = z.object({ id: schemas.uuid });

const listQuery = z.object({
  search:   z.string().optional(),
  status:   z.enum(['active', 'pending', 'inactive']).optional(),
  category: z.string().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

// ── Routes ──────────────────────────────────────────────────────────────────

router.get(
  '/',
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ query: listQuery }),
  controller.getAll
);

router.get(
  '/:id',
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ params: idParams }),
  controller.getById
);

router.post(
  '/',
  allowRoles('admin'),
  validate({ body: createSchema }),
  controller.create
);

router.put(
  '/:id',
  allowRoles('admin'),
  validate({ params: idParams, body: updateSchema }),
  controller.update
);

router.patch(
  '/:id/status',
  allowRoles('admin'),
  validate({ params: idParams, body: statusSchema }),
  controller.updateStatus
);

router.delete(
  '/:id',
  allowRoles('admin'),
  validate({ params: idParams }),
  controller.remove
);

module.exports = router;
