import React, { useState, useEffect } from 'react';
import { venueService } from '@/lib/venueService';
import { Link } from 'react-router-dom';

const VenueTest: React.FC = () => {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVenues = async () => {
      try {
        setLoading(true);
        
        // Get all venues
        const allVenues = await venueService.getAllVenues();
        console.log('All venues from getAllVenues:', allVenues);
        setVenues(allVenues || []);

        // Test getVenueById for first venue
        if (allVenues && allVenues.length > 0) {
          const firstVenue = allVenues[0];
          console.log('Testing getVenueById for venue:', firstVenue.id);
          const singleVenue = await venueService.getVenueById(firstVenue.id);
          console.log('Single venue from getVenueById:', singleVenue);
        }

      } catch (error) {
        console.error('Error checking venues:', error);
      } finally {
        setLoading(false);
      }
    };

    checkVenues();
  }, []);

  if (loading) {
    return <div className="p-8">Loading venues...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Venue Database Test</h1>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Found {venues.length} venues:</h2>
        {venues.length === 0 && (
          <p className="text-red-500">No venues found in database!</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((venue) => (
          <div key={venue.id} className="border p-4 rounded-lg">
            <h3 className="font-bold text-lg mb-2">
              {venue.venue_name || venue.name || 'No name'}
            </h3>
            <p className="text-gray-600 mb-2">{venue.address || 'No address'}</p>
            <p className="text-sm text-gray-500 mb-2">
              Type: {venue.venue_type || venue.type || 'No type'}
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Price: ₹{venue.price_per_hour || venue.hourly_rate || 0}/hour
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Status: {venue.status || 'No status'} | 
              Approval: {venue.approval_status || venue.is_approved ? 'Approved' : 'Not approved'}
            </p>
            <div className="flex gap-2 mt-3">
              <Link 
                to={`/venue/${venue.id}`} 
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
              >
                View Details
              </Link>
              <Link 
                to={`/book/${venue.id}`} 
                className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueTest; 