import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { venueService } from '@/lib/venueService';
import { reviewService } from '@/lib/reviewService';
import { Button } from '@/components/ui/button';
import EnhancedImageCarousel from '@/components/venue-detail/EnhancedImageCarousel';
import VenueDetailsSection from '@/components/venue-detail/VenueDetailsSection';
import SlotBasedBookingCalendar from '@/components/venue-detail/SlotBasedBookingCalendar';
import MobileBookingModal from '@/components/venue-detail/MobileBookingModal';
import VenueReviews from '@/components/venue-detail/VenueReviews';
import { useAuth } from '@/hooks/useAuth';
import { createBookingWithPayment } from '@/lib/paymentService';
import { useNavigate } from 'react-router-dom';
import { Calendar } from '@/components/ui/calendar';
import BookingCalendar from '@/components/venue-detail/BookingCalendar';

// Extended Venue interface to handle both data structures
interface ExtendedVenue {
  id: string;
  name?: string;
  venue_name?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  price_per_hour?: number;
  price_per_day?: number;
  hourly_rate?: number;
  daily_rate?: number;
  capacity?: number;
  avg_rating?: number;
  rating?: number;
  rating_count?: number;
  review_count?: number;
  photos?: string[];
  images?: string[];
  image_urls?: string[];
  amenities?: string[];
  map_embed_code?: string;
  google_maps_link?: string;
  latitude?: number;
  longitude?: number;
  booking_type?: 'hourly' | 'daily' | 'both'; // Added booking_type
  [key: string]: any; // Allow additional properties
}

const VenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<ExtendedVenue | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMobileBooking, setShowMobileBooking] = useState(false);
  // Removed unused selectedBookingType state
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  // Add state for daily booking fields
  const [dailyGuests, setDailyGuests] = useState<number>(1);
  const [dailySpecialRequests, setDailySpecialRequests] = useState<string>('');
  // Add state for booked daily dates
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;

    const fetchVenueData = async () => {
      try {
        setLoading(true);
        console.log('Fetching venue with ID:', id);
        
        const [venueData, reviewsData] = await Promise.all([
          venueService.getVenueById(id),
          reviewService.getReviewsByVenueId(id).catch(err => {
            console.log('No reviews found for venue:', err);
            return [];
          }),
        ]);

        console.log('Venue data received:', venueData);
        console.log('Reviews data received:', reviewsData);

        if (venueData) {
          setVenue(venueData);
        } else {
          console.log('No venue data found for ID:', id);
          setError('Venue not found.');
        }
        setReviews(reviewsData || []);
      } catch (err) {
        console.error('Error fetching venue data:', err);
        setError('Failed to load venue details.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenueData();

    // Fetch booked daily dates for this venue
    const fetchBookedDates = async () => {
      try {
        const { data, error } = await venueService.getDailyBookingsForVenue(id);
        if (!error && data) {
          // Collect all eventDate values as YYYY-MM-DD
          const dates = new Set(data.map((b: any) => b.event_date));
          setBookedDates(dates);
        }
      } catch (err) {
        // Ignore errors for now
      }
    };
    fetchBookedDates();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center px-4">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-3 sm:mb-4"></div>
          <p className="text-sm sm:text-base text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 sm:py-10 px-4">
        <div className="text-red-500 text-lg sm:text-xl mb-3 sm:mb-4">{error}</div>
        <p className="text-sm sm:text-base text-gray-600">Please check the venue ID and try again.</p>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="text-center py-8 sm:py-10 px-4">
        <div className="text-gray-500 text-lg sm:text-xl mb-3 sm:mb-4">Venue not found.</div>
        <p className="text-sm sm:text-base text-gray-600">The venue you're looking for doesn't exist or may have been removed.</p>
      </div>
    );
  }

  // Fallback for images - add some default images if none exist
  const images = venue.photos?.length ? venue.photos : 
                 venue.image_urls?.length ? venue.image_urls : 
                 venue.images?.length ? venue.images : 
                 ['https://via.placeholder.com/800x400?text=Venue+Image'];

  const venueName = venue.venue_name || venue.name || 'Venue';

  // Handler for slot-based booking submission
  interface Slot {
    id: string;
    time: string;
  }
  interface SlotBookingData {
    date: Date;
    selectedSlots: Slot[];
    guests: number;
    totalPrice: number;
  }
  const handleSlotBookingSubmit = async (bookingData: SlotBookingData): Promise<string | void> => {
    if (!venue) return;
    if (!user || !user.id) {
      setError('You must be logged in to book. Please sign in to continue.');
      return;
    }
    // Prepare booking payload
    const slotIds = bookingData.selectedSlots.map((slot) => slot.id);
    const bookingPayload = {
      venueId: venue.id,
      userId: user.id,
      eventDate: bookingData.date.toISOString().split('T')[0],
      startTime: bookingData.selectedSlots[0]?.time || '',
      endTime: bookingData.selectedSlots[bookingData.selectedSlots.length - 1]?.time || '',
      guestCount: bookingData.guests,
      specialRequests: '',
      venueAmount: bookingData.totalPrice * 100, // paise
      bookingType: 'hourly' as const,
      slot_ids: slotIds
    };
    // Save to localStorage instead of DB
    localStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
    // Navigate to payment page (no bookingId yet)
    navigate('/payment');
  };

  // Determine allowed booking types
  const allowedBookingType = venue?.booking_type || 'hourly';
  // Removed unused showBookingTypeSelector

  // All user/profile checks are now handled in booking handlers, so this component always returns JSX

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Image Carousel - Full Width */}
      <div className="w-full">
        <EnhancedImageCarousel images={images} venueName={venueName} />
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Desktop Layout - 2 Column Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Left Column - Venue Details */}
          <div className="lg:col-span-2 space-y-8">
            <VenueDetailsSection venue={venue} />
            <VenueReviews
              reviews={reviews}
              averageRating={venue.avg_rating || venue.rating || 0}
              reviewCount={venue.rating_count || venue.review_count || 0}
            />
          </div>
          {/* Right Column - Booking Calendar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {venue && (
                <BookingCalendar
                  bookingType={venue.booking_type || 'hourly'}
                  venue={venue}
                  user={user}
                  bookedDates={bookedDates}
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  dailyGuests={dailyGuests}
                  setDailyGuests={setDailyGuests}
                  dailySpecialRequests={dailySpecialRequests}
                  setDailySpecialRequests={setDailySpecialRequests}
                  handleSlotBookingSubmit={handleSlotBookingSubmit}
                  navigate={navigate}
                />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout - Single Column */}
        <div className="lg:hidden space-y-8 pb-24">
          <VenueDetailsSection venue={venue} />
          <VenueReviews
            reviews={reviews}
            averageRating={venue.avg_rating || venue.rating || 0}
              reviewCount={venue.rating_count || venue.review_count || 0}
            />
          
          {/* Mobile Book Now Button */}
          <div className="sticky bottom-4 left-4 right-4 z-40">
            <Button
              onClick={() => setShowMobileBooking(true)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 text-lg shadow-lg"
            >
              Book Now - ₹{venue.price_per_hour || venue.hourly_rate || 0}/hour
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Booking Modal */}
      <MobileBookingModal
        venueId={venue.id}
        venueName={venueName}
        pricePerHour={venue.price_per_hour || venue.hourly_rate || 0}
        capacity={venue.capacity}
        isOpen={showMobileBooking}
        onClose={() => setShowMobileBooking(false)}
      />
    </div>
  );
};

export default VenueDetailPage;