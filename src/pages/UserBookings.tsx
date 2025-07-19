import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { bookingsService, UserBooking } from '../lib/userService';
import { 
  Calendar, 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';

// Memoized Booking Card - Mobile Optimized
const BookingCard = React.memo(({ booking, getStatusColor, getStatusIcon, formatDate }: { booking: UserBooking, getStatusColor: (status: string) => string, getStatusIcon: (status: string) => JSX.Element, formatDate: (date: string) => string }) => (
  <div
    key={booking.id}
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
      {/* Booking Info */}
      <div className="flex-1">
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 truncate">
              {booking.venue?.name || 'Unknown Venue'}
            </h3>
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
              <span className="text-xs sm:text-sm truncate">
                {booking.venue?.address || 'Address not available'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
          <span className="text-xs sm:text-sm text-gray-500">{formatDate(booking.start_date)}</span>
          <span className="hidden sm:inline text-xs sm:text-sm text-gray-500">to</span>
          <span className="text-xs sm:text-sm text-gray-500">{formatDate(booking.end_date)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>{booking.status}</span>
          {getStatusIcon(booking.status)}
        </div>
      </div>
      {/* Price */}
      <div className="mt-3 sm:mt-4 lg:mt-0 lg:ml-8 flex flex-col items-end">
        <span className="text-base sm:text-lg font-bold text-blue-600">₹{booking.total_price}</span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  </div>
));

const PAGE_SIZE = 10;

const UserBookings: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading, refreshConnection } = useDatabase();
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(PAGE_SIZE);
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
  }, [user, authLoading, dbLoading, isConnected, dataLoaded, page, pageSize]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const { bookings: bookingsData, total } = await bookingsService.getUserBookings(page, pageSize);
      setBookings(bookingsData || []);
      setTotal(total);
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

  const memoizedBookings = useMemo(() => bookings, [bookings]);
  const memoizedGetStatusColor = useCallback(getStatusColor, []);
  const memoizedGetStatusIcon = useCallback(getStatusIcon, []);
  const memoizedFormatDate = useCallback(formatDate, []);

  // Pagination controls
  const totalPages = Math.ceil(total / pageSize);
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    setDataLoaded(false);
  };

  return (
    <AuthWrapper 
      requireAuth={true}
      loadingText="Loading bookings..."
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <LoadingSpinner size="lg" text="Setting up your bookings..." />
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
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Bookings</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Your venue reservations and bookings</p>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              <span className="text-base sm:text-lg font-semibold text-gray-900">{bookings.length}</span>
            </div>
          </div>
        </div>

        {/* Error Display - Mobile Optimized */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 sm:mb-6 flex items-center justify-between">
            <span className="text-sm sm:text-base flex-1">{error}</span>
            <button
              onClick={handleRefresh}
              className="text-red-600 hover:text-red-800 p-2 ml-2 rounded-lg hover:bg-red-100 transition-colors"
              aria-label="Refresh bookings"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Loading State - Mobile Optimized */}
        {loading && (
          <div className="flex items-center justify-center py-8 sm:py-12">
            <LoadingSpinner size="md" text="Loading your bookings..." />
          </div>
        )}

        {/* Content */}
        {!loading && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-8 sm:py-12 px-4">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-6 text-sm sm:text-base">Start exploring venues and make your first booking!</p>
                <Link
                  to="/venues"
                  className="inline-flex items-center px-4 py-3 sm:px-6 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base h-12 sm:h-10"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Browse Venues
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6">
                {memoizedBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    getStatusColor={memoizedGetStatusColor}
                    getStatusIcon={memoizedGetStatusIcon}
                    formatDate={memoizedFormatDate}
                  />
                ))}
              </div>
            )}
            
            {/* Pagination Controls - Mobile Optimized */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 sm:mt-8 gap-1 sm:gap-2">
                <button
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded border bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm sm:text-base h-10 sm:h-9"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {/* Page Numbers - Show limited on mobile */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => {
                    // Show current page, first page, last page, and pages around current
                    if (totalPages <= 5) return true;
                    if (p === 1 || p === totalPages) return true;
                    if (p >= page - 1 && p <= page + 1) return true;
                    return false;
                  })
                  .map((p, index, array) => {
                    // Add ellipsis if there's a gap
                    const showEllipsis = index > 0 && p - array[index - 1] > 1;
                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-2 py-2 text-gray-500 text-sm">...</span>
                        )}
                        <button
                          className={`px-3 py-2 sm:px-4 sm:py-2 rounded border text-sm sm:text-base h-10 sm:h-9 ${
                            p === page 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'bg-white text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => handlePageChange(p)}
                          disabled={p === page}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    );
                  })}
                
                <button
                  className="px-3 py-2 sm:px-4 sm:py-2 rounded border bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 transition-colors text-sm sm:text-base h-10 sm:h-9"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
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