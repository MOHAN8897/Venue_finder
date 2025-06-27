import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../lib/userService';
import type { UserProfile } from '../lib/userService';
import { 
  User, 
  Settings, 
  Camera, 
  Save, 
  X, 
  Edit, 
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Globe
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Cropper from 'react-easy-crop';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import { getCroppedImg } from '../utils/cropImage';

// Utility to omit preferences field
function omitPreferences<T extends object>(obj: T): Partial<T> {
  const rest: Partial<T> = { ...obj };
  delete (rest as Partial<T> & { preferences?: unknown }).preferences;
  return rest;
}

const UserSettings: React.FC = () => {
  const { user, updateProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Profile form state
  const [profileData, setProfileData] = useState<{
    full_name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  }>({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    gender: 'prefer_not_to_say'
  });

  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    marketing_emails: true,
    booking_reminders: true,
    new_venue_alerts: true
  });

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return; // Wait for auth to finish
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view your settings.');
      return;
    }
    loadUserData();
  }, [user, authLoading]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.user_id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        setError('Failed to load user profile');
        return;
      }

      if (profileData) {
        let loadedPhone = profileData.phone || '';
        loadedPhone = loadedPhone.replace(/\D/g, '');
        const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
        let loadedGender = profileData.gender;
        if (!validGenders.includes(loadedGender)) {
          loadedGender = 'prefer_not_to_say';
        }
        setProfileData({
          full_name: profileData.full_name || profileData.name || '',
          phone: loadedPhone,
          address: profileData.address || '',
          city: profileData.city || '',
          state: profileData.state || '',
          gender: loadedGender
        });

        setSettings(profileData.notification_settings || {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          booking_reminders: true,
          new_venue_alerts: true
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error loading user data:', error);
      setError('Failed to load user data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Only send fields that have changed (partial update)
      const updates: Partial<UserProfile> = {};
      if (profileData.full_name !== (user?.full_name || user?.name || '')) {
        if (!profileData.full_name.trim()) {
          setError('Full name is required.');
          setLoading(false);
          return;
        }
        updates.full_name = profileData.full_name;
      }
      if (profileData.phone !== (user?.phone || '')) {
        const phone = profileData.phone.replace(/\D/g, '');
        if (phone && !/^\d{10,15}$/.test(phone)) {
          setError('Please enter a valid phone number (10-15 digits, numbers only).');
          setLoading(false);
          return;
        }
        updates.phone = phone;
      }
      if (profileData.address !== (user?.address || '')) {
        updates.address = profileData.address;
      }
      if (profileData.city !== (user?.city || '')) {
        updates.city = profileData.city;
      }
      if (profileData.state !== (user?.state || '')) {
        updates.state = profileData.state;
      }
      if (profileData.gender !== (user?.gender || 'prefer_not_to_say')) {
        const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
        let saveGender = profileData.gender;
        if (!validGenders.includes(saveGender)) {
          saveGender = 'prefer_not_to_say';
        }
        updates.gender = saveGender;
      }
      // Always allow notification_settings update
      updates.notification_settings = settings;

      const safeUpdates = omitPreferences(updates);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await updateProfile(safeUpdates as any);

      if (result.success) {
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        await loadUserData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      const error = err as Error;
      setError('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (newSettings: UserProfile['notification_settings']) => {
    if (!newSettings) return;
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const result = await userService.updateNotificationSettings(newSettings);
      
      if (result.success) {
        setSettings(newSettings);
        setSuccess('Settings updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to update settings');
      }
    } catch (err) {
      const error = err as Error;
      setError('Failed to update settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const onCropComplete = (_croppedArea: unknown, croppedAreaPixels: { x: number; y: number; width: number; height: number; }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setCropModalOpen(true);
  };

  const handleCropSave = async () => {
    if (!selectedImage || !croppedAreaPixels) return;
    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(previewUrl!, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], selectedImage.name, { type: croppedBlob.type });
      const result = await userService.uploadUserAvatar(croppedFile);
      if (result.success) {
        setSuccess('Avatar updated successfully!');
        await refreshUserProfile();
        await loadUserData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Failed to upload avatar');
      }
    } catch {
      setError('Failed to crop/upload avatar');
    } finally {
      setLoading(false);
      setCropModalOpen(false);
      setSelectedImage(null);
      setPreviewUrl(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <User className="h-5 w-5 text-blue-600 mr-2" />
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
            </div>

            {/* Avatar Section */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || user.email}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md cursor-pointer">
                    <Camera className="h-4 w-4 text-gray-600" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{profileData.full_name}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={profileData.address}
                  onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={profileData.gender}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProfileData(prev => ({ ...prev, gender: ['male','female','other','prefer_not_to_say'].includes(val) ? val as 'male' | 'female' | 'other' | 'prefer_not_to_say' : 'prefer_not_to_say' }));
                    }}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  >
                    <option value="prefer_not_to_say">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {isEditing && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <Settings className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => handleSettingsUpdate({ ...settings, email_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Smartphone className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">SMS Notifications</p>
                    <p className="text-sm text-gray-500">Receive updates via SMS</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sms_notifications}
                    onChange={(e) => handleSettingsUpdate({ ...settings, sms_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Booking Reminders</p>
                    <p className="text-sm text-gray-500">Get reminded about upcoming bookings</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.booking_reminders}
                    onChange={(e) => handleSettingsUpdate({ ...settings, booking_reminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Globe className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">New Venue Alerts</p>
                    <p className="text-sm text-gray-500">Get notified about new venues</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.new_venue_alerts}
                    onChange={(e) => handleSettingsUpdate({ ...settings, new_venue_alerts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Marketing Emails</p>
                    <p className="text-sm text-gray-500">Receive promotional content</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.marketing_emails}
                    onChange={(e) => handleSettingsUpdate({ ...settings, marketing_emails: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Cropper Modal */}
        <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogContent>
            {previewUrl && (
              <div style={{ position: 'relative', width: '100%', height: 300, background: '#333' }}>
                <Cropper
                  image={previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
            )}
            <div className="mt-4">
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(_, value) => setZoom(value as number)}
                aria-labelledby="Zoom"
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCropModalOpen(false)} color="secondary">Cancel</Button>
            <Button onClick={handleCropSave} color="primary" variant="contained">Save</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default UserSettings; 