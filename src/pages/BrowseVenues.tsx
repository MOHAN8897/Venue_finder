import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Users, Wifi, Car, Snowflake, Coffee, Bath, Phone, Mail, Globe, Clock, Calendar, Filter, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { venueService, Venue } from '../lib/venueService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { Checkbox } from '../components/ui/checkbox';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Skeleton } from '../components/ui/skeleton';

// Amenity icons mapping
const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <Wifi className="h-4 w-4" />,
  parking: <Car className="h-4 w-4" />,
  ac: <Snowflake className="h-4 w-4" />,
  washroom: <Bath className="h-4 w-4" />,
  restrooms: <Bath className="h-4 w-4" />,
  catering: <Coffee className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  website: <Globe className="h-4 w-4" />,
  clock: <Clock className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  heating: <Snowflake className="h-4 w-4" />,
  ventilation: <Globe className="h-4 w-4" />,
  electricity: <Globe className="h-4 w-4" />,
  lighting: <Globe className="h-4 w-4" />,
  stage: <Globe className="h-4 w-4" />,
  pool: <Globe className="h-4 w-4" />,
  dance_floor: <Globe className="h-4 w-4" />,
  outdoor_games: <Globe className="h-4 w-4" />,
  photo_booth: <Globe className="h-4 w-4" />,
  gym_equipment: <Globe className="h-4 w-4" />,
  covered_parking: <Car className="h-4 w-4" />,
  valet_parking: <Car className="h-4 w-4" />,
  taxi_stand: <Car className="h-4 w-4" />,
  public_transport: <Car className="h-4 w-4" />,
  bike_parking: <Car className="h-4 w-4" />,
  airport_shuttle: <Car className="h-4 w-4" />,
  loading_dock: <Car className="h-4 w-4" />,
  phone_system: <Phone className="h-4 w-4" />,
  av_equipment: <Globe className="h-4 w-4" />,
  sound_system: <Globe className="h-4 w-4" />,
  microphones: <Globe className="h-4 w-4" />,
  projector: <Globe className="h-4 w-4" />,
  router: <Wifi className="h-4 w-4" />,
  printer: <Globe className="h-4 w-4" />,
  tv_screens: <Globe className="h-4 w-4" />,
  accessible_parking: <Car className="h-4 w-4" />,
  service_animal_friendly: <Globe className="h-4 w-4" />,
  elevator: <Globe className="h-4 w-4" />,
  braille_signage: <Globe className="h-4 w-4" />,
  hearing_loop: <Globe className="h-4 w-4" />,
  baby_facilities: <Globe className="h-4 w-4" />,
  accessible_restrooms: <Bath className="h-4 w-4" />,
  wheelchair_access: <Globe className="h-4 w-4" />,
  outdoor_furniture: <Globe className="h-4 w-4" />,
  lounge_seating: <Globe className="h-4 w-4" />,
  tables_chairs: <Globe className="h-4 w-4" />,
  bar_stools: <Globe className="h-4 w-4" />,
  storage_space: <Globe className="h-4 w-4" />,
  bedrooms: <Globe className="h-4 w-4" />,
  reception_desk: <Globe className="h-4 w-4" />,
  coat_check: <Globe className="h-4 w-4" />,
  ride_share_zone: <Car className="h-4 w-4" />,
  access_control: <Globe className="h-4 w-4" />,
  first_aid: <Globe className="h-4 w-4" />,
  fire_safety: <Globe className="h-4 w-4" />,
  security_system: <Globe className="h-4 w-4" />,
  emergency_exits: <Globe className="h-4 w-4" />,
  cctv: <Globe className="h-4 w-4" />,
  security_guard: <Globe className="h-4 w-4" />,
  emergency_lighting: <Globe className="h-4 w-4" />,
};

// Venue types - based on actual database values
const venueTypes = [
  { id: 'Sports Venue', label: 'Sports Venue', icon: '🏟️' },
  { id: 'Farmhouse', label: 'Farmhouse', icon: '🏡' },
  { id: 'Auditorium', label: 'Auditorium', icon: '🎭' },
  { id: 'Conference Hall', label: 'Conference Hall', icon: '🏢' },
  { id: 'Outdoor', label: 'Outdoor', icon: '🌳' },
  { id: 'Indoor', label: 'Indoor', icon: '🏠' },
  { id: 'Cricket Ground', label: 'Cricket Ground', icon: '🏏' },
  { id: 'Football Ground', label: 'Football Ground', icon: '⚽' },
  { id: 'Wedding Venue', label: 'Wedding Venue', icon: '💒' },
  { id: 'Corporate', label: 'Corporate', icon: '💼' },
];

// Rating options
const ratingOptions = [
  { value: 5, label: '5★ & above' },
  { value: 4, label: '4★ & above' },
  { value: 3, label: '3★ & above' },
  { value: 2, label: '2★ & above' },
];

// Sort options
const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'Name A-Z' },
];

interface FilterState {
  priceRange: [number, number];
  minPrice: string;
  maxPrice: string;
  selectedTypes: string[];
  selectedRating: number | null;
  selectedAmenities: string[];
  location: string;
  sortBy: string;
}

// Extended Venue interface to handle database mapping
interface ExtendedVenue extends Venue {
  venue_name?: string;
  venue_type?: string;
  price_per_day?: number;
}

const BrowseVenues: React.FC = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<ExtendedVenue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<ExtendedVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableAmenities, setAvailableAmenities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [10, 15000],
    minPrice: '10',
    maxPrice: '15000',
    selectedTypes: [],
    selectedRating: null,
    selectedAmenities: [],
    location: '',
    sortBy: 'newest',
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [venues, filters]);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching venues...');
      const venuesData = await venueService.getAllVenues();
      console.log('Venues data:', venuesData);
      
      // Map database fields to frontend fields
      const mappedVenues = venuesData.map((venue: any) => ({
        ...venue,
        name: venue.venue_name || venue.name || 'Unnamed Venue',
        type: venue.venue_type || venue.type || 'Unknown Type',
        price_per_day: venue.price_per_day || venue.daily_rate || 0,
        price_per_hour: venue.price_per_hour || venue.hourly_rate || 0,
        images: venue.images || venue.image_urls || venue.photos || [],
        amenities: venue.amenities || [],
        rating: venue.rating || venue.average_rating || 0,
        review_count: venue.review_count || 0,
      }));
      
      console.log('Mapped venues:', mappedVenues);
      
      // Filter only approved venues with owner_id
      const approvedVenues = mappedVenues.filter(venue => {
        console.log('Checking venue:', venue.name, 'approval_status:', venue.approval_status, 'is_approved:', venue.is_approved, 'owner_id:', venue.owner_id);
        return (venue.approval_status === 'approved' || venue.is_approved === true) && venue.owner_id;
      });
      
      console.log('Approved venues:', approvedVenues);
      setVenues(approvedVenues);
      
      // Extract unique amenities from all venues
      const allAmenities = new Set<string>();
      approvedVenues.forEach(venue => {
        if (venue.amenities) {
          venue.amenities.forEach((amenity: string) => allAmenities.add(amenity.toLowerCase()));
        }
      });
      setAvailableAmenities(Array.from(allAmenities));
      
    } catch (err) {
      console.error('Error fetching venues:', err);
      setError('Failed to load venues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...venues];

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      filtered = filtered.filter(venue => 
        venue.address?.toLowerCase().includes(locationLower) ||
        venue.city?.toLowerCase().includes(locationLower) ||
        venue.state?.toLowerCase().includes(locationLower) ||
        venue.pincode?.toLowerCase().includes(locationLower)
      );
    }

    // Price filter
    filtered = filtered.filter(venue => {
      const price = venue.price_per_day || venue.price_per_hour || venue.hourly_rate || 0;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    // Type filter
    if (filters.selectedTypes.length > 0) {
      filtered = filtered.filter(venue => 
        filters.selectedTypes.includes(venue.type)
      );
    }

    // Rating filter
    if (filters.selectedRating) {
      filtered = filtered.filter(venue => 
        (venue.rating || venue.average_rating || 0) >= filters.selectedRating!
      );
    }

    // Amenities filter
    if (filters.selectedAmenities.length > 0) {
      filtered = filtered.filter(venue => 
        filters.selectedAmenities.every(amenity => 
          venue.amenities?.some(v => v.toLowerCase() === amenity.toLowerCase())
        )
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return (a.price_per_day || a.price_per_hour || a.hourly_rate || 0) - (b.price_per_day || b.price_per_hour || b.hourly_rate || 0);
        case 'price_high':
          return (b.price_per_day || b.price_per_hour || b.hourly_rate || 0) - (a.price_per_day || a.price_per_hour || a.hourly_rate || 0);
        case 'rating':
          return (b.rating || b.average_rating || 0) - (a.rating || a.average_rating || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredVenues(filtered);
  };

  const handleFilterChange = (filterType: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setFilters(prev => ({
      ...prev,
      priceRange: value,
      minPrice: value[0].toString(),
      maxPrice: value[1].toString()
    }));
  };

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0;
    setFilters(prev => ({
      ...prev,
      [type === 'min' ? 'minPrice' : 'maxPrice']: value,
      priceRange: type === 'min' 
        ? [numValue, prev.priceRange[1]] 
        : [prev.priceRange[0], numValue]
    }));
  };

  const resetFilters = () => {
    setFilters({
      priceRange: [10, 15000],
      minPrice: '10',
      maxPrice: '15000',
      selectedTypes: [],
      selectedRating: null,
      selectedAmenities: [],
      location: '',
      sortBy: 'newest',
    });
  };

  const handleViewDetails = (venueId: string) => {
    navigate(`/venue/${venueId}`);
  };

  const handleBookNow = (venueId: string) => {
    navigate(`/book/${venueId}`);
  };

  const renderAmenityIcon = (amenity: string) => {
    const amenityKey = amenity.toLowerCase().replace(/\s+/g, '_');
    return amenityIcons[amenityKey] || <span className="h-4 w-4">•</span>;
  };

  // Compact Filter Section for Mobile
  const CompactFilterSection: React.FC = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Quick Filters
        </h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={resetFilters}
          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm h-8"
        >
          Reset
        </Button>
      </div>

      {/* Location and Sort Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        <div>
          <Input
            placeholder="Search location..."
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            className="h-9 sm:h-10 text-xs sm:text-sm"
          />
        </div>
        <div>
          <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
            <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range - Compact */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs sm:text-sm font-medium">Price Range</span>
          <span className="text-xs text-gray-500">₹{filters.priceRange[0]} - ₹{filters.priceRange[1]}</span>
        </div>
        <Slider
          value={filters.priceRange}
          onValueChange={handlePriceRangeChange}
          max={15000}
          min={10}
          step={50}
          className="w-full"
        />
      </div>

      {/* Venue Types - Horizontal Scroll */}
      <div>
        <h4 className="text-xs sm:text-sm font-medium mb-2">Venue Type</h4>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {venueTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                const newTypes = filters.selectedTypes.includes(type.id)
                  ? filters.selectedTypes.filter(t => t !== type.id)
                  : [...filters.selectedTypes, type.id];
                handleFilterChange('selectedTypes', newTypes);
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap border ${
                filters.selectedTypes.includes(type.id)
                  ? 'bg-blue-100 border-blue-300 text-blue-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600'
              }`}
            >
              <span>{type.icon}</span>
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.selectedTypes.length > 0 || filters.selectedRating || filters.selectedAmenities.length > 0 || filters.location) && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-1">
            {filters.selectedTypes.map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {venueTypes.find(t => t.id === type)?.label}
              </Badge>
            ))}
            {filters.selectedRating && (
              <Badge variant="secondary" className="text-xs">
                {ratingOptions.find(r => r.value === filters.selectedRating)?.label}
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="text-xs">
                {filters.location}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Full Filter Section for Desktop
  const FullFilterSection: React.FC = () => (
    <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
          Filters
        </h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={resetFilters}
          className="text-blue-600 hover:text-blue-700 text-sm"
        >
          Reset All
        </Button>
      </div>

      {/* Location Filter */}
      <div>
        <h4 className="font-medium mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
          <Search className="h-4 w-4" />
          Location
        </h4>
        <Input
          placeholder="Search by city, state, address, or pincode..."
          value={filters.location}
          onChange={(e) => handleFilterChange('location', e.target.value)}
          className="w-full text-sm sm:text-base"
        />
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Price Range (₹ per day)</h4>
        <div className="space-y-3 sm:space-y-4">
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceRangeChange}
              max={15000}
              min={10}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs sm:text-sm text-gray-600 mt-2">
              <span>₹{filters.priceRange[0]}</span>
              <span>₹{filters.priceRange[1]}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Min"
              value={filters.minPrice}
              onChange={(e) => handlePriceInputChange('min', e.target.value)}
              className="flex-1 text-sm sm:text-base"
            />
            <Input
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(e) => handlePriceInputChange('max', e.target.value)}
              className="flex-1 text-sm sm:text-base"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Sort Options */}
      <div>
        <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Sort By</h4>
        <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
          <SelectTrigger className="text-sm sm:text-base">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Venue Type */}
      <div>
        <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Venue Type</h4>
        <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
          {venueTypes.map((type) => (
            <div key={type.id} className="flex items-center space-x-2">
              <Checkbox
                id={type.id}
                checked={filters.selectedTypes.includes(type.id)}
                onCheckedChange={(checked) => {
                  const newTypes = checked
                    ? [...filters.selectedTypes, type.id]
                    : filters.selectedTypes.filter(t => t !== type.id);
                  handleFilterChange('selectedTypes', newTypes);
                }}
              />
              <label htmlFor={type.id} className="text-xs sm:text-sm cursor-pointer">
                {type.icon} {type.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div>
        <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Rating</h4>
        <div className="space-y-2">
          {ratingOptions.map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <Checkbox
                id={`rating-${option.value}`}
                checked={filters.selectedRating === option.value}
                onCheckedChange={(checked) => {
                  handleFilterChange('selectedRating', checked ? option.value : null);
                }}
              />
              <label htmlFor={`rating-${option.value}`} className="text-xs sm:text-sm cursor-pointer">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div>
        <h4 className="font-medium mb-2 sm:mb-3 text-sm sm:text-base">Amenities</h4>
        <div className="space-y-2 max-h-32 sm:max-h-48 overflow-y-auto">
          {availableAmenities.map((amenity) => (
            <div key={amenity} className="flex items-center space-x-2">
              <Checkbox
                id={amenity}
                checked={filters.selectedAmenities.includes(amenity)}
                onCheckedChange={(checked) => {
                  const newAmenities = checked
                    ? [...filters.selectedAmenities, amenity]
                    : filters.selectedAmenities.filter(a => a !== amenity);
                  handleFilterChange('selectedAmenities', newAmenities);
                }}
              />
              <label htmlFor={amenity} className="text-xs sm:text-sm cursor-pointer capitalize flex items-center gap-1">
                {renderAmenityIcon(amenity)}
                <span>{amenity}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.selectedTypes.length > 0 || filters.selectedRating || filters.selectedAmenities.length > 0 || filters.location) && (
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2 text-xs sm:text-sm">Active Filters:</h4>
          <div className="flex flex-wrap gap-1 sm:gap-2">
            {filters.selectedTypes.map(type => (
              <Badge key={type} variant="secondary" className="text-xs">
                {venueTypes.find(t => t.id === type)?.label}
              </Badge>
            ))}
            {filters.selectedRating && (
              <Badge variant="secondary" className="text-xs">
                {ratingOptions.find(r => r.value === filters.selectedRating)?.label}
              </Badge>
            )}
            {filters.selectedAmenities.slice(0, 3).map(amenity => (
              <Badge key={amenity} variant="secondary" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {filters.selectedAmenities.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{filters.selectedAmenities.length - 3} more
              </Badge>
            )}
            {filters.location && (
              <Badge variant="secondary" className="text-xs">
                {filters.location}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Compact Venue Card for Mobile
  const CompactVenueCard: React.FC<{ venue: ExtendedVenue }> = ({ venue }) => {
    const images = venue.images || venue.image_urls || venue.photos || [];
    const amenities = venue.amenities || [];
    const displayAmenities = amenities.slice(0, 2); // Show only 2 amenities on mobile

    return (
      <Card className="group overflow-hidden hover:shadow-md transition-all duration-200">
        <div className="flex">
          {/* Image - Smaller */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0">
            {images.length > 0 ? (
              <img
                src={images[0]}
                alt={venue.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-500 text-xs">No Image</span>
              </div>
            )}
            
            {/* Rating Badge - Smaller */}
            <div className="absolute top-1 right-1">
              <Badge className="bg-white/90 text-gray-900 text-xs px-1 py-0.5">
                <Star className="h-2 w-2 fill-yellow-400 text-yellow-400 mr-0.5" />
                {venue.rating?.toFixed(1) || venue.average_rating?.toFixed(1) || 'N/A'}
              </Badge>
            </div>
          </div>

          {/* Content - Compact */}
          <div className="flex-1 p-2 sm:p-3 flex flex-col justify-between">
            <div>
              {/* Venue Name */}
              <h3 className="font-semibold text-sm sm:text-base text-gray-900 line-clamp-1 mb-1">
                {venue.name}
              </h3>
              
              {/* Address */}
              <div className="flex items-center text-xs text-gray-600 mb-1">
                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                <span className="line-clamp-1">{venue.address}</span>
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                <Users className="h-3 w-3" />
                <span>Up to {venue.capacity} people</span>
              </div>

              {/* Amenities - Compact */}
              {amenities.length > 0 && (
                <div className="flex gap-1 mb-2">
                  {displayAmenities.map((amenity, index) => (
                    <span key={index} className="text-xs text-gray-500">
                      {renderAmenityIcon(amenity)}
                    </span>
                  ))}
                  {amenities.length > 2 && (
                    <span className="text-xs text-gray-400">+{amenities.length - 2}</span>
                  )}
                </div>
              )}
            </div>

            {/* Price and Actions */}
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm sm:text-base font-bold text-blue-600">
                  ₹{venue.price_per_day || venue.price_per_hour || venue.hourly_rate || 0}
                </div>
                <div className="text-xs text-gray-500">per day</div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline" 
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => handleViewDetails(venue.id)}
                >
                  View
                </Button>
                <Button 
                  size="sm"
                  className="text-xs h-7 px-2"
                  onClick={() => handleBookNow(venue.id)}
                >
                  Book
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // Standard Venue Card for Desktop
  const StandardVenueCard: React.FC<{ venue: ExtendedVenue }> = ({ venue }) => {
    const images = venue.images || venue.image_urls || venue.photos || [];
    const amenities = venue.amenities || [];
    const displayAmenities = amenities.slice(0, 3);
    const remainingCount = amenities.length - 3;

    return (
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden">
          {images.length > 0 ? (
            <img
              src={images[0]}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm sm:text-base">No Image</span>
            </div>
          )}
          
          {/* Rating Badge */}
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <Badge className="bg-white/90 text-gray-900 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
              {venue.rating?.toFixed(1) || venue.average_rating?.toFixed(1) || 'N/A'}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
          <div className="space-y-1 sm:space-y-2">
            {/* Venue Name */}
            <h3 className="font-bold text-base sm:text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              {venue.name}
            </h3>
            
            {/* Address */}
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
              <span className="line-clamp-1">{venue.address}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pb-2 sm:pb-3 px-3 sm:px-6">
          {/* Capacity */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Up to {venue.capacity} people</span>
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="mb-2 sm:mb-3">
              <div className="flex flex-wrap gap-1 mb-1">
                {displayAmenities.map((amenity, index) => (
                  <span key={index} className="text-xs text-gray-600 flex items-center gap-1">
                    {renderAmenityIcon(amenity)}
                    <span className="capitalize hidden sm:inline">{amenity}</span>
                  </span>
                ))}
              </div>
              {remainingCount > 0 && (
                <span className="text-xs text-gray-500">
                  +{remainingCount} more amenities
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="text-right">
            <div className="text-lg sm:text-2xl font-bold text-blue-600">
              ₹{venue.price_per_day || venue.price_per_hour || venue.hourly_rate || 0}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">per day</div>
          </div>
        </CardContent>

        <CardFooter className="pt-0 px-3 sm:px-6 pb-3 sm:pb-6">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline" 
              className="flex-1 text-xs sm:text-sm min-h-[44px]"
              onClick={() => handleViewDetails(venue.id)}
            >
              View Details
            </Button>
            <Button 
              className="flex-1 text-xs sm:text-sm min-h-[44px]"
              onClick={() => handleBookNow(venue.id)}
            >
              Book Now
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 sm:mb-8">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Venues</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchVenues}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Browse Venues</h1>
          <p className="text-sm sm:text-base text-gray-600">
            Discover amazing venues for your events. {filteredVenues.length} venues available.
          </p>
        </div>

        {/* Debug Info - Hidden on mobile */}
        <div className="mb-4 p-4 bg-blue-50 rounded-lg hidden md:block">
          <p className="text-sm text-blue-800">
            Debug: Total venues fetched: {venues.length}, Approved venues: {filteredVenues.length}, Loading: {loading.toString()}, Error: {error || 'none'}
          </p>
          {venues.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-blue-700">Sample venue: {venues[0].name} - Type: {venues[0].type} - Price: ₹{venues[0].price_per_day || venues[0].price_per_hour || venues[0].hourly_rate}</p>
            </div>
          )}
        </div>

        {/* Mobile Layout - Filters at Top */}
        <div className="lg:hidden">
          {/* Compact Filters at Top */}
          <div className="mb-4">
            <CompactFilterSection />
          </div>

          {/* Venue Grid - Compact Cards */}
          <div className="space-y-3">
            {filteredVenues.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="text-gray-400 mb-4">
                  <MapPin className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No venues found</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Try adjusting your filters to find more venues.
                </p>
                <Button onClick={resetFilters} variant="outline" className="min-h-[44px]">
                  Reset Filters
                </Button>
              </div>
            ) : (
              filteredVenues.map((venue) => (
                <CompactVenueCard key={venue.id} venue={venue} />
              ))
            )}
          </div>
        </div>

        {/* Desktop Layout - Sidebar Filters */}
        <div className="hidden lg:flex gap-6 lg:gap-8">
          {/* Left Column - Filters */}
          <div className="w-80 flex-shrink-0">
            <div className="sticky top-8">
              <FullFilterSection />
            </div>
          </div>

          {/* Right Column - Venue Grid */}
          <div className="flex-1">
            {filteredVenues.length === 0 ? (
              <div className="text-center py-8 sm:py-12 md:py-16 px-4">
                <div className="text-gray-400 mb-4">
                  <MapPin className="h-12 w-12 sm:h-16 sm:w-16 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No venues found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  Try adjusting your filters to find more venues.
                </p>
                <Button onClick={resetFilters} variant="outline" className="min-h-[44px]">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredVenues.map((venue) => (
                  <StandardVenueCard key={venue.id} venue={venue} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrowseVenues;