'use strict';

/**
 * src/middleware/auth.js
 *
 * JWT Authentication Middleware.
 *
 * Flow:
 *   1. Extract `Bearer <token>` from the Authorization header
 *   2. Verify the token signature and expiry with jsonwebtoken
 *   3. Re-read the full user row from PostgreSQL using the `sub` claim
 *   4. Attach the sanitized user object to req.user
 *   5. Call next() — subsequent middleware / controllers can trust req.user
 *
 * Security guarantees:
 *   - Role is ALWAYS read from the database, not from the token payload alone.
 *     If a user's role were somehow changed in the DB, the token would still
 *     pass signature verification, but the real DB role would be enforced.
 *   - Deactivated accounts (is_active = false) are rejected even with a valid token.
 *   - The password_hash column is never selected in this query.
 *
 * req.user shape (after this middleware runs):
 *   {
 *     id:       string (UUID),
 *     fullName: string,
 *     email:    string,
 *     role:     'admin' | 'procurement_officer' | 'vendor' | 'manager',
 *     isActive: boolean
 *   }
 */

const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const env = require('../config/env');
const { unauthorized } = require('../utils/response');

/**
 * Middleware: Verify JWT and attach req.user.
 * All protected routes must include this middleware before roleGuard or the controller.
 */
const authenticate = async (req, res, next) => {
  try {
    // ── 1. Extract token ────────────────────────────────────────────────────
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No authentication token provided. Include: Authorization: Bearer <token>');
    }

    const token = authHeader.slice(7); // strip "Bearer "

    // ── 2. Verify signature + expiry ────────────────────────────────────────
    let payload;
    try {
      payload = jwt.verify(token, env.jwt.secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return unauthorized(res, 'Your session has expired. Please log in again.');
      }
      return unauthorized(res, 'Invalid authentication token.');
    }

    if (!payload.sub) {
      return unauthorized(res, 'Malformed token payload.');
    }

    // ── 3. Re-read user from DB ─────────────────────────────────────────────
    const result = await query(
      'SELECT id, full_name, email, role, is_active FROM users WHERE id = $1',
      [payload.sub]
    );

    if (result.rows.length === 0) {
      return unauthorized(res, 'User account no longer exists.');
    }

    const dbUser = result.rows[0];

    // ── 4. Check account status ─────────────────────────────────────────────
    if (!dbUser.is_active) {
      return unauthorized(res, 'Account has been deactivated. Contact your administrator.');
    }

    // ── 5. Attach camelCased user to request ────────────────────────────────
    req.user = {
      id:       dbUser.id,
      fullName: dbUser.full_name,
      email:    dbUser.email,
      role:     dbUser.role,      // ← always from DB
      isActive: dbUser.is_active,
    };

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { authenticate };
