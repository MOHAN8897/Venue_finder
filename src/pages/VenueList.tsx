import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { MapPin, Star, Users, Calendar, Search, Filter, Grid, List, ArrowLeft } from 'lucide-react';
import { venueService, Venue } from '../lib/venueService';

const VenueList: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        const data = await venueService.getAllVenues();
        setVenues(data || []);
      } catch (error) {
        console.error('Error fetching venues:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, []);

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || venue.type === selectedType;
    return matchesSearch && matchesType;
  });

  const sortedVenues = [...filteredVenues].sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (a.hourly_rate || 0) - (b.hourly_rate || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'capacity':
        return b.capacity - a.capacity;
      default:
        return a.name.localeCompare(b.name);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading venues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link 
            to="/"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </div>

        {/* Header - Mobile Optimized */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">All Venues</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Discover amazing venues for your next event
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-10 sm:h-9"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-10 sm:h-9"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Search and Filters - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search venues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
              />
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="wedding">Wedding</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="birthday">Birthday</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="capacity">Capacity</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 sm:h-10 text-sm sm:text-base">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            Showing {sortedVenues.length} of {venues.length} venues
          </p>
        </div>

        {/* Venues Grid/List - Mobile Optimized */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {sortedVenues.map((venue) => (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gray-200 relative">
                  {(venue.image_urls && venue.image_urls[0]) || (venue.images && venue.images[0]) ? (
                    <img
                      src={(venue.image_urls && venue.image_urls[0]) || (venue.images && venue.images[0]) || ''}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                    {venue.type}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-1">{venue.name}</h3>
                  <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
                    <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                      <span className="text-sm">{venue.rating || 0}</span>
                      <span className="text-xs text-gray-500">({venue.review_count || 0})</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{venue.capacity}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-green-600 text-sm sm:text-base">
                      ₹{venue.hourly_rate || venue.price_per_hour || 0}/hour
                    </span>
                    <Link to={`/venue/${venue.id}`}>
                      <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                        View Details
                      </Button>
                    </Link>
            </div>
                </CardContent>
              </Card>
            ))}
            </div>
          ) : (
          <div className="space-y-4">
            {sortedVenues.map((venue) => (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-48 h-32 bg-gray-200 rounded-lg relative flex-shrink-0">
                      {(venue.image_urls && venue.image_urls[0]) || (venue.images && venue.images[0]) ? (
                        <img
                          src={(venue.image_urls && venue.image_urls[0]) || (venue.images && venue.images[0]) || ''}
                          alt={venue.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                          <Calendar className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                      <Badge className="absolute top-2 right-2 bg-blue-600 text-white text-xs">
                        {venue.type}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg mb-2">{venue.name}</h3>
                      <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-2">
                        {venue.description}
                      </p>
                      <div className="flex items-center gap-1 text-gray-600 text-sm mb-3">
                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        <span className="truncate">{venue.address}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                            <span>{venue.rating || 0}</span>
                            <span className="text-gray-500">({venue.review_count || 0})</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span>Capacity: {venue.capacity}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-green-600 text-sm sm:text-base">
                            ₹{venue.hourly_rate || venue.price_per_hour || 0}/hour
                          </span>
                          <Link to={`/venue/${venue.id}`}>
                            <Button size="sm" className="h-8 sm:h-9 text-xs sm:text-sm">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
        </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {sortedVenues.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button onClick={() => { setSearchTerm(''); setSelectedType(''); }}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VenueList;