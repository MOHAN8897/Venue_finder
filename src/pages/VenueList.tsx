import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapPin, Heart } from 'lucide-react';
import { venueService, Venue, VenueFilters } from '../lib/venueService';
import { useAuth } from '../hooks/useAuth';
import { favoritesService } from '../lib/userService';

const venueTypes = [
  { value: '', label: 'All Types' },
  { value: 'cricket-box', label: 'Cricket Box' },
  { value: 'farmhouse', label: 'Farmhouse' },
  { value: 'banquet-hall', label: 'Banquet Hall' },
  { value: 'sports-complex', label: 'Sports Complex' },
  { value: 'party-hall', label: 'Party Hall' },
  { value: 'conference-room', label: 'Conference Room' },
];

interface VenueCardProps {
  venue: Venue;
  favoriteVenueIds: Set<string>;
  favoritesLoading: boolean;
  handleToggleFavorite: (venueId: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}

// Memoized Venue Card
const VenueCard = React.memo(({ venue, favoriteVenueIds, favoritesLoading, handleToggleFavorite, navigate }: VenueCardProps) => (
  <div
    key={venue.id}
    className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-row transition-transform duration-200 hover:-translate-y-1 hover:shadow-2xl group border border-gray-100 relative h-48"
  >
    {/* Favorite Heart Icon */}
    <button
      className={`absolute top-4 right-4 z-10 p-2 rounded-full bg-white shadow-md hover:bg-red-50 transition-colors ${favoritesLoading ? 'opacity-50 pointer-events-none' : ''}`}
      onClick={() => handleToggleFavorite(venue.id)}
      aria-label={favoriteVenueIds.has(venue.id) ? 'Remove from favorites' : 'Add to favorites'}
      disabled={favoritesLoading}
    >
      <Heart
        className={`h-6 w-6 ${favoriteVenueIds.has(venue.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
        fill={favoriteVenueIds.has(venue.id) ? 'currentColor' : 'none'}
      />
    </button>
    {/* End Favorite Heart Icon */}
    
    {/* Left Section - Image */}
    <div className="w-1/2 h-full overflow-hidden">
      <img
        src={
          (venue.image_urls && venue.image_urls.length > 0 && venue.image_urls[0]) ||
          (venue.images && venue.images.length > 0 && venue.images[0]) ||
          'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'
        }
        alt={venue.name}
        loading="lazy"
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        style={{ objectPosition: 'center' }}
      />
    </div>
    
    {/* Right Section - Details */}
    <div className="w-1/2 flex flex-col p-5 justify-between">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1 truncate">{venue.name}</h2>
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1 text-blue-500" />
          <span className="truncate">{venue.city}, {venue.state}</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold text-blue-600">₹{venue.hourly_rate}</span>
          <span className="text-xs text-gray-500">/ hour</span>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
          style={{ textTransform: 'none', fontWeight: 600 }}
          onClick={() => navigate(`/venues/${venue.id}`)}
        >
          View Details
        </button>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold"
          style={{ textTransform: 'none', fontWeight: 600 }}
          onClick={() => navigate(`/book/${venue.id}`)}
        >
          Book Now
        </button>
      </div>
    </div>
  </div>
));

const PAGE_SIZE = 12;

const VenueList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  // Filter state initialized from URL
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const { user } = useAuth();
  const [favoriteVenueIds, setFavoriteVenueIds] = useState<Set<string>>(new Set());
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  // Update URL and reload venues when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (type) params.set('type', type);
    navigate({ pathname: '/venues', search: params.toString() }, { replace: true });
    // eslint-disable-next-line
  }, [location, type]);

  // Fetch venues from database (with pagination)
  useEffect(() => {
    async function fetchVenues() {
      setLoading(true);
      try {
        const venueFilters: VenueFilters = {
          location: location,
          type: type,
          minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0,
          maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 5000,
          capacity: searchParams.get('capacity') ? Number(searchParams.get('capacity')) : 0,
          amenities: searchParams.getAll('amenities'),
        };
        const { venues: data, total } = await venueService.getFilteredVenues(venueFilters, page, pageSize);
        setVenues(data);
        setTotal(total);
      } catch {
        // No error handling needed as the error state is not used in the component
      } finally {
        setLoading(false);
      }
    }
    fetchVenues();
    // eslint-disable-next-line
  }, [location, type, searchParams, page, pageSize]);

  // Load user's favorites on mount (if logged in)
  useEffect(() => {
    async function fetchFavorites() {
      if (!user) return;
      setFavoritesLoading(true);
      try {
        const favs = await favoritesService.getUserFavorites();
        setFavoriteVenueIds(new Set(favs.map(f => f.venue_id)));
      } finally {
        setFavoritesLoading(false);
      }
    }
    fetchFavorites();
  }, [user]);

  // Toggle favorite status
  const handleToggleFavorite = async (venueId: string) => {
    if (!user) {
      alert('Please sign in to add favorites.');
      return;
    }
    setFavoritesLoading(true);
    if (favoriteVenueIds.has(venueId)) {
      const result = await favoritesService.removeFromFavorites(venueId);
      if (result.success) {
        setFavoriteVenueIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(venueId);
          return newSet;
        });
      }
    } else {
      const result = await favoritesService.addToFavorites(venueId);
      if (result.success) {
        setFavoriteVenueIds(prev => new Set(prev).add(venueId));
      }
    }
    setFavoritesLoading(false);
  };

  const memoizedHandleToggleFavorite = useCallback(handleToggleFavorite, [favoriteVenueIds, user]);

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  return (
    <div id="venue-list-page" className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between border border-gray-100">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="flex flex-col">
              <label htmlFor="location-filter" className="text-sm font-semibold text-gray-700 mb-1">Location</label>
              <input
                id="location-filter"
                type="text"
                placeholder="Enter city or area..."
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-48 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="type-filter" className="text-sm font-semibold text-gray-700 mb-1">Venue Type</label>
              <select
                id="type-filter"
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-48 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                {venueTypes.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {/* End Filter Bar */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">Browse Venues</h1>
        {/* Venue Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <span>Loading venues...</span>
            </div>
          ) : venues.length === 0 ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <span>No venues found.</span>
            </div>
          ) : (
            venues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                favoriteVenueIds={favoriteVenueIds}
                favoritesLoading={favoritesLoading}
                handleToggleFavorite={memoizedHandleToggleFavorite}
                navigate={navigate}
              />
            ))
          )}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 gap-2">
            <button
              className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`px-3 py-1 rounded border ${p === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => handlePageChange(p)}
                disabled={p === page}
              >
                {p}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-white text-gray-700 disabled:opacity-50"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueList;