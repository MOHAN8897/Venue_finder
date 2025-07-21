import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, MapPin, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';

interface BookingSummaryProps {
  venue: {
    id: string;
    venue_name: string;
    address: string;
    price_per_hour: number;
    price_per_day: number;
  };
  booking: {
    eventDate: string;
    startTime: string;
    endTime: string;
    guestCount: number;
    specialRequests?: string;
    venueAmount: number; // in paise
  };
  platformFee: number; // in paise
  totalAmount: number; // in paise
}

const BookingSummary: React.FC<BookingSummaryProps> = ({
  venue,
  booking,
  platformFee,
  totalAmount
}) => {
  // Convert paise to rupees for display
  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toFixed(2)}`;
  };

  // Calculate duration in hours
  const startTime = new Date(`2000-01-01T${booking.startTime}`);
  const endTime = new Date(`2000-01-01T${booking.endTime}`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-green-600" />
          Booking Summary
        </CardTitle>
        <CardDescription>
          Review your booking details and payment breakdown
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Venue Details */}
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">{venue.venue_name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{venue.address}</span>
          </div>
        </div>

        <Separator />

        {/* Booking Details */}
        <div className="space-y-3">
          <h4 className="font-medium">Booking Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(booking.eventDate), 'EEEE, MMMM do, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{booking.startTime} - {booking.endTime}</span>
              <Badge variant="secondary">{durationHours} hours</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{booking.guestCount} {booking.guestCount === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Payment Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium">Payment Breakdown</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Venue Amount ({durationHours} hours)</span>
              <span>{formatCurrency(booking.venueAmount)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Platform Fee</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total Amount</span>
              <span className="text-green-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Platform Fee Notice */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Platform Fee:</strong> A fixed ₹35 fee is charged per booking to cover 
            platform maintenance and support services.
          </p>
        </div>

        {/* Special Requests */}
        {booking.specialRequests && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium">Special Requests</h4>
              <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                {booking.specialRequests}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingSummary; 