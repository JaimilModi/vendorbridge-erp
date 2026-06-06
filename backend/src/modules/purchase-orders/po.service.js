'use strict';

/**
 * src/modules/purchase-orders/po.service.js
 *
 * PO GENERATION RULE (architecture-enforced):
 *
 *   createFromApproval() is the ONLY entry point for PO creation.
 *   It is called exclusively by approval.service.decide() when status = 'approved'.
 *   It is never exposed through a public API controller.
 *
 * Flow of createFromApproval():
 *   1. Load the approved quotation + its items
 *   2. Generate PO number via DB sequence
 *   3. Insert purchase_orders row linked to approval + quotation + vendor + rfq
 *   4. Copy quotation_items into po_items
 *   5. Return the full PO object (used by approval.service to include in response + activity log)
 */

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
const { generateNumber } = require('../../utils/generateNumber');

const TAX_RATE = 0.10; // 10%

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — fetch PO items
// ─────────────────────────────────────────────────────────────────────────────
const fetchItems = async (poId) => {
  const result = await query(
    `SELECT id, po_id, rfq_item_id, item_name, quantity, unit_price, total_price
     FROM po_items WHERE po_id = $1 ORDER BY id`,
    [poId]
  );
  return rowsToCamel(result.rows);
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — resolve vendor from user
// ─────────────────────────────────────────────────────────────────────────────
const resolveVendorId = async (userId) => {
  const r = await query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
  if (r.rows.length === 0) throw new AppError('Vendor profile not found.', 404);
  return r.rows[0].id;
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL — enrich a single PO with all related data
// ─────────────────────────────────────────────────────────────────────────────
const _enrichPO = async (poId) => {
  const result = await query(
    `SELECT
       po.*,
       v.company_name AS vendor_name, v.email AS vendor_email,
       v.phone AS vendor_phone, v.address AS vendor_address,
       v.gst_number AS vendor_gst,
       q.quote_number, q.total_amount AS quotation_amount,
       q.delivery_timeline, q.notes AS quotation_notes,
       r.rfq_number, r.title AS rfq_title, r.department,
       issuer.full_name AS issued_by_name
     FROM purchase_orders po
     JOIN vendors v    ON v.id  = po.vendor_id
     JOIN quotations q ON q.id  = po.quotation_id
     JOIN rfqs r       ON r.id  = po.rfq_id
     LEFT JOIN users issuer ON issuer.id = po.issued_by
     WHERE po.id = $1`,
    [poId]
  );
  if (result.rows.length === 0) throw new AppError('Purchase Order not found.', 404, 'PO_NOT_FOUND');

  const po = toCamel(result.rows[0]);
  po.items = await fetchItems(poId);

  // Compute tax and grand total for the response
  const totalAmount = parseFloat(po.totalAmount);
  po.taxAmount  = parseFloat((totalAmount * TAX_RATE).toFixed(2));
  po.grandTotal = parseFloat((totalAmount + po.taxAmount).toFixed(2));
  po.taxRate    = TAX_RATE;

  return po;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE FROM APPROVAL — called ONLY by approval.service.decide()
// ─────────────────────────────────────────────────────────────────────────────
const createFromApproval = async (approvalId, quotationId, user) => {
  // Load approved quotation with items
  const quotationResult = await query(
    'SELECT * FROM quotations WHERE id = $1',
    [quotationId]
  );
  if (quotationResult.rows.length === 0) throw new AppError('Quotation not found.', 404);
  const quotation = quotationResult.rows[0];

  const itemsResult = await query(
    'SELECT * FROM quotation_items WHERE quotation_id = $1',
    [quotationId]
  );
  const items = itemsResult.rows;

  // Generate PO number
  const poNumber = await generateNumber('po');

  // Insert PO header
  const poResult = await query(
    `INSERT INTO purchase_orders
       (po_number, approval_id, quotation_id, vendor_id, rfq_id, total_amount, issued_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [poNumber, approvalId, quotationId, quotation.vendor_id,
     quotation.rfq_id, quotation.total_amount, user.id]
  );

  const po = toCamel(poResult.rows[0]);

  // Copy quotation items into po_items (preserve item_name from rfq_items if available)
  for (const item of items) {
    let itemName = 'Item';
    if (item.rfq_item_id) {
      const rfqItemResult = await query('SELECT item_name FROM rfq_items WHERE id = $1', [item.rfq_item_id]);
      if (rfqItemResult.rows.length > 0) itemName = rfqItemResult.rows[0].item_name;
    }

    await query(
      `INSERT INTO po_items (po_id, rfq_item_id, item_name, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [po.id, item.rfq_item_id ?? null, itemName, item.quantity, item.unit_price, item.total_price]
    );
  }

  return _enrichPO(po.id);
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
    where = `WHERE po.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM purchase_orders po ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       po.id, po.po_number, po.status, po.total_amount, po.issued_at,
       v.company_name AS vendor_name,
       r.rfq_number, r.title AS rfq_title,
       q.quote_number
     FROM purchase_orders po
     JOIN vendors v    ON v.id  = po.vendor_id
     JOIN rfqs r       ON r.id  = po.rfq_id
     JOIN quotations q ON q.id  = po.quotation_id
     ${where}
     ORDER BY po.issued_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET FOR VENDOR — vendor sees only their own POs
// ─────────────────────────────────────────────────────────────────────────────
const getForVendor = async (user, { status, page = 1, limit = 20 }) => {
  const vendorId = await resolveVendorId(user.id);
  const offset = (page - 1) * limit;
  const params = [vendorId];
  let statusFilter = '';

  if (status) {
    params.push(status);
    statusFilter = `AND po.status = $${params.length}`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM purchase_orders po WHERE po.vendor_id = $1 ${statusFilter}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       po.id, po.po_number, po.status, po.total_amount, po.issued_at,
       r.rfq_number, r.title AS rfq_title, q.quote_number
     FROM purchase_orders po
     JOIN rfqs r       ON r.id  = po.rfq_id
     JOIN quotations q ON q.id  = po.quotation_id
     WHERE po.vendor_id = $1 ${statusFilter}
     ORDER BY po.issued_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID — vendor can only see their own PO
// ─────────────────────────────────────────────────────────────────────────────
const getById = async (id, user) => {
  const po = await _enrichPO(id);

  if (user.role === 'vendor') {
    const vendorId = await resolveVendorId(user.id);
    if (po.vendorId !== vendorId) {
      throw new AppError('You do not have access to this Purchase Order.', 403, 'FORBIDDEN');
    }
  }

  return po;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STATUS
// ─────────────────────────────────────────────────────────────────────────────
const updateStatus = async (id, status, user) => {
  const r = await query('SELECT id FROM purchase_orders WHERE id = $1', [id]);
  if (r.rows.length === 0) throw new AppError('Purchase Order not found.', 404, 'PO_NOT_FOUND');

  await query(
    `UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2`,
    [status, id]
  );

  await logActivity({
    userId: user.id,
    action: 'PO_STATUS_UPDATED',
    entityType: 'purchase_order',
    entityId: id,
    metadata: { status },
  });

  return _enrichPO(id);
};

module.exports = { getAll, getForVendor, getById, updateStatus, createFromApproval };
