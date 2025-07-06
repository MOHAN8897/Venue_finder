import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    // Check if the user's role is 'owner' or 'super_admin'
    if (user.role === 'owner' || user.role === 'super_admin') {
      console.log('[VenueOwnerProtectedRoute] User is authorized (owner or super_admin).');
      setIsAuthorizedOwner(true);
    } else {
      console.log('[VenueOwnerProtectedRoute] User is NOT authorized, role:', user.role, 'redirecting to list-venue.');
      navigate('/list-venue'); // Or '/unauthorized' if preferred
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

  console.log('[VenueOwnerProtectedRoute] Authorized, rendering children.');
  return <>{children}</>;
};

export default VenueOwnerProtectedRoute; 