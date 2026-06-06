'use strict';

const service = require('./user.service');

exports.getAll = async (req, res, next) => {
  try {
    const users = await service.getAll();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updatedUser = await service.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    next(error);
  }
};
