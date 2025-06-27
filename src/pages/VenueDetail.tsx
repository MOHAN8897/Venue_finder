import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Users, Calendar, Clock, Wifi, Car, Shield, Phone, Mail, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';

const VenueDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Blank data with unique IDs for future Supabase integration
  const venue = {
    id: id || 'venue-detail-1',
    name: 'Sample Venue Detail',
    description: 'This is a sample venue description. Connect to Supabase to show real data. This venue offers excellent facilities and is perfect for various events.',
    type: 'cricket-box',
    location: {
      address: 'Sample Address, Sample City',
      city: 'Sample City',
      state: 'Sample State',
      pincode: '123456',
      coordinates: { lat: 28.4595, lng: 77.0266 }
    },
    images: [
      'https://via.placeholder.com/800x400?text=Venue+Image+1',
      'https://via.placeholder.com/800x400?text=Venue+Image+2',
      'https://via.placeholder.com/800x400?text=Venue+Image+3'
    ],
    amenities: ['Parking', 'AC', 'WiFi', 'Security', 'Catering'],
    specifications: { 
      capacity: 100, 
      area: '2000 sq ft', 
      dimensions: '100x60 feet' 
    },
    pricing: { hourlyRate: 1500, currency: 'INR' },
    rating: 4.5,
    reviewCount: 50,
    verified: true,
    availability: [] as Array<{id: string, date: string, available: boolean, price: number}>,
    google_maps_embed_code: '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3505.3744747474747!2d77.0266!3d28.4595!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390d1a4e5d335d33%3A0x390d1a4e5d335d33!2sSample%20Address%2C%20Sample%20City%2C%20Sample%20State%20123456!5e0!3m2!1sen!2sin!4v1630454400000!5m2!1sen!2sin" width="100%" height="300" style="border:0;" allowfullscreen="" loading="lazy"></iframe>'
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % venue.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + venue.images.length) % venue.images.length);
  };

  const handleBookNow = () => {
    setShowBookingModal(true);
  };

  const confirmBooking = () => {
    // Here you would handle the actual booking logic
    alert('Booking confirmed! You will be redirected to payment.');
    setShowBookingModal(false);
  };

  const amenityIcons: { [key: string]: React.ReactNode } = {
    'Wifi': <Wifi className="h-5 w-5" />,
    'WiFi': <Wifi className="h-5 w-5" />,
    'Parking': <Car className="h-5 w-5" />,
    'Security': <Shield className="h-5 w-5" />,
    'AC': <Calendar className="h-5 w-5" />,
  };

  // Generate next 7 days for date selection
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        isToday: i === 0
      });
    }
    return days;
  };

  return (
    <div id="venue-detail-page" className="min-h-screen bg-gray-50">
      {/* Image Gallery */}
      <div id="venue-image-gallery" className="relative h-96 bg-gray-900">
        <img
          src={venue.images[currentImageIndex]}
          alt={venue.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Navigation Arrows */}
        {venue.images.length > 1 && (
          <>
            <button
              id="prev-image-button"
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              id="next-image-button"
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Image Indicators */}
        <div id="image-indicators" className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {venue.images.map((_, index) => (
            <button
              key={index}
              id={`image-indicator-${index}`}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div id="action-buttons" className="absolute top-4 right-4 flex space-x-2">
          <button id="favorite-button" className="bg-white/80 hover:bg-white rounded-full p-2 transition-colors">
            <Heart className="h-6 w-6" />
          </button>
          <button id="share-button" className="bg-white/80 hover:bg-white rounded-full p-2 transition-colors">
            <Share2 className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Venue Info */}
            <div id="venue-info" className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center space-x-2 text-gray-500 mb-2">
                    <MapPin className="h-5 w-5" />
                    <span>{venue.location.address}, {venue.location.city}</span>
                  </div>
                  <h1 id="venue-name" className="text-3xl font-bold text-gray-900 mb-2">{venue.name}</h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{venue.rating}</span>
                      <span className="text-gray-500">({venue.reviewCount} reviews)</span>
                    </div>
                    {venue.verified && (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div id="venue-price" className="text-3xl font-bold text-blue-600">₹{venue.pricing.hourlyRate}</div>
                  <div className="text-gray-500">per hour</div>
                </div>
              </div>

              <p id="venue-description" className="text-gray-600 leading-relaxed mb-6">
                {venue.description}
              </p>

              {/* Specifications */}
              <div id="venue-specifications" className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Capacity</div>
                    <div className="text-sm text-gray-500">Up to {venue.specifications.capacity} people</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Area</div>
                    <div className="text-sm text-gray-500">{venue.specifications.area}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-semibold text-gray-900">Dimensions</div>
                    <div className="text-sm text-gray-500">{venue.specifications.dimensions}</div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div id="venue-amenities">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {venue.amenities.map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-3">
                      {amenityIcons[amenity] || <div className="w-5 h-5 bg-gray-300 rounded" />}
                      <span className="text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Embed Section */}
            {venue.google_maps_embed_code && (
              <div id="venue-map-embed" className="bg-white rounded-2xl p-8 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Map</h3>
                <div className="w-full overflow-x-auto">
                  <div
                    className="venue-map-iframe-wrapper"
                    style={{ maxWidth: '100%', minHeight: 300 }}
                    dangerouslySetInnerHTML={{ __html: venue.google_maps_embed_code }}
                  />
                </div>
              </div>
            )}

            {/* Booking Section */}
            <div id="booking-section" className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Book This Venue</h2>
              
              {/* Date Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Date</h3>
                <div className="grid grid-cols-7 gap-2">
                  {getNext7Days().map((day) => (
                    <button
                      key={day.date}
                      id={`date-${day.date}`}
                      onClick={() => setSelectedDate(day.date)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedDate === day.date
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${day.isToday ? 'ring-2 ring-blue-200' : ''}`}
                    >
                      <div className="text-sm font-medium">{day.display}</div>
                      {day.isToday && <div className="text-xs text-blue-600">Today</div>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time Slots</h3>
                  <div className="text-center py-8 text-gray-500">
                    No available slots for the selected date. Connect to Supabase to show real availability.
                  </div>
                </div>
              )}

              {/* Booking Button */}
              <button
                id="book-now-button"
                onClick={handleBookNow}
                className="w-full bg-blue-600 text-white py-4 rounded-xl hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                Book Now
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <div id="contact-info" className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">+91 98765 43210</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700">contact@samplevenue.com</span>
                </div>
              </div>
            </div>

            {/* Similar Venues */}
            <div id="similar-venues" className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Similar Venues</h3>
              <div className="text-center py-8 text-gray-500">
                No similar venues found. Connect to Supabase to show real data.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div id="booking-modal" className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Confirm Booking</h2>
            <p className="text-gray-600 mb-6">
              You are about to book {venue.name} for the selected time slots.
            </p>
            <div className="flex gap-4">
              <button
                id="cancel-booking-button"
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-booking-button"
                onClick={confirmBooking}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueDetail;