'use strict';

/**
 * src/modules/quotations/quotation.routes.js
 *
 * GET    /api/quotations              → list all (admin, proc_officer, manager)
 * GET    /api/quotations/rfq/:rfqId   → quotations for one RFQ (comparison view)
 * GET    /api/quotations/my           → vendor's own quotations
 * GET    /api/quotations/:id          → get one
 * POST   /api/quotations              → vendor creates draft
 * PUT    /api/quotations/:id          → vendor updates draft
 * PATCH  /api/quotations/:id/submit   → vendor submits
 * PATCH  /api/quotations/:id/select   → procurement selects winner
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./quotation.controller');

const router = Router();
router.use(authenticate);

// ── Zod schemas ──────────────────────────────────────────────────────────────

const quotationItemSchema = z.object({
  rfqItemId:  schemas.uuid.optional(),
  unitPrice:  z.number().nonnegative(),
  quantity:   z.number().int().positive(),
  totalPrice: z.number().nonnegative(),
});

const createSchema = z.object({
  rfqId:            schemas.uuid,
  totalAmount:      z.number().nonnegative(),
  validityDays:     z.number().int().positive().default(30),
  deliveryTimeline: z.string().trim().max(100).optional(),
  notes:            z.string().trim().max(2000).optional(),
  items:            z.array(quotationItemSchema).min(1, 'At least one item is required'),
});

const updateSchema = z.object({
  totalAmount:      z.number().nonnegative().optional(),
  validityDays:     z.number().int().positive().optional(),
  deliveryTimeline: z.string().trim().max(100).optional(),
  notes:            z.string().trim().max(2000).optional(),
  items:            z.array(quotationItemSchema).min(1).optional(),
});

const idParams = z.object({ id: schemas.uuid });
const rfqIdParams = z.object({ rfqId: schemas.uuid });

const listQuery = z.object({
  status: z.enum(['draft', 'submitted', 'selected', 'rejected']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

// ── Routes ────────────────────────────────────────────────────────────────────

// IMPORTANT: /my and /rfq/:rfqId must come before /:id to avoid param collision

router.get(
  '/my',
  allowRoles('vendor'),
  validate({ query: listQuery }),
  controller.getMy
);

router.get(
  '/rfq/:rfqId',
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ params: rfqIdParams }),
  controller.getByRfqId
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

router.post(
  '/',
  allowRoles('vendor'),
  validate({ body: createSchema }),
  controller.create
);

router.put(
  '/:id',
  allowRoles('vendor'),
  validate({ params: idParams, body: updateSchema }),
  controller.update
);

router.patch(
  '/:id/submit',
  allowRoles('vendor'),
  validate({ params: idParams }),
  controller.submit
);

router.patch(
  '/:id/select',
  allowRoles('admin', 'procurement_officer'),
  validate({ params: idParams }),
  controller.selectWinner
);

module.exports = router;
