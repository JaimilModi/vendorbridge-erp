'use strict';

require('../config/env');
const { query, testConnection } = require('../config/db');
const bcrypt = require('bcryptjs');

const MOCK_DATA = async () => {
  console.log('[seed] Cleaning database...');
  await query(`
    TRUNCATE activity_logs, receipts, payments, invoice_items, invoices,
    po_items, purchase_orders, approvals, quotation_items, quotations,
    rfq_vendors, rfq_items, rfqs, vendors, users RESTART IDENTITY CASCADE
  `);

  console.log('[seed] Inserting users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  // Create 4 users for 4 roles
  const usersResult = await query(`
    INSERT INTO users (id, full_name, email, password_hash, role) VALUES
    (gen_random_uuid(), 'Admin User', 'admin@vendorbridge.com', $1, 'admin'),
    (gen_random_uuid(), 'Procurement Officer', 'procurement@vendorbridge.com', $1, 'procurement_officer'),
    (gen_random_uuid(), 'Manager Approver', 'manager@vendorbridge.com', $1, 'manager'),
    (gen_random_uuid(), 'TechSupply Vendor', 'techsupply@vendor.com', $1, 'vendor'),
    (gen_random_uuid(), 'Global Logistics', 'logistics@vendor.com', $1, 'vendor')
    RETURNING id, role
  `, [passwordHash]);

  const adminId = usersResult.rows.find(u => u.role === 'admin').id;
  const procId = usersResult.rows.find(u => u.role === 'procurement_officer').id;
  const managerId = usersResult.rows.find(u => u.role === 'manager').id;
  const vendorUsers = usersResult.rows.filter(u => u.role === 'vendor');

  console.log('[seed] Inserting vendors...');
  const vendorsResult = await query(`
    INSERT INTO vendors (id, user_id, company_name, contact_name, email, phone, category, status, rating) VALUES
    (gen_random_uuid(), $1, 'TechSupply Inc.', 'John Tech', 'techsupply@vendor.com', '+1234567890', 'IT Hardware', 'active', 4.8),
    (gen_random_uuid(), $2, 'Global Logistics', 'Jane Logic', 'logistics@vendor.com', '+1987654321', 'Logistics', 'active', 4.5)
    RETURNING id
  `, [vendorUsers[0].id, vendorUsers[1].id]);

  const vendor1 = vendorsResult.rows[0].id;
  const vendor2 = vendorsResult.rows[1].id;

  console.log('[seed] Inserting RFQs...');
  const rfqResult = await query(`
    INSERT INTO rfqs (id, rfq_number, title, description, department, status, deadline, budget_limit, created_by) VALUES
    (gen_random_uuid(), 'RFQ-1001', 'Server Hardware Upgrade', 'Need 10 new high performance servers for the data center.', 'IT', 'published', NOW() + INTERVAL '7 days', 50000, $1),
    (gen_random_uuid(), 'RFQ-1002', 'Office Furniture', 'Desks and chairs for the new branch.', 'Facilities', 'draft', NOW() + INTERVAL '14 days', 15000, $1),
    (gen_random_uuid(), 'RFQ-1003', 'Cloud Migration Services', 'Consulting and implementation for AWS migration.', 'Engineering', 'closed', NOW() - INTERVAL '1 days', 100000, $1),
    (gen_random_uuid(), 'RFQ-1004', 'Q3 Delivery Logistics', 'Freight shipping for the entire quarter.', 'Operations', 'awarded', NOW() - INTERVAL '10 days', 75000, $1)
    RETURNING id, rfq_number, status
  `, [procId]);

  const rfq1 = rfqResult.rows[0].id;
  const rfq2 = rfqResult.rows[1].id;
  const rfq3 = rfqResult.rows[2].id;
  const rfq4 = rfqResult.rows[3].id;

  await query(`
    INSERT INTO rfq_items (id, rfq_id, item_name, quantity, estimated_price) VALUES
    (gen_random_uuid(), $1, 'Dell PowerEdge R750', 10, 4500),
    (gen_random_uuid(), $2, 'Ergonomic Chair', 50, 150),
    (gen_random_uuid(), $2, 'Standing Desk', 50, 250),
    (gen_random_uuid(), $3, 'Cloud Architect Hours', 200, 250),
    (gen_random_uuid(), $4, 'Ocean Freight Container', 5, 8000)
  `, [rfq1, rfq2, rfq3, rfq4]);

  await query(`
    INSERT INTO rfq_vendors (rfq_id, vendor_id) VALUES
    ($1, $2), ($1, $3), ($4, $3)
  `, [rfq1, vendor1, vendor2, rfq4]);

  console.log('[seed] Inserting Quotations...');
  // Quotation 1: Submitted by vendor1 for rfq1
  const q1Result = await query(`
    INSERT INTO quotations (id, quote_number, rfq_id, vendor_id, status, total_amount, validity_days, delivery_timeline, submitted_at) VALUES
    (gen_random_uuid(), 'QT-2001', $1, $2, 'submitted', 43000, 30, '2 weeks', NOW() - INTERVAL '3 days')
    RETURNING id
  `, [rfq1, vendor1]);
  const q1 = q1Result.rows[0].id;

  // Quotation 2: Selected for rfq4 by vendor2
  const q2Result = await query(`
    INSERT INTO quotations (id, quote_number, rfq_id, vendor_id, status, total_amount, validity_days, delivery_timeline, submitted_at) VALUES
    (gen_random_uuid(), 'QT-2002', $1, $2, 'selected', 38000, 60, '1 month', NOW() - INTERVAL '15 days')
    RETURNING id
  `, [rfq4, vendor2]);
  const q2 = q2Result.rows[0].id;

  await query(`
    INSERT INTO quotation_items (quotation_id, unit_price, quantity, total_price) VALUES
    ($1, 4300, 10, 43000),
    ($2, 7600, 5, 38000)
  `, [q1, q2]);

  console.log('[seed] Inserting Approvals...');
  const appResult = await query(`
    INSERT INTO approvals (id, quotation_id, requester_id, approver_id, status, requested_at, decided_at) VALUES
    (gen_random_uuid(), $1, $2, $3, 'approved', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days')
    RETURNING id
  `, [q2, procId, managerId]);
  const app1 = appResult.rows[0].id;

  console.log('[seed] Inserting Purchase Orders...');
  const poResult = await query(`
    INSERT INTO purchase_orders (id, po_number, approval_id, quotation_id, vendor_id, rfq_id, status, total_amount, issued_by, issued_at) VALUES
    (gen_random_uuid(), 'PO-3001', $1, $2, $3, $4, 'fulfilled', 38000, $5, NOW() - INTERVAL '12 days')
    RETURNING id
  `, [app1, q2, vendor2, rfq4, procId]);
  const po1 = poResult.rows[0].id;

  await query(`
    INSERT INTO po_items (po_id, item_name, quantity, unit_price, total_price) VALUES
    ($1, 'Ocean Freight Container', 5, 7600, 38000)
  `, [po1]);

  console.log('[seed] Inserting Invoices...');
  const invResult = await query(`
    INSERT INTO invoices (id, invoice_number, po_id, vendor_id, status, total_amount, tax_amount, grand_total, submitted_at) VALUES
    (gen_random_uuid(), 'INV-4001', $1, $2, 'paid', 38000, 3800, 41800, NOW() - INTERVAL '10 days')
    RETURNING id
  `, [po1, vendor2]);
  const inv1 = invResult.rows[0].id;

  await query(`
    INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) VALUES
    ($1, 'Ocean Freight Container', 5, 7600, 38000)
  `, [inv1]);

  console.log('[seed] Inserting Payments & Receipts...');
  const payResult = await query(`
    INSERT INTO payments (id, payment_number, invoice_id, vendor_id, amount, status, payment_date) VALUES
    (gen_random_uuid(), 'PAY-5001', $1, $2, 41800, 'completed', NOW() - INTERVAL '5 days')
    RETURNING id
  `, [inv1, vendor2]);
  const pay1 = payResult.rows[0].id;

  await query(`
    INSERT INTO receipts (id, receipt_number, payment_id, invoice_id, vendor_id, amount_received) VALUES
    (gen_random_uuid(), 'REC-6001', $1, $2, $3, 41800)
  `, [pay1, inv1, vendor2]);

  console.log('[seed] Generating Activity Logs...');
  await query(`
    INSERT INTO activity_logs (user_id, action, entity_type, metadata) VALUES
    ($1, 'SYSTEM_INIT', 'system', '{"message": "Seed data loaded successfully"}')
  `, [adminId]);

  // Adjust sequences
  await query(`
    SELECT setval('rfq_number_seq', 1005);
    SELECT setval('quotation_number_seq', 2003);
    SELECT setval('po_number_seq', 3002);
    SELECT setval('invoice_number_seq', 4002);
    SELECT setval('payment_number_seq', 5002);
    SELECT setval('receipt_number_seq', 6002);
  `);

  console.log('[seed] Database seeded completely! 🎉');
};

const runSeed = async () => {
  await testConnection();
  try {
    await MOCK_DATA();
  } catch (err) {
    console.error('[seed] Failed:', err);
  } finally {
    process.exit(0);
  }
};

runSeed();
