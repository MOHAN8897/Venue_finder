import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Users, Star, CreditCard, Calendar as CalendarIcon } from 'lucide-react';
import { venueService } from '@/lib/venueService';

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

    setBookingLoading(true);

    try {
      // Create booking in database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please login to book a venue');
      }

      const bookingData = {
        venue_id: venue.id,
        user_id: user.id,
        start_date: formData.date.toISOString(),
        end_date: formData.date.toISOString(),
        start_time: formData.startTime,
        end_time: formData.endTime,
        total_price: calculateTotalPrice(),
        notes: formData.specialRequests,
        customer_name: formData.customerName,
        customer_email: formData.customerEmail,
        customer_phone: formData.customerPhone
      };

      const { data: booking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) throw error;

      // Initialize payment
      await initializePayment(booking.id, calculateTotalPrice());

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

  const initializePayment = async (bookingId: string, amount: number) => {
    setPaymentLoading(true);

    try {
      // For now, we'll simulate a payment gateway
      // In production, you would integrate with Razorpay, Stripe, etc.
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update booking status
      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          payment_status: 'paid'
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast({
        title: "Booking Successful!",
        description: `Your booking has been confirmed. Booking ID: ${bookingId}`,
      });

      // Redirect to booking confirmation page
      window.location.href = `/booking-confirmation/${bookingId}`;

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue Not Found</h2>
          <p className="text-gray-600">The venue you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Venue Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Book {venue.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Venue Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{venue.venue_name || venue.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {venue.address}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Capacity: {venue.capacity}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {venue.avg_rating || 0} ({venue.rating_count || 0} reviews)
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-green-600">
                      ₹{venue.price_per_hour || venue.hourly_rate}/hour
                    </span>
                  </div>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Date Selection */}
                  <div>
                    <Label htmlFor="date">Select Date</Label>
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={handleDateSelect}
                      disabled={isDateDisabled}
                      className="rounded-md border mt-2"
                    />
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time</Label>
                      <Select value={formData.startTime} onValueChange={(value) => handleTimeChange('startTime', value)}>
                        <SelectTrigger>
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
                      <Label htmlFor="endTime">End Time</Label>
                      <Select value={formData.endTime} onValueChange={(value) => handleTimeChange('endTime', value)}>
                        <SelectTrigger>
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

                  {/* Customer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="customerName">Full Name *</Label>
                      <Input
                        id="customerName"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerEmail">Email *</Label>
                      <Input
                        id="customerEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerPhone">Phone *</Label>
                      <Input
                        id="customerPhone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="guests">Number of Guests</Label>
                    <Input
                      id="guests"
                      type="number"
                      min="1"
                      max={venue.capacity}
                      value={formData.guests}
                      onChange={(e) => setFormData(prev => ({ ...prev, guests: parseInt(e.target.value) }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialRequests">Special Requests</Label>
                    <Textarea
                      id="specialRequests"
                      value={formData.specialRequests}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special requirements or requests..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Booking Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Duration:</span>
                    <span>{calculateTotalHours()} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate per hour:</span>
                    <span>₹{venue.price_per_hour || venue.hourly_rate}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span>₹{calculateTotalPrice()}</span>
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div>
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="razorpay">Razorpay</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Payment Button */}
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={paymentLoading || !formData.date || !formData.startTime || !formData.endTime}
                  onClick={handleBookingSubmit}
                >
                  {paymentLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Processing Payment...
                    </div>
                  ) : (
                    `Pay ₹${calculateTotalPrice()}`
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center">
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