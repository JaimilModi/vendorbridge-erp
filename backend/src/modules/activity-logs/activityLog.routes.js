'use strict';

/**
 * src/modules/activity-logs/activityLog.routes.js
 *
 * GET /api/activity-logs           → full paginated audit trail (admin, proc_officer, manager)
 * GET /api/activity-logs/entity/:type/:id → logs for a specific entity
 *
 * This module is READ-ONLY. Logs are written by other services via utils/activityLogger.js.
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate, schemas } = require('../../middleware/validate');
const controller = require('./activityLog.controller');

const router = Router();
router.use(authenticate);
router.use(allowRoles('admin', 'procurement_officer', 'manager'));

const listQuery = z.object({
  action:     z.string().trim().optional(),
  entityType: z.string().trim().optional(),
  userId:     schemas.uuid.optional(),
  page:       z.coerce.number().int().min(1).default(1),
  limit:      z.coerce.number().int().min(1).max(200).default(50),
});

const entityParams = z.object({
  type: z.string().trim().min(1),
  id:   schemas.uuid,
});

router.get('/', validate({ query: listQuery }), controller.getAll);
router.get('/entity/:type/:id', validate({ params: entityParams }), controller.getByEntity);

module.exports = router;
