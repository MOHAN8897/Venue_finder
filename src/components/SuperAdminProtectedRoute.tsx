import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

interface SuperAdminProtectedRouteProps {
  children: React.ReactNode;
}

const SuperAdminProtectedRoute: React.FC<SuperAdminProtectedRouteProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSuperAdminAuth = () => {
      try {
        const session = localStorage.getItem('superAdminSession');
        if (!session) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        const sessionData = JSON.parse(session);
        const loginTime = new Date(sessionData.loginTime);
        const currentTime = new Date();
        const hoursDiff = (currentTime.getTime() - loginTime.getTime()) / (1000 * 60 * 60);

        // Check if session is expired (24 hours)
        if (hoursDiff > 24) {
          localStorage.removeItem('superAdminSession');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        setIsAuthenticated(true);
        setLoading(false);
      } catch (error) {
        console.error('Error checking super admin authentication:', error);
        localStorage.removeItem('superAdminSession');
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkSuperAdminAuth();
  }, []);

  if (loading) {
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
            onClick={() => navigate('/super-admin/login')}
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