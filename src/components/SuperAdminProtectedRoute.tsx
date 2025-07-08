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
  const { user, loading } = useAuth();
  const location = useLocation();

  const hasSuperAdminSession = typeof window !== 'undefined' && localStorage.getItem('super_admin_session') === 'true';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== 'owner' || !hasSuperAdminSession) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default SuperAdminProtectedRoute;
