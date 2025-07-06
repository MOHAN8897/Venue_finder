import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false); // Initialize to false, will be set true in check function
  const navigate = useNavigate();

  const checkSuperAdminAuth = async () => {
    console.log('checkSuperAdminAuth called'); // DEBUG
    setLoading(true); // Set loading true at the start of every check
    try {
      let session = localStorage.getItem('superAdminSession');
      if (!session) {
        session = sessionStorage.getItem('superAdminSession');
      }
      // Check Supabase session as well
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();
      if (!session || !supabaseSession) {
        setIsAuthenticated(false);
        return;
      }

      console.log('SuperAdminProtectedRoute: session found (in checkSuperAdminAuth):', session); // DEBUG

      const sessionData = JSON.parse(session);
      console.log('SuperAdminProtectedRoute: parsed sessionData (in checkSuperAdminAuth):', sessionData); // DEBUG

      const loginTime = new Date(sessionData.loginTime);
      const currentTime = new Date();
      const hoursDiff = (currentTime.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        console.log('Session expired, clearing.'); // DEBUG
        localStorage.removeItem('superAdminSession');
        sessionStorage.removeItem('superAdminSession');
        setIsAuthenticated(false);
        return;
      }

      console.log('Session valid, authenticating.'); // DEBUG
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error checking super admin authentication (in checkSuperAdminAuth):', error); // DEBUG
      localStorage.removeItem('superAdminSession');
      sessionStorage.removeItem('superAdminSession');
      setIsAuthenticated(false);
    } finally {
      setLoading(false); // Always set loading false at the end
    }
  };

  useEffect(() => {
    // Initial check on mount
    checkSuperAdminAuth();

    // Event listener for localStorage changes (native 'storage' event)
    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === 'superAdminSession') {
        console.log('localStorage ' + event.key + ' changed, re-checking auth (from storage event).', event.newValue); // DEBUG
        checkSuperAdminAuth();
      }
    };

    // Event listener for sessionStorage changes (custom event)
    const handleSessionStorageUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.key === 'superAdminSession') {
        console.log('sessionStorage ' + customEvent.detail.key + ' updated, re-checking auth (from custom event).', customEvent.detail.newValue); // DEBUG
        checkSuperAdminAuth();
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('sessionStorageUpdated', handleSessionStorageUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('sessionStorageUpdated', handleSessionStorageUpdate as EventListener);
    };
  }, []); // Empty dependency array, events will trigger re-checks

  // Effect to handle redirection based on authentication status
  useEffect(() => {
    if (isAuthenticated === false) {
      console.log('isAuthenticated is false, navigating to login.'); // DEBUG
      navigate('/super-admin/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show loading spinner while authentication status is being determined
  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <p className="text-blue-200">Verifying super admin access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not loading, it means checkSuperAdminAuth set isAuthenticated to false
  // and the useEffect above should have navigated. This is a fallback to show the access denied screen
  // in case navigation fails or is delayed.
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-blue-200 mb-6">
            You must be logged in as a super administrator to access this page.
          </p>
          <button
            onClick={() => navigate('/super-admin/login', { replace: true })}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center justify-center mx-auto"
          >
            <Shield className="h-5 w-5 mr-2" />
            Go to Super Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Super Admin Header */}
      <div className="bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="h-8 w-8 mr-3" />
              <h1 className="text-xl font-bold">Super Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-blue-200">Super Administrator</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dashboard Content */}
      {children}
    </div>
  );
};

export default SuperAdminProtectedRoute; 