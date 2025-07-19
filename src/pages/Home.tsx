import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Clock, Shield, Star, ArrowRight, Users, Award } from 'lucide-react';
import { venueService, Venue } from '../lib/venueService';

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
    { type: 'banquet-hall', name: 'Banquet Halls', icon: '🎉', count: 0 },
    { type: 'sports-complex', name: 'Sports Complex', icon: '⚽', count: 0 },
    { type: 'party-hall', name: 'Party Halls', icon: '🎊', count: 0 },
    { type: 'conference-room', name: 'Conference Rooms', icon: '💼', count: 0 }
  ];

  return (
    <div id="home-page" className="min-h-screen">
      {/* Hero Section */}
      <section id="hero-section" className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-green-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center space-y-8">
            <h1 id="hero-title" className="text-4xl md:text-6xl font-bold leading-tight">
              Find Perfect Venues for
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Every Occasion
              </span>
            </h1>
            <p id="hero-description" className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Discover and book cricket boxes, farmhouses, banquet halls, and more with instant confirmation
            </p>

            {/* Search Form */}
            <form id="search-form" onSubmit={handleSearch} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
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
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label id="type-label" className="block text-sm font-semibold text-gray-700">Venue Type</label>
                  <select
                    id="type-select"
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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
                  <label id="search-button-label" className="block text-sm font-semibold text-gray-700 md:text-transparent">Search</label>
                  <button
                    id="search-button"
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 font-semibold flex items-center justify-center space-x-2 transform hover:scale-105"
                  >
                    <Search className="h-5 w-5" />
                    <span>Search Venues</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Stats */}
            <div id="stats-section" className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto mt-16">
              <div id="stat-venues" className="text-center">
                <div className="text-3xl font-bold text-yellow-300">{featuredVenues.length}</div>
                <div className="text-blue-100">Premium Venues</div>
              </div>
              <div id="stat-customers" className="text-center">
                <div className="text-3xl font-bold text-yellow-300">0</div>
                <div className="text-blue-100">Happy Customers</div>
              </div>
              <div id="stat-cities" className="text-center">
                <div className="text-3xl font-bold text-yellow-300">0</div>
                <div className="text-blue-100">Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Venue Types */}
      <section id="venue-types-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="venue-types-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Browse by Venue Type
            </h2>
            <p id="venue-types-description" className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find the perfect space for your event from our diverse collection
            </p>
          </div>

          <div id="venue-types-grid" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {venueTypes.map((category, index) => (
              <Link
                key={category.type}
                id={`venue-type-${index}`}
                to={`/venues?type=${category.type}`}
                className="group bg-white rounded-2xl p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500">{category.count} venues</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Venues */}
      <section id="featured-venues-section" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 id="featured-venues-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Venues
              </h2>
              <p id="featured-venues-description" className="text-xl text-gray-600">
                Discover our most popular and highly-rated venues
              </p>
            </div>
            <Link
              id="view-all-venues-link"
              to="/venues"
              className="hidden md:flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="h-5 w-5" />
            </Link>

          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">{error}</p>
            </div>
          ) : featuredVenues.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No featured venues available at the moment.</p>
              <p className="text-gray-400 text-sm mt-2">Check back soon for new venues!</p>
            </div>
          ) : (
            <div id="featured-venues-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredVenues.map((venue, index) => (
                <Link
                  key={venue.id}
                  id={`featured-venue-${index}`}
                  to={`/venue/${venue.id}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                >
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
                    <img
                      src={venue.images && venue.images.length > 0 ? venue.images[0] : 'https://via.placeholder.com/400x300?text=No+Image'}
                      alt={venue.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      style={{ objectPosition: 'center' }}
                    />
                    <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 flex items-center space-x-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-semibold">{venue.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{venue.city}, {venue.state}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {venue.name}
                    </h3>
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
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12 md:hidden">
            <Link
              id="mobile-view-all-venues-link"
              to="/venues"
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <span>View All Venues</span>
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features-section" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 id="features-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose VenueFinder?
            </h2>
            <p id="features-description" className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make venue booking simple, secure, and hassle-free
            </p>
          </div>

          <div id="features-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div id="feature-easy-search" className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-green-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Search className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Easy Search</h3>
              <p className="text-gray-600">
                Find venues quickly with our advanced search and filter options
              </p>
            </div>

            <div id="feature-instant-booking" className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Booking</h3>
              <p className="text-gray-600">
                Book your venue instantly with real-time availability updates
              </p>
            </div>

            <div id="feature-secure-payment" className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Payment</h3>
              <p className="text-gray-600">
                Your payments are protected with bank-level security
              </p>
            </div>

            <div id="feature-quality-assured" className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assured</h3>
              <p className="text-gray-600">
                All venues are verified and meet our quality standards
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta-section" className="py-20 bg-gradient-to-r from-blue-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 id="cta-title" className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Find Your Perfect Venue?
          </h2>
          <p id="cta-description" className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who found their ideal event space through VenueFinder
          </p>
          <div id="cta-buttons" className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              id="cta-browse-venues"
              to="/venues"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors font-bold text-lg"
            >
              Browse Venues
            </Link>
            <Link
              id="cta-list-venue"
              to="/list-venue"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-blue-600 transition-colors font-bold text-lg"
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