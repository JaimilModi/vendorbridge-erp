'use strict';

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles, VALID_ROLES } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./user.controller');

const router = Router();
router.use(authenticate);
router.use(allowRoles('admin'));

const updateSchema = z.object({
  role: z.enum(VALID_ROLES).optional(),
  status: z.enum(['active', 'inactive']).optional()
});

router.get('/', controller.getAll);
router.patch('/:id', validate({ params: z.object({ id: schemas.uuid }), body: updateSchema }), controller.update);

module.exports = router;
