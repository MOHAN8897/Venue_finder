import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, LogIn, Shield, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Error Icon */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-yellow-100 rounded-full mb-4">
            <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-yellow-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Unauthorized Access</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            You don't have permission to access this page. Please sign in with the appropriate account.
          </p>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4">
          <Link to="/signin">
            <Button className="w-full h-12 sm:h-10 text-sm sm:text-base">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          </Link>
          
          <Link to="/">
            <Button variant="outline" className="w-full h-12 sm:h-10 text-sm sm:text-base">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>

          <Button 
            variant="ghost" 
            onClick={() => window.history.back()}
            className="w-full h-12 sm:h-10 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>

        {/* Helpful Information - Mobile Optimized */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">
            Need Help?
          </h3>
          <div className="space-y-2 sm:space-y-3">
            <p className="text-gray-600 text-xs sm:text-sm">
              If you believe you should have access to this page, please contact support.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <Link 
                to="/contact" 
                className="text-blue-600 hover:text-blue-700 text-sm sm:text-base hover:underline"
              >
                Contact Support
              </Link>
              <Link 
                to="/help" 
                className="text-blue-600 hover:text-blue-700 text-sm sm:text-base hover:underline"
              >
                Help Center
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;