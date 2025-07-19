import React from 'react';
import OfferManager from '../components/OfferManager';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Tag, Plus, Filter, Search } from 'lucide-react';

const OfferManagerPage: React.FC = () => {
  const location = useLocation();
  const venueId = location.state?.venueId || 'default-venue-id';
  const venueName = location.state?.venueName || 'this venue';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link 
            to="/manage-venues" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Venues
          </Link>
        </div>

        {/* Header - Mobile Optimized */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Tag className="h-6 w-6 sm:h-8 sm:w-8" />
                Offer Management
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Creating and managing offers for: <span className="font-semibold">{venueName}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10 sm:h-9">
                <Search className="h-4 w-4 mr-2" />
                Search
              </button>
              <button className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10 sm:h-9">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </button>
              <button className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10 sm:h-9">
                <Plus className="h-4 w-4 mr-2" />
                New Offer
              </button>
            </div>
          </div>
        </header>

        {/* Offer Manager Component */}
        <main className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <OfferManager />
        </main>

        {/* Mobile Quick Actions */}
        <div className="mt-6 sm:hidden">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="inline-flex items-center justify-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10">
                <Tag className="h-4 w-4 mr-2" />
                View Offers
              </button>
              <button className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 h-10">
                <Plus className="h-4 w-4 mr-2" />
                New Offer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferManagerPage; 