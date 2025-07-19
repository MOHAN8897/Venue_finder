import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Home, Search, ArrowLeft, AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto text-center">
        {/* Error Icon */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="h-8 w-8 sm:h-10 sm:w-10 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-2">Page Not Found</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Action Buttons - Mobile Optimized */}
        <div className="space-y-3 sm:space-y-4">
          <Link to="/">
            <Button className="w-full h-12 sm:h-10 text-sm sm:text-base">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
          
          <Link to="/venues">
            <Button variant="outline" className="w-full h-12 sm:h-10 text-sm sm:text-base">
              <Search className="h-4 w-4 mr-2" />
              Browse Venues
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

        {/* Helpful Links - Mobile Optimized */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-3 sm:mb-4">
            Popular Pages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Link 
              to="/venues" 
              className="text-blue-600 hover:text-blue-700 text-sm sm:text-base hover:underline"
            >
              Browse Venues
            </Link>
            <Link 
              to="/contact" 
              className="text-blue-600 hover:text-blue-700 text-sm sm:text-base hover:underline"
            >
              Contact Us
            </Link>
            <Link 
              to="/about" 
              className="text-blue-600 hover:text-blue-700 text-sm sm:text-base hover:underline"
            >
              About Us
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
  );
};

export default NotFound;