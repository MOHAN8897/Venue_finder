import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, Users, Grid, List, SlidersHorizontal } from 'lucide-react';
import { venueService, Venue, VenueFilters } from '../lib/venueService';

// Define the SearchFilters type locally since we removed the types import
interface SearchFilters {
  location: string;
  type: string;
  date: string;
  minPrice: number;
  maxPrice: number;
  amenities: string[];
  capacity: number;
}

const VenueList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<SearchFilters>({
    location: searchParams.get('location') || '',
    type: searchParams.get('type') || '',
    date: '',
    minPrice: 0,
    maxPrice: 5000,
    amenities: [],
    capacity: 0
  });

  // Fetch venues from database
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const venueFilters: VenueFilters = {
          location: filters.location,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          capacity: filters.capacity,
          amenities: filters.amenities
        };

        const fetchedVenues = await venueService.getFilteredVenues(venueFilters);
        setVenues(fetchedVenues);
      } catch (err) {
        console.error('Error fetching venues:', err);
        setError('Failed to load venues');
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [filters]);

  const allAmenities = ['Parking', 'AC', 'WiFi', 'Garden', 'Kitchen', 'Stage', 'Sound System', 'Catering'];

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity]
    }));
  };

  const clearFilters = () => {
    setFilters({
      location: '',
      type: '',
      date: '',
      minPrice: 0,
      maxPrice: 5000,
      amenities: [],
      capacity: 0
    });
    setSearchParams({});
  };

  return (
    <div id="venue-list-page" className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div id="search-header" className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="venue-search-input"
                  type="text"
                  placeholder="Search by location, venue name..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                id="filters-toggle-button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <SlidersHorizontal className="h-5 w-5" />
                <span>Filters</span>
              </button>
              
              <div id="view-mode-toggle" className="flex border border-gray-300 rounded-xl overflow-hidden">
                <button
                  id="grid-view-button"
                  onClick={() => setViewMode('grid')}
                  className={`p-3 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  id="list-view-button"
                  onClick={() => setViewMode('list')}
                  className={`p-3 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div id="filters-sidebar" className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-80 space-y-6`}>
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Filters</h3>
                <button id="clear-filters-button" onClick={clearFilters} className="text-blue-600 hover:text-blue-700 text-sm">
                  Clear All
                </button>
              </div>

              {/* Venue Type */}
              <div className="mb-6">
                <label id="venue-type-label" className="block text-sm font-semibold text-gray-700 mb-3">Venue Type</label>
                <select
                  id="venue-type-select"
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  <option value="cricket-box">Cricket Box</option>
                  <option value="farmhouse">Farmhouse</option>
                  <option value="banquet-hall">Banquet Hall</option>
                  <option value="sports-complex">Sports Complex</option>
                  <option value="party-hall">Party Hall</option>
                  <option value="conference-room">Conference Room</option>
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label id="price-range-label" className="block text-sm font-semibold text-gray-700 mb-3">
                  Price Range (₹{filters.minPrice} - ₹{filters.maxPrice})
                </label>
                <div className="space-y-2">
                  <input
                    id="min-price-slider"
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', Number(e.target.value))}
                    className="w-full"
                  />
                  <input
                    id="max-price-slider"
                    type="range"
                    min="0"
                    max="5000"
                    step="100"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="mb-6">
                <label id="capacity-label" className="block text-sm font-semibold text-gray-700 mb-3">Minimum Capacity</label>
                <input
                  id="capacity-input"
                  type="number"
                  placeholder="Enter minimum capacity"
                  value={filters.capacity || ''}
                  onChange={(e) => handleFilterChange('capacity', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Amenities */}
              <div className="mb-6">
                <label id="amenities-label" className="block text-sm font-semibold text-gray-700 mb-3">Amenities</label>
                <div className="space-y-2">
                  {allAmenities.map((amenity) => (
                    <label key={amenity} className="flex items-center space-x-2">
                      <input
                        id={`amenity-${amenity.toLowerCase().replace(' ', '-')}`}
                        type="checkbox"
                        checked={filters.amenities.includes(amenity)}
                        onChange={() => handleAmenityToggle(amenity)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Venues Grid/List */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 id="venues-title" className="text-2xl font-bold text-gray-900">
                {loading ? 'Loading venues...' : `${venues.length} Venues Found`}
              </h1>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Try again
                </button>
              </div>
            ) : venues.length === 0 ? (
              <div id="no-venues-message" className="text-center py-12">
                <div className="text-gray-500 text-lg">No venues found matching your criteria</div>
                <button
                  id="reset-filters-button"
                  onClick={clearFilters}
                  className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div id="venues-container" className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {venues.map((venue, index) => (
                  <div
                    key={venue.id}
                    id={`venue-card-${index}`}
                    className={`bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`${viewMode === 'list' ? 'w-48' : ''} relative h-48 overflow-hidden rounded-t-2xl`}>
                      <img
                        src={venue.images && venue.images.length > 0 ? venue.images[0] : 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center space-x-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-semibold">{venue.rating.toFixed(1)}</span>
                      </div>
                    </div>
                    
                    <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                        <MapPin className="h-4 w-4" />
                        <span>{venue.city}, {venue.state}</span>
                      </div>
                      
                      <Link
                        to={`/venue/${venue.id}`}
                        className="block"
                      >
                        <h3 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                          {venue.name}
                        </h3>
                      </Link>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {venue.description}
                      </p>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">Up to {venue.capacity} people</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-600">₹{venue.price_per_hour}</div>
                          <div className="text-sm text-gray-500">per hour</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueList;