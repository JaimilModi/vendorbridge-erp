'use strict';

/**
 * src/modules/approvals/approval.routes.js
 *
 * GET    /api/approvals          → list all approvals (admin, manager)
 * GET    /api/approvals/pending  → pending approvals only (manager)
 * GET    /api/approvals/:id      → approval detail (admin, manager, proc_officer)
 * POST   /api/approvals          → create approval request (admin, proc_officer)
 * PATCH  /api/approvals/:id/decide → approve or reject (manager only)
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./approval.controller');

const router = Router();
router.use(authenticate);

// ── Zod schemas ──────────────────────────────────────────────────────────────

const createSchema = z.object({
  quotationId: schemas.uuid,
  approverId:  schemas.uuid.optional(), // optionally pre-assign a manager
  notes:       z.string().trim().max(2000).optional(),
});

const decideSchema = z.object({
  status: z.enum(['approved', 'rejected'], {
    errorMap: () => ({ message: 'Status must be "approved" or "rejected"' }),
  }),
  notes: z.string().trim().max(2000).optional(),
});

const idParams      = z.object({ id: schemas.uuid });
const listQuery     = z.object({
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.get(
  '/pending',
  allowRoles('manager'),
  controller.getPending
);

router.get(
  '/',
  allowRoles('admin', 'manager'),
  validate({ query: listQuery }),
  controller.getAll
);

router.get(
  '/:id',
  allowRoles('admin', 'manager', 'procurement_officer'),
  validate({ params: idParams }),
  controller.getById
);

router.post(
  '/',
  allowRoles('admin', 'procurement_officer'),
  validate({ body: createSchema }),
  controller.create
);

router.patch(
  '/:id/decide',
  allowRoles('manager'),
  validate({ params: idParams, body: decideSchema }),
  controller.decide
);

module.exports = router;
