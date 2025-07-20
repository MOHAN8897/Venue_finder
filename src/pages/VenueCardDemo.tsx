import React from 'react';
import { useNavigate } from 'react-router-dom';
import VenueCard from '../components/VenueCard';

// Sample venue data for demo
const sampleVenues = [
  {
    id: '1',
    name: 'Grand Conference Center',
    address: '123 Business District, Downtown, City Center, 12345',
    capacity: 500,
    amenities: ['wifi', 'parking', 'ac', 'catering', 'av_equipment', 'sound_system', 'projector', 'tables_chairs'],
    rating: 4.8,
    price_per_day: 25000,
    images: [
      'https://picsum.photos/400/225?random=1',
      'https://picsum.photos/400/225?random=2',
      'https://picsum.photos/400/225?random=3'
    ]
  },
  {
    id: '2',
    name: 'Elegant Wedding Hall',
    address: '456 Luxury Avenue, Premium Location, 67890',
    capacity: 200,
    amenities: ['catering', 'dance_floor', 'photo_booth', 'outdoor_games', 'parking', 'ac'],
    rating: 4.9,
    price_per_day: 35000,
    images: [
      'https://picsum.photos/400/225?random=4',
      'https://picsum.photos/400/225?random=5'
    ]
  },
  {
    id: '3',
    name: 'Modern Tech Hub',
    address: '789 Innovation Street, Tech Park, 11111',
    capacity: 100,
    amenities: ['wifi', 'av_equipment', 'projector', 'sound_system', 'microphones', 'tables_chairs'],
    rating: 4.6,
    price_per_day: 15000,
    images: [
      'https://picsum.photos/400/225?random=6',
      'https://picsum.photos/400/225?random=7',
      'https://picsum.photos/400/225?random=8',
      'https://picsum.photos/400/225?random=9'
    ]
  },
  {
    id: '4',
    name: 'Rustic Farmhouse',
    address: '321 Country Road, Rural Area, 22222',
    capacity: 150,
    amenities: ['outdoor_games', 'parking', 'catering', 'outdoor_furniture', 'storage_space'],
    rating: 4.7,
    price_per_day: 18000,
    images: [
      'https://picsum.photos/400/225?random=10'
    ]
  },
  {
    id: '5',
    name: 'Sports Complex',
    address: '654 Athletic Boulevard, Sports District, 33333',
    capacity: 300,
    amenities: ['parking', 'ac', 'sound_system', 'tables_chairs', 'storage_space', 'first_aid'],
    rating: 4.5,
    price_per_day: 22000,
    images: [
      'https://picsum.photos/400/225?random=11',
      'https://picsum.photos/400/225?random=12',
      'https://picsum.photos/400/225?random=13'
    ]
  },
  {
    id: '6',
    name: 'Intimate Meeting Room',
    address: '987 Corporate Plaza, Business Center, 44444',
    capacity: 50,
    amenities: ['wifi', 'av_equipment', 'projector', 'tables_chairs', 'coffee'],
    rating: 4.4,
    price_per_day: 8000,
    images: [
      'https://picsum.photos/400/225?random=14',
      'https://picsum.photos/400/225?random=15'
    ]
  }
];

const VenueCardDemo: React.FC = () => {
  const navigate = useNavigate();

  const handleViewDetails = (venue: any) => {
    console.log('View details for venue:', venue.name);
    // You can navigate to venue detail page or open modal
    alert(`Viewing details for: ${venue.name}`);
  };

  const handleBookNow = (venueId: string) => {
    console.log('Book now for venue ID:', venueId);
    // You can navigate to booking page
    alert(`Booking venue with ID: ${venueId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Responsive Venue Cards Demo
          </h1>
          <p className="text-lg text-gray-600">
            Showcasing the new venue card layout with Swiper.js carousel
          </p>
        </div>

        {/* Responsive Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {sampleVenues.map((venue) => (
            <VenueCard
              key={venue.id}
              venue={venue}
              onViewDetails={handleViewDetails}
              onBookNow={handleBookNow}
            />
          ))}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Previous Page
          </button>
        </div>
      </div>
    </div>
  );
};

export default VenueCardDemo; 