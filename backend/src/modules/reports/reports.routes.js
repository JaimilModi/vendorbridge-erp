'use strict';

/**
 * src/modules/reports/reports.routes.js
 *
 * All report endpoints require authentication and admin or manager role.
 *
 * GET /api/reports/summary          → KPI cards for dashboard
 * GET /api/reports/spend            → spend breakdown by vendor and category
 * GET /api/reports/vendor-performance → vendor rating + activity scores
 * GET /api/reports/monthly-trend    → monthly PO spend for the past 12 months
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { allowRoles } = require('../../middleware/roleGuard');
const { validate } = require('../../middleware/validate');
const controller = require('./reports.controller');

const router = Router();
router.use(authenticate);
router.use(allowRoles('admin', 'manager'));

const yearQuery = z.object({
  year: z.coerce.number().int().min(2020).max(2100).optional(),
});

router.get('/summary',            controller.summary);
router.get('/spend',              controller.spend);
router.get('/vendor-performance', controller.vendorPerformance);
router.get('/monthly-trend',      validate({ query: yearQuery }), controller.monthlyTrend);

module.exports = router;
