'use strict';

/**
 * src/modules/quotations/quotation.service.js
 *
 * All quotation business logic and SQL.
 *
 * State machine:
 *   draft → submitted → selected / rejected
 *
 * Rules enforced here:
 * - Only the owning vendor can create/update/submit their quotation
 * - Submission writes an activity log
 * - Selecting a quotation:
 *     1. Sets the selected quotation to 'selected'
 *     2. Sets all other quotations for the same RFQ to 'rejected'
 *     3. Updates the RFQ status to 'awarded'
 *     4. Writes an activity log
 * - Vendor can only read their own quotations
 * - Quote number is auto-generated via DB sequence
 */

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
const { generateNumber } = require('../../utils/generateNumber');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const fetchItems = async (quotationId) => {
  const result = await query(
    `SELECT id, quotation_id, rfq_item_id, unit_price, quantity, total_price
     FROM quotation_items WHERE quotation_id = $1 ORDER BY id`,
    [quotationId]
  );
  return rowsToCamel(result.rows);
};

/** Resolve vendor profile from the logged-in user. Throws if not found. */
const resolveVendorId = async (userId) => {
  const result = await query('SELECT id FROM vendors WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('Vendor profile not found for this user.', 404, 'VENDOR_PROFILE_NOT_FOUND');
  }
  return result.rows[0].id;
};

/** Get raw quotation row. Throws 404 if not found. */
const _getRaw = async (id) => {
  const result = await query('SELECT * FROM quotations WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('Quotation not found.', 404, 'QUOTATION_NOT_FOUND');
  return result.rows[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL (procurement team)
// ─────────────────────────────────────────────────────────────────────────────
const getAll = async ({ status, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = '';

  if (status) {
    params.push(status);
    where = `WHERE q.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM quotations q ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT q.*, v.company_name AS vendor_name, r.rfq_number, r.title AS rfq_title
     FROM quotations q
     JOIN vendors v ON v.id = q.vendor_id
     JOIN rfqs r ON r.id = q.rfq_id
     ${where}
     ORDER BY q.submitted_at DESC NULLS LAST, q.updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY RFQ ID — comparison view with all submitted quotations for an RFQ
// This is the primary endpoint for the Comparison Matrix page
// ─────────────────────────────────────────────────────────────────────────────
const getByRfqId = async (rfqId) => {
  // Verify RFQ exists
  const rfqResult = await query('SELECT id, rfq_number, title, status FROM rfqs WHERE id = $1', [rfqId]);
  if (rfqResult.rows.length === 0) throw new AppError('RFQ not found.', 404, 'RFQ_NOT_FOUND');

  const rfq = toCamel(rfqResult.rows[0]);

  // All quotations for this RFQ (any status visible to procurement)
  const quotesResult = await query(
    `SELECT
       q.id, q.quote_number, q.vendor_id, q.status, q.total_amount,
       q.validity_days, q.delivery_timeline, q.notes, q.submitted_at,
       v.company_name AS vendor_name, v.rating AS vendor_rating, v.status AS vendor_status
     FROM quotations q
     JOIN vendors v ON v.id = q.vendor_id
     WHERE q.rfq_id = $1
     ORDER BY q.total_amount ASC`,
    [rfqId]
  );

  const quotations = rowsToCamel(quotesResult.rows);

  // Attach items to each quotation
  for (const q of quotations) {
    q.items = await fetchItems(q.id);
  }

  // Mark the lowest amount
  if (quotations.length > 0) {
    const submittedQuotes = quotations.filter(q => q.status === 'submitted' || q.status === 'selected');
    if (submittedQuotes.length > 0) {
      const minAmount = Math.min(...submittedQuotes.map(q => parseFloat(q.totalAmount)));
      for (const q of quotations) {
        q.isLowestPrice = parseFloat(q.totalAmount) === minAmount && q.status !== 'rejected';
      }
    }
  }

  return { rfq, quotations };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET MY — vendor's own quotations only
// ─────────────────────────────────────────────────────────────────────────────
const getMy = async (user, { status, page = 1, limit = 20 }) => {
  const vendorId = await resolveVendorId(user.id);
  const offset = (page - 1) * limit;
  const params = [vendorId];
  let statusFilter = '';

  if (status) {
    params.push(status);
    statusFilter = `AND q.status = $${params.length}`;
  }

  const countResult = await query(
    `SELECT COUNT(*) FROM quotations q WHERE q.vendor_id = $1 ${statusFilter}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT q.*, r.rfq_number, r.title AS rfq_title, r.status AS rfq_status, r.deadline
     FROM quotations q
     JOIN rfqs r ON r.id = q.rfq_id
     WHERE q.vendor_id = $1 ${statusFilter}
     ORDER BY q.updated_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID — vendors can only see their own
// ─────────────────────────────────────────────────────────────────────────────
const getById = async (id, user) => {
  const raw = await _getRaw(id);

  if (user.role === 'vendor') {
    const vendorId = await resolveVendorId(user.id);
    if (raw.vendor_id !== vendorId) {
      throw new AppError('You do not have access to this quotation.', 403, 'FORBIDDEN');
    }
  }

  const result = await query(
    `SELECT q.*,
       v.company_name AS vendor_name, v.rating AS vendor_rating,
       r.rfq_number, r.title AS rfq_title, r.deadline
     FROM quotations q
     JOIN vendors v ON v.id = q.vendor_id
     JOIN rfqs r ON r.id = q.rfq_id
     WHERE q.id = $1`,
    [id]
  );

  const quotation = toCamel(result.rows[0]);
  quotation.items = await fetchItems(id);

  return quotation;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE DRAFT — vendor creates a quotation for an RFQ they're assigned to
// ─────────────────────────────────────────────────────────────────────────────
const create = async (body, user) => {
  const vendorId = await resolveVendorId(user.id);
  const { rfqId, totalAmount, validityDays = 30, deliveryTimeline, notes, items } = body;

  // Verify RFQ exists and vendor is assigned
  const rfqResult = await query(
    `SELECT r.id, r.status FROM rfqs r
     JOIN rfq_vendors rv ON rv.rfq_id = r.id
     WHERE r.id = $1 AND rv.vendor_id = $2`,
    [rfqId, vendorId]
  );

  if (rfqResult.rows.length === 0) {
    throw new AppError('RFQ not found or you are not assigned to it.', 403, 'NOT_ASSIGNED');
  }

  if (rfqResult.rows[0].status !== 'published') {
    throw new AppError('You can only submit quotations for published RFQs.', 422, 'RFQ_NOT_PUBLISHED');
  }

  // Check for duplicate (one quotation per vendor per RFQ)
  const existing = await query(
    'SELECT id FROM quotations WHERE rfq_id = $1 AND vendor_id = $2',
    [rfqId, vendorId]
  );
  if (existing.rows.length > 0) {
    throw new AppError(
      'You have already created a quotation for this RFQ. Use PUT to update it.',
      409,
      'QUOTATION_ALREADY_EXISTS'
    );
  }

  const quoteNumber = await generateNumber('quotation');

  const result = await query(
    `INSERT INTO quotations (quote_number, rfq_id, vendor_id, total_amount, validity_days, delivery_timeline, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [quoteNumber, rfqId, vendorId, totalAmount, validityDays, deliveryTimeline ?? null, notes ?? null]
  );

  const quotation = toCamel(result.rows[0]);

  for (const item of items) {
    await query(
      `INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, quantity, total_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [quotation.id, item.rfqItemId ?? null, item.unitPrice, item.quantity, item.totalPrice]
    );
  }

  quotation.items = await fetchItems(quotation.id);
  return quotation;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — only while draft, only by owner
// ─────────────────────────────────────────────────────────────────────────────
const update = async (id, body, user) => {
  const raw = await _getRaw(id);
  const vendorId = await resolveVendorId(user.id);

  if (raw.vendor_id !== vendorId) {
    throw new AppError('You do not own this quotation.', 403, 'FORBIDDEN');
  }
  if (raw.status !== 'draft') {
    throw new AppError('Only draft quotations can be edited.', 422, 'INVALID_STATE');
  }

  const { totalAmount, validityDays, deliveryTimeline, notes, items } = body;

  const result = await query(
    `UPDATE quotations SET
       total_amount      = COALESCE($1, total_amount),
       validity_days     = COALESCE($2, validity_days),
       delivery_timeline = COALESCE($3, delivery_timeline),
       notes             = COALESCE($4, notes),
       updated_at        = NOW()
     WHERE id = $5
     RETURNING *`,
    [totalAmount ?? null, validityDays ?? null, deliveryTimeline ?? null, notes ?? null, id]
  );

  if (items && items.length > 0) {
    await query('DELETE FROM quotation_items WHERE quotation_id = $1', [id]);
    for (const item of items) {
      await query(
        `INSERT INTO quotation_items (quotation_id, rfq_item_id, unit_price, quantity, total_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.rfqItemId ?? null, item.unitPrice, item.quantity, item.totalPrice]
      );
    }
  }

  const quotation = toCamel(result.rows[0]);
  quotation.items = await fetchItems(id);
  return quotation;
};

// ─────────────────────────────────────────────────────────────────────────────
// SUBMIT — draft → submitted
// ─────────────────────────────────────────────────────────────────────────────
const submit = async (id, user) => {
  const raw = await _getRaw(id);
  const vendorId = await resolveVendorId(user.id);

  if (raw.vendor_id !== vendorId) {
    throw new AppError('You do not own this quotation.', 403, 'FORBIDDEN');
  }
  if (raw.status !== 'draft') {
    throw new AppError('Only draft quotations can be submitted.', 422, 'INVALID_STATE');
  }

  const result = await query(
    `UPDATE quotations SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );

  const quotation = toCamel(result.rows[0]);

  await logActivity({
    userId: user.id,
    action: 'QUOTE_SUBMITTED',
    entityType: 'quotation',
    entityId: id,
    metadata: { quoteNumber: quotation.quoteNumber, rfqId: quotation.rfqId },
  });

  quotation.items = await fetchItems(id);
  return quotation;
};

// ─────────────────────────────────────────────────────────────────────────────
// SELECT WINNER — submitted → selected; others → rejected; RFQ → awarded
// ─────────────────────────────────────────────────────────────────────────────
const selectWinner = async (id, user) => {
  const raw = await _getRaw(id);

  if (raw.status !== 'submitted') {
    throw new AppError(
      'Only submitted quotations can be selected as winner.',
      422,
      'INVALID_STATE'
    );
  }

  // 1. Mark this quotation as selected
  const result = await query(
    `UPDATE quotations SET status = 'selected', updated_at = NOW()
     WHERE id = $1 RETURNING *`,
    [id]
  );
  const quotation = toCamel(result.rows[0]);

  // 2. Reject all other quotations for the same RFQ
  await query(
    `UPDATE quotations SET status = 'rejected', updated_at = NOW()
     WHERE rfq_id = $1 AND id != $2 AND status = 'submitted'`,
    [raw.rfq_id, id]
  );

  // 3. Update RFQ status to 'awarded'
  await query(
    `UPDATE rfqs SET status = 'awarded', updated_at = NOW() WHERE id = $1`,
    [raw.rfq_id]
  );

  await logActivity({
    userId: user.id,
    action: 'QUOTE_SELECTED',
    entityType: 'quotation',
    entityId: id,
    metadata: { quoteNumber: quotation.quoteNumber, rfqId: raw.rfq_id },
  });

  quotation.items = await fetchItems(id);
  return quotation;
};

module.exports = {
  getAll, getByRfqId, getMy, getById,
  create, update, submit, selectWinner,
};
