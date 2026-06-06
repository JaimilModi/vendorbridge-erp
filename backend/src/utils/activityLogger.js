'use strict';

/**
 * src/utils/activityLogger.js
 *
 * Centralized Activity Log Writer.
 *
 * This is the ONLY place in the codebase that writes to the activity_logs table.
 * All services call this utility directly — controllers never call it.
 * This ensures a consistent, auditable trail of all procurement events.
 *
 * Valid action strings (match frontend constants):
 *   'RFQ_PUBLISHED', 'QUOTE_SUBMITTED', 'QUOTE_SELECTED', 'QUOTE_APPROVED',
 *   'QUOTE_REJECTED', 'PO_GENERATED', 'INVOICE_SUBMITTED', 'INVOICE_APPROVED',
 *   'INVOICE_PAID', 'USER_REGISTERED'
 *
 * Usage (inside any service):
 *   const { logActivity } = require('../utils/activityLogger');
 *   await logActivity({ userId: req.user.id, action: 'RFQ_PUBLISHED', entityType: 'rfq', entityId: newRfq.id });
 */

const { query } = require('../config/db');

/**
 * Insert an activity log entry.
 *
 * @param {Object} params
 * @param {string|null} params.userId - ID of the user who triggered the action (null for system events)
 * @param {string} params.action - Action constant string (e.g. 'RFQ_PUBLISHED')
 * @param {string} params.entityType - Entity type string (e.g. 'rfq', 'quotation', 'po')
 * @param {string} params.entityId - UUID of the affected entity
 * @param {Object} [params.metadata] - Optional JSONB metadata for extra context
 * @returns {Promise<void>}
 */
const logActivity = async ({ userId = null, action, entityType, entityId, metadata = null }) => {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null]
    );
  } catch (err) {
    // Activity logging must NEVER crash the main business flow.
    // Log the error server-side only.
    console.error(`[activityLogger] Failed to write log. Action: ${action}, Entity: ${entityType}/${entityId}`, err.message);
  }
};

module.exports = { logActivity };
