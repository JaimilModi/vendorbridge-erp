import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import RFQs from './pages/RFQs';
import Quotations from './pages/Quotations';
import Approvals from './pages/Approvals';
import PurchaseOrders from './pages/PurchaseOrders';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';

const RootRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'PROCUREMENT_OFFICER') return <Navigate to="/officer/dashboard" replace />;
  if (user.role === 'VENDOR') return <Navigate to="/vendor/dashboard" replace />;
  if (user.role === 'MANAGER') return <Navigate to="/manager/dashboard" replace />;
  
  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<RootRedirect />} />

          <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route path="admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><Dashboard /></ProtectedRoute>} />
            <Route path="officer/dashboard" element={<ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER']}><Dashboard /></ProtectedRoute>} />
            <Route path="vendor/dashboard" element={<ProtectedRoute allowedRoles={['VENDOR']}><Dashboard /></ProtectedRoute>} />
            <Route path="manager/dashboard" element={<ProtectedRoute allowedRoles={['MANAGER']}><Dashboard /></ProtectedRoute>} />

            <Route path="vendors" element={<ProtectedRoute allowedRoles={['ADMIN', 'PROCUREMENT_OFFICER']}><Vendors /></ProtectedRoute>} />
            <Route path="rfqs" element={<ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'VENDOR']}><RFQs /></ProtectedRoute>} />
            <Route path="quotations" element={<ProtectedRoute allowedRoles={['VENDOR']}><Quotations /></ProtectedRoute>} />
            <Route path="approvals" element={<ProtectedRoute allowedRoles={['MANAGER']}><Approvals /></ProtectedRoute>} />
            <Route path="purchase-orders" element={<ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'VENDOR']}><PurchaseOrders /></ProtectedRoute>} />
            <Route path="invoices" element={<ProtectedRoute allowedRoles={['PROCUREMENT_OFFICER', 'VENDOR']}><Invoices /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}><Reports /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
