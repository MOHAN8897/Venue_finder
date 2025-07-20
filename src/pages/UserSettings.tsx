import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { 
  ArrowLeft,
  Mail,
  Smartphone,
  User,
  MapPin,
  Phone,
  Save,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AuthWrapper from '../components/AuthWrapper';
import LoadingSpinner from '../components/LoadingSpinner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Utility to omit preferences field
function omitPreferences<T extends object>(obj: T): Partial<T> {
  const rest: Partial<T> = { ...obj };
  delete (rest as Partial<T> & { preferences?: unknown }).preferences;
  return rest;
}

const UserSettings: React.FC = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const { isConnected, isLoading: dbLoading } = useDatabase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

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
    new_venue_alerts: true,
    review_alerts: true,
    message_alerts: true
  });

  useEffect(() => {
    if (authLoading || dbLoading) return; // Wait for auth and db to finish
    if (!user) {
      setLoading(false);
      setError('You must be logged in to view your settings.');
      return;
    }
    if (!isConnected) {
      setError('Database connection failed. Please check your connection and try again.');
      return;
    }
    if (!dataLoaded) {
    loadUserData();
    }
  }, [user, authLoading, dbLoading, isConnected, dataLoaded]);

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
          new_venue_alerts: true,
          review_alerts: true,
          message_alerts: true
        });
        setDataLoaded(true);
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

      const updates: Partial<import('../context/AuthContext').UserProfile> = {};
      if (profileData.full_name !== (user?.full_name || user?.name || '')) {
        updates.full_name = profileData.full_name;
      }
      if (profileData.phone !== (user?.phone || '')) {
        updates.phone = profileData.phone;
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
        updates.gender = profileData.gender;
      }
      
      updates.notification_settings = settings;

      const safeUpdates = omitPreferences(updates);
      // Fix type for preferences if present
      if ('preferences' in safeUpdates && safeUpdates.preferences) {
        // Convert all values to string | number | boolean
        const fixedPrefs: Record<string, string | number | boolean> = {};
        Object.entries(safeUpdates.preferences).forEach(([k, v]) => {
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            fixedPrefs[k] = v;
          } else {
            fixedPrefs[k] = String(v);
          }
        });
        (safeUpdates as any).preferences = fixedPrefs;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- safe cast for Supabase update
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

  const handleSettingsChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (authLoading || dbLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthWrapper requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Header - Mobile Optimized */}
          <header className="mb-6 sm:mb-8">
            <Link 
              to="/dashboard" 
              className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-3 sm:mb-4 text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                  Manage your profile, preferences, and account settings.
                </p>
              </div>
            {!isEditing && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)} 
                  className="w-full sm:w-auto h-12 sm:h-10"
                >
                  <User className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
            )}
          </div>
        </header>

          {/* Error/Success Messages - Mobile Optimized */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
              {success}
            </div>
          )}

          {/* Profile Card - Mobile Optimized */}
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <User className="h-5 w-5 mr-2" />
                Profile Information
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="full_name"
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, full_name: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender
                  </Label>
                  <Select
                    value={profileData.gender}
                    onValueChange={(value: 'male' | 'female' | 'other' | 'prefer_not_to_say') => 
                      setProfileData(prev => ({ ...prev, gender: value }))
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      disabled={!isEditing}
                      className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData(prev => ({ ...prev, city: e.target.value }))}
                    disabled={!isEditing}
                    className="h-12 sm:h-10 text-sm sm:text-base"
                    placeholder="Enter your city"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm font-medium">
                    State
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    value={profileData.state}
                    onChange={(e) => setProfileData(prev => ({ ...prev, state: e.target.value }))}
                    disabled={!isEditing}
                    className="h-12 sm:h-10 text-sm sm:text-base"
                    placeholder="Enter your state"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings Card - Mobile Optimized */}
            <Card>
              <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Mail className="h-5 w-5 mr-2" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Manage how you receive notifications from VenueFinder.
              </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 flex items-center text-sm sm:text-base">
                  <Mail className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
                  Email Notifications
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-gray-50">
                    <Label htmlFor="booking-reminders" className="text-sm sm:text-base flex-1">
                      Booking reminders and updates
                    </Label>
                    <Switch 
                      id="booking-reminders" 
                      checked={settings.booking_reminders} 
                      onCheckedChange={(val) => handleSettingsChange('booking_reminders', val)} 
                      disabled={!isEditing} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-gray-50">
                    <Label htmlFor="new-venue-alerts" className="text-sm sm:text-base flex-1">
                      Alerts for new venues in your area
                    </Label>
                    <Switch 
                      id="new-venue-alerts" 
                      checked={settings.new_venue_alerts} 
                      onCheckedChange={(val) => handleSettingsChange('new_venue_alerts', val)} 
                      disabled={!isEditing} 
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-gray-50">
                    <Label htmlFor="marketing-emails" className="text-sm sm:text-base flex-1">
                      Promotions, offers, and news
                    </Label>
                    <Switch 
                      id="marketing-emails" 
                      checked={settings.marketing_emails} 
                      onCheckedChange={(val) => handleSettingsChange('marketing_emails', val)} 
                      disabled={!isEditing} 
                    />
                  </div>
                  </div>
              </div>

                <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 flex items-center text-sm sm:text-base">
                  <Smartphone className="mr-2 h-4 w-4 sm:h-5 sm:w-5"/>
                  SMS Notifications
                </h4>
                <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border bg-gray-50">
                  <Label htmlFor="sms-notifications" className="text-sm sm:text-base flex-1">
                    Critical alerts and booking confirmations
                  </Label>
                  <Switch 
                    id="sms-notifications" 
                    checked={settings.sms_notifications} 
                    onCheckedChange={(val) => handleSettingsChange('sms_notifications', val)} 
                    disabled={!isEditing} 
                  />
                </div>
                </div>
              </CardContent>
            </Card>

          {/* Floating Save Button - Mobile Optimized */}
        {isEditing && (
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-4 border-t z-10">
              <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                variant="outline"
                  onClick={() => setIsEditing(false)} 
                  disabled={loading}
                  className="flex-1 sm:flex-none h-12 sm:h-10"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                onClick={handleProfileSave}
                disabled={loading}
                  className="flex-1 sm:flex-none h-12 sm:h-10"
              >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthWrapper>
  );
};

export default UserSettings; 