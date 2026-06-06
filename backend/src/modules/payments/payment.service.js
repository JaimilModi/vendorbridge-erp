'use strict';

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
const { generateNumber } = require('../../utils/generateNumber');

// ─────────────────────────────────────────────────────────────────────────────
// ENRICH PAYMENT
// ─────────────────────────────────────────────────────────────────────────────
const _enrichPayment = async (id) => {
  const result = await query(
    `SELECT
       p.*,
       v.company_name AS vendor_name,
       inv.invoice_number, inv.status AS invoice_status, inv.grand_total AS invoice_amount,
       po.po_number
     FROM payments p
     JOIN vendors v ON v.id = p.vendor_id
     JOIN invoices inv ON inv.id = p.invoice_id
     JOIN purchase_orders po ON po.id = inv.po_id
     WHERE p.id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new AppError('Payment not found.', 404, 'PAYMENT_NOT_FOUND');
  return toCamel(result.rows[0]);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────────────────────────────────────
const getAll = async ({ status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';

  if (status) {
    params.push(status);
    where = `WHERE p.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM payments p ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       p.id, p.payment_number, p.amount, p.payment_method, p.status, p.payment_date,
       v.company_name AS vendor_name,
       inv.invoice_number
     FROM payments p
     JOIN vendors v ON v.id = p.vendor_id
     JOIN invoices inv ON inv.id = p.invoice_id
     ${where}
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getMy = async (user, { status, page = 1, limit = 20 }) => {
  const vendorRes = await query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
  if (vendorRes.rows.length === 0) throw new AppError('Vendor not found.', 404);
  const vendorId = vendorRes.rows[0].id;

  const offset = (page - 1) * limit;
  const params = [vendorId];
  let statusFilter = '';

  if (status) {
    params.push(status);
    statusFilter = `AND p.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM payments p WHERE p.vendor_id = $1 ${statusFilter}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       p.id, p.payment_number, p.amount, p.payment_method, p.status, p.payment_date,
       inv.invoice_number
     FROM payments p
     JOIN invoices inv ON inv.id = p.invoice_id
     WHERE p.vendor_id = $1 ${statusFilter}
     ORDER BY p.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  return _enrichPayment(id);
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE PAYMENT (Admin/Procurement only)
// ─────────────────────────────────────────────────────────────────────────────
const create = async ({ invoiceId, amount, paymentMethod, notes }, user) => {
  // 1. Verify invoice exists and is 'approved' or 'pending'
  const invResult = await query('SELECT * FROM invoices WHERE id = $1', [invoiceId]);
  if (invResult.rows.length === 0) throw new AppError('Invoice not found.', 404);
  const invoice = invResult.rows[0];

  if (invoice.status === 'paid') {
    throw new AppError('Invoice is already paid.', 422, 'INVOICE_ALREADY_PAID');
  }

  const paymentNumber = await generateNumber('payment');

  const result = await query(
    `INSERT INTO payments (payment_number, invoice_id, vendor_id, amount, payment_method, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [paymentNumber, invoiceId, invoice.vendor_id, amount || invoice.grand_total, paymentMethod || 'bank_transfer', notes]
  );
  
  const payment = toCamel(result.rows[0]);

  await logActivity({
    userId: user.id,
    action: 'PAYMENT_INITIATED',
    entityType: 'payment',
    entityId: payment.id,
    metadata: { paymentNumber, invoiceId, amount: payment.amount }
  });

  return _enrichPayment(payment.id);
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STATUS (completed -> triggers receipt)
// ─────────────────────────────────────────────────────────────────────────────
const updateStatus = async (id, status, user) => {
  const result = await query(
    `UPDATE payments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );
  if (result.rows.length === 0) throw new AppError('Payment not found.', 404);
  
  const payment = toCamel(result.rows[0]);

  if (status === 'completed') {
    // Generate receipt
    const receiptService = require('../receipts/receipt.service');
    await receiptService.createFromPayment(payment.id, user);

    // Update invoice status to 'paid'
    await query(`UPDATE invoices SET status = 'paid' WHERE id = $1`, [payment.invoiceId]);
  }

  await logActivity({
    userId: user.id,
    action: 'PAYMENT_STATUS_UPDATED',
    entityType: 'payment',
    entityId: id,
    metadata: { status }
  });

  return _enrichPayment(id);
};

module.exports = { getAll, getMy, getById, create, updateStatus };
