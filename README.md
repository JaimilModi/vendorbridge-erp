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
├── docs/               # System Documentation
└── README.md           # This file
```

## Documentation Directory

For deep-dive documentation on the system, refer to the `docs/` folder:
- [System Architecture](./docs/system-architecture.md)
- [Database Schema](./docs/database-schema.md)
- [API Documentation](./docs/api-documentation.md)
- [Deployment Guide](./docs/deployment-guide.md)

## Quick Start (Local Development)

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database URL (from Neon)

### 1. Database Setup
1. Copy the environment file template in the backend folder: `cp backend/.env.example backend/.env`
2. Update `DATABASE_URL` with your Neon Postgres connection string.
3. Run the database migrations to set up tables:
   ```bash
   cd backend
   node src/db/migrate.js
   ```

### 2. Start the Backend Server
```bash
cd backend
npm install
npm run dev
```

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`.
