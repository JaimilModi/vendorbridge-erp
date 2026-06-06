'use strict';

/**
 * src/modules/rfqs/rfq.controller.js
 * Thin controller — parse req, call service, return response.
 */

const rfqService = require('./rfq.service');
const { ok, created, noContent } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    return ok(res, await rfqService.getAll(req.query));
  } catch (err) { next(err); }
};

const getForVendor = async (req, res, next) => {
  try {
    return ok(res, await rfqService.getForVendor(req.user));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    return ok(res, await rfqService.getById(req.params.id, req.user));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    return created(res, await rfqService.create(req.body, req.user), 'RFQ created successfully.');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    return ok(res, await rfqService.update(req.params.id, req.body, req.user));
  } catch (err) { next(err); }
};

const publish = async (req, res, next) => {
  try {
    return ok(res, await rfqService.publish(req.params.id, req.user), 'RFQ published successfully.');
  } catch (err) { next(err); }
};

const close = async (req, res, next) => {
  try {
    return ok(res, await rfqService.close(req.params.id, req.user), 'RFQ closed.');
  } catch (err) { next(err); }
};

const assignVendors = async (req, res, next) => {
  try {
    return ok(res, await rfqService.assignVendors(req.params.id, req.body.vendorIds, req.user));
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await rfqService.remove(req.params.id, req.user);
    return noContent(res);
  } catch (err) { next(err); }
};

module.exports = { getAll, getForVendor, getById, create, update, publish, close, assignVendors, remove };
