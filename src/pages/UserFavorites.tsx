import React, { useState, useEffect } from 'react';
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
  Trash2
} from 'lucide-react';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';

const UserFavorites: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading, refreshConnection } = useDatabase();
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

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

    return (
    <AuthWrapper 
      requireAuth={true}
      loadingText="Loading favorites..."
      fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Setting up your favorites..." />
            <p className="mt-4 text-gray-600">This may take a moment...</p>
      </div>
      </div>
  }
    >
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
                <p className="text-gray-600 mt-2">Your saved venues and locations</p>
              </div>
              <div className="flex items-center space-x-2">
                <Heart className="h-6 w-6 text-red-500" />
                <span className="text-lg font-semibold text-gray-900">{favorites.length}</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={handleRefresh}
                className="text-red-600 hover:text-red-800"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
        </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" text="Loading your favorites..." />
          </div>
        )}

          {/* Content */}
          {!loading && (
            <>
        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
                  <p className="text-gray-600 mb-6">Start exploring venues and add them to your favorites!</p>
            <Link
              to="/venues"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                    <MapPin className="h-4 w-4 mr-2" />
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                      {/* Venue Image */}
                      <div className="relative h-48 bg-gray-200">
                        {favorite.venue?.image_urls?.[0] ? (
                          <img
                            src={favorite.venue.image_urls[0]}
                            alt={favorite.venue.name}
                            className="w-full h-full object-cover"
                  />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                  <button
                          onClick={() => handleRemoveFavorite(favorite.venue_id)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                          title="Remove from favorites"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                      {/* Venue Info */}
                      <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {favorite.venue?.name || 'Unknown Venue'}
                  </h3>
                  
                        <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span className="text-sm">
                            {favorite.venue?.address || 'Address not available'}
                    </span>
                  </div>
                  
                        <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">
                              {favorite.venue?.rating || 0} (0 reviews)
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-blue-600">
                            ${favorite.venue?.hourly_rate || 0}/hour
                    </span>
                    <Link
                      to={`/venue/${favorite.venue_id}`}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
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