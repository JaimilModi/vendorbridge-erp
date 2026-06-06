'use strict';

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./payment.controller');

const router = Router();
router.use(authenticate);

const createSchema = z.object({
  invoiceId: schemas.uuid,
  amount: z.number().positive().optional(),
  paymentMethod: z.enum(['bank_transfer', 'credit_card', 'cheque', 'cash']).optional(),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['processing', 'completed', 'failed']),
});

const idParams = z.object({ id: schemas.uuid });
const listQuery = z.object({
  status: z.enum(['processing', 'completed', 'failed']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

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
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ body: createSchema }),
  controller.create
);

router.patch(
  '/:id/status',
  allowRoles('admin', 'procurement_officer', 'manager'),
  validate({ params: idParams, body: statusSchema }),
  controller.updateStatus
);

module.exports = router;
