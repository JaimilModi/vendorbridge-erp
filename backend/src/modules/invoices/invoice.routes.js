'use strict';

/**
 * src/modules/invoices/invoice.routes.js
 *
 * GET    /api/invoices        → all invoices (admin, proc_officer, manager)
 * GET    /api/invoices/my     → vendor's own invoices (vendor)
 * GET    /api/invoices/:id    → invoice detail (all authenticated)
 * POST   /api/invoices        → vendor generates invoice from an issued PO
 * POST   /api/invoices/:id/email → email the invoice
 * PATCH  /api/invoices/:id/status → approve / reject / paid (admin, proc_officer)
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./invoice.controller');

const router = Router();
router.use(authenticate);

// ── Zod schemas ──────────────────────────────────────────────────────────────

const invoiceItemSchema = z.object({
  poItemId:    schemas.uuid.optional(),
  description: z.string().trim().min(1).max(255),
  quantity:    z.number().int().positive(),
  unitPrice:   z.number().nonnegative(),
  totalPrice:  z.number().nonnegative(),
});

const createSchema = z.object({
  poId:    schemas.uuid,
  dueDate: z.string().datetime({ message: 'dueDate must be an ISO datetime' }).optional(),
  items:   z.array(invoiceItemSchema).min(1, 'At least one invoice item is required'),
});

const statusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'paid'], {
    errorMap: () => ({ message: 'Status must be: approved, rejected, or paid' }),
  }),
  notes: z.string().trim().max(2000).optional(),
});

const idParams = z.object({ id: schemas.uuid });

const listQuery = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'paid']).optional(),
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
});

// ── Routes — /my must come before /:id ──────────────────────────────────────

router.get(
  '/my',
  allowRoles('vendor'),
  validate({ query: listQuery }),
  controller.getMy
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

router.patch(
  '/:id/status',
  allowRoles('admin', 'procurement_officer'),
  validate({ params: idParams, body: statusSchema }),
  controller.updateStatus
);

router.post(
  '/:id/email',
  allowRoles('admin', 'procurement_officer', 'manager', 'vendor'),
  validate({ params: idParams }),
  controller.emailInvoice
);

module.exports = router;
