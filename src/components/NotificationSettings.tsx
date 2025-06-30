import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

export interface NotificationPrefs {
  email_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  booking_reminders: boolean;
  new_venue_alerts: boolean;
  review_alerts: boolean;
  message_alerts: boolean;
}

interface NotificationSettingsProps {
  settings: NotificationPrefs;
  onSettingsChange: (newSettings: Partial<NotificationPrefs>) => void;
  onSave: () => void;
  loading: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ settings, onSettingsChange, onSave, loading }) => {
  
  const handleToggle = (key: keyof NotificationPrefs) => {
    onSettingsChange({ [key]: !settings[key] });
  };

  const handleSaveClick = () => {
    onSave();
    toast.success("Notification settings saved!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Manage how you receive notifications from VenueFinder.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 flex items-center"><Bell className="mr-2 h-5 w-5"/> General</h4>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="review-alerts">New reviews and ratings</Label>
            <Switch id="review-alerts" checked={settings.review_alerts} onCheckedChange={() => handleToggle('review_alerts')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="message-alerts">New messages in your inbox</Label>
            <Switch id="message-alerts" checked={settings.message_alerts} onCheckedChange={() => handleToggle('message_alerts')} />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 flex items-center"><Mail className="mr-2 h-5 w-5"/> Email Notifications</h4>
           <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="booking-reminders">Booking reminders and updates</Label>
            <Switch id="booking-reminders" checked={settings.booking_reminders} onCheckedChange={() => handleToggle('booking_reminders')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="new-venue-alerts">Alerts for new venues in your area</Label>
            <Switch id="new-venue-alerts" checked={settings.new_venue_alerts} onCheckedChange={() => handleToggle('new_venue_alerts')} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="marketing-emails">Promotions, offers, and news</Label>
            <Switch id="marketing-emails" checked={settings.marketing_emails} onCheckedChange={() => handleToggle('marketing_emails')} />
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 flex items-center"><Smartphone className="mr-2 h-5 w-5"/> SMS Notifications</h4>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <Label htmlFor="sms-notifications">Critical alerts and booking confirmations</Label>
            <Switch id="sms-notifications" checked={settings.sms_notifications} onCheckedChange={() => handleToggle('sms_notifications')} />
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveClick} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings; 