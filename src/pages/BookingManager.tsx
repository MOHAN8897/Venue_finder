import React from 'react';
import BookingCalendar from '../components/BookingCalendar';
import { useLocation } from 'react-router-dom';

const BookingManager: React.FC = () => {
  // In a real app, we might get the venueId from the URL, a context, or props
  // For now, we'll simulate it or pass a default
  const location = useLocation();
  const venueId = location.state?.venueId || 'default-venue-id';
  const venueName = location.state?.venueName || 'All Bookings';

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Manager</h1>
          <p className="text-sm text-gray-600">
            Viewing calendar for: <span className="font-semibold">{venueName}</span>
          </p>
        </header>
        <BookingCalendar venueId={venueId} />
      </div>
    </div>
  );
};

export default BookingManager; 