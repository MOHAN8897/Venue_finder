import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Calendar, Clock, MapPin, Users, CreditCard, Download, Share2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Link } from 'react-router-dom';

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
  venue?: {
    id: string;
    name: string;
    address: string;
    image_urls: string[];
  };
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
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            venue:venues(id, name, address, image_urls)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600">The booking you're looking for doesn't exist.</p>
                      <Link to="/list-venue">
              <Button className="mt-4">List Your Venue</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">Your venue booking has been successfully confirmed and payment processed.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Venue Info */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{booking.venue?.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{booking.venue?.address}</span>
                  </div>
                </div>

                {/* Booking Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Date:</span>
                    </div>
                    <p className="text-gray-600">{formatDate(booking.start_date)}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Time:</span>
                    </div>
                    <p className="text-gray-600">
                      {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Customer:</span>
                    </div>
                    <p className="text-gray-600">{booking.customer_name}</p>
                    <p className="text-gray-600">{booking.customer_email}</p>
                    <p className="text-gray-600">{booking.customer_phone}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">Payment:</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {booking.payment_status === 'paid' ? 'Paid' : booking.payment_status}
                    </Badge>
                  </div>
                </div>

                {booking.notes && (
                  <div className="space-y-2">
                    <span className="font-medium">Special Requests:</span>
                    <p className="text-gray-600 bg-gray-50 p-3 rounded">{booking.notes}</p>
                  </div>
                )}

                <Separator />

                {/* Price Summary */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="text-2xl font-bold text-green-600">₹{booking.total_price}</span>
                  </div>
                  <p className="text-sm text-gray-500">Payment processed successfully</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Booking Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={downloadInvoice}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoice
                </Button>

                <Button 
                  onClick={shareBooking}
                  variant="outline"
                  className="w-full"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Booking
                </Button>

                <Link to="/bookings">
                  <Button variant="outline" className="w-full">
                    View All Bookings
                  </Button>
                </Link>

                <Link to="/list-venue">
                  <Button variant="outline" className="w-full">
                    List Your Venue
                  </Button>
                </Link>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Booking ID:</p>
                  <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                    {booking.id}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Save to Calendar</h4>
                <p className="text-sm text-gray-600">Add this booking to your calendar to stay organized</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Get Directions</h4>
                <p className="text-sm text-gray-600">Get directions to the venue on your booking date</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">Contact Venue</h4>
                <p className="text-sm text-gray-600">Reach out to the venue owner for any questions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BookingConfirmationPage; 