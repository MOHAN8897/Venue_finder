import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Calendar, Clock, MapPin, Users, CreditCard, Download, Share2, ArrowLeft, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

interface PaymentDetails {
  id: string;
  booking_id: string;
  user_id: string;
  amount: number;
  status: string;
  payment_method: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  platform_fee?: number;
  venue_amount?: number;
  created_at: string;
}

interface BookingDetails {
  id: string;
  venue_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
  slot_ids?: string[];
  venue?: {
    id: string;
    name: string;
    address: string;
    image_urls: string[];
  };
  payment?: PaymentDetails;
}

const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingId) return;

    const fetchBooking = async () => {
      try {
        setLoading(true);
        // Join bookings and payments
        const { data, error } = await supabase
          .from('bookings')
          .select(`*,
            venue:venues(id, name, address, image_urls),
            payment:payments!booking_id(*)
          `)
          .eq('id', bookingId)
          .single();
        if (error) throw error;
        setBooking(data);
      } catch (error) {
        console.error('Error fetching booking:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const downloadInvoice = () => {
    // In a real app, this would generate and download a PDF invoice
    alert('Invoice download feature will be implemented soon!');
  };

  const shareBooking = () => {
    if (navigator.share) {
      navigator.share({
        title: 'My Venue Booking',
        text: `I just booked ${booking?.venue?.name} for ${formatDate(booking?.start_date || '')}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Booking link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm sm:text-base">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 text-sm sm:text-base mb-4">The booking you're looking for doesn't exist.</p>
          <Link to="/venues">
            <Button className="w-full sm:w-auto h-12 sm:h-10">Browse Venues</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Back Navigation - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <Link 
            to="/bookings" 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Link>
        </div>

        {/* Success Header - Mobile Optimized */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
            <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 text-sm sm:text-base">Your venue booking has been successfully confirmed and payment processed.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Booking Details - Mobile Optimized */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                {/* Venue Info - Mobile Optimized */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{booking.venue?.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm sm:text-base">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{booking.venue?.address}</span>
                  </div>
                </div>

                {/* Booking Info - Mobile Optimized */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Date:</span>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">{formatDate(booking.start_date)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Time:</span>
                    </div>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Customer:</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-600 text-sm sm:text-base">{booking.customer_name}</p>
                      <div className="flex items-center gap-1 text-gray-600 text-sm sm:text-base">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span className="truncate">{booking.customer_email}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 text-sm sm:text-base">
                        <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                        <span>{booking.customer_phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Payment:</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm">
                      {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status}
                    </Badge>
                  </div>
                </div>

                {booking.notes && (
                  <div className="space-y-2">
                    <span className="font-medium text-sm sm:text-base">Special Requests:</span>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded text-sm sm:text-base">{booking.notes}</p>
                  </div>
                )}

                <Separator />
                {/* Payment Details - Mobile Optimized */}
                {booking.payment && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium text-sm sm:text-base">Payment Details:</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      <div>Payment Status: <Badge className={booking.payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{booking.payment.status}</Badge></div>
                      <div>Order ID: <span className="font-mono">{booking.payment.razorpay_order_id || '-'}</span></div>
                      <div>Payment ID: <span className="font-mono">{booking.payment.razorpay_payment_id || '-'}</span></div>
                      <div>Signature: <span className="font-mono">{booking.payment.razorpay_signature || '-'}</span></div>
                      <div>Payment Method: {booking.payment.payment_method || '-'}</div>
                      <div>Platform Fee: ₹{(booking.payment.platform_fee || 0) / 100}</div>
                      <div>Venue Amount: ₹{(booking.payment.venue_amount || 0) / 100}</div>
                      <div>Total Paid: ₹{(booking.payment.amount || 0) / 100}</div>
                    </div>
                  </div>
                )}

                {/* Price Summary - Mobile Optimized */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm sm:text-base">Total Amount:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">₹{booking.total_price}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500">Payment processed successfully</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Sidebar - Mobile Optimized */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Booking Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <Button 
                  onClick={downloadInvoice}
                  className="w-full bg-blue-600 hover:bg-blue-700 h-12 sm:h-10 text-sm sm:text-base"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>

                <Button 
                  onClick={shareBooking}
                  variant="outline"
                  className="w-full h-12 sm:h-10 text-sm sm:text-base"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Booking
                </Button>

                <Link to="/bookings">
                  <Button variant="outline" className="w-full h-12 sm:h-10 text-sm sm:text-base">
                    View All Bookings
                  </Button>
                </Link>

                <Link to="/venues">
                  <Button variant="outline" className="w-full h-12 sm:h-10 text-sm sm:text-base">
                    Browse Venues
                  </Button>
                </Link>

                <div className="pt-4 border-t">
                  <p className="text-xs sm:text-sm text-gray-500 mb-2">Booking ID:</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                    {booking.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info - Mobile Optimized */}
        <Card className="mt-6 sm:mt-8">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Save to Calendar</h4>
                <p className="text-xs sm:text-sm text-gray-600">Add this booking to your calendar to stay organized</p>
              </div>
              
              <div className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Get Directions</h4>
                <p className="text-xs sm:text-sm text-gray-600">Get directions to the venue on your booking date</p>
              </div>
              
              <div className="text-center sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2 text-sm sm:text-base">Contact Venue</h4>
                <p className="text-xs sm:text-sm text-gray-600">Reach out to the venue owner for any questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmationPage; 