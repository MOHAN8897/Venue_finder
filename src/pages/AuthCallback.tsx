import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, refreshUserProfile } = useAuth();

  useEffect(() => {
    // Force session/user refresh on mount
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session && refreshUserProfile) {
        await refreshUserProfile();
      }
    })();
  }, [refreshUserProfile]);

  useEffect(() => {
    if (!loading && user) {
      // User is authenticated and profile is loaded, redirect
      navigate('/', { replace: true });
    } else if (!loading && !user) {
      // Not authenticated, redirect to sign in
      navigate('/signin', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700">Completing authentication...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback; 