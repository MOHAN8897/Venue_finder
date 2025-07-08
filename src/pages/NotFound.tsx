import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="text-8xl font-bold text-gray-200 mb-4">404</div>
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          
          <div className="space-y-4">
            <Link
              to="/"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Go to Homepage</span>
            </Link>
            
            <Link
              to="/venues"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center space-x-2"
            >
              <Search className="h-5 w-5" />
              <span>Browse Venues</span>
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="w-full text-blue-600 hover:text-blue-700 py-3 px-4 font-semibold flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Go Back</span>
            </button>
          </div>
        </div>
        
        {/* Helpful Links */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm mb-4">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/venues?type=cricket-box" className="text-blue-600 hover:text-blue-700">
              Cricket Boxes
            </Link>
            <Link to="/venues?type=farmhouse" className="text-blue-600 hover:text-blue-700">
              Farmhouses
            </Link>
            <Link to="/venues?type=banquet-hall" className="text-blue-600 hover:text-blue-700">
              Banquet Halls
            </Link>
            <Link to="/register?role=owner" className="text-blue-600 hover:text-blue-700">
              List Your Venue
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;