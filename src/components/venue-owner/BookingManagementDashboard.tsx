import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, Mail, MapPin, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { bookingService, type Booking } from '../../lib/bookingService';

interface BookingManagementDashboardProps {
  venueId: string;
}

/**
 * VENUE OWNER BOOKING MANAGEMENT DASHBOARD
 * This shows actual confirmed bookings (not individual slots)
 * Venue owners can see who booked, when, and manage the bookings
 */
export const BookingManagementDashboard: React.FC<BookingManagementDashboardProps> = ({ venueId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVenueBookings();
  }, [venueId]);

  const loadVenueBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all bookings for this venue using Supabase
      const bookingsData = await bookingService.getVenueBookings(venueId);
      setBookings(bookingsData);
    } catch (error) {
      setError('Failed to load bookings. Please try again.');
      console.error('Failed to load bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by status and date
  const today = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter(booking => 
    booking.event_date >= today && booking.booking_status === 'confirmed'
  );
  const pastBookings = bookings.filter(booking => 
    booking.event_date < today && booking.booking_status === 'completed'
  );
  const cancelledBookings = bookings.filter(booking => 
    booking.booking_status === 'cancelled'
  );

  /**
   * Handle booking cancellation by venue owner
   */
  const handleCancelBooking = async (bookingId: string, reason: string) => {
    try {
      await bookingService.cancelBooking(bookingId, reason, 'venue_owner');
      // Refresh bookings list
      await loadVenueBookings();
      alert('Booking cancelled successfully. Customer will be notified and refunded.');
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      alert('Failed to cancel booking. Please try again.');
    }
  };

  /**
   * Render individual booking card
   */
  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{booking.event_date}</h3>
              <p className="text-sm text-muted-foreground">
                {booking.start_time} - {booking.end_time}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant={
              booking.booking_status === 'confirmed' ? 'default' :
              booking.booking_status === 'completed' ? 'secondary' :
              booking.booking_status === 'cancelled' ? 'destructive' : 'outline'
            }>
              {booking.booking_status}
            </Badge>
            <p className="text-lg font-bold mt-1">₹{booking.total_amount}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{booking.customer_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{booking.customer_phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{booking.customer_email}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{booking.guest_count} guests</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">{booking.payment_status}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Booked {new Date(booking.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {booking.special_requests && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-1">Special Requests:</p>
            <p className="text-sm text-muted-foreground">{booking.special_requests}</p>
          </div>
        )}

        {/* Action Buttons */}
        {booking.booking_status === 'confirmed' && (
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`tel:${booking.customer_phone}`)}
            >
              <Phone className="w-4 h-4 mr-1" />
              Call Customer
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`mailto:${booking.customer_email}`)}
            >
              <Mail className="w-4 h-4 mr-1" />
              Email Customer
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => {
                const reason = prompt('Reason for cancellation:');
                if (reason) handleCancelBooking(booking.id, reason);
              }}
            >
              Cancel Booking
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div>
      {loading ? (
        <div id="loading-bookings" className="loading-skeleton flex flex-col items-center py-8">
          <Clock className="h-8 w-8 animate-spin loading-spinner mb-3 text-blue-500" />
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-7 w-80 mb-2" />
          <Skeleton className="h-7 w-80 mb-2" />
          <span className="text-muted-foreground mt-4">Loading bookings...</span>
        </div>
      ) : error ? (
        <div id="error-boundary">
          <Alert variant="destructive" id="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button id="retry-button" variant="outline" className="mt-4" onClick={loadVenueBookings}>
            Retry
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastBookings.length})
            </TabsTrigger>
            <TabsTrigger value="cancelled">
              Cancelled ({cancelledBookings.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            <div className="space-y-4">
              {upcomingBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Upcoming Bookings</h3>
                    <p className="text-muted-foreground">
                      Your next bookings will appear here when customers make reservations.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                upcomingBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            <div className="space-y-4">
              {pastBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Past Bookings</h3>
                    <p className="text-muted-foreground">
                      Completed bookings will appear here for your records.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pastBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>

          <TabsContent value="cancelled" className="mt-4">
            <div className="space-y-4">
              {cancelledBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No cancelled bookings</p>
                  </CardContent>
                </Card>
              ) : (
                cancelledBookings.map(renderBookingCard)
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}; 