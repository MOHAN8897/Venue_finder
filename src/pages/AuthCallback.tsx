import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refreshUserProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('Handling auth callback...');
        console.log('Current URL:', window.location.href);
        
        // Check if we have auth parameters in the URL
        const urlParams = new URLSearchParams(location.search);
        const hashParams = new URLSearchParams(location.hash.substring(1));
        
        const hasAuthParams = urlParams.has('access_token') || 
                             urlParams.has('error') || 
                             hashParams.has('access_token') || 
                             hashParams.has('error');
        
        console.log('Has auth params:', hasAuthParams);
        
        if (hasAuthParams) {
          // Handle the auth callback
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Auth callback error:', error);
            setError('Authentication failed. Please try again.');
            setTimeout(() => navigate('/signin', { replace: true }), 3000);
            return;
          }
          
          if (data.session) {
            console.log('Session obtained successfully');
            // Refresh user profile
            if (refreshUserProfile) {
              await refreshUserProfile();
            }
            // Redirect to home page
            navigate('/', { replace: true });
          } else {
            console.log('No session found');
            setError('Authentication failed. Please try again.');
            setTimeout(() => navigate('/signin', { replace: true }), 3000);
          }
        } else {
          // No auth params, check if user is already authenticated
          const { data: { session } } = await supabase.auth.getSession();
          if (session && refreshUserProfile) {
            await refreshUserProfile();
            navigate('/', { replace: true });
          } else {
            navigate('/signin', { replace: true });
          }
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/signin', { replace: true }), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, refreshUserProfile, location]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md">
          <div className="bg-white py-6 sm:py-8 px-4 shadow rounded-lg sm:px-10">
            <div className="text-center">
              <div className="text-red-600 mb-3 sm:mb-4">
                <svg className="h-10 w-10 sm:h-12 sm:w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Authentication Error</h3>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4 px-2">{error}</p>
              <p className="text-xs text-gray-500">Redirecting to sign in page...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 shadow rounded-lg sm:px-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-sm sm:text-base text-gray-700">Completing authentication...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 