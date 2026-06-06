'use strict';

const service = require('./payment.service');
const { sendResponse } = require('../../utils/responseHandler');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    sendResponse(res, 200, 'Payments retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

const getMy = async (req, res, next) => {
  try {
    const data = await service.getMy(req.user, req.query);
    sendResponse(res, 200, 'My payments retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    sendResponse(res, 200, 'Payment retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user);
    sendResponse(res, 201, 'Payment created successfully', data);
  } catch (err) {
    next(err);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const data = await service.updateStatus(req.params.id, req.body.status, req.user);
    sendResponse(res, 200, 'Payment status updated successfully', data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getMy, getById, create, updateStatus };
