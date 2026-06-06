# VendorBridge ERP

VendorBridge is an end-to-end Procurement & Vendor Management ERP designed to streamline the sourcing, quotation, approval, and invoicing workflow between enterprises and their suppliers.

## Overview

VendorBridge replaces fragmented email threads and manual spreadsheets with a unified, transparent platform. From Request for Quotation (RFQ) to Purchase Order (PO) and Invoicing, the system tracks the entire lifecycle of procurement.

### Key Features
- **Role-Based Access Control**: Secure interfaces for Admins, Procurement Officers, Managers/Approvers, and Vendors.
- **RFQ Management**: Create, assign, and track RFQs with granular line-item specifications.
- **Quotation Matrix**: Automatically compare vendor bids to highlight the lowest or most favorable terms.
- **Approval Workflows**: Multi-tier approvals preventing unauthorized PO generation.
- **Purchase Orders & Invoices**: Auto-generation of formal documents tied back to the original approved quotes.
- **Payments & Receipts**: Admin-triggered payment generation against invoices and automated receipt issuance.
- **Activity Logging**: Centralized, unalterable audit trails for all critical actions.
- **Dashboard & KPIs**: Real-time spending analysis, active vendor tracking, and order statuses.

## Tech Stack

### Frontend
- **Framework**: React + Vite (TypeScript)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Charts**: Recharts

### Backend
- **Environment**: Node.js + Express.js (JavaScript)
- **Database**: PostgreSQL (Neon Serverless Postgres)
- **Authentication**: JWT + bcryptjs
- **Validation**: Zod

## Project Structure
```text
vendorbridge-erp/
├── frontend/           # React + Vite Client
├── backend/            # Express.js + Node Server
└── README.md           # This file
```

## System Architecture

VendorBridge follows a classic monolithic client-server architecture with a clear separation of concerns.

1. **Client Tier**: A React Single Page Application (SPA) providing a dynamic interface for multiple user roles. It communicates with the backend via REST APIs.
2. **Application Tier**: A Node.js/Express.js backend utilizing a service-controller pattern.
   - **Controllers**: Handle HTTP requests/responses and validation.
   - **Services**: Contain business logic and database interactions.
   - **Middleware**: Manages authentication, RBAC authorization, and error handling.
3. **Data Tier**: A PostgreSQL database (hosted on Neon) serving as the single source of truth, heavily relying on foreign keys, constraints, and relational integrity.

## Core API Workflows

The REST API is versioned at `/api` and relies on Bearer token authentication.

- **`/api/auth`**: Login, Registration, Password recovery.
- **`/api/vendors`**: Vendor directory, onboarding, and status management.
- **`/api/rfqs`**: RFQ creation, item specification, and vendor assignment.
- **`/api/quotations`**: Bid submissions and comparison matrices.
- **`/api/approvals`**: Manager sign-offs for finalized quotes.
- **`/api/purchase-orders`**: PO generation triggered upon quote approval.
- **`/api/invoices`**: Vendor billing against POs.
- **`/api/payments`**: System record of fulfilled invoice payments.
- **`/api/receipts`**: Output generated upon payment completion.

## Database Schema Highlights
- `users`: Stores global user accounts with roles (`admin`, `procurement_officer`, `manager`, `vendor`).
- `vendors`: Linked 1:1 with a `user` account, holding company metadata.
- `rfqs` & `rfq_items`: The requirements payload.
- `quotations` & `quotation_items`: The vendor's monetary bid against an RFQ.
- `purchase_orders` & `invoices`: Financial and legal execution entities.
- `payments` & `receipts`: Bookkeeping for finalized transactions.
- `activity_logs`: Immutable tracking table for system audits.

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL (from Neon or local)

### 1. Backend Setup & Database Migration
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env and ensure DATABASE_URL is set to your Postgres instance

# Migrate database tables
node src/db/migrate.js

# Seed the database with realistic mock data (Users, RFQs, POs, Invoices, etc.)
node src/db/seed.js
```

### 2. Start the Backend Server
```bash
npm run dev
```

### 3. Start the Frontend Application
```bash
cd ../frontend
npm install
npm run dev
```

The frontend application will be available at `http://localhost:5173`.
The backend API is served at `http://localhost:5000/api`.

### Test Accounts (from seed.js)
- **Admin**: `admin@vendorbridge.com` / `password123`
- **Procurement Officer**: `procurement@vendorbridge.com` / `password123`
- **Manager**: `manager@vendorbridge.com` / `password123`
- **Vendor**: `techsupply@vendor.com` / `password123`

## Deployment

### Frontend (Vercel/Netlify)
1. Set the root directory to `frontend/`.
2. Build command: `npm run build`
3. Output directory: `dist/`
4. Set environment variable `VITE_API_URL` to point to the deployed backend URL.

### Backend (Render/Railway/Heroku)
1. Set the root directory to `backend/`.
2. Start command: `node server.js`
3. Set environment variables:
   - `DATABASE_URL`: Production Postgres connection string.
   - `JWT_SECRET`: Secure cryptographic string.
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: The deployed frontend URL.
