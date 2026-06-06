'use strict';

/**
 * src/middleware/roleGuard.js
 *
 * Role-Based Access Control (RBAC) Middleware Factory.
 *
 * Usage:
 *   router.get('/admin-only', authenticate, allowRoles('admin'), controller.handler);
 *   router.get('/multi', authenticate, allowRoles('admin', 'manager'), controller.handler);
 *
 * Valid roles: 'admin' | 'procurement_officer' | 'vendor' | 'manager'
 * Must be used AFTER the `authenticate` middleware (requires req.user).
 */

const { forbidden } = require('../utils/response');

const VALID_ROLES = ['admin', 'procurement_officer', 'vendor', 'manager'];

/**
 * Factory: returns middleware that only allows the specified roles.
 *
 * @param {...string} roles - One or more allowed role strings
 * @returns {Function} Express middleware
 */
const allowRoles = (...roles) => {
  // Validate roles at startup to catch developer typos
  for (const role of roles) {
    if (!VALID_ROLES.includes(role)) {
      throw new Error(`[roleGuard] Invalid role in allowRoles(): "${role}". Valid roles: ${VALID_ROLES.join(', ')}`);
    }
  }

  return (req, res, next) => {
    if (!req.user) {
      // Should not happen if authenticate middleware is applied first
      return forbidden(res, 'Authentication required before role check.');
    }

    if (!roles.includes(req.user.role)) {
      return forbidden(
        res,
        `Access denied. Required role(s): [${roles.join(', ')}]. Your role: ${req.user.role}.`
      );
    }

    next();
  };
};

module.exports = { allowRoles, VALID_ROLES };
