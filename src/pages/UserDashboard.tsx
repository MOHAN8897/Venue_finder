import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { useNavigate } from 'react-router-dom';
import { 
  userService, 
  dashboardService,
  UserProfile,
  UserFavorite
} from '../lib/userService';
import { 
  User, 
  Heart, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';

interface RecentBooking {
  booking_id: string;
  venue_name: string;
  booking_date: string;
}

// Define a type for dashboard stats mapping
interface RawBooking {
  booking_id?: string;
  id?: string;
  venue_name?: string;
  venue?: { name?: string };
  booking_date?: string;
  start_date?: string;
}

// Memoized Recent Booking Item
const RecentBookingItem = React.memo(({ booking }: { booking: RecentBooking }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <div className="font-semibold text-gray-900">{booking.venue_name}</div>
      <div className="text-xs text-gray-500">{booking.booking_date}</div>
    </div>
    <ArrowRight className="h-5 w-5 text-blue-500" />
  </div>
));

// Memoized Favorite Item
const FavoriteItem = React.memo(({ favorite }: { favorite: UserFavorite }) => (
  <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <div className="font-semibold text-gray-900">{favorite.venue?.name || ''}</div>
      <div className="text-xs text-gray-500">{favorite.venue?.address || ''}</div>
    </div>
    <Heart className="h-5 w-5 text-red-500" />
  </div>
));

const UserDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading, refreshConnection } = useDatabase();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // State for user data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    totalFavorites: 0,
    totalReviews: 0,
    totalVenues: 0,
    recentBookings: [] as RecentBooking[],
    recentFavorites: [] as UserFavorite[]
  });

  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    booking_reminders: true,
    new_venue_alerts: true
  });

  const memoizedRecentBookings = useMemo(() => dashboardStats.recentBookings, [dashboardStats.recentBookings]);
  const memoizedRecentFavorites = useMemo(() => dashboardStats.recentFavorites, [dashboardStats.recentFavorites]);

  useEffect(() => {
    if (authLoading || dbLoading) return; // Wait for auth and db to finish
    if (!user) {
      navigate('/signin');
      return;
    }
    if (!isConnected) {
      setError('Database connection failed. Please check your connection and try again.');
      return;
    }
    if (!dataLoaded) {
      loadUserData();
    }
  }, [user, authLoading, dbLoading, isConnected, navigate, dataLoaded]);

  const loadUserData = async () => {
    setDataLoading(true);
    setError('');
    try {
      // Fetch user profile using RPC
      const profileData = await userService.getCurrentUserProfile();
      if (!profileData) {
        setError('Failed to load user profile. Please try refreshing the page.');
        setDataLoading(false);
        return;
      }
      setUserProfile(profileData);
      setSettings(profileData.notification_settings || {
        email_notifications: true,
        sms_notifications: false,
        marketing_emails: true,
        booking_reminders: true,
        new_venue_alerts: true
      });
      // Fetch dashboard stats using RPC
      const stats = await dashboardService.getDashboardStats();
      setDashboardStats({
        ...stats,
        recentBookings: (stats?.recentBookings || []).map((b: RawBooking) => ({
          booking_id: b.booking_id || b.id || '',
          venue_name: b.venue_name || (b.venue && b.venue.name) || '',
          booking_date: b.booking_date || b.start_date || ''
        })),
        recentFavorites: stats?.recentFavorites || []
      });
      setDataLoaded(true);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data. Please try refreshing the page.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleSettingsUpdate = async (newSettings: typeof settings) => {
    try {
      setDataLoading(true);
      const result = await userService.updateNotificationSettings(newSettings);
      
      if (result.success) {
        setSettings(newSettings);
      } else {
        setError(result.error || 'Failed to update settings');
      }
    } catch {
      setError('Failed to update settings');
    } finally {
      setDataLoading(false);
    }
  };

  const handleRefresh = async () => {
    setDataLoaded(false);
    setError('');
    await refreshConnection();
    if (isConnected) {
      await loadUserData();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome back, {userProfile?.full_name || 'User'}!
            </h2>
            <p className="text-blue-100">Here's what's happening with your account</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalFavorites}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalReviews}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Venues</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalVenues}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Bookings</h3>
        {dashboardStats.recentBookings.length === 0 ? (
          <div className="text-gray-500 text-sm">No bookings available.</div>
        ) : (
          <div className="space-y-2">
            {memoizedRecentBookings.map((booking, idx) => (
              <RecentBookingItem key={booking.booking_id || idx} booking={booking} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Favorites */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Recent Favorites</h3>
        {dashboardStats.recentFavorites.length === 0 ? (
          <div className="text-gray-500 text-sm">No favorites available.</div>
        ) : (
          <div className="space-y-2">
            {memoizedRecentFavorites.map((favorite, idx) => (
              <FavoriteItem key={favorite.id || idx} favorite={favorite} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, email_notifications: !settings.email_notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">SMS Notifications</p>
              <p className="text-sm text-gray-600">Receive updates via SMS</p>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, sms_notifications: !settings.sms_notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.sms_notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AuthWrapper 
      requireAuth={true}
      loadingText="Loading dashboard..."
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" text="Setting up your dashboard..." />
            <p className="mt-4 text-gray-600">This may take a moment...</p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Welcome to your venue finder dashboard</p>
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
          {dataLoading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="md" text="Loading your data..." />
            </div>
          )}

          {/* Content */}
          {!dataLoading && (
            <>
              {/* Navigation Tabs */}
              <div className="mb-6">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'settings'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Settings
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'settings' && renderSettings()}
            </>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
};

export default UserDashboard; 