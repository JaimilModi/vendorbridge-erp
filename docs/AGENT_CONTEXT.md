# VendorBridge ERP

# AI EXECUTION RULES (MANDATORY)

Before generating any code:

* Read this file completely.
* Follow all architecture decisions in this document.
* Do not replace technologies unless explicitly requested.
* Do not introduce unnecessary libraries.
* Generate production-quality code.
* Use modular architecture.
* Use reusable components.
* Create APIs before UI integration.

When generating code:

1. First explain the implementation plan.
2. Generate one module at a time.
3. Never generate the entire ERP in one response.
4. Never overwrite existing files unless requested.
5. Always show the file path before generating code.
6. If a file already exists, modify it instead of creating duplicates.
7. Follow the Development Order exactly.
8. Always use the existing project structure.
9. Never generate mock authentication.
10. Never generate fake dashboard data.

---

# PROJECT STRUCTURE (MANDATORY)

vendorbridge-erp/

├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── utils/
│   │   └── config/
│   │
│   ├── prisma/
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── AGENT_CONTEXT.md
│
├── .gitignore
├── README.md
└── .env.example

Never place frontend and backend code in the same folder.

Never create React files inside backend.

Never create Express files inside frontend.

Frontend and backend must remain completely separated.

---

# DEVELOPMENT ORDER (MANDATORY)

1. Design database schema
2. Generate Prisma models
3. Run migrations
4. Create backend architecture
5. Create authentication
6. Create APIs
7. Create frontend pages
8. Connect frontend with backend
9. Add charts and analytics
10. Polish UI

Never generate frontend before database and backend are defined.

Never create dashboards before authentication exists.

---

# PROJECT OVERVIEW

VendorBridge is a Procurement & Vendor Management ERP.

The platform manages:

* Vendors
* RFQs
* Quotations
* Approvals
* Purchase Orders
* Invoices
* Notifications
* Activity Logs
* Reports & Analytics

---

# AUTHENTICATION FLOW (MANDATORY)

Application startup flow:

1. Open application
2. Redirect to /login
3. User can login or signup
4. Authenticate using JWT
5. Store JWT in localStorage
6. Verify JWT on application startup
7. Redirect user based on role

Role Routes:

ADMIN -> /admin/dashboard

PROCUREMENT_OFFICER -> /officer/dashboard

VENDOR -> /vendor/dashboard

MANAGER -> /manager/dashboard

No dashboard route should be accessible without authentication.

Use protected routes.

Never bypass authentication using mock data.

---

# USER REGISTRATION

Signup fields:

* First Name
* Last Name
* Email
* Password
* Role

If role = VENDOR

Additional fields:

* Company Name
* Contact Person
* Email
* Phone
* GST Number
* Address

Create:

* User record
* Vendor record

Link Vendor to User.

---

# BUSINESS WORKFLOW

PROCUREMENT_OFFICER

Create RFQ
↓
Add RFQ Items
↓
Assign Vendors

VENDOR

Receive RFQ
↓
Submit Quotation

PROCUREMENT_OFFICER

Compare Quotations

MANAGER

Approve or Reject Quotation

APPROVED QUOTATION

Generate Purchase Order
↓
Generate Invoice
↓
Track Activity

---

# ROLE PERMISSIONS

ADMIN

* Manage Users
* Manage Vendors
* View Reports
* View Activity Logs

PROCUREMENT_OFFICER

* Create RFQ
* Edit RFQ
* Assign Vendors
* Compare Quotations
* Generate Purchase Orders
* Generate Invoices

VENDOR

* View Assigned RFQs
* Submit Quotations
* View Purchase Orders

MANAGER

* Approve Quotations
* Reject Quotations
* Monitor Procurement Workflow

---

# TECHNOLOGY STACK

Frontend

* React
* Vite
* TypeScript
* Ant Design
* React Router
* Axios
* Recharts

Backend

* Node.js
* Express
* TypeScript

Database

* PostgreSQL
* Neon

ORM

* Prisma

Authentication

* JWT
* bcrypt

PDF Generation

* PDFKit

Deployment

Frontend:

* Vercel

Backend:

* Railway

Package Manager:

* npm

Do not use Yarn.
Do not use pnpm.

---

# ENVIRONMENT VARIABLES

Stored in .env

Required:

DATABASE_URL

JWT_SECRET

PORT

Never hardcode secrets.

Always use process.env.

---

# DATABASE MODELS

User

Vendor

RFQ

RFQItem

Quotation

QuotationItem

Approval

PurchaseOrder

PurchaseOrderItem

Invoice

InvoiceItem

Notification

ActivityLog

---

# DATABASE STANDARDS

Use UUID primary keys.

Every table must contain:

* id
* createdAt
* updatedAt

Use Prisma relations.

Use foreign keys.

Use indexes on frequently queried fields.

Use PostgreSQL best practices.

Whenever schema changes:

1. Update schema.prisma
2. Generate Prisma Client
3. Create migration
4. Apply migration

Never create manual SQL tables if Prisma is being used.

---

# DATA RULES (MANDATORY)

Do not generate fake dashboard data.

Do not generate mock vendors.

Do not generate mock quotations.

Do not generate mock purchase orders.

Do not generate mock invoices.

All displayed data must come from Prisma and PostgreSQL.

Use seed data only when explicitly requested.

---

# ENUMS

Role

* ADMIN
* PROCUREMENT_OFFICER
* VENDOR
* MANAGER

VendorStatus

* ACTIVE
* INACTIVE
* BLOCKED

RFQStatus

* DRAFT
* OPEN
* CLOSED
* AWARDED

QuotationStatus

* DRAFT
* SUBMITTED
* ACCEPTED
* REJECTED

ApprovalStatus

* PENDING
* APPROVED
* REJECTED

PurchaseOrderStatus

* DRAFT
* ISSUED
* COMPLETED
* CANCELLED

InvoiceStatus

* DRAFT
* SENT
* PAID
* OVERDUE

---

# BACKEND ARCHITECTURE

backend/src/

controllers/
services/
routes/
middleware/
validators/
utils/
config/

Prisma must only be accessed through services.

Routes should never directly access Prisma.

Controllers should remain thin.

Business logic belongs in services.

---

# API STANDARDS

Base URL:

/api/v1

Routes:

/api/v1/auth
/api/v1/vendors
/api/v1/rfqs
/api/v1/quotations
/api/v1/approvals
/api/v1/purchase-orders
/api/v1/invoices

Use RESTful conventions.

---

# FRONTEND ARCHITECTURE

frontend/src/

pages/
components/
layouts/
services/
hooks/
types/
utils/

Pages:

* Login
* Signup
* Dashboard
* Vendors
* RFQs
* Quotations
* Approvals
* Purchase Orders
* Invoices
* Reports

Use React Router.

Use Axios.

Use Ant Design Layout.

---

# UI THEME

Professional Enterprise ERP

Primary Color:

#1677ff

Use:

* Ant Design Layout
* Ant Design Table
* Ant Design Form
* Ant Design Card
* Ant Design Modal

Responsive design required.

---

# HACKATHON SCOPE

Must Have:

* Authentication
* Role Based Access
* Dashboard
* Vendor Management
* RFQ Management
* Quotation Management
* Quotation Comparison
* Approval Workflow
* Purchase Order Generation
* Invoice Generation
* Activity Logs
* Reports Dashboard

Nice To Have:

* Email Sending
* Export Reports
* Advanced Analytics

Do Not Build:

* Multi-level approval chains
* Real-time chat
* Complex workflow engines
* Microservices

---

# CODING STANDARDS

Use TypeScript.

Use Prisma for all database operations.

Use Neon PostgreSQL.

Use Ant Design components.

Use responsive layouts.

Use clean and maintainable code.

Avoid duplicate code.

Generate complete implementations whenever possible.
