import React from 'react';
import OfferManager from '../components/OfferManager';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const OfferManagerPage: React.FC = () => {
  const location = useLocation();
  const venueId = location.state?.venueId || 'default-venue-id';
  const venueName = location.state?.venueName || 'this venue';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
            <Link to="/owner-dashboard" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
        </div>
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
          <p className="text-sm text-gray-600">
            Creating and managing offers for: <span className="font-semibold">{venueName}</span>
          </p>
        </header>
        <OfferManager venueId={venueId} />
      </div>
    </div>
  );
};

export default OfferManagerPage; 