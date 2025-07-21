import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Users, Star, CreditCard, Calendar as CalendarIcon, ArrowLeft, User, Mail, Phone } from 'lucide-react';
import { venueService } from '@/lib/venueService';
import { createBookingWithPayment, processSuccessfulPayment } from '@/lib/paymentService';
import { useAuth } from '@/hooks/useAuth';

// Extended Venue interface to handle both data structures
interface ExtendedVenue {
  id: string;
  name?: string;
  venue_name?: string;
  description?: string;
  address?: string;
  price_per_hour?: number;
  price_per_day?: number;
  hourly_rate?: number;
  daily_rate?: number;
  capacity?: number;
  avg_rating?: number;
  rating?: number;
  rating_count?: number;
  review_count?: number;
  photos?: string[];
  images?: string[];
  image_urls?: string[];
  amenities?: string[];
  [key: string]: any; // Allow additional properties
}
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';

interface BookingFormData {
  date: Date | undefined;
  startTime: string;
  endTime: string;
  guests: number;
  specialRequests: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const VenueBookingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venue, setVenue] = useState<ExtendedVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<BookingFormData>({
    date: new Date(),
    startTime: '',
    endTime: '',
    guests: 1,
    specialRequests: '',
    customerName: '',
    customerEmail: '',
    customerPhone: ''
  });

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchVenue = async () => {
      try {
        setLoading(true);
        const venueData = await venueService.getVenueById(id);
        if (venueData) {
          setVenue(venueData);
        }
      } catch (error) {
        console.error('Error fetching venue:', error);
        toast({
          title: "Error",
          description: "Failed to load venue details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
  }, [id]);

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
  ];

  const calculateTotalHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    const start = parseInt(formData.startTime.split(':')[0]);
    const end = parseInt(formData.endTime.split(':')[0]);
    return end - start;
  };

  const calculateTotalPrice = () => {
    const hours = calculateTotalHours();
    const hourlyRate = venue?.price_per_hour || venue?.hourly_rate || 0;
    return hours * hourlyRate;
  };

  const checkSlotAvailability = async (date: Date, startTime: string, endTime: string) => {
    if (!venue) return false;
    
    try {
      const { data, error } = await supabase
        .from('venue_slots')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('date', date.toISOString().split('T')[0])
        .gte('start_time', startTime)
        .lte('end_time', endTime)
        .eq('available', true);
      
      if (error) {
        console.error('Error checking slot availability:', error);
        return false;
      }
      
      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking slot availability:', error);
      return false;
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, date }));
  };

  const handleTimeChange = (field: 'startTime' | 'endTime', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isDateDisabled = (date: Date) => {
    // Disable past dates
    return date < new Date();
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venue || !formData.date || !formData.startTime || !formData.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please login to book a venue",
        variant: "destructive"
      });
      return;
    }

    setBookingLoading(true);

    try {
      // Check slot availability first
      const isAvailable = await checkSlotAvailability(formData.date, formData.startTime, formData.endTime);
      if (!isAvailable) {
        throw new Error('Selected time slot is not available. Please choose a different time.');
      }

      // Create booking using payment service
      const bookingData = {
        venueId: venue.id,
        userId: user.user_id,
        eventDate: formData.date.toISOString().split('T')[0],
        startTime: formData.startTime,
        endTime: formData.endTime,
        guestCount: formData.guests,
        specialRequests: formData.specialRequests,
        venueAmount: calculateTotalPrice() * 100, // Convert to paise
        bookingType: 'hourly' as const
      };

      const bookingId = await createBookingWithPayment(bookingData);

      // Redirect to payment page
      navigate(`/payment/${bookingId}`);

    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "Failed to create booking",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h2>
          <p className="text-gray-600 text-sm sm:text-base mb-4">The venue you're looking for doesn't exist.</p>
          <Link to="/venues">
            <Button className="w-full sm:w-auto h-12 sm:h-10">Browse Venues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link 
            to={`/venue/${id}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venue
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Venue Details - Mobile Optimized */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CalendarIcon className="h-5 w-5" />
                  Book {venue.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Venue Info - Mobile Optimized */}
                <div className="mb-6 p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{venue.venue_name || venue.name}</h3>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{venue.address}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4 flex-shrink-0" />
                      Capacity: {venue.capacity}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      {venue.avg_rating || 0} ({venue.rating_count || 0} reviews)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-green-600">
                      ₹{venue.price_per_hour || venue.hourly_rate}/hour
                    </span>
                  </div>
                </div>

                {/* Booking Form - Mobile Optimized */}
                <form onSubmit={handleBookingSubmit} className="space-y-4 sm:space-y-6">
                  {/* Date Selection - Mobile Optimized */}
                  <div>
                    <Label htmlFor="date" className="text-sm sm:text-base font-medium">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateSelect}
                      disabled={isDateDisabled}
                      className="rounded-md border mt-2"
                    />
                  </div>

                  {/* Time Selection - Mobile Optimized */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="text-sm sm:text-base font-medium">Start Time</Label>
                      <Select value={formData.startTime} onValueChange={(value) => handleTimeChange('startTime', value)}>
                        <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-sm sm:text-base font-medium">End Time</Label>
                      <Select value={formData.endTime} onValueChange={(value) => handleTimeChange('endTime', value)}>
                        <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                        <SelectContent>
                          {timeSlots.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Customer Details - Mobile Optimized */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customerName" className="text-sm sm:text-base font-medium">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="customerName"
                          value={formData.customerName}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                          required
                          className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
                          placeholder="Enter your full name"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="customerEmail" className="text-sm sm:text-base font-medium">Email *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                          required
                          className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Label htmlFor="customerPhone" className="text-sm sm:text-base font-medium">Phone *</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="customerPhone"
                          type="tel"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          required
                          className="pl-10 h-12 sm:h-10 text-sm sm:text-base"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guests" className="text-sm sm:text-base font-medium">Number of Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max={venue.capacity}
                      value={formData.guests}
                      onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                      className="h-12 sm:h-10 text-sm sm:text-base"
                      placeholder="Number of guests"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequests" className="text-sm sm:text-base font-medium">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requirements or requests..."
                      rows={3}
                      className="text-sm sm:text-base"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 sm:h-10 text-sm sm:text-base"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary - Mobile Optimized */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CreditCard className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Duration:</span>
                    <span>{calculateTotalHours()} hours</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Rate per hour:</span>
                    <span>₹{venue.price_per_hour || venue.hourly_rate}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Venue Amount:</span>
                    <span>₹{calculateTotalPrice()}</span>
                  </div>
                  <div className="flex justify-between text-sm sm:text-base">
                    <span>Platform Fee:</span>
                    <span>₹35</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg sm:text-xl">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotalPrice() + 35}</span>
                  </div>
                </div>

                {/* Payment Method Selection - Mobile Optimized */}
                <div>
                  <Label className="text-sm sm:text-base font-medium">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger className="h-12 sm:h-10 text-sm sm:text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Button - Mobile Optimized */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 sm:h-10 text-sm sm:text-base"
                  disabled={bookingLoading || !formData.date || !formData.startTime || !formData.endTime}
                  onClick={handleBookingSubmit}
                >
                  {bookingLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Creating Booking...
                    </div>
                  ) : (
                    `Proceed to Payment - ₹${calculateTotalPrice() + 35}`
                  )}
                </Button>

                <div className="text-xs sm:text-sm text-gray-500 text-center">
                  Secure payment powered by {paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueBookingPage; 