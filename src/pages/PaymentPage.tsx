import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, ArrowLeft, Check, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { 
  createRazorpayOrder, 
  initializeRazorpayPayment, 
  calculatePlatformFee, 
  calculateTotalAmount,
  validateAndLogOrderPayload
} from '@/lib/razorpayService';
import { getBookingWithPayment, processSuccessfulPayment, createBookingWithPayment } from '@/lib/paymentService';
import { useAuth } from '@/hooks/useAuth';
import { venueService } from '@/lib/venueService';
import { supabase } from '@/lib/supabase';

// Patch: extend BookingWithPayment type locally to include slot_ids
type BookingWithPaymentWithSlots = import('@/lib/paymentService').BookingWithPayment & { slot_ids?: string[] };

const PaymentPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingWithPaymentWithSlots | null>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);
  const [venue, setVenue] = useState<any>(null);

  // Get bookingId from URL params
  // const bookingId = searchParams.get('bookingId');

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      try {
        if (bookingId) {
          // Existing flow: fetch from DB
          const data = await getBookingWithPayment(bookingId as string);
          setBooking(data);
          // Fetch slots if slot_ids exist
          const slotIds = Array.isArray((data as any)?.slot_ids) ? (data as any).slot_ids : [];
          if (slotIds.length > 0) {
            const { data: slotData, error: slotError } = await supabase
              .from('venue_slots')
              .select('*')
              .in('id', slotIds);
            if (!slotError) setSlots(slotData || []);
          }
          // Fetch venue details
          if (data && data.venueId) {
            const venueData = await venueService.getVenueById(data.venueId);
            setVenue(venueData);
          }
        } else {
          // New flow: fetch from localStorage
          const localBooking = localStorage.getItem('pendingBooking');
          if (localBooking) {
            const parsed = JSON.parse(localBooking);
            // Convert only numeric fields to numbers for calculation, but store as strings if type expects string
            const normalized = {
              ...parsed,
              venueAmount: parsed.venueAmount !== undefined ? String(parsed.venueAmount) : undefined,
              totalAmount: parsed.totalAmount !== undefined ? String(parsed.totalAmount) : undefined,
              platformFee: parsed.platformFee !== undefined ? String(parsed.platformFee) : undefined,
              guestCount: parsed.guestCount !== undefined ? String(parsed.guestCount) : undefined,
              slot_ids: parsed.slot_ids,
            };
            setBooking(normalized);
            // Optionally fetch slots/venue for summary
            if (parsed.slot_ids && parsed.slot_ids.length > 0) {
              const { data: slotData } = await supabase
                .from('venue_slots')
                .select('*')
                .in('id', parsed.slot_ids);
              setSlots(slotData || []);
            }
            if (parsed.venueId) {
              const venueData = await venueService.getVenueById(parsed.venueId);
              setVenue(venueData);
            }
          }
        }
      } catch (err) {
        setError('Failed to fetch booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handlePayment = async () => {
    if (!user) {
      setError('Please sign in to complete your booking.');
      return;
    }
    if (!booking) {
      setError('Booking not found.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      // Validate and log payload before creating order
      validateAndLogOrderPayload({
        amount: paymentAmount,
        currency: 'INR',
        receipt: `booking_${bookingId}`,
        notes: {
          venue_id: booking.venueId,
          venue_name: booking.venueName,
          event_date: booking.eventDate,
          slot_times: booking.startTime + '-' + booking.endTime,
          guest_count: booking.guestCount,
          platform_fee: booking.platformFee,
          venue_amount: booking.venueAmount
        }
      });
      // Create Razorpay order via backend
      const order = await createRazorpayOrder({
        amount: paymentAmount,
        currency: 'INR',
        receipt: `booking_${bookingId}`,
        notes: {
          venue_id: booking.venueId,
          venue_name: booking.venueName,
          event_date: booking.eventDate,
          slot_times: booking.startTime + '-' + booking.endTime,
          guest_count: booking.guestCount,
          platform_fee: booking.platformFee,
          venue_amount: booking.venueAmount
        }
      });
      // Initialize payment
      initializeRazorpayPayment(
        order,
        {
          name: user.name || user.full_name || 'User',
          email: user.email,
          contact: user.phone || ''
        },
        async (paymentResponse) => {
          // On payment success, verify and update backend
          if (!bookingId) {
            // Create booking in DB using localStorage data
            const newBookingId = await createBookingWithPayment(booking as any);
            localStorage.removeItem('pendingBooking');
            navigate(`/payment/${newBookingId}`);
            return;
          }
          await processSuccessfulPayment(
            bookingId as string,
            paymentResponse.razorpay_payment_id,
            paymentResponse.razorpay_signature,
            booking.totalAmount
          );
          navigate(`/booking-confirmation/${bookingId}`);
        },
        (paymentError) => {
          setError('Payment failed. Please try again.');
          setIsProcessing(false);
        },
        () => {
          setIsProcessing(false);
        }
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Always treat venueAmount, platformFee, and totalAmount as paise (integers)
  const venueAmountInPaise = booking?.venueAmount ? Number(booking.venueAmount) : 0;
  const platformFee = booking?.platformFee ? Number(booking.platformFee) : 3500;
  const calculatedTotalAmount = venueAmountInPaise + platformFee;

  // Use booking.totalAmount if valid, else recalculate
  const paymentAmount = booking?.totalAmount && Number(booking.totalAmount) > 0
    ? Number(booking.totalAmount)
    : calculatedTotalAmount;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Complete Your Booking</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <Label>Payment Method</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className="h-12"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Card
                    </Button>
                    <Button
                      variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('upi')}
                      className="h-12"
                    >
                      UPI
                    </Button>
                    <Button
                      variant={paymentMethod === 'netbanking' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('netbanking')}
                      className="h-12"
                    >
                      Net Banking
                    </Button>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {/* Payment Button */}
                <Button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="w-full h-12"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Pay Securely
                    </>
                  )}
                </Button>

                {/* Security Notice */}
                <div className="flex items-center text-sm text-gray-600">
                  <Shield className="h-4 w-4 mr-2" />
                  Your payment is secured by Razorpay
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-medium">{venue?.venue_name || booking?.venueName || 'Venue'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{booking?.eventDate ? format(new Date(booking.eventDate), 'PPP') : 'N/A'}</span>
                  </div>
                  {/* Show slot times if slots exist */}
                  {slots.length > 0 && (
                    <div>
                      <span className="text-gray-600">Slots:</span>
                      <ul className="ml-2 text-sm">
                        {slots.map(slot => (
                          <li key={slot.id} className="flex justify-between">
                            <span>{slot.start_time} - {slot.end_time}</span>
                            <span>₹{String(slot.price)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Fallback to booking start/end time if no slots */}
                  {slots.length === 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Slots:</span>
                      <span className="font-medium">{booking?.startTime + ' - ' + booking?.endTime || 'N/A'}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guests:</span>
                    <span className="font-medium">{booking?.guestCount || 'N/A'}</span>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue Amount:</span>
                    <span>{formatAmount(venueAmountInPaise / 100)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span>{formatAmount(platformFee / 100)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-green-600">{formatAmount(paymentAmount / 100)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage; 