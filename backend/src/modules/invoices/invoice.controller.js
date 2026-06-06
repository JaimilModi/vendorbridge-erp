'use strict';

/**
 * src/modules/invoices/invoice.controller.js
 * Thin controller — parse req, call service, return response.
 */

const invoiceService = require('./invoice.service');
const { ok, created } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    return ok(res, await invoiceService.getAll(req.query));
  } catch (err) { next(err); }
};

const getMy = async (req, res, next) => {
  try {
    return ok(res, await invoiceService.getMy(req.user, req.query));
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    return ok(res, await invoiceService.getById(req.params.id, req.user));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    return created(res, await invoiceService.create(req.body, req.user), 'Invoice generated successfully.');
  } catch (err) { next(err); }
};

const updateStatus = async (req, res, next) => {
  try {
    return ok(res, await invoiceService.updateStatus(req.params.id, req.body, req.user));
  } catch (err) { next(err); }
};

const emailInvoice = async (req, res, next) => {
  try {
    return ok(res, await invoiceService.emailInvoice(req.params.id, req.user), 'Invoice emailed successfully.');
  } catch (err) { next(err); }
};

module.exports = { getAll, getMy, getById, create, updateStatus, emailInvoice };
