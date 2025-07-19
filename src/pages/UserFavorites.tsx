import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { favoritesService, UserFavorite } from '../lib/userService';
import { 
  Heart, 
  MapPin, 
  Star, 
  ArrowLeft,
  RefreshCw,
  Trash2,
  Search
} from 'lucide-react';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';

// Memoized Favorite Card - Mobile Optimized
const FavoriteCard = React.memo(({ favorite, handleRemoveFavorite }: { favorite: UserFavorite, handleRemoveFavorite: (venueId: string) => void }) => (
  <div
    key={favorite.id}
    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
  >
    {/* Venue Image */}
    <div className="relative w-full overflow-hidden bg-gray-200" style={{ aspectRatio: '16/9' }}>
      {favorite.venue?.image_urls?.[0] ? (
        <img
          src={favorite.venue.image_urls[0]}
          alt={favorite.venue.name}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center' }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <MapPin className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
        </div>
      )}
      <button
        onClick={() => handleRemoveFavorite(favorite.venue_id)}
        className="absolute top-2 right-2 p-2 sm:p-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
        title="Remove from favorites"
        aria-label="Remove from favorites"
      >
        <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
      </button>
    </div>
    {/* Venue Info */}
    <div className="p-3 sm:p-4">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
        {favorite.venue?.name || 'Unknown Venue'}
      </h3>
      <div className="flex items-center text-gray-600 mb-2">
        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
        <span className="text-xs sm:text-sm truncate">
          {favorite.venue?.address || 'Address not available'}
        </span>
      </div>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center">
          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 mr-1" />
          <span className="text-xs sm:text-sm text-gray-600">
            {favorite.venue?.rating || 0} (0 reviews)
          </span>
        </div>
      </div>
    </div>
  </div>
));

const UserFavorites: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading, refreshConnection } = useDatabase();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemoveFavorite = async (venueId: string) => {
    try {
      setLoading(true);
      const result = await favoritesService.removeFromFavorites(venueId);
      if (result.success) {
        setFavorites(prev => prev.filter(fav => fav.venue_id !== venueId));
      } else {
        setError(result.error || 'Failed to remove from favorites');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      setError('Failed to remove from favorites');
    } finally {
      setLoading(false);
    }
  };

  const memoizedFavorites = useMemo(() => favorites, [favorites]);
  const memoizedHandleRemoveFavorite = useCallback(handleRemoveFavorite, [favorites]);

  // Filter favorites based on search
  const filteredFavorites = useMemo(() => {
    if (!searchQuery) return memoizedFavorites;
    return memoizedFavorites.filter(favorite => 
      favorite.venue?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.venue?.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [memoizedFavorites, searchQuery]);

  useEffect(() => {
    if (authLoading || dbLoading) return; // Wait for auth and db to finish
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view your favorites.');
      return;
    }
    if (!isConnected) {
      setError('Database connection failed. Please check your connection and try again.');
      return;
    }
    if (!dataLoaded) {
    loadFavorites();
    }
  }, [user, authLoading, dbLoading, isConnected, dataLoaded]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      setError('');
      const favoritesData = await favoritesService.getUserFavorites();
      setFavorites(favoritesData || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setDataLoaded(false);
    setError('');
    await refreshConnection();
    if (isConnected) {
      await loadFavorites();
    }
  };

    return (
    <AuthWrapper 
      requireAuth={true}
      loadingText="Loading favorites..."
      fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <LoadingSpinner size="lg" text="Setting up your favorites..." />
            <p className="mt-4 text-gray-600 text-sm sm:text-base">This may take a moment...</p>
      </div>
      </div>
  }
    >
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header - Mobile Optimized */}
        <div className="mb-6 sm:mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Favorites</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Your saved venues and locations</p>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
              <span className="text-base sm:text-lg font-semibold text-gray-900">{favorites.length}</span>
            </div>
          </div>
        </div>

        {/* Search Bar - Mobile Optimized */}
        {favorites.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search your favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base h-12 sm:h-10"
              />
            </div>
          </div>
        )}

        {/* Results Count */}
        {favorites.length > 0 && (
          <div className="text-sm text-muted-foreground mb-4">
            {filteredFavorites.length} favorite{filteredFavorites.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Error Display - Mobile Optimized */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 sm:mb-6 flex items-center justify-between">
            <span className="text-sm sm:text-base flex-1">{error}</span>
            <button
              onClick={handleRefresh}
              className="text-red-600 hover:text-red-800 p-2 ml-2 rounded-lg hover:bg-red-100 transition-colors"
              aria-label="Refresh favorites"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Loading State - Mobile Optimized */}
        {loading && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <LoadingSpinner size="md" text="Loading your favorites..." />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {favorites.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">Start exploring venues and add them to your favorites!</p>
                <Link
                  to="/venues"
                  className="inline-flex items-center px-4 py-3 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base h-12 sm:h-10"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Browse Venues
                </Link>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Search className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No matches found</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">
                  No favorites match your search criteria.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="inline-flex items-center px-4 py-3 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base h-12 sm:h-10"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredFavorites.map((favorite) => (
                  <FavoriteCard
                    key={favorite.id}
                    favorite={favorite}
                    handleRemoveFavorite={memoizedHandleRemoveFavorite}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    </AuthWrapper>
  );
};

export default UserFavorites; 