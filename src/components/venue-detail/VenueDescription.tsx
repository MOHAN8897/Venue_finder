import React from 'react';
import { MapPin } from 'lucide-react';
interface ExtendedVenue {
  id: string;
  name?: string;
  venue_name?: string;
  description?: string;
  address?: string;
  [key: string]: any;
}

interface VenueDescriptionProps {
  venue: ExtendedVenue;
}

const VenueDescription: React.FC<VenueDescriptionProps> = ({ venue }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-2">{venue.venue_name || venue.name || 'Venue'}</h1>
      <div className="flex items-center text-gray-500 mb-4">
        <MapPin className="w-5 h-5 mr-2" />
        <span>{venue.address}</span>
      </div>
      <p className="text-gray-700 leading-relaxed">{venue.description || 'No description available.'}</p>
    </div>
  );
};

export default VenueDescription; 