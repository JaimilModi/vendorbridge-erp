'use strict';

/**
 * src/modules/purchase-orders/po.controller.js
 * Thin controller — parse req, call service, return response.
 */

const poService = require('./po.service');
const { ok } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    return ok(res, await poService.getAll(req.query));
  } catch (err) { next(err); }
};

const getForVendor = async (req, res, next) => {
  try {
    return ok(res, await poService.getForVendor(req.user, req.query));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    return ok(res, await poService.getById(req.params.id, req.user));
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    return ok(res, await poService.updateStatus(req.params.id, req.body.status, req.user), 'PO status updated.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getForVendor, getById, updateStatus };
