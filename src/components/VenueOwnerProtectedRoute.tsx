import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { VenueSubmissionService } from '../lib/venueSubmissionService';
import LoadingSpinner from './LoadingSpinner';

interface VenueOwnerProtectedRouteProps {
  children: React.ReactNode;
}

const VenueOwnerProtectedRoute: React.FC<VenueOwnerProtectedRouteProps> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingVenues, setCheckingVenues] = useState(true);
  const [hasVenues, setHasVenues] = useState(false);

  useEffect(() => {
    const checkUserVenues = async () => {
      if (authLoading) return;
      
      if (!user) {
        navigate('/signin');
        return;
      }

      try {
        const userVenues = await VenueSubmissionService.getUserSubmittedVenues();
        setHasVenues(userVenues.length > 0);
        
        if (userVenues.length === 0) {
          // Redirect to list venue page if user has no venues
          navigate('/list-venue');
          return;
        }
      } catch (error) {
        console.error('Error checking user venues:', error);
        // On error, redirect to list venue page as fallback
        navigate('/list-venue');
        return;
      } finally {
        setCheckingVenues(false);
      }
    };

    checkUserVenues();
  }, [user, authLoading, navigate]);

  if (authLoading || checkingVenues) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" text="Checking your venues..." />
          <p className="mt-4 text-gray-600">Verifying venue access...</p>
        </div>
      </div>
    );
  }

  if (!hasVenues) {
    return null; // Will redirect to list venue page
  }

  return <>{children}</>;
};

export default VenueOwnerProtectedRoute; 