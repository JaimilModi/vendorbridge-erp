'use strict';

/**
 * src/modules/auth/auth.service.js
 *
 * All auth business logic:
 * - Password hashing with bcryptjs (cost 12)
 * - JWT signing (HS256, role stored in payload for convenience but ALWAYS re-read from DB)
 * - Role is accepted ONCE at signup, written to DB, and never changed via API
 * - On login, role is always read from the database row — client-provided role is ignored
 * - If role === 'vendor', a linked vendors row is auto-created with status 'pending'
 * - password_hash is NEVER returned in any response
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../config/db');
const env = require('../../config/env');
const { AppError } = require('../../utils/AppError');
const { logActivity } = require('../../utils/activityLogger');
const { toCamel } = require('../../utils/camelCase');

const BCRYPT_ROUNDS = 12;

/**
 * Sign a JWT for the given user.
 * Payload contains only sub (user id) and role.
 * The role in the token is for convenience only — auth middleware always re-reads from DB.
 */
const signToken = (user) =>
  jwt.sign(
    { sub: user.id, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

/**
 * Build a safe public user object — strips password_hash, adds vendorId if applicable.
 *
 * @param {Object} dbUser - Raw row from users table
 * @param {string|null} vendorId - UUID from vendors table if role === 'vendor'
 */
const buildPublicUser = (dbUser, vendorId = null) => {
  const base = {
    id: dbUser.id,
    full_name: dbUser.full_name,
    email: dbUser.email,
    role: dbUser.role,
    is_active: dbUser.is_active,
    created_at: dbUser.created_at,
  };
  if (vendorId) base.vendor_id = vendorId;
  return toCamel(base);
};

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Register a new user.
 *
 * Rules:
 * 1. Email must be unique (case-insensitive)
 * 2. Password is hashed with bcrypt before storage
 * 3. Role is written once and cannot be changed via API afterwards
 * 4. If role === 'vendor', a vendors profile row is created with status 'pending'
 * 5. Returns JWT + public user object (no password_hash)
 */
const signup = async ({ fullName, email, password, role }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check for duplicate email
  const existing = await query(
    'SELECT id FROM users WHERE email = $1',
    [normalizedEmail]
  );
  if (existing.rows.length > 0) {
    throw new AppError('An account with this email already exists.', 409, 'DUPLICATE_EMAIL');
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // 3. Insert user — role is set here and ONLY here
  const userResult = await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role, is_active, created_at`,
    [fullName.trim(), normalizedEmail, passwordHash, role]
  );
  const dbUser = userResult.rows[0];

  // 4. If vendor role, auto-create linked vendor profile
  let vendorId = null;
  if (role === 'vendor') {
    const vendorResult = await query(
      `INSERT INTO vendors (user_id, company_name, contact_name, email, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [dbUser.id, fullName.trim(), fullName.trim(), normalizedEmail]
    );
    vendorId = vendorResult.rows[0].id;
  }

  // 5. Write activity log (non-blocking — failure does not roll back signup)
  await logActivity({
    userId: dbUser.id,
    action: 'USER_REGISTERED',
    entityType: 'user',
    entityId: dbUser.id,
    metadata: { role, email: normalizedEmail },
  });

  const user = buildPublicUser(dbUser, vendorId);
  const token = signToken(user);

  return { token, user };
};

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Authenticate a user with email + password.
 *
 * Rules:
 * 1. Email lookup is case-insensitive
 * 2. Generic error message to prevent user enumeration
 * 3. Role is read from the DB row — client cannot influence role
 * 4. password_hash is compared but never returned
 * 5. Deactivated accounts are rejected
 * 6. If role === 'vendor', includes vendorId in the response
 */
const login = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find user by email
  const userResult = await query(
    `SELECT id, full_name, email, password_hash, role, is_active, created_at
     FROM users WHERE email = $1`,
    [normalizedEmail]
  );

  // 2. Generic error — do not reveal whether email exists
  if (userResult.rows.length === 0) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const dbUser = userResult.rows[0];

  // 3. Check account is active
  if (!dbUser.is_active) {
    throw new AppError(
      'Your account has been deactivated. Please contact your administrator.',
      401,
      'ACCOUNT_INACTIVE'
    );
  }

  // 4. Compare password
  const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  // 5. If vendor — fetch their vendor profile ID
  let vendorId = null;
  if (dbUser.role === 'vendor') {
    const vendorResult = await query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [dbUser.id]
    );
    if (vendorResult.rows.length > 0) {
      vendorId = vendorResult.rows[0].id;
    }
  }

  const user = buildPublicUser(dbUser, vendorId);
  const token = signToken(user);

  return { token, user };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET CURRENT USER  (called by auth middleware after token verification)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Return the full current user profile from the database,
 * enriched with vendorId if applicable.
 *
 * @param {string} userId
 */
const getCurrentUser = async (userId) => {
  const result = await query(
    `SELECT id, full_name, email, role, is_active, created_at
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  const dbUser = result.rows[0];

  let vendorId = null;
  if (dbUser.role === 'vendor') {
    const vendorResult = await query(
      'SELECT id, company_name, status FROM vendors WHERE user_id = $1',
      [dbUser.id]
    );
    if (vendorResult.rows.length > 0) {
      vendorId = vendorResult.rows[0].id;
    }
  }

  return buildPublicUser(dbUser, vendorId);
};

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const userResult = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
  
  if (userResult.rows.length === 0) {
    throw new AppError('No account found with this email address. Please check your email.', 404, 'USER_NOT_FOUND');
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Upsert into password_resets
  await query(
    `INSERT INTO password_resets (email, otp, expires_at)
     VALUES ($1, $2, NOW() + INTERVAL '120 seconds')
     ON CONFLICT (email) DO UPDATE SET otp = $2, expires_at = NOW() + INTERVAL '120 seconds'`,
    [normalizedEmail, otp]
  );

  console.log(`\n========================================`);
  console.log(`🔑 PASSWORD RESET OTP for ${normalizedEmail}: ${otp}`);
  console.log(`========================================\n`);
};

const verifyOtp = async ({ email, otp }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const result = await query(
    'SELECT otp, expires_at FROM password_resets WHERE email = $1',
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new AppError('Invalid or expired OTP.', 400, 'INVALID_OTP');
  }

  const record = result.rows[0];
  if (record.otp !== otp || new Date() > new Date(record.expires_at)) {
    throw new AppError('Invalid or expired OTP.', 400, 'INVALID_OTP');
  }

  return true;
};

const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.toLowerCase().trim();
  
  // Re-verify OTP
  await verifyOtp({ email: normalizedEmail, otp });

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password in DB
  await query(
    'UPDATE users SET password_hash = $1 WHERE email = $2',
    [passwordHash, normalizedEmail]
  );

  // Delete OTP record
  await query('DELETE FROM password_resets WHERE email = $1', [normalizedEmail]);
};

module.exports = { signup, login, getCurrentUser, forgotPassword, verifyOtp, resetPassword };
