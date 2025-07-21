import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  IndianRupee, 
  Download,
  Share2,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface BookingConfirmationProps {
  booking: {
    id: string;
    venue_name: string;
    address: string;
    event_date: string;
    start_time: string;
    end_time: string;
    guest_count: number;
    venue_amount: number;
    platform_fee: number;
    total_amount: number;
    booking_status: string;
    payment_status: string;
    special_requests?: string;
  };
  payment: {
    id: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    payment_date: string;
    payment_status: string;
  };
}

const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  booking,
  payment
}) => {
  const navigate = useNavigate();

  // Convert paise to rupees for display
  const formatCurrency = (amountInPaise: number) => {
    return `₹${(amountInPaise / 100).toFixed(2)}`;
  };

  // Calculate duration in hours
  const startTime = new Date(`2000-01-01T${booking.start_time}`);
  const endTime = new Date(`2000-01-01T${booking.end_time}`);
  const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);

  const handleDownloadReceipt = () => {
    // Generate and download receipt
    const receiptData = {
      bookingId: booking.id,
      paymentId: payment.razorpay_payment_id,
      venueName: booking.venue_name,
      date: booking.event_date,
      time: `${booking.start_time} - ${booking.end_time}`,
      amount: formatCurrency(booking.total_amount),
      status: booking.payment_status
    };

    const receiptText = `
      BOOKING RECEIPT
      ================
      
      Booking ID: ${receiptData.bookingId}
      Payment ID: ${receiptData.paymentId}
      Venue: ${receiptData.venueName}
      Date: ${receiptData.date}
      Time: ${receiptData.time}
      Amount: ${receiptData.amount}
      Status: ${receiptData.status}
      
      Thank you for your booking!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${booking.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Booking Confirmation',
        text: `I just booked ${booking.venue_name} for ${format(new Date(booking.event_date), 'MMMM do, yyyy')}!`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Booking link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-green-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-green-800 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-green-600">
            Your payment was successful and your booking is confirmed.
          </p>
        </div>

        {/* Booking Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Details
            </CardTitle>
            <CardDescription>
              Your booking has been confirmed and payment processed successfully.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Venue Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">{booking.venue_name}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{booking.address}</span>
              </div>
            </div>

            <Separator />

            {/* Booking Information */}
            <div className="space-y-3">
              <h4 className="font-medium">Booking Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{format(new Date(booking.event_date), 'EEEE, MMMM do, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.start_time} - {booking.end_time}</span>
                  <Badge variant="secondary">{durationHours} hours</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.guest_count} {booking.guest_count === 1 ? 'guest' : 'guests'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={booking.booking_status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.booking_status}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Payment Information */}
            <div className="space-y-3">
              <h4 className="font-medium">Payment Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Venue Amount ({durationHours} hours)</span>
                  <span>{formatCurrency(booking.venue_amount)}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Platform Fee</span>
                  <span>{formatCurrency(booking.platform_fee)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total Paid</span>
                  <span className="text-green-600">{formatCurrency(booking.total_amount)}</span>
                </div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg border border-green-200 mt-4">
                <div className="flex items-center gap-2 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span>Payment ID: {payment.razorpay_payment_id}</span>
                </div>
              </div>
            </div>

            {/* Special Requests */}
            {booking.special_requests && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium">Special Requests</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {booking.special_requests}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button 
            onClick={handleDownloadReceipt}
            variant="outline"
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
          
          <Button 
            onClick={handleShare}
            variant="outline"
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share Booking
          </Button>
          
          <Button 
            onClick={() => navigate('/')}
            className="flex-1"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            You will receive a confirmation email shortly. 
            Please keep this booking ID for reference: <strong>{booking.id}</strong>
          </p>
          <p className="mt-2">
            For any questions or changes, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation; 