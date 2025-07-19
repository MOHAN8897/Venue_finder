import React from 'react';
import { Wifi, Car, Wind } from 'lucide-react';

interface VenueAmenitiesProps {
  amenities: string[];
}

const amenityIcons: { [key: string]: React.ReactNode } = {
  'Free Wi-Fi': <Wifi className="w-5 h-5 text-blue-500" />,
  'Parking': <Car className="w-5 h-5 text-blue-500" />,
  'Air Conditioning': <Wind className="w-5 h-5 text-blue-500" />,
  // Add more icons as needed
};

const VenueAmenities: React.FC<VenueAmenitiesProps> = ({ amenities }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Amenities</h2>
      <div className="grid grid-cols-2 gap-4">
        {amenities.map((amenity) => (
          <div key={amenity} className="flex items-center">
            {amenityIcons[amenity] || <div className="w-5 h-5 bg-gray-300 rounded-full" />}
            <span className="ml-3 text-gray-700">{amenity}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VenueAmenities; 