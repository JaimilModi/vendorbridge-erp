'use strict';

const service = require('./receipt.service');
const { sendResponse } = require('../../utils/responseHandler');

const getAll = async (req, res, next) => {
  try {
    const data = await service.getAll(req.query);
    sendResponse(res, 200, 'Receipts retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

const getMy = async (req, res, next) => {
  try {
    const data = await service.getMy(req.user, req.query);
    sendResponse(res, 200, 'My receipts retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    sendResponse(res, 200, 'Receipt retrieved successfully', data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getMy, getById };
