'use strict';

/**
 * src/modules/activity-logs/activityLog.service.js
 *
 * READ-ONLY service. All log writes go through utils/activityLogger.js.
 *
 * Provides:
 *   - Paginated full audit trail with optional filters
 *   - Entity-specific log timeline (e.g. all logs for rfq/:id)
 *
 * Log entry structure returned to frontend:
 * {
 *   id:         UUID
 *   action:     string   — e.g. "RFQ_PUBLISHED", "INVOICE_PAID"
 *   entityType: string   — e.g. "rfq", "quotation", "purchase_order"
 *   entityId:   UUID
 *   metadata:   object   — contextual data (rfqNumber, etc.)
 *   createdAt:  ISO 8601 timestamp
 *   user: {
 *     id:       UUID
 *     fullName: string
 *     role:     string
 *   } | null             — null for system-generated events
 * }
 */

const { query } = require('../../config/db');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');

// ─────────────────────────────────────────────────────────────────────────────
// GET ALL — full audit trail, newest first, with optional filters
// ─────────────────────────────────────────────────────────────────────────────
const getAll = async ({ action, entityType, userId, page = 1, limit = 50 }) => {
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];

  if (action) {
    params.push(`%${action.toUpperCase()}%`);
    conditions.push(`al.action ILIKE $${params.length}`);
  }
  if (entityType) {
    params.push(entityType.toLowerCase());
    conditions.push(`al.entity_type = $${params.length}`);
  }
  if (userId) {
    params.push(userId);
    conditions.push(`al.user_id = $${params.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count
  const countResult = await query(
    `SELECT COUNT(*) FROM activity_logs al ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Data — join users for actor info
  params.push(limit, offset);
  const result = await query(
    `SELECT
       al.id,
       al.action,
       al.entity_type,
       al.entity_id,
       al.metadata,
       al.created_at,
       u.id        AS user_id,
       u.full_name AS user_full_name,
       u.role      AS user_role
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     ${where}
     ORDER BY al.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const data = result.rows.map(row => ({
    id:         row.id,
    action:     row.action,
    entityType: row.entity_type,
    entityId:   row.entity_id,
    metadata:   row.metadata,
    createdAt:  row.created_at,
    user: row.user_id
      ? { id: row.user_id, fullName: row.user_full_name, role: row.user_role }
      : null,
  }));

  return {
    data,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ENTITY — timeline for a specific entity (e.g. all events on rfq/:id)
// Used for audit timeline view on detail pages
// ─────────────────────────────────────────────────────────────────────────────
const getByEntity = async (entityType, entityId) => {
  const result = await query(
    `SELECT
       al.id,
       al.action,
       al.entity_type,
       al.entity_id,
       al.metadata,
       al.created_at,
       u.id        AS user_id,
       u.full_name AS user_full_name,
       u.role      AS user_role
     FROM activity_logs al
     LEFT JOIN users u ON u.id = al.user_id
     WHERE al.entity_type = $1 AND al.entity_id = $2
     ORDER BY al.created_at ASC`,
    [entityType.toLowerCase(), entityId]
  );

  const data = result.rows.map(row => ({
    id:         row.id,
    action:     row.action,
    entityType: row.entity_type,
    entityId:   row.entity_id,
    metadata:   row.metadata,
    createdAt:  row.created_at,
    user: row.user_id
      ? { id: row.user_id, fullName: row.user_full_name, role: row.user_role }
      : null,
  }));

  return { data };
};

module.exports = { getAll, getByEntity };
