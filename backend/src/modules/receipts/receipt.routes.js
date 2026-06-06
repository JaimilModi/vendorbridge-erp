'use strict';

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./receipt.controller');

const router = Router();
router.use(authenticate);

const idParams = z.object({ id: schemas.uuid });
const listQuery = z.object({
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

module.exports = router;
