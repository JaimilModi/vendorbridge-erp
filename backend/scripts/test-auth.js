#!/usr/bin/env node
'use strict';

/**
 * scripts/test-auth.js
 *
 * Quick integration test for the VendorBridge Auth API.
 * Uses only Node.js built-ins — no extra test libraries needed.
 *
 * Run: node scripts/test-auth.js
 *
 * Requires the server to be running on PORT 5000:
 *   npm run dev
 */

const http = require('http');

const BASE = 'http://localhost:5000';
let PASS = 0;
let FAIL = 0;

// ─────────────────────────────────────────────────────────────────────────────
// HTTP helper
// ─────────────────────────────────────────────────────────────────────────────
function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Content-Type': 'application/json' };
    if (payload) headers['Content-Length'] = Buffer.byteLength(payload);
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    const url = new URL(path, BASE);
    options.hostname = url.hostname;
    options.port = url.port;
    options.path = url.pathname + url.search;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${label}`);
    PASS++;
  } else {
    console.log(`  ❌ FAIL: ${label}${detail ? ' — ' + detail : ''}`);
    FAIL++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n🧪 VendorBridge Auth API Integration Tests\n');
  const ts = Date.now();

  // ── Health check ──────────────────────────────────────────────────────────
  console.log('▶ Health Check');
  const health = await request('GET', '/api/health');
  assert('GET /api/health returns 200', health.status === 200);
  assert('Health response success=true', health.body.success === true);

  // ── Signup: Admin ─────────────────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/signup — Admin');
  const adminEmail = `admin.${ts}@test.com`;
  const adminSignup = await request('POST', '/api/auth/signup', {
    fullName: 'Test Admin',
    email: adminEmail,
    password: 'Admin1234!',
    role: 'admin',
  });
  assert('Admin signup returns 201', adminSignup.status === 201);
  assert('Admin signup has token', typeof adminSignup.body.data?.token === 'string');
  assert('Admin user has correct role', adminSignup.body.data?.user?.role === 'admin');
  assert('No password_hash in response', !JSON.stringify(adminSignup.body).includes('password_hash'));
  const adminToken = adminSignup.body.data?.token;

  // ── Signup: Vendor (auto-creates vendor profile) ──────────────────────────
  console.log('\n▶ POST /api/auth/signup — Vendor (auto vendor profile)');
  const vendorEmail = `vendor.${ts}@test.com`;
  const vendorSignup = await request('POST', '/api/auth/signup', {
    fullName: 'Test Vendor Co',
    email: vendorEmail,
    password: 'Vendor1234!',
    role: 'vendor',
  });
  assert('Vendor signup returns 201', vendorSignup.status === 201);
  assert('Vendor user has correct role', vendorSignup.body.data?.user?.role === 'vendor');
  const vendorToken = vendorSignup.body.data?.token;

  // ── Signup: Duplicate email ───────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/signup — Duplicate email rejection');
  const dupSignup = await request('POST', '/api/auth/signup', {
    fullName: 'Duplicate User',
    email: adminEmail,
    password: 'Admin1234!',
    role: 'admin',
  });
  assert('Duplicate email returns 409', dupSignup.status === 409);
  assert('Duplicate email code = DUPLICATE_EMAIL', dupSignup.body.code === 'DUPLICATE_EMAIL');

  // ── Signup: Invalid role ──────────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/signup — Invalid role rejection');
  const badRole = await request('POST', '/api/auth/signup', {
    fullName: 'Bad Role User',
    email: `badrole.${ts}@test.com`,
    password: 'Password1234!',
    role: 'superuser',
  });
  assert('Invalid role returns 400', badRole.status === 400);
  assert('Invalid role code = VALIDATION_ERROR', badRole.body.code === 'VALIDATION_ERROR');

  // ── Signup: Weak password ─────────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/signup — Weak password rejection');
  const weakPwd = await request('POST', '/api/auth/signup', {
    fullName: 'Weak Password User',
    email: `weakpwd.${ts}@test.com`,
    password: '123',
    role: 'vendor',
  });
  assert('Weak password returns 400', weakPwd.status === 400);

  // ── Login: Valid credentials ──────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/login — Valid credentials');
  const loginRes = await request('POST', '/api/auth/login', {
    email: adminEmail,
    password: 'Admin1234!',
  });
  assert('Login returns 200', loginRes.status === 200);
  assert('Login has token', typeof loginRes.body.data?.token === 'string');
  assert('Login user role from DB = admin', loginRes.body.data?.user?.role === 'admin');
  assert('No password_hash in login response', !JSON.stringify(loginRes.body).includes('password_hash'));

  // ── Login: Wrong password ─────────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/login — Wrong password');
  const badLogin = await request('POST', '/api/auth/login', {
    email: adminEmail,
    password: 'WrongPassword!',
  });
  assert('Wrong password returns 401', badLogin.status === 401);
  assert('Wrong password code = INVALID_CREDENTIALS', badLogin.body.code === 'INVALID_CREDENTIALS');

  // ── Login: Non-existent email ─────────────────────────────────────────────
  console.log('\n▶ POST /api/auth/login — Non-existent email');
  const notFoundLogin = await request('POST', '/api/auth/login', {
    email: `nobody.${ts}@nowhere.com`,
    password: 'Password1234!',
  });
  assert('Unknown email returns 401 (no enumeration)', notFoundLogin.status === 401);

  // ── GET /api/auth/me — valid token ────────────────────────────────────────
  console.log('\n▶ GET /api/auth/me — authenticated');
  const meRes = await request('GET', '/api/auth/me', null, adminToken);
  assert('GET /me returns 200', meRes.status === 200);
  assert('GET /me returns user object', meRes.body.data?.user?.email === adminEmail);

  // ── GET /api/auth/me — no token ───────────────────────────────────────────
  console.log('\n▶ GET /api/auth/me — no token');
  const meNoToken = await request('GET', '/api/auth/me');
  assert('GET /me without token returns 401', meNoToken.status === 401);

  // ── GET /api/auth/me — invalid token ─────────────────────────────────────
  console.log('\n▶ GET /api/auth/me — invalid token');
  const meBadToken = await request('GET', '/api/auth/me', null, 'Bearer notavalidtoken');
  assert('GET /me with invalid token returns 401', meBadToken.status === 401);

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${PASS} passed, ${FAIL} failed`);
  console.log(FAIL === 0 ? '\n🎉 All tests passed!\n' : '\n⚠️  Some tests failed. Check server logs.\n');
}

run().catch((err) => {
  console.error('\n[test-auth] Could not connect to server. Is it running?\n', err.message);
  process.exit(1);
});
