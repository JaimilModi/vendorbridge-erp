'use strict';

/**
 * src/modules/purchase-orders/po.routes.js
 *
 * NOTE: There is NO POST /api/purchase-orders endpoint.
 * POs are created exclusively by approval.service.decide() on approval.
 * Exposing a public POST would bypass the approval workflow entirely.
 *
 * GET    /api/purchase-orders          → all POs (admin, proc_officer, manager)
 * GET    /api/purchase-orders/vendor   → vendor's own POs (vendor)
 * GET    /api/purchase-orders/:id      → full PO detail (all authenticated)
 * PATCH  /api/purchase-orders/:id/status → update PO status (admin, proc_officer)
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./po.controller');

const router = Router();
router.use(authenticate);

const idParams = z.object({ id: schemas.uuid });

const statusSchema = z.object({
  status: z.enum(['issued', 'acknowledged', 'fulfilled', 'cancelled'], {
    errorMap: () => ({ message: 'Status must be: issued, acknowledged, fulfilled, or cancelled' }),
  }),
});

const listQuery = z.object({
  status: z.enum(['issued', 'acknowledged', 'fulfilled', 'cancelled']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

// /vendor must come before /:id
router.get(
  '/vendor',
  allowRoles('vendor'),
  validate({ query: listQuery }),
  controller.getForVendor
);

router.get(
  '/',
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ query: listQuery }),
  controller.getAll
);

router.get(
  '/:id',
  allowRoles('admin', 'procurement_officer', 'manager', 'vendor'),
  validate({ params: idParams }),
  controller.getById
);

router.patch(
  '/:id/status',
  allowRoles('admin', 'procurement_officer'),
  validate({ params: idParams, body: statusSchema }),
  controller.updateStatus
);

module.exports = router;
