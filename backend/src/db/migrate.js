'use strict';

/**
 * src/db/migrate.js
 *
 * Full database migration script for VendorBridge.
 * Run once with: node src/db/migrate.js
 *
 * Creates all ENUMs, tables, indexes, and sequences for auto-number generation.
 * Idempotent — safe to re-run (uses IF NOT EXISTS everywhere).
 */

require('../config/env'); // ensure .env is loaded
const { query, testConnection } = require('../config/db');

const MIGRATION_SQL = `
-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM TYPES (drop then recreate is not safe in production; use ALTER TYPE instead)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'procurement_officer', 'vendor', 'manager');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vendor_status AS ENUM ('active', 'pending', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE rfq_status AS ENUM ('draft', 'published', 'closed', 'awarded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE quotation_status AS ENUM ('draft', 'submitted', 'selected', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE po_status AS ENUM ('issued', 'acknowledged', 'fulfilled', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('pending', 'approved', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEQUENCES for document number generation
-- ─────────────────────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS rfq_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS quotation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS po_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name    VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role         user_role NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- VENDORS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email        VARCHAR(255),
  phone        VARCHAR(50),
  address      TEXT,
  category     VARCHAR(100),
  gst_number   VARCHAR(100),
  status       vendor_status DEFAULT 'pending',
  rating       DECIMAL(3,2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RFQs
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfqs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_number   VARCHAR(50) NOT NULL UNIQUE,
  title        VARCHAR(255) NOT NULL,
  description  TEXT,
  department   VARCHAR(100),
  status       rfq_status DEFAULT 'draft',
  deadline     TIMESTAMPTZ,
  budget_limit DECIMAL(15,2),
  created_by   UUID REFERENCES users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rfq_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id          UUID NOT NULL REFERENCES rfqs(id) ON DELETE CASCADE,
  item_name       VARCHAR(255) NOT NULL,
  quantity        INTEGER NOT NULL DEFAULT 1,
  unit            VARCHAR(50) DEFAULT 'pcs',
  estimated_price DECIMAL(15,2)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- RFQ <-> VENDOR ASSIGNMENT
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rfq_vendors (
  rfq_id     UUID REFERENCES rfqs(id) ON DELETE CASCADE,
  vendor_id  UUID REFERENCES vendors(id) ON DELETE CASCADE,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (rfq_id, vendor_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- QUOTATIONS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number      VARCHAR(50) NOT NULL UNIQUE,
  rfq_id            UUID NOT NULL REFERENCES rfqs(id),
  vendor_id         UUID NOT NULL REFERENCES vendors(id),
  status            quotation_status DEFAULT 'draft',
  total_amount      DECIMAL(15,2) NOT NULL DEFAULT 0,
  validity_days     INTEGER DEFAULT 30,
  delivery_timeline VARCHAR(100),
  notes             TEXT,
  submitted_at      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  rfq_item_id   UUID REFERENCES rfq_items(id),
  unit_price    DECIMAL(15,2) NOT NULL DEFAULT 0,
  quantity      INTEGER NOT NULL DEFAULT 1,
  total_price   DECIMAL(15,2) NOT NULL DEFAULT 0
);

-- ─────────────────────────────────────────────────────────────────────────────
-- APPROVALS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS approvals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id  UUID NOT NULL UNIQUE REFERENCES quotations(id),
  requester_id  UUID REFERENCES users(id),
  approver_id   UUID REFERENCES users(id),
  status        approval_status DEFAULT 'pending',
  notes         TEXT,
  requested_at  TIMESTAMPTZ DEFAULT NOW(),
  decided_at    TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────────────────────
-- PURCHASE ORDERS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchase_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number    VARCHAR(50) NOT NULL UNIQUE,
  approval_id  UUID NOT NULL UNIQUE REFERENCES approvals(id),
  quotation_id UUID NOT NULL REFERENCES quotations(id),
  vendor_id    UUID NOT NULL REFERENCES vendors(id),
  rfq_id       UUID REFERENCES rfqs(id),
  status       po_status DEFAULT 'issued',
  total_amount DECIMAL(15,2) NOT NULL,
  issued_by    UUID REFERENCES users(id),
  issued_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS po_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_id       UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  rfq_item_id UUID REFERENCES rfq_items(id),
  item_name   VARCHAR(255) NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  po_id          UUID NOT NULL UNIQUE REFERENCES purchase_orders(id),
  vendor_id      UUID NOT NULL REFERENCES vendors(id),
  status         invoice_status DEFAULT 'pending',
  total_amount   DECIMAL(15,2) NOT NULL,
  tax_amount     DECIMAL(15,2) NOT NULL DEFAULT 0,
  grand_total    DECIMAL(15,2) NOT NULL,
  due_date       DATE,
  submitted_at   TIMESTAMPTZ DEFAULT NOW(),
  processed_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invoice_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  po_item_id  UUID REFERENCES po_items(id),
  description VARCHAR(255) NOT NULL,
  quantity    INTEGER NOT NULL,
  unit_price  DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- ACTIVITY LOGS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id   UUID,
  metadata    JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES (performance)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_rfqs_status ON rfqs(status);
CREATE INDEX IF NOT EXISTS idx_rfqs_created_by ON rfqs(created_by);
CREATE INDEX IF NOT EXISTS idx_quotations_rfq_id ON quotations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_quotations_vendor_id ON quotations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_po_vendor_id ON purchase_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
`;

const migrate = async () => {
  console.log('[migrate] Starting VendorBridge database migration...');
  await testConnection();

  try {
    await query(MIGRATION_SQL);
    console.log('[migrate] ✅ Migration completed successfully. All tables and sequences are ready.');
  } catch (err) {
    console.error('[migrate] ❌ Migration failed:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

migrate();
