import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { venueService } from '@/lib/venueService';
import { reviewService } from '@/lib/reviewService';
import ImageCarousel from '@/components/venue-detail/ImageCarousel';
import VenueDescription from '@/components/venue-detail/VenueDescription';
import VenueAmenities from '@/components/venue-detail/VenueAmenities';
import VenueMap from '@/components/venue-detail/VenueMap';
import VenueReviews from '@/components/venue-detail/VenueReviews';
import VenueBooking from '@/components/venue-detail/VenueBooking';

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
  [key: string]: any; // Allow additional properties
}

const VenueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<ExtendedVenue | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Image Carousel at the top */}
      <ImageCarousel images={images} venueName={venue.venue_name || venue.name || 'Venue'} />
      
      {/* Main content - Mobile Optimized */}
      <div className="max-w-7xl mx-auto py-4 sm:py-6 md:py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Left column - Venue details */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 lg:space-y-8">
            <VenueDescription venue={venue} />
            <VenueAmenities amenities={venue.amenities || []} />
            <VenueMap mapEmbedCode={venue.map_embed_code || venue.google_maps_link || ''} />
            <VenueReviews
              reviews={reviews}
              averageRating={venue.avg_rating || venue.rating || 0}
              reviewCount={venue.rating_count || venue.review_count || 0}
            />
          </div>
          
          {/* Right column - Booking system */}
          <div className="lg:col-span-1">
            <VenueBooking 
              pricePerHour={venue.price_per_hour || venue.hourly_rate || 0}
              venueId={venue.id}
              venueName={venue.venue_name || venue.name}
              capacity={venue.capacity}
              rating={venue.avg_rating || venue.rating || 0}
              reviewCount={venue.rating_count || venue.review_count || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage;