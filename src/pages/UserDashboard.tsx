import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  userService, 
  favoritesService, 
  reviewsService, 
  bookingsService, 
  venueOwnerService, 
  dashboardService,
  UserProfile,
  UserFavorite,
  UserReview,
  UserBooking
} from '../lib/userService';
import { 
  User, 
  Calendar, 
  Settings, 
  LogOut, 
  Heart, 
  MapPin, 
  Star, 
  Clock,
  Edit,
  Save,
  X,
  Camera,
  Bell,
  BookOpen,
  Building2,
  TrendingUp,
  Plus,
  Trash2
} from 'lucide-react';

const UserDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for user data
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<UserFavorite[]>([]);
  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [userVenues, setUserVenues] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState({
    totalBookings: 0,
    totalFavorites: 0,
    totalReviews: 0,
    totalVenues: 0,
    recentBookings: [] as UserBooking[],
    recentFavorites: [] as UserFavorite[]
  });

  // Edit form state
  const [editData, setEditData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say'
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
    if (!user) {
      navigate('/signin');
      return;
    }

    loadUserData();
  }, [user, navigate]);

  const loadUserData = async () => {
    setLoading(true);
    setError('');

    try {
      const [
        profile,
        userFavorites,
        userBookings,
        userReviews,
        venues,
        stats
      ] = await Promise.all([
        userService.getCurrentUserProfile(),
        favoritesService.getUserFavorites(),
        bookingsService.getUserBookings(),
        reviewsService.getUserReviews(),
        venueOwnerService.getUserVenues(),
        dashboardService.getDashboardStats()
      ]);

      setUserProfile(profile);
      setFavorites(userFavorites);
      setBookings(userBookings);
      setReviews(userReviews);
      setUserVenues(venues);
      setDashboardStats(stats);

      // Initialize edit data
      if (profile) {
        setEditData({
          full_name: profile.full_name || '',
          phone: profile.phone || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          date_of_birth: profile.date_of_birth || '',
          gender: profile.gender || 'prefer_not_to_say'
        });

        setSettings(profile.notification_settings || {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          booking_reminders: true,
          new_venue_alerts: true
        });
      }
    } catch (err) {
      setError('Failed to load user data. Please try again.');
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    try {
      setLoading(true);
      const result = await userService.updateUserProfile(editData);
      
      if (result.success) {
        setIsEditing(false);
        await loadUserData(); // Reload data
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (newSettings: typeof settings) => {
    try {
      setLoading(true);
      const result = await userService.updateNotificationSettings(newSettings);
      
      if (result.success) {
        setSettings(newSettings);
      } else {
        setError(result.error || 'Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const result = await userService.uploadUserAvatar(file);
      
      if (result.success) {
        await loadUserData(); // Reload data
      } else {
        setError(result.error || 'Failed to upload avatar');
      }
    } catch (err) {
      setError('Failed to upload avatar');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (venueId: string) => {
    try {
      const result = await favoritesService.removeFromFavorites(venueId);
      if (result.success) {
        setFavorites(prev => prev.filter(fav => fav.venue_id !== venueId));
      } else {
        setError(result.error || 'Failed to remove from favorites');
      }
    } catch (err) {
      setError('Failed to remove from favorites');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      const result = await bookingsService.cancelBooking(bookingId);
      if (result.success) {
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' as const }
            : booking
        ));
      } else {
        setError(result.error || 'Failed to cancel booking');
      }
    } catch (err) {
      setError('Failed to cancel booking');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return null;
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'bookings', name: 'My Bookings', icon: Calendar },
    { id: 'favorites', name: 'Favorites', icon: Heart },
    { id: 'reviews', name: 'My Reviews', icon: Star },
    { id: 'venues', name: 'My Venues', icon: Building2 },
    { id: 'settings', name: 'Settings', icon: Settings }
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Edit className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleEditSave}
              disabled={loading}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setEditData({
                  full_name: userProfile?.full_name || '',
                  phone: userProfile?.phone || '',
                  address: userProfile?.address || '',
                  city: userProfile?.city || '',
                  state: userProfile?.state || '',
                  date_of_birth: userProfile?.date_of_birth || '',
                  gender: userProfile?.gender || 'prefer_not_to_say'
                });
              }}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name || user.email}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="h-10 w-10 text-white" />
              </div>
            )}
            {isEditing && (
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1 rounded-full cursor-pointer hover:bg-blue-700">
                <Camera className="h-3 w-3" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <div>
            <h4 className="text-lg font-medium text-gray-900">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  className="border border-gray-300 rounded px-2 py-1 w-full"
                  placeholder="Enter full name"
                />
              ) : (
                userProfile?.full_name || 'No name provided'
              )}
            </h4>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            {isEditing ? (
              <input
                type="tel"
                value={editData.phone}
                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter phone number"
              />
            ) : (
              <p className="text-gray-900">{userProfile?.phone || 'No phone number provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <p className="text-gray-900">
              {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.address}
                onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter address"
              />
            ) : (
              <p className="text-gray-900">{userProfile?.address || 'No address provided'}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.city}
                onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Enter city"
              />
            ) : (
              <p className="text-gray-900">{userProfile?.city || 'No city provided'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Bookings</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalBookings}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Heart className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Favorites</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalFavorites}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Star className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Reviews</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalReviews}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <Building2 className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">My Venues</p>
              <p className="text-2xl font-semibold text-gray-900">{dashboardStats.totalVenues}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">My Bookings</h3>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h4>
          <p className="text-gray-600 mb-4">Start exploring venues and make your first booking!</p>
          <button
            onClick={() => navigate('/venues')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Venues
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{booking.venue?.name}</h4>
                  <p className="text-gray-600 flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {booking.venue?.address}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-gray-900 mt-2">₹{booking.total_price}</p>
                </div>
                {booking.status === 'pending' && (
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFavorites = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">My Favorites</h3>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h4>
          <p className="text-gray-600 mb-4">Start adding venues to your favorites!</p>
          <button
            onClick={() => navigate('/venues')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Venues
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => (
            <div key={favorite.id} className="bg-white rounded-lg shadow overflow-hidden">
              {favorite.venue?.image_urls?.[0] && (
                <img
                  src={favorite.venue.image_urls[0]}
                  alt={favorite.venue.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{favorite.venue?.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{favorite.venue?.address}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">{favorite.venue?.rating || 0}</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">₹{favorite.venue?.hourly_rate}/hr</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <button
                    onClick={() => navigate(`/venue/${favorite.venue_id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleRemoveFromFavorites(favorite.venue_id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">My Reviews</h3>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h4>
          <p className="text-gray-600 mb-4">Start reviewing venues you've visited!</p>
          <button
            onClick={() => navigate('/venues')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Venues
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">{review.venue?.name}</h4>
                  <p className="text-gray-600 text-sm mb-2">{review.venue?.address}</p>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">{review.rating}/5</span>
                  </div>
                  {review.review_text && (
                    <p className="text-gray-700">{review.review_text}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-2">
                    Reviewed on {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVenues = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">My Venues</h3>
        <button
          onClick={() => navigate('/list-venue')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Venue
        </button>
      </div>

      {userVenues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No venues listed yet</h4>
          <p className="text-gray-600 mb-4">Start earning by listing your venues!</p>
          <button
            onClick={() => navigate('/list-venue')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            List Your Venue
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userVenues.map((venue) => (
            <div key={venue.id} className="bg-white rounded-lg shadow overflow-hidden">
              {venue.image_urls?.[0] && (
                <img
                  src={venue.image_urls[0]}
                  alt={venue.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-2">{venue.name}</h4>
                <p className="text-gray-600 text-sm mb-2">{venue.address}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    venue.status === 'approved' ? 'bg-green-100 text-green-800' :
                    venue.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {venue.status.charAt(0).toUpperCase() + venue.status.slice(1)}
                  </span>
                  <span className="text-lg font-semibold text-gray-900">₹{venue.hourly_rate}/hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">{venue.rating || 0}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/venue/${venue.id}`)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-gray-900">Settings</h3>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h4>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, email_notifications: !settings.email_notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.email_notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">SMS Notifications</p>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, sms_notifications: !settings.sms_notifications })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.sms_notifications ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.sms_notifications ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BookOpen className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Marketing Emails</p>
                <p className="text-sm text-gray-500">Receive promotional emails</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, marketing_emails: !settings.marketing_emails })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.marketing_emails ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.marketing_emails ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Booking Reminders</p>
                <p className="text-sm text-gray-500">Get reminded about upcoming bookings</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, booking_reminders: !settings.booking_reminders })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.booking_reminders ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.booking_reminders ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">New Venue Alerts</p>
                <p className="text-sm text-gray-500">Get notified about new venues</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingsUpdate({ ...settings, new_venue_alerts: !settings.new_venue_alerts })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.new_venue_alerts ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.new_venue_alerts ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h4>
        <button
          onClick={handleSignOut}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  if (loading && !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {userProfile?.full_name || user.email}!</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            {activeTab === 'profile' && renderProfile()}
            {activeTab === 'bookings' && renderBookings()}
            {activeTab === 'favorites' && renderFavorites()}
            {activeTab === 'reviews' && renderReviews()}
            {activeTab === 'venues' && renderVenues()}
            {activeTab === 'settings' && renderSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard; 