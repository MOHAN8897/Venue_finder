import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { bookingsService, UserBooking } from '../lib/userService';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Eye
} from 'lucide-react';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';

const UserBookings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading, refreshConnection } = useDatabase();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (authLoading || dbLoading) return; // Wait for auth and db to finish
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view your bookings.');
      return;
    }
    if (!isConnected) {
      setError('Database connection failed. Please check your connection and try again.');
      return;
    }
    if (!dataLoaded) {
    loadBookings();
    }
  }, [user, authLoading, dbLoading, isConnected, dataLoaded]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const bookingsData = await bookingsService.getUserBookings();
      setBookings(bookingsData || []);
      setDataLoaded(true);
    } catch (err) {
      console.error('Error loading bookings:', err);
      setError('Failed to load bookings. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setDataLoaded(false);
    setError('');
    await refreshConnection();
    if (isConnected) {
      await loadBookings();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AuthWrapper 
      requireAuth={true}
      loadingText="Loading bookings..."
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Setting up your bookings..." />
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
              <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                <p className="text-gray-600 mt-2">Your venue reservations and bookings</p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-6 w-6 text-blue-500" />
                <span className="text-lg font-semibold text-gray-900">{bookings.length}</span>
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
              <LoadingSpinner size="md" text="Loading your bookings..." />
          </div>
        )}

          {/* Content */}
          {!loading && (
            <>
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                  <p className="text-gray-600 mb-6">Start exploring venues and make your first booking!</p>
            <Link
              to="/venues"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                    <MapPin className="h-4 w-4 mr-2" />
              Browse Venues
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                        {/* Booking Info */}
                        <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {booking.venue?.name || 'Unknown Venue'}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                                  {booking.venue?.address || 'Address not available'}
                        </span>
                      </div>
                    </div>
                            <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1 capitalize">{booking.status}</span>
                    </div>
                  </div>
                  
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Start Time</p>
                                <p className="text-sm text-gray-600">{formatDate(booking.start_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">End Time</p>
                                <p className="text-sm text-gray-600">{formatDate(booking.end_date)}</p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Total Price</p>
                                <p className="text-sm text-gray-600">${booking.total_price}</p>
                    </div>
                    </div>
                  </div>
                  
                          {booking.notes && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-900 mb-1">Notes</p>
                              <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                          )}
                    
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                              Booking ID: {booking.id}
                            </div>
                    <Link
                      to={`/venue/${booking.venue_id}`}
                              className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                              <Eye className="h-4 w-4 mr-1" />
                      View Venue
                    </Link>
                          </div>
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

export default UserBookings; 