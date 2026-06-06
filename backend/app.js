'use strict';

/**
 * app.js
 *
 * Express application configuration.
 * - Loads middleware (cors, json, security)
 * - Registers all API routes
 * - Registers the global error handler (must be last)
 *
 * This file exports the app so server.js can bind it to a port,
 * and it can also be imported by test runners without starting the server.
 */

const express = require('express');
const cors = require('cors');
const env = require('./src/config/env');
const { errorHandler } = require('./src/middleware/errorHandler');

// ─────────────────────────────────────────────────────────────────────────────
// Route imports
// ─────────────────────────────────────────────────────────────────────────────
const authRoutes = require('./src/modules/auth/auth.routes');
const vendorRoutes = require('./src/modules/vendors/vendor.routes');
const rfqRoutes = require('./src/modules/rfqs/rfq.routes');
const quotationRoutes = require('./src/modules/quotations/quotation.routes');
const approvalRoutes = require('./src/modules/approvals/approval.routes');
const poRoutes = require('./src/modules/purchase-orders/po.routes');
const invoiceRoutes = require('./src/modules/invoices/invoice.routes');
const activityLogRoutes = require('./src/modules/activity-logs/activityLog.routes');
const reportsRoutes = require('./src/modules/reports/reports.routes');
const userRoutes = require('./src/modules/users/user.routes');
const paymentRoutes = require('./src/modules/payments/payment.routes');
const receiptRoutes = require('./src/modules/receipts/receipt.routes');

// ─────────────────────────────────────────────────────────────────────────────
// App initialization
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────────────────────
// Security & parsing middleware
// ─────────────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: env.cors.origin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// Health check (unauthenticated)
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'VendorBridge API is running.',
    version: '1.0.0',
    env: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/purchase-orders', poRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/receipts', receiptRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// 404 handler — catch-all for unmatched routes
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Global error handler — MUST be registered last
// ─────────────────────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
