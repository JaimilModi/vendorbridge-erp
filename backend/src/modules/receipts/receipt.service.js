'use strict';

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
const { generateNumber } = require('../../utils/generateNumber');

const _enrichReceipt = async (id) => {
  const result = await query(
    `SELECT
       r.*,
       p.payment_number, p.payment_method, p.payment_date,
       v.company_name AS vendor_name,
       inv.invoice_number
     FROM receipts r
     JOIN payments p ON p.id = r.payment_id
     JOIN vendors v ON v.id = r.vendor_id
     JOIN invoices inv ON inv.id = r.invoice_id
     WHERE r.id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new AppError('Receipt not found.', 404, 'RECEIPT_NOT_FOUND');
  return toCamel(result.rows[0]);
};

const getAll = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const countResult = await query(`SELECT COUNT(*) FROM receipts`);
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query(
    `SELECT
       r.id, r.receipt_number, r.amount_received, r.issued_at,
       p.payment_number, p.payment_method,
       v.company_name AS vendor_name,
       inv.invoice_number
     FROM receipts r
     JOIN payments p ON p.id = r.payment_id
     JOIN vendors v ON v.id = r.vendor_id
     JOIN invoices inv ON inv.id = r.invoice_id
     ORDER BY r.issued_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getMy = async (user, { page = 1, limit = 20 }) => {
  const vendorRes = await query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
  if (vendorRes.rows.length === 0) throw new AppError('Vendor not found.', 404);
  const vendorId = vendorRes.rows[0].id;

  const offset = (page - 1) * limit;

  const countResult = await query(`SELECT COUNT(*) FROM receipts WHERE vendor_id = $1`, [vendorId]);
  const total = parseInt(countResult.rows[0].count, 10);

  const result = await query(
    `SELECT
       r.id, r.receipt_number, r.amount_received, r.issued_at,
       p.payment_number, p.payment_method,
       inv.invoice_number
     FROM receipts r
     JOIN payments p ON p.id = r.payment_id
     JOIN invoices inv ON inv.id = r.invoice_id
     WHERE r.vendor_id = $1
     ORDER BY r.issued_at DESC
     LIMIT $2 OFFSET $3`,
    [vendorId, limit, offset]
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

const getById = async (id) => {
  return _enrichReceipt(id);
};

// Create from payment (called by payment service)
const createFromPayment = async (paymentId, user) => {
  const pResult = await query('SELECT * FROM payments WHERE id = $1', [paymentId]);
  if (pResult.rows.length === 0) throw new AppError('Payment not found.', 404);
  const payment = pResult.rows[0];

  const receiptNumber = await generateNumber('receipt');

  const result = await query(
    `INSERT INTO receipts (receipt_number, payment_id, invoice_id, vendor_id, amount_received)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [receiptNumber, paymentId, payment.invoice_id, payment.vendor_id, payment.amount]
  );
  
  const receipt = toCamel(result.rows[0]);

  await logActivity({
    userId: user.id,
    action: 'RECEIPT_GENERATED',
    entityType: 'receipt',
    entityId: receipt.id,
    metadata: { receiptNumber, paymentId, amountReceived: receipt.amountReceived }
  });

  return _enrichReceipt(receipt.id);
};

module.exports = { getAll, getMy, getById, createFromPayment };
