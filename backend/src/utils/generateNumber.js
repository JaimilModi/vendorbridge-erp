'use strict';

/**
 * src/utils/generateNumber.js
 *
 * Auto-generates formatted document reference numbers using
 * PostgreSQL sequences. Each entity type has its own sequence,
 * ensuring unique, collision-free numbers even under concurrent requests.
 *
 * Format examples:
 *   RFQs:        RFQ-2026-0001
 *   Quotations:  Q-2026-0001
 *   POs:         PO-2026-0001
 *   Invoices:    INV-2026-0001
 *
 * The sequences are created in the DB migration script.
 */

const { query } = require('../config/db');

/**
 * Map of entity type to its PostgreSQL sequence name.
 * Sequence names must match the migration SQL exactly.
 */
const SEQUENCES = {
  rfq: 'rfq_number_seq',
  quotation: 'quotation_number_seq',
  po: 'po_number_seq',
  invoice: 'invoice_number_seq',
};

/**
 * Map of entity type to its formatted prefix.
 */
const PREFIXES = {
  rfq: 'RFQ',
  quotation: 'Q',
  po: 'PO',
  invoice: 'INV',
};

/**
 * Get the next sequential number from the database and format it.
 *
 * @param {'rfq' | 'quotation' | 'po' | 'invoice'} entityType
 * @returns {Promise<string>} - e.g. "RFQ-2026-0001"
 */
const generateNumber = async (entityType) => {
  const sequenceName = SEQUENCES[entityType];
  if (!sequenceName) {
    throw new Error(`[generateNumber] Unknown entity type: "${entityType}"`);
  }

  const result = await query(`SELECT nextval('${sequenceName}') AS seq`);
  const seq = result.rows[0].seq;
  const year = new Date().getFullYear();
  const padded = String(seq).padStart(4, '0');
  const prefix = PREFIXES[entityType];

  return `${prefix}-${year}-${padded}`;
};

module.exports = { generateNumber };
