import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface VenueOwnerProtectedRouteProps {
  children: React.ReactNode;
}

const VenueOwnerProtectedRoute: React.FC<VenueOwnerProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAuthorizedOwner, setIsAuthorizedOwner] = useState(false);

  useEffect(() => {
    console.log('[VenueOwnerProtectedRoute] useEffect triggered. authLoading:', authLoading, 'user:', user);

    if (authLoading) {
      console.log('[VenueOwnerProtectedRoute] Auth loading, returning early.');
      return;
    }
      
      if (!user) {
      console.log('[VenueOwnerProtectedRoute] User not found, redirecting to signin.');
        navigate('/signin');
        return;
      }

    console.log('[VenueOwnerProtectedRoute] Checking user role:', user.role);
    // Check if the user's role is 'venue_owner' (partner) or 'owner' (website owner)
    if (user.role === 'venue_owner' || user.role === 'owner') {
      console.log('[VenueOwnerProtectedRoute] User is authorized (venue_owner or owner).');
      setIsAuthorizedOwner(true);
    } else {
      console.log('[VenueOwnerProtectedRoute] User is NOT authorized, role:', user.role, 'redirecting to list-venue.');
      setIsAuthorizedOwner(false);
    }
    setCheckingRole(false);
    console.log('[VenueOwnerProtectedRoute] Finished checking role. isAuthorizedOwner:', isAuthorizedOwner);
  }, [user, authLoading, navigate, isAuthorizedOwner]); // Added isAuthorizedOwner to dependencies for consistent logging

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Verifying owner status..." />
          <p className="mt-4 text-gray-600">Checking your permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorizedOwner) {
    console.log('[VenueOwnerProtectedRoute] Not authorized, returning null (should have redirected).');
    return null; // Should have redirected via navigate() if not authorized
  }

  if (user && user.role === 'owner') {
    // Block owner from accessing venue owner routes
    return <Navigate to="/super-admin/dashboard" replace />;
  }

  console.log('[VenueOwnerProtectedRoute] Authorized, rendering children.');
  return <>{children}</>;
};

export default VenueOwnerProtectedRoute; 