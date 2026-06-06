# VendorBridge ERP

VendorBridge ERP is a full-stack Vendor Management and Procurement System built to streamline the procurement lifecycle from RFQ creation to invoice management.

The platform enables procurement teams, vendors, managers, and administrators to collaborate efficiently through a centralized procurement workflow.

---

## Features

### Authentication & Role-Based Access Control

* JWT Authentication
* Role-based authorization
* Supported roles:

  * Admin
  * Procurement Officer
  * Vendor
  * Manager

---

## Vendor Management

* Add new vendors
* Update vendor information
* Activate / deactivate vendors
* Vendor performance tracking
* Vendor-specific portal access

---


## RFQ (Request for Quotation) Management

* Create RFQs
* Add multiple RFQ line items
* Set submission deadlines
* Open / Close RFQs
* View RFQ history
* Vendor access to open RFQs

---

## Quotation Management

* Vendors can submit quotations
* Multiple item pricing support
* Delivery timeline submission
* Quotation comparison dashboard
* Lowest bid identification
* Quotation approval workflow

---

## Approval Workflow

* Manager review process
* Approve quotations
* Reject quotations
* Approval history tracking
* Audit-ready approval records

---

## Purchase Order Management

* Generate Purchase Orders from approved quotations
* Automatic PO numbering
* PO status management:

  * Draft
  * Issued
  * Completed
  * Cancelled
* Vendor visibility controls

---

## Invoice Management

* Generate invoices from Purchase Orders
* Automatic invoice numbering
* Invoice statuses:

  * Draft
  * Sent
  * Paid
  * Overdue
* Invoice tracking
* Due date management

---

## Dashboard Analytics

Role-based dashboards providing:

### Admin Dashboard

* Total Vendors
* Total RFQs
* Total Quotations
* Total Purchase Orders
* Total Invoices
* Procurement Spend Overview

### Procurement Officer Dashboard

* Open RFQs
* Pending Approvals
* Active Purchase Orders
* Vendor Performance Metrics

### Vendor Dashboard

* Submitted Quotations
* Active Purchase Orders
* Pending Invoices
* Awarded Contracts

### Manager Dashboard

* Approval Requests
* Procurement Summary
* Spend Analysis

---

## Reports

* Procurement Spend Report
* Vendor Spend Analysis
* Product Spend Analysis
* Purchase Order Summary
* Invoice Summary

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Ant Design
* React Router
* Axios
* Recharts
* Day.js

## Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* JWT Authentication

## Database

* PostgreSQL
* Neon Database

---

# Project Structure

```
vendorbridge-erp/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── components/
│   │   ├── services/
│   │   ├── context/
│   │   └── types/
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   └── config/
│   │
│   └── prisma/
│
└── README.md
```

---

# Installation

## Clone Repository

```bash
git clone <repository-url>
cd vendorbridge-erp
```

---

## Backend Setup

```bash
cd backend

npm install
```

Create `.env`

```env
DATABASE_URL=your_neon_database_url
JWT_SECRET=your_secret_key
PORT=5000
```

Run Prisma:

```bash
npx prisma generate
npx prisma migrate deploy
```

Start Backend:

```bash
npm run dev
```

Backend runs on:

```
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install
npm run dev
```

Frontend runs on:

```
http://localhost:3000
```

---

# API Base URL

```
http://localhost:5000/api/v1
```

---

# Default Test Accounts

## Vendor

Email:

```
vendor1@vendor.com
```

Password:

```
123456
```

---

## Admin

Email:

```
admin1@vender.com
```

Password:

```
123456
```

---

## Manager

Email:

```
manager1@vender.com
```

Password:

```
123456
```

---

## Procurement Officer

Email:

```
procurementofficer@vender.com
```

Password:

```
123456
```

---

# Procurement Workflow

```
RFQ Creation
      ↓
Vendor Quotation Submission
      ↓
Quotation Comparison
      ↓
Manager Approval
      ↓
Purchase Order Generation
      ↓
Invoice Generation
      ↓
Payment Tracking
```


---

# Security Features

* JWT Authentication
* Protected Routes
* Role-Based Access Control
* Vendor Data Isolation
* API Validation Middleware
* Secure Password Hashing

---

# Future Enhancements

* PDF Purchase Order Export
* PDF Invoice Download
* Email Notifications
* Vendor Rating Engine
* Inventory Integration
* Multi-level Approval Workflow
* Audit Logs
* Mobile Responsive Enhancements

---

Built using React, TypeScript, Express, Prisma, PostgreSQL, and Neon Database.
