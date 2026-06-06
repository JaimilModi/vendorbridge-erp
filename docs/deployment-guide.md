# Deployment Guide

VendorBridge is built for modern cloud infrastructure. Follow these instructions to deploy the database on Neon, the backend on Render (or similar Node.js host), and the frontend on Vercel.

## 1. Database Deployment (Neon)

Neon is a serverless Postgres platform that scales automatically.

1. **Sign Up/Login**: Navigate to [console.neon.tech](https://console.neon.tech).
2. **Create Project**: Create a new project (e.g., `vendorbridge-db`).
3. **Get Connection String**: Once the database is initialized, copy the Node.js connection string. It will look like this:
   `postgresql://user:password@ep-host.region.aws.neon.tech/dbname?sslmode=require`
4. **Run Migrations Locally**:
   Before deploying your backend, run the schema migrations from your local machine targeting the remote Neon database.
   ```bash
   cd backend
   # Add the Neon string to your .env file
   node src/db/migrate.js
   ```

## 2. Backend Deployment (Render)

Render is an excellent PaaS for hosting Express applications.

1. **Sign Up/Login**: Navigate to [render.com](https://render.com).
2. **New Web Service**: Click "New" -> "Web Service".
3. **Connect Repository**: Link your GitHub repository.
4. **Configuration**:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Root Directory**: `backend`
5. **Environment Variables**: Add the following under "Advanced":
   - `NODE_ENV`: `production`
   - `PORT`: `5000` (or leave default, Render assigns one automatically)
   - `DATABASE_URL`: Your Neon Postgres connection string.
   - `JWT_SECRET`: A secure randomly generated 64-character string.
   - `CORS_ORIGIN`: Your frontend URL (e.g., `https://vendorbridge.vercel.app`). *You may need to update this after deploying the frontend.*
6. **Deploy**: Click "Create Web Service". Wait for the deployment to finish and copy your Backend URL (e.g., `https://vendorbridge-api.onrender.com`).

## 3. Frontend Deployment (Vercel)

Vercel provides seamless deployment for Vite and React applications.

1. **Sign Up/Login**: Navigate to [vercel.com](https://vercel.com).
2. **New Project**: Click "Add New..." -> "Project".
3. **Import Repository**: Select your GitHub repository.
4. **Configuration**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. **Environment Variables**: Add your backend API URL.
   - `VITE_API_URL`: `https://vendorbridge-api.onrender.com/api`
6. **Deploy**: Click "Deploy".

## 4. Final Security Verification

Once all systems are online:
1. Ensure the backend `CORS_ORIGIN` matches the exact URL of your Vercel frontend.
2. Verify that `NODE_ENV=production` is set on the backend to hide detailed stack traces from potential attackers.
3. Access the frontend URL, create an Admin account, and test the full RFQ -> PO workflow.
