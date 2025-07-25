import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Shield, Star, ArrowRight, Users, Award } from 'lucide-react';
import { venueService, Venue } from '../lib/venueService';
import PaymentTest from '../components/PaymentTest';

const Home: React.FC = () => {
  const [searchLocation, setSearchLocation] = useState('');
  const [searchType, setSearchType] = useState('');
  const [featuredVenues, setFeaturedVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch featured venues from database
  useEffect(() => {
    const fetchFeaturedVenues = async () => {
      try {
        setLoading(true);
        const venues = await venueService.getFeaturedVenues(6);
        setFeaturedVenues(venues);
      } catch (err) {
        console.error('Error fetching featured venues:', err);
        setError('Unable to load featured venues. Please check your internet connection.');
        
        // Set fallback venues for better UX
        const fallbackVenues = [
          {
            id: 'fallback-1',
            name: 'Sample Cricket Ground',
            type: 'Cricket Ground',
            description: 'A beautiful cricket ground with modern facilities',
            address: 'Sample Address, City',
            city: 'Sample City',
            state: 'Sample State',
            pincode: '123456',
            capacity: 100,
            area: '5000 sq ft',
            hourly_rate: 500,
            daily_rate: 5000,
            price_per_hour: 500,
            price_per_day: 5000,
            currency: 'INR',
            images: ['https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400'],
            videos: [],
            amenities: ['wifi', 'parking', 'ac'],
            owner_id: 'fallback-owner',
            status: 'approved',
            verified: true,
            rating: 4.5,
            review_count: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            approval_status: 'approved' as const,
            is_approved: true,
            is_published: true,
          }
        ];
        setFeaturedVenues(fallbackVenues);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedVenues();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchLocation) params.set('location', searchLocation);
    if (searchType) params.set('type', searchType);
    navigate(`/venues?${params.toString()}`);
  };

  const venueTypes = [
    { type: 'cricket-box', name: 'Cricket Boxes', icon: '🏏', count: 0 },
    { type: 'farmhouse', name: 'Farmhouses', icon: '🏡', count: 0 },
  ];

  return (
    <div id="home-page" className="min-h-screen">
      {/* Hero Section - Mobile Optimized */}
      <section id="hero-section" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 text-white overflow-hidden min-h-[60vh] md:min-h-[80vh]">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32">
          <div className="text-center space-y-6 sm:space-y-8">
            <h1 id="hero-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold leading-tight px-2">
              Find Perfect Venues for
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mt-1 sm:mt-2">
                Every Occasion
              </span>
            </h1>
            <p id="hero-description" className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed px-4">
              Discover and book cricket boxes, farmhouses, banquet halls, and more with instant confirmation
            </p>

            {/* Search Form - Mobile Optimized */}
            <form id="search-form" onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 mx-4">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <label id="location-label" className="block text-sm font-semibold text-gray-700">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="location-input"
                      type="text"
                      placeholder="Enter city or area..."
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label id="type-label" className="block text-sm font-semibold text-gray-700">Venue Type</label>
                  <select
                    id="type-select"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 text-base"
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
                
                <div className="space-y-2">
                  <label id="search-button-label" className="block text-sm font-semibold text-gray-700">Search</label>
                  <button
                    id="search-button"
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 sm:py-4 px-6 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 transform hover:scale-105 min-h-[44px]"
                  >
                    <Search className="h-5 w-5" />
                    <span>Search Venues</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Stats - Mobile Optimized */}
            <div id="stats-section" className="grid grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-3xl mx-auto mt-8 sm:mt-12 md:mt-16 px-4">
              <div id="stat-venues" className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">{featuredVenues.length}</div>
                <div className="text-sm sm:text-base text-blue-100">Premium Venues</div>
              </div>
              <div id="stat-customers" className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">0</div>
                <div className="text-sm sm:text-base text-blue-100">Happy Customers</div>
              </div>
              <div id="stat-cities" className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-300">0</div>
                <div className="text-sm sm:text-base text-blue-100">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Types - Mobile Optimized */}
      <section id="venue-types-section" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 id="venue-types-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Browse by Venue Type
            </h2>
            <p id="venue-types-description" className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Find the perfect space for your event from our diverse collection
            </p>
          </div>

          <div id="venue-types-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {venueTypes.map((category, index) => (
              <Link
                key={category.type}
                id={`venue-type-${index}`}
                to={`/venues?type=${category.type}`}
                className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100 min-h-[120px] sm:min-h-[140px] flex flex-col justify-center"
              >
                <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 md:mb-4">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-600 transition-colors text-sm sm:text-base">
                  {category.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500">{category.count} venues</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Mobile Optimized */}
      <section id="features-section" className="py-12 sm:py-16 md:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12 md:mb-16">
            <h2 id="features-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Why Choose VenueFinder?
            </h2>
            <p id="features-description" className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              We make venue booking simple, secure, and hassle-free
            </p>
          </div>

          <div id="features-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div id="feature-easy-search" className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Search className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Easy Search</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Find venues quickly with our advanced search and filter options
              </p>
            </div>

            <div id="feature-instant-booking" className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Instant Booking</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Book your venue instantly with real-time availability updates
              </p>
            </div>

            <div id="feature-secure-payment" className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Secure Payment</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Your payments are protected with bank-level security
              </p>
            </div>

            <div id="feature-quality-assured" className="text-center group">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">Quality Assured</h3>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                All venues are verified and meet our quality standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section id="cta-section" className="py-12 sm:py-16 md:py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-title" className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 px-2">
            Ready to Find Your Perfect Venue?
          </h2>
          <p id="cta-description" className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Join thousands of satisfied customers who found their ideal event space through VenueFinder
          </p>
          <div id="cta-buttons" className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              id="cta-browse-venues"
              to="/venues"
              className="bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-gray-100 transition-colors font-bold text-base sm:text-lg min-h-[44px] flex items-center justify-center"
            >
              Browse Venues
            </Link>
            <Link
              id="cta-list-venue"
              to="/list-venue"
              className="bg-transparent border-2 border-white text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-colors font-bold text-base sm:text-lg min-h-[44px] flex items-center justify-center"
            >
              List Your Venue
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;