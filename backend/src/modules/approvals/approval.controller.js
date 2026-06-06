'use strict';

/**
 * src/modules/approvals/approval.controller.js
 * Thin controller — parse req, call service, return response.
 */

const approvalService = require('./approval.service');
const { ok, created } = require('../../utils/response');

const getAll = async (req, res, next) => {
  try {
    return ok(res, await approvalService.getAll(req.query));
  } catch (err) { next(err); }
};

const getPending = async (req, res, next) => {
  try {
    return ok(res, await approvalService.getPending());
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    return ok(res, await approvalService.getById(req.params.id));
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    return created(res, await approvalService.create(req.body, req.user), 'Approval request submitted.');
  } catch (err) { next(err); }
};

const decide = async (req, res, next) => {
  try {
    const result = await approvalService.decide(req.params.id, req.body, req.user);
    const msg = req.body.status === 'approved'
      ? 'Quotation approved. Purchase Order generated automatically.'
      : 'Quotation rejected.';
    return ok(res, result, msg);
  } catch (err) { next(err); }
};

module.exports = { getAll, getPending, getById, create, decide };
