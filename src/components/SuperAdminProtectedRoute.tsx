import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/super-admin/login' 
}) => {
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
  const location = useLocation();

  if (userRole !== 'administrator') {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
