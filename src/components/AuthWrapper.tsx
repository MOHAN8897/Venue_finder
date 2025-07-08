import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import LoadingSpinner from './LoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  loadingText?: string;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({
  children,
  requireAuth = true,
  fallback,
  loadingText = 'Loading...'
}) => {
  const { user, loading: authLoading, version } = useAuth();
  const { isConnected, isLoading: dbLoading, error: dbError, refreshConnection } = useDatabase();
  const [retryCount, setRetryCount] = useState(0);
  const [showFallback, setShowFallback] = useState(false);
  const [showError, setShowError] = useState(false);

  // Reset states when version changes
  useEffect(() => {
    setShowFallback(false);
    setShowError(false);
  }, [version]);

  // Show fallback after a delay if still loading
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (authLoading || dbLoading) {
      // Reset error state when loading starts
      setShowError(false);
      
      timer = setTimeout(() => {
        if (authLoading || dbLoading) {
          setShowFallback(true);
        }
      }, 3000); // Show fallback after 3 seconds
    } else {
      setShowFallback(false);
      
      // Show error after a delay if not connected
      if (!isConnected && !showError) {
        timer = setTimeout(() => {
          setShowError(true);
        }, 1000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [authLoading, dbLoading, isConnected]);

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    setShowError(false);
    await refreshConnection();
  };

  // Show loading state
  if (authLoading || dbLoading) {
    if (showFallback && fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text={loadingText} />
      </div>
    );
  }

  // Show database connection error
  if (!isConnected && showError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">
            {dbError || 'Unable to connect to the database. Please check your internet connection.'}
          </p>
          <button
            onClick={handleRetry}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={retryCount > 3}
          >
            <RefreshCw className={`h-4 w-4 inline mr-2 ${dbLoading ? 'animate-spin' : ''}`} />
            {retryCount > 3 ? 'Please refresh the page' : 'Retry Connection'}
          </button>
        </div>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user && !authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-md">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            You need to be logged in to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/signin'}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

export default AuthWrapper; 