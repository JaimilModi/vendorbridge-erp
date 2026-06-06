'use strict';

/**
 * src/modules/rfqs/rfq.routes.js
 *
 * GET    /api/rfqs                   → list all (admin, proc_officer, manager)
 * GET    /api/rfqs/vendor            → vendor's assigned RFQs (vendor only)
 * GET    /api/rfqs/:id               → get one with items + vendors
 * POST   /api/rfqs                   → create draft or published RFQ
 * PUT    /api/rfqs/:id               → update (draft only)
 * PATCH  /api/rfqs/:id/publish       → draft → published
 * PATCH  /api/rfqs/:id/close         → published → closed
 * POST   /api/rfqs/:id/vendors       → assign vendor(s) to RFQ
 * DELETE /api/rfqs/:id               → delete draft only
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./rfq.controller');

const router = Router();
router.use(authenticate);

// ── Zod schemas ──────────────────────────────────────────────────────────────

const rfqItemSchema = z.object({
  itemName:       z.string().trim().min(1).max(255),
  quantity:       z.number().int().positive(),
  unit:           z.string().trim().max(50).default('pcs'),
  estimatedPrice: z.number().nonnegative().optional(),
});

const createSchema = z.object({
  title:       z.string().trim().min(2).max(255),
  description: z.string().trim().max(5000).optional(),
  department:  z.string().trim().max(100).optional(),
  deadline:    z.string().datetime({ message: 'deadline must be an ISO datetime string' }).optional(),
  budgetLimit: z.number().nonnegative().optional(),
  status:      z.enum(['draft', 'published']).default('draft'),
  items:       z.array(rfqItemSchema).min(1, 'At least one line item is required'),
  vendorIds:   z.array(schemas.uuid).optional(),
});

const updateSchema = z.object({
  title:       z.string().trim().min(2).max(255).optional(),
  description: z.string().trim().max(5000).optional(),
  department:  z.string().trim().max(100).optional(),
  deadline:    z.string().datetime().optional(),
  budgetLimit: z.number().nonnegative().optional(),
  items:       z.array(rfqItemSchema).min(1).optional(),
});

const assignVendorsSchema = z.object({
  vendorIds: z.array(schemas.uuid).min(1, 'At least one vendor ID is required'),
});

const idParams = z.object({ id: schemas.uuid });

const listQuery = z.object({
  status:   z.enum(['draft', 'published', 'closed', 'awarded']).optional(),
  search:   z.string().optional(),
  page:     z.coerce.number().int().min(1).default(1),
  limit:    z.coerce.number().int().min(1).max(100).default(20),
});

// ── Routes ────────────────────────────────────────────────────────────────────

router.get(
  '/',
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ query: listQuery }),
  controller.getAll
);

router.get(
  '/vendor',
  allowRoles('vendor'),
  controller.getForVendor
);

router.get(
  '/:id',
  allowRoles('admin', 'procurement_officer', 'manager', 'vendor'),
  validate({ params: idParams }),
  controller.getById
);

router.post(
  '/',
  allowRoles('admin', 'procurement_officer'),
  validate({ body: createSchema }),
  controller.create
);

router.put(
  '/:id',
  allowRoles('admin', 'procurement_officer'),
  validate({ params: idParams, body: updateSchema }),
  controller.update
);

router.patch(
  '/:id/publish',
  allowRoles('admin', 'procurement_officer'),
  validate({ params: idParams }),
  controller.publish
);

router.patch(
  '/:id/close',
  allowRoles('admin'),
  validate({ params: idParams }),
  controller.close
);

router.post(
  '/:id/vendors',
  allowRoles('admin', 'procurement_officer'),
  validate({ params: idParams, body: assignVendorsSchema }),
  controller.assignVendors
);

router.delete(
  '/:id',
  allowRoles('admin'),
  validate({ params: idParams }),
  controller.remove
);

module.exports = router;
