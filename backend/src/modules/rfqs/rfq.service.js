'use strict';

/**
 * src/modules/rfqs/rfq.service.js
 *
 * All RFQ business logic and SQL.
 *
 * State machine:
 *   draft → published → closed / awarded
 *
 * Rules enforced here (not in controllers):
 * - Only draft RFQs can be edited or deleted
 * - Publishing writes an activity log
 * - Vendor access restricted to assigned RFQs via rfq_vendors
 * - RFQ number auto-generated via PostgreSQL sequence
 */

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
const { generateNumber } = require('../../utils/generateNumber');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch items for one or many RFQs */
const fetchItems = async (rfqId) => {
  const result = await query(
    `SELECT id, rfq_id, item_name, quantity, unit, estimated_price
     FROM rfq_items WHERE rfq_id = $1 ORDER BY id`,
    [rfqId]
  );
  return rowsToCamel(result.rows);
};

/** Fetch invited vendors for an RFQ */
const fetchInvitedVendors = async (rfqId) => {
  const result = await query(
    `SELECT v.id, v.company_name, v.status, rv.invited_at
     FROM rfq_vendors rv
     JOIN vendors v ON v.id = rv.vendor_id
     WHERE rv.rfq_id = $1`,
    [rfqId]
  );
  return rowsToCamel(result.rows);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────────────────────────────────────
const getAll = async ({ status, search, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(r.title ILIKE $${params.length} OR r.rfq_number ILIKE $${params.length})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) FROM rfqs r ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const dataResult = await query(
    `SELECT r.*, u.full_name AS creator_name
     FROM rfqs r
     LEFT JOIN users u ON u.id = r.created_by
     ${where}
     ORDER BY r.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(dataResult.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET FOR VENDOR — only RFQs that vendor was explicitly assigned to
// ─────────────────────────────────────────────────────────────────────────────
const getForVendor = async (user) => {
  // Resolve vendor profile from user
  const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
  if (vendorResult.rows.length === 0) {
    throw new AppError('Vendor profile not found for this user.', 404, 'VENDOR_PROFILE_NOT_FOUND');
  }
  const vendorId = vendorResult.rows[0].id;

  const result = await query(
    `SELECT r.id, r.rfq_number, r.title, r.department, r.status, r.deadline, rv.invited_at
     FROM rfqs r
     JOIN rfq_vendors rv ON rv.rfq_id = r.id
     WHERE rv.vendor_id = $1 AND r.status IN ('published', 'closed', 'awarded')
     ORDER BY r.created_at DESC`,
    [vendorId]
  );

  return { data: rowsToCamel(result.rows) };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID — with items and invited vendors
// Vendors can only access RFQs they're assigned to
// ─────────────────────────────────────────────────────────────────────────────
const getById = async (id, user) => {
  const result = await query(
    `SELECT r.*, u.full_name AS creator_name
     FROM rfqs r
     LEFT JOIN users u ON u.id = r.created_by
     WHERE r.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('RFQ not found.', 404, 'RFQ_NOT_FOUND');
  }

  const rfq = toCamel(result.rows[0]);

  // Vendors: enforce assignment check
  if (user.role === 'vendor') {
    const vendorResult = await query('SELECT id FROM vendors WHERE user_id = $1', [user.id]);
    if (vendorResult.rows.length === 0) throw new AppError('Vendor profile not found.', 404);

    const vendorId = vendorResult.rows[0].id;
    const assigned = await query(
      'SELECT 1 FROM rfq_vendors WHERE rfq_id = $1 AND vendor_id = $2',
      [id, vendorId]
    );
    if (assigned.rows.length === 0) {
      throw new AppError('You are not assigned to this RFQ.', 403, 'NOT_ASSIGNED');
    }
  }

  rfq.items = await fetchItems(id);
  rfq.invitedVendors = await fetchInvitedVendors(id);

  return rfq;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE RFQ (draft or published)
// ─────────────────────────────────────────────────────────────────────────────
const create = async (body, user) => {
  const { title, description, department, deadline, budgetLimit, status = 'draft', items, vendorIds } = body;

  const rfqNumber = await generateNumber('rfq');

  // Insert RFQ header
  const rfqResult = await query(
    `INSERT INTO rfqs (rfq_number, title, description, department, status, deadline, budget_limit, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [rfqNumber, title, description ?? null, department ?? null,
     status, deadline ?? null, budgetLimit ?? null, user.id]
  );
  const rfq = toCamel(rfqResult.rows[0]);

  // Insert items
  for (const item of items) {
    await query(
      `INSERT INTO rfq_items (rfq_id, item_name, quantity, unit, estimated_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [rfq.id, item.itemName, item.quantity, item.unit ?? 'pcs', item.estimatedPrice ?? null]
    );
  }

  // Assign vendors if provided
  if (vendorIds && vendorIds.length > 0) {
    await _assignVendors(rfq.id, vendorIds);
  }

  // If immediately publishing, log it
  if (status === 'published') {
    await logActivity({
      userId: user.id,
      action: 'RFQ_PUBLISHED',
      entityType: 'rfq',
      entityId: rfq.id,
      metadata: { rfqNumber, title },
    });
  } else {
    await logActivity({
      userId: user.id,
      action: 'RFQ_CREATED',
      entityType: 'rfq',
      entityId: rfq.id,
      metadata: { rfqNumber, title, status },
    });
  }

  rfq.items = await fetchItems(rfq.id);
  rfq.invitedVendors = await fetchInvitedVendors(rfq.id);

  return rfq;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE — only allowed while draft
// ─────────────────────────────────────────────────────────────────────────────
const update = async (id, body, user) => {
  const existing = await _getRaw(id);

  if (existing.status !== 'draft') {
    throw new AppError(
      `RFQ cannot be edited in "${existing.status}" status. Only draft RFQs can be modified.`,
      422,
      'INVALID_STATE'
    );
  }

  const { title, description, department, deadline, budgetLimit, items } = body;

  const result = await query(
    `UPDATE rfqs SET
       title        = COALESCE($1, title),
       description  = COALESCE($2, description),
       department   = COALESCE($3, department),
       deadline     = COALESCE($4, deadline),
       budget_limit = COALESCE($5, budget_limit),
       updated_at   = NOW()
     WHERE id = $6
     RETURNING *`,
    [title ?? null, description ?? null, department ?? null,
     deadline ?? null, budgetLimit ?? null, id]
  );

  const rfq = toCamel(result.rows[0]);

  // Replace items if provided
  if (items && items.length > 0) {
    await query('DELETE FROM rfq_items WHERE rfq_id = $1', [id]);
    for (const item of items) {
      await query(
        `INSERT INTO rfq_items (rfq_id, item_name, quantity, unit, estimated_price)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, item.itemName, item.quantity, item.unit ?? 'pcs', item.estimatedPrice ?? null]
      );
    }
  }

  rfq.items = await fetchItems(id);
  rfq.invitedVendors = await fetchInvitedVendors(id);

  return rfq;
};

// ─────────────────────────────────────────────────────────────────────────────
// PUBLISH — draft → published, must have at least one invited vendor
// ─────────────────────────────────────────────────────────────────────────────
const publish = async (id, user) => {
  const existing = await _getRaw(id);

  if (existing.status !== 'draft') {
    throw new AppError(
      `Only draft RFQs can be published. Current status: "${existing.status}".`,
      422,
      'INVALID_STATE'
    );
  }

  const vendorCheck = await query('SELECT COUNT(*) FROM rfq_vendors WHERE rfq_id = $1', [id]);
  if (parseInt(vendorCheck.rows[0].count, 10) === 0) {
    throw new AppError(
      'At least one vendor must be assigned before publishing the RFQ.',
      422,
      'NO_VENDORS_ASSIGNED'
    );
  }

  const result = await query(
    `UPDATE rfqs SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  const rfq = toCamel(result.rows[0]);

  await logActivity({
    userId: user.id,
    action: 'RFQ_PUBLISHED',
    entityType: 'rfq',
    entityId: id,
    metadata: { rfqNumber: rfq.rfqNumber, title: rfq.title },
  });

  rfq.items = await fetchItems(id);
  rfq.invitedVendors = await fetchInvitedVendors(id);

  return rfq;
};

// ─────────────────────────────────────────────────────────────────────────────
// CLOSE — published → closed
// ─────────────────────────────────────────────────────────────────────────────
const close = async (id, user) => {
  const existing = await _getRaw(id);

  if (existing.status !== 'published') {
    throw new AppError(
      `Only published RFQs can be closed. Current status: "${existing.status}".`,
      422,
      'INVALID_STATE'
    );
  }

  const result = await query(
    `UPDATE rfqs SET status = 'closed', updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );

  await logActivity({
    userId: user.id,
    action: 'RFQ_CLOSED',
    entityType: 'rfq',
    entityId: id,
  });

  return toCamel(result.rows[0]);
};

// ─────────────────────────────────────────────────────────────────────────────
// ASSIGN VENDORS (idempotent — skips already-invited vendors)
// ─────────────────────────────────────────────────────────────────────────────
const assignVendors = async (id, vendorIds, user) => {
  const existing = await _getRaw(id);

  if (existing.status === 'closed' || existing.status === 'awarded') {
    throw new AppError('Cannot assign vendors to a closed or awarded RFQ.', 422, 'INVALID_STATE');
  }

  await _assignVendors(id, vendorIds);

  await logActivity({
    userId: user.id,
    action: 'RFQ_VENDORS_ASSIGNED',
    entityType: 'rfq',
    entityId: id,
    metadata: { vendorIds },
  });

  return { invitedVendors: await fetchInvitedVendors(id) };
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE — only draft
// ─────────────────────────────────────────────────────────────────────────────
const remove = async (id, user) => {
  const existing = await _getRaw(id);

  if (existing.status !== 'draft') {
    throw new AppError('Only draft RFQs can be deleted.', 422, 'INVALID_STATE');
  }

  await query('DELETE FROM rfqs WHERE id = $1', [id]);

  await logActivity({
    userId: user.id,
    action: 'RFQ_DELETED',
    entityType: 'rfq',
    entityId: id,
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const _getRaw = async (id) => {
  const result = await query('SELECT * FROM rfqs WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('RFQ not found.', 404, 'RFQ_NOT_FOUND');
  return result.rows[0];
};

const _assignVendors = async (rfqId, vendorIds) => {
  for (const vendorId of vendorIds) {
    // ON CONFLICT DO NOTHING makes this idempotent
    await query(
      `INSERT INTO rfq_vendors (rfq_id, vendor_id)
       VALUES ($1, $2)
       ON CONFLICT (rfq_id, vendor_id) DO NOTHING`,
      [rfqId, vendorId]
    );
  }
};

module.exports = {
  getAll, getForVendor, getById, create, update,
  publish, close, assignVendors, remove,
};
