import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDatabase } from '../hooks/useDatabase';
import { userService } from '../lib/userService';
import type { UserProfile } from '../lib/userService';
import { 
  Save, 
  Edit, 
  ArrowLeft,
  Bell,
  Mail,
  Smartphone
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import Cropper from 'react-easy-crop';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getCroppedImg, convertToWebP } from '../utils/cropImage';

// Utility to omit preferences field
function omitPreferences<T extends object>(obj: T): Partial<T> {
  const rest: Partial<T> = { ...obj };
  delete (rest as Partial<T> & { preferences?: unknown }).preferences;
  return rest;
}

const UserSettings: React.FC = () => {
  const { user, updateProfile, loading: authLoading, refreshUserProfile } = useAuth();
  const { isConnected, isLoading: dbLoading, refreshConnection } = useDatabase();
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

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number; } | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

  const handleRefresh = async () => {
    setDataLoaded(false);
    setError('');
    await refreshConnection();
    if (isConnected) {
      await loadUserData();
    }
  };

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const updates: Partial<UserProfile> = {};
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
      const result = await updateProfile(safeUpdates as Partial<UserProfile>);

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
      // Convert cropped image to WebP
      const webpBlob = await convertToWebP(new File([croppedBlob], selectedImage.name, { type: croppedBlob.type }));
      const webpFile = new File([webpBlob], selectedImage.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
      const result = await userService.uploadUserAvatar(webpFile);
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

  if (authLoading || dbLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthWrapper>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8">
            <Link to="/dashboard" className="flex items-center text-sm text-blue-600 hover:underline mb-4">
                <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            {!isEditing && (
              <Button variant="outlined" onClick={() => setIsEditing(true)} startIcon={<Edit />}>
                Edit Profile
              </Button>
            )}
          </div>
          <p className="text-gray-600 mt-1">Manage your profile, preferences, and account settings.</p>
        </header>

        {error && <p className="mt-4 text-red-600 bg-red-100 p-3 rounded-md">{error}</p>}
        {success && <p className="mt-4 text-green-600 bg-green-100 p-3 rounded-md">{success}</p>}

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          {/* ... existing profile fields ... */}
            </div>

        {/* Notification Settings Card */}
        <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications from VenueFinder.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center"><Bell className="mr-2 h-5 w-5"/> General</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="review-alerts">New reviews and ratings</Label>
                    <Switch id="review-alerts" checked={settings.review_alerts} onCheckedChange={(val) => handleSettingsChange('review_alerts', val)} disabled={!isEditing} />
              </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="message-alerts">New messages in your inbox</Label>
                    <Switch id="message-alerts" checked={settings.message_alerts} onCheckedChange={(val) => handleSettingsChange('message_alerts', val)} disabled={!isEditing} />
                </div>
              </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center"><Mail className="mr-2 h-5 w-5"/> Email Notifications</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="booking-reminders">Booking reminders and updates</Label>
                    <Switch id="booking-reminders" checked={settings.booking_reminders} onCheckedChange={(val) => handleSettingsChange('booking_reminders', val)} disabled={!isEditing} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="new-venue-alerts">Alerts for new venues in your area</Label>
                    <Switch id="new-venue-alerts" checked={settings.new_venue_alerts} onCheckedChange={(val) => handleSettingsChange('new_venue_alerts', val)} disabled={!isEditing} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="marketing-emails">Promotions, offers, and news</Label>
                    <Switch id="marketing-emails" checked={settings.marketing_emails} onCheckedChange={(val) => handleSettingsChange('marketing_emails', val)} disabled={!isEditing} />
                  </div>
              </div>

                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-700 flex items-center"><Smartphone className="mr-2 h-5 w-5"/> SMS Notifications</h4>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <Label htmlFor="sms-notifications">Critical alerts and booking confirmations</Label>
                    <Switch id="sms-notifications" checked={settings.sms_notifications} onCheckedChange={(val) => handleSettingsChange('sms_notifications', val)} disabled={!isEditing} />
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>

        {/* Floating Save Button */}
        {isEditing && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-4 border-t z-10">
            <div className="max-w-4xl mx-auto flex justify-end space-x-4">
              <Button variant="outlined" onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleProfileSave}
                disabled={loading}
                startIcon={<Save />}
              >
                {loading ? 'Saving...' : 'Save All Changes'}
              </Button>
              </div>
            </div>
          )}
        </div>

      <Dialog open={cropModalOpen} onClose={() => setCropModalOpen(false)}>
          <div className="relative h-64">
                <Cropper
              image={previewUrl || ''}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
          </Dialog>
    </AuthWrapper>
  );
};

export default UserSettings; 