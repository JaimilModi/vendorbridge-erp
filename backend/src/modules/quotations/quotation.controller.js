'use strict';

/**
 * src/modules/quotations/quotation.controller.js
 * Thin controller — parse req, call service, return response.
 */

const quotationService = require('./quotation.service');
const { ok, created } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    return ok(res, await quotationService.getAll(req.query));
  } catch (err) { next(err); }
};

const getByRfqId = async (req, res, next) => {
  try {
    return ok(res, await quotationService.getByRfqId(req.params.rfqId));
  } catch (err) { next(err); }
};

const getMy = async (req, res, next) => {
  try {
    return ok(res, await quotationService.getMy(req.user, req.query));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    return ok(res, await quotationService.getById(req.params.id, req.user));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    return created(res, await quotationService.create(req.body, req.user), 'Quotation draft saved.');
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    return ok(res, await quotationService.update(req.params.id, req.body, req.user));
  } catch (err) { next(err); }
};

const submit = async (req, res, next) => {
  try {
    return ok(res, await quotationService.submit(req.params.id, req.user), 'Quotation submitted successfully.');
  } catch (err) { next(err); }
};

const selectWinner = async (req, res, next) => {
  try {
    return ok(res, await quotationService.selectWinner(req.params.id, req.user), 'Winning quotation selected.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getByRfqId, getMy, getById, create, update, submit, selectWinner };
