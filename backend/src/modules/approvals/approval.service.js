'use strict';

/**
 * src/modules/approvals/approval.service.js
 *
 * All approval business logic.
 *
 * CRITICAL WORKFLOW on decide(approved):
 *   1. Validate: approval must be 'pending'
 *   2. Validate: linked quotation must be 'selected'
 *   3. Update approval → approved, set decided_at
 *   4. Call poService.createFromApproval() — auto-generates the PO
 *   5. Log: QUOTE_APPROVED
 *   6. Log: PO_GENERATED
 *
 * on decide(rejected):
 *   1. Validate: approval must be 'pending'
 *   2. Update approval → rejected, set decided_at
 *   3. Log: QUOTE_REJECTED
 *   4. NO PO is created
 */

const { query } = require('../../config/db');
const { AppError } = require('../../utils/AppError');
const { toCamel, rowsToCamel } = require('../../utils/camelCase');
const { logActivity } = require('../../utils/activityLogger');
// Lazy-require PO service to avoid circular dependency at module load time
const getPoService = () => require('../purchase-orders/po.service');

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER
// ─────────────────────────────────────────────────────────────────────────────
const _getRaw = async (id) => {
  const result = await query('SELECT * FROM approvals WHERE id = $1', [id]);
  if (result.rows.length === 0) throw new AppError('Approval not found.', 404, 'APPROVAL_NOT_FOUND');
  return result.rows[0];
};

const _enrichApproval = async (id) => {
  const result = await query(
    `SELECT
       a.*,
       q.quote_number, q.total_amount AS quotation_amount, q.delivery_timeline,
       q.status AS quotation_status,
       r.rfq_number, r.title AS rfq_title,
       v.company_name AS vendor_name, v.id AS vendor_id,
       requester.full_name AS requester_name,
       approver.full_name  AS approver_name
     FROM approvals a
     JOIN quotations q  ON q.id = a.quotation_id
     JOIN rfqs r        ON r.id = q.rfq_id
     JOIN vendors v     ON v.id = q.vendor_id
     LEFT JOIN users requester ON requester.id = a.requester_id
     LEFT JOIN users approver  ON approver.id  = a.approver_id
     WHERE a.id = $1`,
    [id]
  );
  if (result.rows.length === 0) throw new AppError('Approval not found.', 404, 'APPROVAL_NOT_FOUND');
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
    where = `WHERE a.status = $${params.length}`;
  }

  const countResult = await query(`SELECT COUNT(*) FROM approvals a ${where}`, params);
  const total = parseInt(countResult.rows[0].count, 10);

  params.push(limit, offset);
  const result = await query(
    `SELECT
       a.id, a.status, a.requested_at, a.decided_at, a.notes,
       q.quote_number, q.total_amount,
       r.rfq_number, r.title AS rfq_title,
       v.company_name AS vendor_name,
       requester.full_name AS requester_name,
       approver.full_name  AS approver_name
     FROM approvals a
     JOIN quotations q  ON q.id = a.quotation_id
     JOIN rfqs r        ON r.id = q.rfq_id
     JOIN vendors v     ON v.id = q.vendor_id
     LEFT JOIN users requester ON requester.id = a.requester_id
     LEFT JOIN users approver  ON approver.id  = a.approver_id
     ${where}
     ORDER BY a.requested_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    data: rowsToCamel(result.rows),
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET PENDING
// ─────────────────────────────────────────────────────────────────────────────
const getPending = async () => {
  const result = await query(
    `SELECT
       a.id, a.status, a.requested_at, a.notes,
       q.quote_number, q.total_amount, q.delivery_timeline,
       r.rfq_number, r.title AS rfq_title, r.deadline,
       v.company_name AS vendor_name,
       requester.full_name AS requester_name
     FROM approvals a
     JOIN quotations q  ON q.id = a.quotation_id
     JOIN rfqs r        ON r.id = q.rfq_id
     JOIN vendors v     ON v.id = q.vendor_id
     LEFT JOIN users requester ON requester.id = a.requester_id
     WHERE a.status = 'pending'
     ORDER BY a.requested_at ASC`,
    []
  );
  return { data: rowsToCamel(result.rows) };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET BY ID — full detail with linked entities
// ─────────────────────────────────────────────────────────────────────────────
const getById = async (id) => {
  const approval = await _enrichApproval(id);

  // Also attach any generated PO
  const poResult = await query(
    'SELECT id, po_number, status, total_amount FROM purchase_orders WHERE approval_id = $1',
    [id]
  );
  if (poResult.rows.length > 0) {
    approval.purchaseOrder = toCamel(poResult.rows[0]);
  }

  return approval;
};

// ─────────────────────────────────────────────────────────────────────────────
// CREATE APPROVAL REQUEST
// ─────────────────────────────────────────────────────────────────────────────
const create = async ({ quotationId, approverId, notes }, user) => {
  // Verify quotation exists and is 'selected'
  const quoteResult = await query('SELECT id, status FROM quotations WHERE id = $1', [quotationId]);
  if (quoteResult.rows.length === 0) throw new AppError('Quotation not found.', 404);
  if (quoteResult.rows[0].status !== 'selected') {
    throw new AppError(
      'Only selected quotations can be sent for approval.',
      422,
      'QUOTATION_NOT_SELECTED'
    );
  }

  // Prevent duplicate approval requests
  const existingApproval = await query(
    'SELECT id FROM approvals WHERE quotation_id = $1',
    [quotationId]
  );
  if (existingApproval.rows.length > 0) {
    throw new AppError('An approval request already exists for this quotation.', 409, 'DUPLICATE_APPROVAL');
  }

  const result = await query(
    `INSERT INTO approvals (quotation_id, requester_id, approver_id, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [quotationId, user.id, approverId ?? null, notes ?? null]
  );

  const approval = toCamel(result.rows[0]);

  await logActivity({
    userId: user.id,
    action: 'APPROVAL_REQUESTED',
    entityType: 'approval',
    entityId: approval.id,
    metadata: { quotationId },
  });

  return _enrichApproval(approval.id);
};

// ─────────────────────────────────────────────────────────────────────────────
// DECIDE — approve or reject (manager only)
//
// On APPROVED:
//   → Update approval status + decided_at
//   → Auto-generate PO via poService.createFromApproval()
//   → Log QUOTE_APPROVED + PO_GENERATED
//
// On REJECTED:
//   → Update approval status + decided_at
//   → NO PO generated
//   → Log QUOTE_REJECTED
// ─────────────────────────────────────────────────────────────────────────────
const decide = async (id, { status, notes }, user) => {
  const raw = await _getRaw(id);

  if (raw.status !== 'pending') {
    throw new AppError(
      `This approval has already been decided. Current status: "${raw.status}".`,
      422,
      'ALREADY_DECIDED'
    );
  }

  // Record the decision
  await query(
    `UPDATE approvals
     SET status = $1, approver_id = $2, notes = COALESCE($3, notes), decided_at = NOW()
     WHERE id = $4`,
    [status, user.id, notes ?? null, id]
  );

  if (status === 'approved') {
    // Trigger automatic PO generation
    const poService = getPoService();
    const po = await poService.createFromApproval(id, raw.quotation_id, user);

    await logActivity({
      userId: user.id,
      action: 'QUOTE_APPROVED',
      entityType: 'approval',
      entityId: id,
      metadata: { quotationId: raw.quotation_id },
    });

    await logActivity({
      userId: user.id,
      action: 'PO_GENERATED',
      entityType: 'purchase_order',
      entityId: po.id,
      metadata: { poNumber: po.poNumber, approvalId: id },
    });

    const approval = await _enrichApproval(id);
    approval.purchaseOrder = po;
    return approval;

  } else {
    // Rejected — no PO
    await logActivity({
      userId: user.id,
      action: 'QUOTE_REJECTED',
      entityType: 'approval',
      entityId: id,
      metadata: { quotationId: raw.quotation_id, notes },
    });

    return _enrichApproval(id);
  }
};

module.exports = { getAll, getPending, getById, create, decide };
