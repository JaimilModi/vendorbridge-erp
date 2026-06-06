'use strict';

/**
 * src/modules/auth/auth.controller.js
 *
 * Thin controller layer:
 * - Parses validated req.body (Zod has already coerced it)
 * - Calls the service
 * - Returns the HTTP response
 * - All business logic is in auth.service.js — nothing here
 */

const authService = require('./auth.service');
const { ok, created } = require('../../utils/response');

/**
 * POST /api/auth/signup
 * Body: { fullName, email, password, role }
 * Returns: 201 { token, user }
 */
const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    return created(res, result, 'Account created successfully. Welcome to VendorBridge.');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns: 200 { token, user }
 */
const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    return ok(res, result, 'Login successful.');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 * Header: Authorization: Bearer <token>
 * Returns: 200 { user }
 *
 * req.user is attached by the `authenticate` middleware.
 * We re-fetch from DB via the service to get the most current data including vendorId.
 */
const me = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    return ok(res, { user }, 'Current user retrieved.');
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body);
    return ok(res, null, 'If that email exists, an OTP has been sent.');
  } catch (err) {
    next(err);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    await authService.verifyOtp(req.body);
    return ok(res, null, 'OTP verified successfully.');
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return ok(res, null, 'Password reset successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, me, forgotPassword, verifyOtp, resetPassword };
