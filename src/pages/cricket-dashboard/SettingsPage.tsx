
import { DashboardLayout } from "@/components/cricket-dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/cricket-dashboard/card";
import { Button } from "@/components/cricket-dashboard/button";
import { Input } from "@/components/cricket-dashboard/input";
import { Label } from "@/components/cricket-dashboard/label";
import { Textarea } from "@/components/cricket-dashboard/textarea";
import { Switch } from "@/components/cricket-dashboard/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/cricket-dashboard/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/cricket-dashboard/tabs";
import { Separator } from "@/components/cricket-dashboard/separator";
import { User, Bell, CreditCard, Shield, MapPin, Clock, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    profile: {
      name: "",
      email: "",
      phone: "",
      address: "",
      bio: ""
    },
    venue: {
      name: "",
      description: "",
      location: "",
      timezone: "Asia/Kolkata"
    },
    notifications: {
      newBookings: false,
      cancellations: false,
      payments: false,
      maintenance: false,
      marketing: false
    },
    business: {
      currency: "INR",
      taxRate: "",
      cancellationPolicy: "",
      autoConfirmBookings: false,
      allowOnlinePayments: false
    }
  });

  const handleSave = (section: string) => {
    toast.success(`${section} settings saved successfully!`);
  };

  const updateSetting = (section: keyof typeof settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and venue preferences</p>
        </div>
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="venue" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Venue
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={settings.profile.name}
                      onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.profile.email}
                      onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={settings.profile.phone}
                      onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      value={settings.profile.address}
                      onChange={(e) => updateSetting('profile', 'address', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={settings.profile.bio}
                    onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                  />
                </div>
                <Button onClick={() => handleSave('Profile')} className="bg-gradient-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Venue Settings */}
          <TabsContent value="venue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Venue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="venueName">Venue Name</Label>
                  <Input
                    id="venueName"
                    value={settings.venue.name}
                    onChange={(e) => updateSetting('venue', 'name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="venueDescription">Description</Label>
                  <Textarea
                    id="venueDescription"
                    value={settings.venue.description}
                    onChange={(e) => updateSetting('venue', 'description', e.target.value)}
                    placeholder="Describe your venue..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={settings.venue.location}
                      onChange={(e) => updateSetting('venue', 'location', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={settings.venue.timezone} 
                      onValueChange={(value) => updateSetting('venue', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={() => handleSave('Venue')} className="bg-gradient-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Venue Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'newBookings', label: 'New Bookings', description: 'Get notified when someone books your venue' },
                  { key: 'cancellations', label: 'Cancellations', description: 'Get notified when bookings are cancelled' },
                  { key: 'payments', label: 'Payments', description: 'Get notified about payment confirmations' },
                  { key: 'maintenance', label: 'Maintenance Reminders', description: 'Periodic maintenance reminders for your boxes' },
                  { key: 'marketing', label: 'Marketing Updates', description: 'Receive marketing tips and feature updates' }
                ].map((notification) => (
                  <div key={notification.key} className="flex items-center justify-between space-x-4">
                    <div className="flex-1">
                      <div className="font-medium">{notification.label}</div>
                      <div className="text-sm text-muted-foreground">{notification.description}</div>
                    </div>
                    <Switch
                      checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                      onCheckedChange={(checked) => updateSetting('notifications', notification.key, checked)}
                    />
                  </div>
                ))}
                <Separator />
                <Button onClick={() => handleSave('Notification')} className="bg-gradient-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Business Settings */}
          <TabsContent value="business" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={settings.business.currency}
                      onChange={(e) => updateSetting('business', 'currency', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      value={settings.business.taxRate}
                      onChange={(e) => updateSetting('business', 'taxRate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cancellationPolicy">Cancellation Policy (hours)</Label>
                  <Input
                    id="cancellationPolicy"
                    value={settings.business.cancellationPolicy}
                    onChange={(e) => updateSetting('business', 'cancellationPolicy', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.business.autoConfirmBookings}
                    onCheckedChange={(checked) => updateSetting('business', 'autoConfirmBookings', checked)}
                  />
                  <span>Auto-confirm bookings</span>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={settings.business.allowOnlinePayments}
                    onCheckedChange={(checked) => updateSetting('business', 'allowOnlinePayments', checked)}
                  />
                  <span>Allow online payments</span>
                </div>
                <Button onClick={() => handleSave('Business')} className="bg-gradient-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Business Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Change Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <Button onClick={() => handleSave('Security')} className="bg-gradient-primary hover:bg-primary/90">
                  <Save className="h-4 w-4 mr-2" />
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
