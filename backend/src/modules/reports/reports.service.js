'use strict';

/**
 * src/modules/reports/reports.service.js
 *
 * All report data is derived from live database tables — no mock data.
 * Tables queried: users, vendors, rfqs, quotations, approvals, purchase_orders, invoices, activity_logs
 *
 * Consistent with frontend KPI cards:
 *   - Active RFQs
 *   - Pending approvals
 *   - Total POs issued
 *   - Total invoice spend
 *   - Active vendors
 */

const { query } = require('../../config/db');
const { rowsToCamel } = require('../../utils/camelCase');

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY — KPI cards for the dashboard
// ─────────────────────────────────────────────────────────────────────────────
const summary = async () => {
  const [rfqs, approvals, pos, invoices, vendors] = await Promise.all([
    query(`SELECT
             COUNT(*) FILTER (WHERE status = 'published') AS active_rfqs,
             COUNT(*) FILTER (WHERE status = 'draft')     AS draft_rfqs,
             COUNT(*) FILTER (WHERE status = 'awarded')   AS awarded_rfqs,
             COUNT(*)                                     AS total_rfqs
           FROM rfqs`),
    query(`SELECT
             COUNT(*) FILTER (WHERE status = 'pending')  AS pending_approvals,
             COUNT(*) FILTER (WHERE status = 'approved') AS approved_approvals,
             COUNT(*) FILTER (WHERE status = 'rejected') AS rejected_approvals
           FROM approvals`),
    query(`SELECT
             COUNT(*)           AS total_pos,
             COUNT(*) FILTER (WHERE status = 'issued')    AS issued_pos,
             COUNT(*) FILTER (WHERE status = 'fulfilled') AS fulfilled_pos,
             COALESCE(SUM(total_amount), 0) AS total_po_value
           FROM purchase_orders`),
    query(`SELECT
             COUNT(*)           AS total_invoices,
             COUNT(*) FILTER (WHERE status = 'paid')    AS paid_invoices,
             COUNT(*) FILTER (WHERE status = 'pending') AS pending_invoices,
             COALESCE(SUM(grand_total) FILTER (WHERE status = 'paid'),     0) AS total_paid,
             COALESCE(SUM(grand_total) FILTER (WHERE status = 'pending'),  0) AS outstanding_amount
           FROM invoices`),
    query(`SELECT
             COUNT(*) FILTER (WHERE status = 'active')  AS active_vendors,
             COUNT(*) FILTER (WHERE status = 'pending') AS pending_vendors,
             COUNT(*)                                   AS total_vendors
           FROM vendors`),
  ]);

  const rfqRow      = rfqs.rows[0];
  const approvalRow = approvals.rows[0];
  const poRow       = pos.rows[0];
  const invoiceRow  = invoices.rows[0];
  const vendorRow   = vendors.rows[0];

  return {
    rfqs: {
      active:  parseInt(rfqRow.active_rfqs,  10),
      draft:   parseInt(rfqRow.draft_rfqs,   10),
      awarded: parseInt(rfqRow.awarded_rfqs, 10),
      total:   parseInt(rfqRow.total_rfqs,   10),
    },
    approvals: {
      pending:  parseInt(approvalRow.pending_approvals,  10),
      approved: parseInt(approvalRow.approved_approvals, 10),
      rejected: parseInt(approvalRow.rejected_approvals, 10),
    },
    purchaseOrders: {
      total:     parseInt(poRow.total_pos,     10),
      issued:    parseInt(poRow.issued_pos,    10),
      fulfilled: parseInt(poRow.fulfilled_pos, 10),
      totalValue: parseFloat(poRow.total_po_value),
    },
    invoices: {
      total:             parseInt(invoiceRow.total_invoices,    10),
      paid:              parseInt(invoiceRow.paid_invoices,     10),
      pending:           parseInt(invoiceRow.pending_invoices,  10),
      totalPaid:         parseFloat(invoiceRow.total_paid),
      outstandingAmount: parseFloat(invoiceRow.outstanding_amount),
    },
    vendors: {
      active:  parseInt(vendorRow.active_vendors,  10),
      pending: parseInt(vendorRow.pending_vendors, 10),
      total:   parseInt(vendorRow.total_vendors,   10),
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// SPEND — breakdown by vendor (top 10) and category
// ─────────────────────────────────────────────────────────────────────────────
const spend = async () => {
  const [byVendor, byCategory] = await Promise.all([
    // Top 10 vendors by paid + approved invoice grand total
    query(`
      SELECT
        v.company_name AS name,
        COALESCE(SUM(inv.grand_total), 0) AS total_spend,
        COUNT(inv.id) AS invoice_count
      FROM vendors v
      LEFT JOIN invoices inv ON inv.vendor_id = v.id AND inv.status IN ('paid', 'approved')
      GROUP BY v.id, v.company_name
      ORDER BY total_spend DESC
      LIMIT 10
    `),
    // Spend by category (from vendor.category via POs)
    query(`
      SELECT
        COALESCE(v.category, 'Uncategorized') AS category,
        COALESCE(SUM(po.total_amount), 0) AS total_spend,
        COUNT(po.id) AS po_count
      FROM purchase_orders po
      JOIN vendors v ON v.id = po.vendor_id
      GROUP BY v.category
      ORDER BY total_spend DESC
    `),
  ]);

  return {
    byVendor:   rowsToCamel(byVendor.rows).map(r => ({
      name:         r.name,
      totalSpend:   parseFloat(r.totalSpend),
      invoiceCount: parseInt(r.invoiceCount, 10),
    })),
    byCategory: rowsToCamel(byCategory.rows).map(r => ({
      category:   r.category,
      totalSpend: parseFloat(r.totalSpend),
      poCount:    parseInt(r.poCount, 10),
    })),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR PERFORMANCE — derived from quotation win rates and invoice payment data
// ─────────────────────────────────────────────────────────────────────────────
const vendorPerformance = async () => {
  const result = await query(`
    SELECT
      v.id,
      v.company_name                                              AS name,
      v.status                                                    AS vendor_status,
      COALESCE(v.rating, 0)                                       AS rating,
      COUNT(DISTINCT q.id)                                        AS total_quotes,
      COUNT(DISTINCT q.id) FILTER (WHERE q.status = 'selected')  AS won_quotes,
      COUNT(DISTINCT po.id)                                       AS total_pos,
      COALESCE(SUM(po.total_amount), 0)                           AS total_po_value,
      COUNT(DISTINCT inv.id) FILTER (WHERE inv.status = 'paid')  AS paid_invoices
    FROM vendors v
    LEFT JOIN quotations q  ON q.vendor_id = v.id
    LEFT JOIN purchase_orders po ON po.vendor_id = v.id
    LEFT JOIN invoices inv ON inv.vendor_id = v.id
    WHERE v.status = 'active'
    GROUP BY v.id, v.company_name, v.status, v.rating
    ORDER BY total_po_value DESC
    LIMIT 20
  `);

  return {
    data: result.rows.map(row => {
      const totalQuotes = parseInt(row.total_quotes, 10);
      const wonQuotes   = parseInt(row.won_quotes,   10);
      const winRate     = totalQuotes > 0
        ? parseFloat(((wonQuotes / totalQuotes) * 100).toFixed(1))
        : 0;

      return {
        id:            row.id,
        name:          row.company_name || row.name,
        vendorStatus:  row.vendor_status,
        rating:        parseFloat(row.rating),
        totalQuotes,
        wonQuotes,
        winRate,
        totalPos:      parseInt(row.total_pos,      10),
        totalPoValue:  parseFloat(row.total_po_value),
        paidInvoices:  parseInt(row.paid_invoices,  10),
      };
    }),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY TREND — PO spend + count per month for a given year
// ─────────────────────────────────────────────────────────────────────────────
const monthlyTrend = async (year) => {
  const targetYear = year || new Date().getFullYear();

  const result = await query(`
    SELECT
      TO_CHAR(issued_at, 'Mon')          AS month,
      EXTRACT(MONTH FROM issued_at)       AS month_num,
      COUNT(*)                            AS po_count,
      COALESCE(SUM(total_amount), 0)      AS total_spend
    FROM purchase_orders
    WHERE EXTRACT(YEAR FROM issued_at) = $1
    GROUP BY month, month_num
    ORDER BY month_num ASC
  `, [targetYear]);

  // Fill in months with no data so the chart has all 12 points
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const byMonth = {};
  for (const row of result.rows) {
    byMonth[row.month] = {
      month:      row.month,
      poCount:    parseInt(row.po_count, 10),
      totalSpend: parseFloat(row.total_spend),
    };
  }

  const data = MONTHS.map(m => byMonth[m] || { month: m, poCount: 0, totalSpend: 0 });

  return { year: targetYear, data };
};

module.exports = { summary, spend, vendorPerformance, monthlyTrend };
