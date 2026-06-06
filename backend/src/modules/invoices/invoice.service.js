'use strict';

/**
 * src/modules/invoices/invoice.service.js
 *
 * Invoice generation rules:
 *   1. Vendor calls POST /api/invoices with { poId, items }
 *   2. Service verifies:
 *       - PO exists and belongs to that vendor
 *       - PO status is 'issued' (not cancelled, not already invoiced)
 *       - No invoice already exists for this PO (UNIQUE on invoices.po_id)
 *   3. Tax is calculated at TAX_RATE (10%) — consistent system-wide
 *   4. grand_total = total_amount + tax_amount (stored in DB)
 *   5. INVOICE_SUBMITTED activity log is written
 *
 * Status transitions:
 *   pending → approved → paid
 *   pending → rejected
 */

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
const { generateNumber } = require('../../utils/generateNumber');

const TAX_RATE = 0.10; // 10% — matches PO service and frontend display

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const resolveVendorId = async (userId) => {
  const r = await query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
  if (r.rows.length === 0) throw new AppError('Vendor profile not found.', 404);
  return r.rows[0].id;
};

const fetchItems = async (invoiceId) => {
  const result = await query(
    `SELECT id, invoice_id, po_item_id, description, quantity, unit_price, total_price
     FROM invoice_items WHERE invoice_id = $1 ORDER BY id`,
    [invoiceId]
  );
  return rowsToCamel(result.rows);
};

const _enrichInvoice = async (invoiceId) => {
  const result = await query(
    `SELECT
       inv.*,
       v.company_name AS vendor_name, v.email AS vendor_email,
       v.phone AS vendor_phone, v.address AS vendor_address,
       v.gst_number AS vendor_gst,
       po.po_number, po.status AS po_status,
       r.rfq_number, r.title AS rfq_title
     FROM invoices inv
     JOIN vendors v ON v.id = inv.vendor_id
     JOIN purchase_orders po ON po.id = inv.po_id
     JOIN rfqs r ON r.id = po.rfq_id
     WHERE inv.id = $1`,
    [invoiceId]
  );
  if (result.rows.length === 0) throw new AppError('Invoice not found.', 404, 'INVOICE_NOT_FOUND');

  const invoice = toCamel(result.rows[0]);
  invoice.items = await fetchItems(invoiceId);
  invoice.taxRate = TAX_RATE;

  return invoice;
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
    where = `WHERE inv.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM invoices inv ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       inv.id, inv.invoice_number, inv.status,
       inv.total_amount, inv.tax_amount, inv.grand_total, inv.submitted_at, inv.due_date,
       v.company_name AS vendor_name,
       po.po_number
     FROM invoices inv
     JOIN vendors v ON v.id = inv.vendor_id
     JOIN purchase_orders po ON po.id = inv.po_id
     ${where}
     ORDER BY inv.submitted_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY — vendor's own invoices
// ─────────────────────────────────────────────────────────────────────────────
const getMy = async (user, { status, page = 1, limit = 20 }) => {
  const vendorId = await resolveVendorId(user.id);
  const offset = (page - 1) * limit;
  const params = [vendorId];
  let statusFilter = '';

  if (status) {
    params.push(status);
    statusFilter = `AND inv.status = $${params.length}`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM invoices inv WHERE inv.vendor_id = $1 ${statusFilter}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       inv.id, inv.invoice_number, inv.status,
       inv.total_amount, inv.tax_amount, inv.grand_total, inv.submitted_at, inv.due_date,
       po.po_number, r.rfq_number, r.title AS rfq_title
     FROM invoices inv
     JOIN purchase_orders po ON po.id = inv.po_id
     JOIN rfqs r ON r.id = po.rfq_id
     WHERE inv.vendor_id = $1 ${statusFilter}
     ORDER BY inv.submitted_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID — vendor can only see own invoices
// ─────────────────────────────────────────────────────────────────────────────
const getById = async (id, user) => {
  const invoice = await _enrichInvoice(id);

  if (user.role === 'vendor') {
    const vendorId = await resolveVendorId(user.id);
    if (invoice.vendorId !== vendorId) {
      throw new AppError('You do not have access to this invoice.', 403, 'FORBIDDEN');
    }
  }

  return invoice;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — vendor generates invoice from an issued PO
// ─────────────────────────────────────────────────────────────────────────────
const create = async ({ poId, dueDate, items }, user) => {
  const vendorId = await resolveVendorId(user.id);

  // 1. Verify PO exists, belongs to this vendor, and is 'issued'
  const poResult = await query(
    'SELECT id, status, vendor_id, total_amount FROM purchase_orders WHERE id = $1',
    [poId]
  );
  if (poResult.rows.length === 0) throw new AppError('Purchase Order not found.', 404);

  const po = poResult.rows[0];
  if (po.vendor_id !== vendorId) {
    throw new AppError('This Purchase Order does not belong to your vendor profile.', 403, 'FORBIDDEN');
  }
  if (po.status !== 'issued') {
    throw new AppError(
      `Invoice can only be generated for POs with status "issued". Current: "${po.status}".`,
      422,
      'PO_NOT_ISSUED'
    );
  }

  // 2. Verify no existing invoice for this PO
  const existingInvoice = await query('SELECT id FROM invoices WHERE po_id = $1', [poId]);
  if (existingInvoice.rows.length > 0) {
    throw new AppError('An invoice has already been generated for this Purchase Order.', 409, 'INVOICE_ALREADY_EXISTS');
  }

  // 3. Calculate totals — server-side, never trust client amounts
  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxAmount   = parseFloat((totalAmount * TAX_RATE).toFixed(2));
  const grandTotal  = parseFloat((totalAmount + taxAmount).toFixed(2));

  // 4. Generate invoice number
  const invoiceNumber = await generateNumber('invoice');

  // 5. Insert invoice header
  const invoiceResult = await query(
    `INSERT INTO invoices
       (invoice_number, po_id, vendor_id, total_amount, tax_amount, grand_total, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [invoiceNumber, poId, vendorId, totalAmount, taxAmount, grandTotal, dueDate ?? null]
  );
  const invoice = toCamel(invoiceResult.rows[0]);

  // 6. Insert invoice items
  for (const item of items) {
    await query(
      `INSERT INTO invoice_items (invoice_id, po_item_id, description, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [invoice.id, item.poItemId ?? null, item.description, item.quantity, item.unitPrice, item.totalPrice]
    );
  }

  // 7. Activity log
  await logActivity({
    userId: user.id,
    action: 'INVOICE_SUBMITTED',
    entityType: 'invoice',
    entityId: invoice.id,
    metadata: { invoiceNumber, poId, totalAmount, grandTotal },
  });

  return _enrichInvoice(invoice.id);
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STATUS — pending → approved / rejected / paid
// ─────────────────────────────────────────────────────────────────────────────
const updateStatus = async (id, { status, notes }, user) => {
  const r = await query('SELECT id, status FROM invoices WHERE id = $1', [id]);
  if (r.rows.length === 0) throw new AppError('Invoice not found.', 404, 'INVOICE_NOT_FOUND');

  const current = r.rows[0].status;

  // State machine guards
  const VALID_TRANSITIONS = {
    pending:  ['approved', 'rejected'],
    approved: ['paid'],
    rejected: [],
    paid:     [],
  };

  if (!VALID_TRANSITIONS[current].includes(status)) {
    throw new AppError(
      `Cannot transition invoice from "${current}" to "${status}".`,
      422,
      'INVALID_STATE_TRANSITION'
    );
  }

  await query(
    `UPDATE invoices
     SET status = $1, processed_at = NOW()
     WHERE id = $2`,
    [status, id]
  );

  const ACTION_MAP = {
    approved: 'INVOICE_APPROVED',
    rejected: 'INVOICE_REJECTED',
    paid:     'INVOICE_PAID',
  };

  await logActivity({
    userId: user.id,
    action: ACTION_MAP[status],
    entityType: 'invoice',
    entityId: id,
    metadata: { status, notes: notes ?? null },
  });

  return _enrichInvoice(id);
};

module.exports = { getAll, getMy, getById, create, updateStatus };
