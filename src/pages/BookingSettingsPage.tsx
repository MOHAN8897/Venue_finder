import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Save, Clock, Calendar, Users, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';

const BookingSettingsPage: React.FC = () => {
  const location = useLocation();
  const venueName = location.state?.venueName || 'this venue';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link 
            to="/manage-venues" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manage Venues
          </Link>
        </div>

        {/* Header - Mobile Optimized */}
        <header className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Settings className="h-6 w-6 sm:h-8 sm:w-8" />
                Booking Settings
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Configure booking preferences for: <span className="font-semibold">{venueName}</span>
              </p>
            </div>
            <Button className="w-full sm:w-auto h-12 sm:h-10 text-sm sm:text-base">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </header>

        {/* Settings Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Availability Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar className="h-5 w-5" />
                Availability Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="advance-booking" className="text-sm sm:text-base font-medium">
                  Advance Booking Period
                </Label>
                <Select defaultValue="30">
                  <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="60">60 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-notice" className="text-sm sm:text-base font-medium">
                  Minimum Notice Period
                </Label>
                <Select defaultValue="24">
                  <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                    <SelectItem value="48">48 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="instant-booking" className="text-sm sm:text-base font-medium">
                  Allow Instant Booking
                </Label>
                <Switch id="instant-booking" />
              </div>
            </CardContent>
          </Card>

          {/* Time Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Clock className="h-5 w-5" />
                Time Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="opening-time" className="text-sm sm:text-base font-medium">
                    Opening Time
                  </Label>
                  <Input 
                    id="opening-time" 
                    type="time" 
                    defaultValue="09:00"
                    className="h-12 sm:h-10 text-sm sm:text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closing-time" className="text-sm sm:text-base font-medium">
                    Closing Time
                  </Label>
                  <Input 
                    id="closing-time" 
                    type="time" 
                    defaultValue="22:00"
                    className="h-12 sm:h-10 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slot-duration" className="text-sm sm:text-base font-medium">
                  Booking Slot Duration
                </Label>
                <Select defaultValue="60">
                  <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="240">4 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Capacity & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Users className="h-5 w-5" />
                Capacity & Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="max-capacity" className="text-sm sm:text-base font-medium">
                  Maximum Capacity
                </Label>
                <Input 
                  id="max-capacity" 
                  type="number" 
                  placeholder="Enter maximum capacity"
                  className="h-12 sm:h-10 text-sm sm:text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-capacity" className="text-sm sm:text-base font-medium">
                  Minimum Capacity
                </Label>
                <Input 
                  id="min-capacity" 
                  type="number" 
                  placeholder="Enter minimum capacity"
                  className="h-12 sm:h-10 text-sm sm:text-base"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="flexible-pricing" className="text-sm sm:text-base font-medium">
                  Flexible Pricing
                </Label>
                <Switch id="flexible-pricing" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <CreditCard className="h-5 w-5" />
                Payment Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deposit-required" className="text-sm sm:text-base font-medium">
                  Deposit Required
                </Label>
                <Select defaultValue="25">
                  <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Select percentage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No deposit</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="100">Full payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cancellation-policy" className="text-sm sm:text-base font-medium">
                  Cancellation Policy
                </Label>
                <Select defaultValue="flexible">
                  <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                    <SelectValue placeholder="Select policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flexible">Flexible</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strict">Strict</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-confirm" className="text-sm sm:text-base font-medium">
                  Auto-confirm Bookings
                </Label>
                <Switch id="auto-confirm" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Action Bar */}
        <div className="mt-6 sm:hidden">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 h-12 text-sm">
                Reset
              </Button>
              <Button className="flex-1 h-12 text-sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSettingsPage; 