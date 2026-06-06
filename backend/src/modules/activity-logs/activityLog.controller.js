'use strict';

/**
 * src/modules/activity-logs/activityLog.controller.js
 * Thin controller — parse req, call service, return response.
 */

const activityLogService = require('./activityLog.service');
const { ok } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    return ok(res, await activityLogService.getAll(req.query));
  } catch (err) { next(err); }
};

const getByEntity = async (req, res, next) => {
  try {
    return ok(res, await activityLogService.getByEntity(req.params.type, req.params.id));
  } catch (err) { next(err); }
};

module.exports = { getAll, getByEntity };
