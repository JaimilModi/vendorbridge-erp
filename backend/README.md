# VendorBridge Backend API

This directory contains the Express.js / Node.js backend for VendorBridge ERP.

## Technology Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL (via `pg` driver)
- **Authentication**: JSON Web Tokens (JWT) + bcryptjs
- **Validation**: Zod
- **Architecture**: Modular Service-Controller pattern

## Getting Started

### 1. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
```
Ensure you provide a valid Neon PostgreSQL connection string inside the `.env` file under `DATABASE_URL`.

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize the Database
This project uses pure SQL migrations. Run the initialization script to generate all required tables and sequences:
```bash
node src/db/migrate.js
```

### 4. Run the Server
For development (with live-reloading via nodemon):
```bash
npm run dev
```
For production:
```bash
npm start
```

## Folder Structure
- `src/config/`: Environment and database configuration.
- `src/db/`: SQL migration files and raw queries.
- `src/middleware/`: Global Express middlewares (Auth, Roles, Validation, Error Handling).
- `src/modules/`: Domain-driven module folders (e.g., `auth/`, `rfqs/`, `invoices/`). Each module contains its own `.routes.js`, `.controller.js`, and `.service.js` files.
- `src/utils/`: Shared utilities (Activity Logger, Response formatters, ID generators).

## Security Notes
- Roles are fixed strictly at the time of user registration and are fetched securely from the database on every request using the `authenticate` middleware.
- Never modify a role from the client-side.
- The `roleGuard.js` middleware handles all RBAC permissions logic.
