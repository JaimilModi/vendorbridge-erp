'use strict';

/**
 * src/modules/vendors/vendor.service.js
 *
 * All vendor business logic and SQL.
 * Controllers remain thin — every rule lives here.
 */

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL — with optional search, filter by status/category, and pagination
// ─────────────────────────────────────────────────────────────────────────────
const getAll = async ({ search, status, category, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(v.company_name ILIKE $${params.length} OR v.contact_name ILIKE $${params.length} OR v.email ILIKE $${params.length})`
    );
  }
  if (status) {
    params.push(status);
    conditions.push(`v.status = $${params.length}`);
  }
  if (category) {
    params.push(`%${category}%`);
    conditions.push(`v.category ILIKE $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count query for pagination metadata
  const countResult = await query(
    `SELECT COUNT(*) FROM vendors v ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data query
  params.push(limit, offset);
  const dataResult = await query(
    `SELECT
       v.id, v.user_id, v.company_name, v.contact_name, v.email,
       v.phone, v.address, v.category, v.gst_number, v.status,
       v.rating, v.created_at, v.updated_at
     FROM vendors v
     ${where}
     ORDER BY v.company_name ASC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(dataResult.rows),
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID
// ─────────────────────────────────────────────────────────────────────────────
const getById = async (id) => {
  const result = await query(
    `SELECT
       v.id, v.user_id, v.company_name, v.contact_name, v.email,
       v.phone, v.address, v.category, v.gst_number, v.status,
       v.rating, v.created_at, v.updated_at,
       u.full_name AS user_full_name, u.role AS user_role
     FROM vendors v
     LEFT JOIN users u ON u.id = v.user_id
     WHERE v.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new AppError('Vendor not found.', 404, 'VENDOR_NOT_FOUND');
  }

  return toCamel(result.rows[0]);
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE — admin can manually register a vendor without a user account
// ─────────────────────────────────────────────────────────────────────────────
const create = async (body, actor) => {
  const {
    companyName, contactName, email, phone,
    address, category, gstNumber, rating, status = 'pending'
  } = body;

  const result = await query(
    `INSERT INTO vendors
       (company_name, contact_name, email, phone, address, category, gst_number, rating, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [companyName, contactName ?? null, email ?? null, phone ?? null,
     address ?? null, category ?? null, gstNumber ?? null, rating ?? null, status]
  );

  const vendor = toCamel(result.rows[0]);

  await logActivity({
    userId: actor.id,
    action: 'VENDOR_CREATED',
    entityType: 'vendor',
    entityId: vendor.id,
    metadata: { companyName, status },
  });

  return vendor;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE
// ─────────────────────────────────────────────────────────────────────────────
const update = async (id, body, actor) => {
  // Ensure vendor exists
  await getById(id);

  const {
    companyName, contactName, email, phone,
    address, category, gstNumber, rating
  } = body;

  const result = await query(
    `UPDATE vendors SET
       company_name  = COALESCE($1, company_name),
       contact_name  = COALESCE($2, contact_name),
       email         = COALESCE($3, email),
       phone         = COALESCE($4, phone),
       address       = COALESCE($5, address),
       category      = COALESCE($6, category),
       gst_number    = COALESCE($7, gst_number),
       rating        = COALESCE($8, rating),
       updated_at    = NOW()
     WHERE id = $9
     RETURNING *`,
    [companyName ?? null, contactName ?? null, email ?? null,
     phone ?? null, address ?? null, category ?? null,
     gstNumber ?? null, rating ?? null, id]
  );

  const vendor = toCamel(result.rows[0]);

  await logActivity({
    userId: actor.id,
    action: 'VENDOR_UPDATED',
    entityType: 'vendor',
    entityId: id,
  });

  return vendor;
};

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE STATUS (activate / deactivate)
// ─────────────────────────────────────────────────────────────────────────────
const updateStatus = async (id, status, actor) => {
  await getById(id);

  const result = await query(
    `UPDATE vendors SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [status, id]
  );

  const vendor = toCamel(result.rows[0]);

  await logActivity({
    userId: actor.id,
    action: 'VENDOR_STATUS_CHANGED',
    entityType: 'vendor',
    entityId: id,
    metadata: { status },
  });

  return vendor;
};

// ─────────────────────────────────────────────────────────────────────────────
// SOFT DELETE — set status to 'inactive' rather than hard delete
// Hard delete is blocked if vendor has linked quotations/POs
// ─────────────────────────────────────────────────────────────────────────────
const remove = async (id, actor) => {
  await getById(id);

  // Safety check: block if vendor has active POs
  const poCheck = await query(
    `SELECT COUNT(*) FROM purchase_orders WHERE vendor_id = $1 AND status != 'cancelled'`,
    [id]
  );
  if (parseInt(poCheck.rows[0].count, 10) > 0) {
    throw new AppError(
      'Cannot delete vendor with active purchase orders. Deactivate the vendor instead.',
      409,
      'VENDOR_HAS_ACTIVE_POS'
    );
  }

  await query(`UPDATE vendors SET status = 'inactive', updated_at = NOW() WHERE id = $1`, [id]);

  await logActivity({
    userId: actor.id,
    action: 'VENDOR_DELETED',
    entityType: 'vendor',
    entityId: id,
  });
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
