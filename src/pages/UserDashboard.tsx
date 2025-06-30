import React, { useState, useEffect } from 'react';
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
  Calendar, 
  Heart, 
  MapPin, 
  Star, 
  Building2,
  ArrowRight,
  RefreshCw,
  AlertCircle
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

const UserDashboard: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading, error: dbError, refreshConnection } = useDatabase();
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
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalFavorites}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalReviews}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Listed Venues</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalVenues}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/venues')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3" />
                <span>Browse Venues</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/list-venue')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center">
                <Building2 className="h-5 w-5 mr-3" />
                <span>List Your Venue</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
            {dashboardStats.totalVenues > 0 && (
              <button
                onClick={() => navigate('/manage-venues')}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 mr-3" />
                  <span>Manage My Venues ({dashboardStats.totalVenues})</span>
                </div>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => navigate('/bookings')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3" />
                <span>View Bookings</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/favorites')}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center">
                <Heart className="h-5 w-5 mr-3" />
                <span>My Favorites</span>
              </div>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {dashboardStats.recentBookings.length > 0 ? (
              dashboardStats.recentBookings.slice(0, 3).map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{booking.venue_name}</p>
                    <p className="text-sm text-gray-600">{new Date(booking.booking_date).toLocaleDateString()}</p>
                  </div>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>
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