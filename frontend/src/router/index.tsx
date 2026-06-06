import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROLES } from '../constants';

// Layout
import AppShell from '../components/layout/AppShell';

// Auth Pages
import LandingPage from '../pages/auth/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

// Feature Pages
import DashboardPage from '../pages/dashboard/DashboardPage';
import VendorListPage from '../pages/vendors/VendorListPage';
import VendorDetailPage from '../pages/vendors/VendorDetailPage';
import VendorFormPage from '../pages/vendors/VendorFormPage';
import RFQListPage from '../pages/rfqs/RFQListPage';
import RFQDetailPage from '../pages/rfqs/RFQDetailPage';
import RFQFormPage from '../pages/rfqs/RFQFormPage';
import QuotationListPage from '../pages/quotations/QuotationListPage';
import QuotationDetailPage from '../pages/quotations/QuotationDetailPage';
import QuotationSubmitPage from '../pages/quotations/QuotationSubmitPage';
import QuotationComparePage from '../pages/quotations/QuotationComparePage';
import ApprovalQueuePage from '../pages/approvals/ApprovalQueuePage';
import ApprovalDetailPage from '../pages/approvals/ApprovalDetailPage';
import POListPage from '../pages/purchase-orders/POListPage';
import PODetailPage from '../pages/purchase-orders/PODetailPage';
import InvoiceListPage from '../pages/invoices/InvoiceListPage';
import InvoiceDetailPage from '../pages/invoices/InvoiceDetailPage';
import ReportsPage from '../pages/reports/ReportsPage';
import ActivityLogPage from '../pages/activity/ActivityLogPage';

// Error Pages
import NotFoundPage from '../pages/errors/NotFoundPage';
import UnauthorizedPage from '../pages/errors/UnauthorizedPage';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';

export const router = createBrowserRouter([
  // Public Routes
  { path: '/', element: <LandingPage /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/unauthorized', element: <UnauthorizedPage /> },

  // Protected App Routes
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          // Common Dashboard (Accessible by all, content varies by role)
          { path: 'dashboard', element: <DashboardPage /> },

          // Vendors
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER]} />,
            children: [
              { path: 'vendors', element: <VendorListPage /> },
              { path: 'vendors/new', element: <VendorFormPage /> },
              { path: 'vendors/:id', element: <VendorDetailPage /> },
            ],
          },

          // RFQs
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER]} />,
            children: [
              { path: 'rfqs', element: <RFQListPage /> },
              { path: 'rfqs/new', element: <RFQFormPage /> },
              { path: 'rfqs/:id', element: <RFQDetailPage /> },
            ],
          },

          // Quotations
          { path: 'quotations', element: <QuotationListPage /> }, // All roles see their view
          { path: 'quotations/:id', element: <QuotationDetailPage /> }, // All roles
          {
            path: 'quotations/submit/:rfqId',
            element: (
              <RoleRoute allowedRoles={[ROLES.VENDOR]} />
            ),
            children: [{ index: true, element: <QuotationSubmitPage /> }],
          },
          {
            path: 'quotations/compare/:rfqId',
            element: (
              <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER]} />
            ),
            children: [{ index: true, element: <QuotationComparePage /> }],
          },

          // Approvals
          {
            path: 'approvals',
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]} />,
            children: [
              { index: true, element: <ApprovalQueuePage /> },
              { path: ':id', element: <ApprovalDetailPage /> },
            ],
          },

          // Purchase Orders
          {
            path: 'purchase-orders',
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR]} />,
            children: [
              { index: true, element: <POListPage /> },
              { path: ':id', element: <PODetailPage /> },
            ],
          },

          // Invoices
          {
            path: 'invoices',
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.PROCUREMENT_OFFICER, ROLES.MANAGER, ROLES.VENDOR]} />,
            children: [
              { index: true, element: <InvoiceListPage /> },
              { path: ':id', element: <InvoiceDetailPage /> },
            ],
          },

          // Analytics & Logs
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN, ROLES.MANAGER]} />,
            children: [{ path: 'reports', element: <ReportsPage /> }],
          },
          {
            element: <RoleRoute allowedRoles={[ROLES.ADMIN]} />,
            children: [{ path: 'activity', element: <ActivityLogPage /> }],
          },
        ],
      },
    ],
  },

  // Fallback
  { path: '*', element: <NotFoundPage /> },
]);
