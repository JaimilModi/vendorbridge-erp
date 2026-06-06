'use strict';

/**
 * src/modules/auth/auth.routes.js
 *
 * Public routes: /api/auth/signup, /api/auth/login
 * Protected route: /api/auth/me (requires valid JWT)
 *
 * All request bodies are validated with Zod before reaching the controller.
 * Validation failures return 400 with field-level error details.
 */

const { Router } = require('express');
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth');
const { validate, schemas } = require('../../middleware/validate');
const { VALID_ROLES } = require('../../middleware/roleGuard');
const controller = require('./auth.controller');

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Signup schema
 * - fullName: 2-100 chars, trimmed
 * - email: valid format, lowercased
 * - password: min 8, max 128 chars
 * - role: must be one of the 4 allowed roles (set once, never changed)
 */
const signupSchema = z.object({
  fullName: z
    .string({ required_error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  email: schemas.email,
  password: schemas.password,
  role: z.enum(VALID_ROLES, {
    errorMap: () => ({
      message: `Role must be one of: ${VALID_ROLES.join(', ')}`,
    }),
  }),
  companyName: z.string().trim().optional(),
  gstin: z.string().trim().optional(),
  category: z.string().trim().optional(),
  address: z.string().trim().optional(),
});

/**
 * Login schema
 * - email: valid format
 * - password: required (length checked by bcrypt, not us)
 */
const loginSchema = z.object({
  email: schemas.email,
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: schemas.email,
});

const verifyOtpSchema = z.object({
  email: schemas.email,
  otp: z.string().length(6, 'OTP must be exactly 6 characters'),
});

const resetPasswordSchema = z.object({
  email: schemas.email,
  otp: z.string().length(6, 'OTP must be exactly 6 characters'),
  newPassword: schemas.password,
});

// ─────────────────────────────────────────────────────────────────────────────
// Route Definitions
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/auth/signup — public
router.post('/signup', validate({ body: signupSchema }), controller.signup);

// POST /api/auth/login — public
router.post('/login', validate({ body: loginSchema }), controller.login);

// POST /api/auth/forgot-password — public
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), controller.forgotPassword);

// POST /api/auth/verify-otp — public
router.post('/verify-otp', validate({ body: verifyOtpSchema }), controller.verifyOtp);

// POST /api/auth/reset-password — public
router.post('/reset-password', validate({ body: resetPasswordSchema }), controller.resetPassword);

// GET /api/auth/me — requires valid JWT
router.get('/me', authenticate, controller.me);

module.exports = router;
