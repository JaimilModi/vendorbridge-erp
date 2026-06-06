'use strict';

/**
 * src/modules/vendors/vendor.controller.js
 * Thin layer — parses req, calls service, returns response.
 */

const vendorService = require('./vendor.service');
const { ok, created, noContent } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    const data = await vendorService.getAll(req.query);
    return ok(res, data);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const data = await vendorService.getById(req.params.id);
    return ok(res, data);
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const data = await vendorService.create(req.body, req.user);
    return created(res, data, 'Vendor created successfully.');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const data = await vendorService.update(req.params.id, req.body, req.user);
    return ok(res, data, 'Vendor updated successfully.');
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await vendorService.updateStatus(req.params.id, req.body.status, req.user);
    return ok(res, data, 'Vendor status updated.');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await vendorService.remove(req.params.id, req.user);
    return noContent(res);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
