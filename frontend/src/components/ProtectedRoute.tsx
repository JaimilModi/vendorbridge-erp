import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('ADMIN' | 'PROCUREMENT_OFFICER' | 'VENDOR' | 'MANAGER')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If unauthorized, redirect to their role-specific dashboard instead of blank page
    let dashboardPath = '/login';
    if (user.role === 'ADMIN') dashboardPath = '/admin/dashboard';
    else if (user.role === 'PROCUREMENT_OFFICER') dashboardPath = '/officer/dashboard';
    else if (user.role === 'VENDOR') dashboardPath = '/vendor/dashboard';
    else if (user.role === 'MANAGER') dashboardPath = '/manager/dashboard';
    
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
};
