import { supabase } from './supabase';
import { createRazorpayOrder, verifyPaymentSignature, calculatePlatformFee, calculateTotalAmount } from './razorpayService';
import { useAuth } from '@/hooks/useAuth';

// Types for payment processing
export interface BookingData {
  venueId: string;
  userId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  specialRequests?: string;
  venueAmount: number; // Amount in paise
  bookingType: 'hourly' | 'daily';
  slot_ids: string[]; // Array of slot UUIDs
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
}

export interface PaymentData {
  bookingId: string;
  userId: string;
  venueId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  venueAmount: number;
  platformFee: number;
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
}

export interface BookingWithPayment {
  bookingId: string;
  userId: string;
  venueId: string;
  venueName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  totalAmount: number;
  venueAmount: number;
  platformFee: number;
  bookingStatus: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: string;
}

// Create booking with payment using database function
export const createBookingWithPayment = async (bookingData: BookingData): Promise<string> => {
  // Only require slot_ids for hourly bookings
  if (
    bookingData.bookingType === 'hourly' &&
    (!bookingData.slot_ids || bookingData.slot_ids.length === 0)
  ) {
    throw new Error('No slots selected for booking.');
  }
  // For daily bookings, slot_ids can be empty
  try {
    const { data, error } = await supabase.rpc('create_booking_with_payment', {
      p_venue_id: bookingData.venueId,
      p_event_date: bookingData.eventDate,
      p_start_time: bookingData.startTime,
      p_end_time: bookingData.endTime,
      p_guest_count: bookingData.guestCount,
      p_special_requests: bookingData.specialRequests || null,
      p_venue_amount: bookingData.venueAmount,
      p_platform_fee: calculatePlatformFee(bookingData.venueAmount),
      p_total_amount: calculateTotalAmount(bookingData.venueAmount),
      p_razorpay_order_id: null, // Will be set after order creation
      p_booking_type: bookingData.bookingType,
      p_slot_ids: bookingData.slot_ids, // Pass slot_ids to backend
      p_customer_name: bookingData.customer_name || null,
      p_customer_email: bookingData.customer_email || null,
      p_customer_phone: bookingData.customer_phone || null,
    });

    if (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }

    return data;
  } catch (error) {
    console.error('Error in createBookingWithPayment:', error);
    throw error;
  }
};

// Process successful payment
export const processSuccessfulPayment = async (
  bookingId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentAmount: number
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('process_successful_payment', {
      p_booking_id: bookingId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_signature: razorpaySignature,
      p_payment_amount: paymentAmount
    });

    if (error) {
      console.error('Error processing payment:', error);
      throw new Error('Failed to process payment');
    }

    return data;
  } catch (error) {
    console.error('Error in processSuccessfulPayment:', error);
    throw error;
  }
};

// Get booking with payment details
export const getBookingWithPayment = async (bookingId: string): Promise<BookingWithPayment | null> => {
  try {
    const { data, error } = await supabase.rpc('get_booking_with_payment', {
      p_booking_id: bookingId
    });

    if (error) {
      console.error('Error getting booking:', error);
      throw new Error('Failed to get booking details');
    }

    if (data && data.length > 0) {
      return data[0] as BookingWithPayment;
    }

    return null;
  } catch (error) {
    console.error('Error in getBookingWithPayment:', error);
    throw error;
  }
};

// Get user bookings
export const getUserBookings = async (userId: string): Promise<BookingWithPayment[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        venue_id,
        event_date,
        start_time,
        end_time,
        guest_count,
        total_amount,
        venue_amount,
        platform_fee,
        booking_status,
        payment_status,
        created_at,
        venues!inner(venue_name),
        payments!inner(razorpay_order_id, razorpay_payment_id)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user bookings:', error);
      throw new Error('Failed to get user bookings');
    }

    return data.map(booking => ({
      bookingId: booking.id,
      userId: booking.user_id,
      venueId: booking.venue_id,
      venueName: (booking.venues as any).venue_name,
      eventDate: booking.event_date,
      startTime: booking.start_time,
      endTime: booking.end_time,
      guestCount: booking.guest_count,
      totalAmount: booking.total_amount,
      venueAmount: booking.venue_amount,
      platformFee: booking.platform_fee,
      bookingStatus: booking.booking_status,
      paymentStatus: booking.payment_status,
      razorpayOrderId: (booking.payments as any)?.razorpay_order_id || '',
      razorpayPaymentId: (booking.payments as any)?.razorpay_payment_id || '',
      createdAt: booking.created_at
    }));
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    throw error;
  }
};

// Get venue owner revenue
export const getVenueOwnerRevenue = async (
  ownerId: string,
  startDate: string,
  endDate: string
) => {
  try {
    const { data, error } = await supabase.rpc('get_venue_owner_revenue', {
      p_owner_id: ownerId,
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error('Error getting venue owner revenue:', error);
      throw new Error('Failed to get revenue data');
    }

    return data;
  } catch (error) {
    console.error('Error in getVenueOwnerRevenue:', error);
    throw error;
  }
};

// Get platform revenue
export const getPlatformRevenue = async (startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase.rpc('get_platform_revenue', {
      p_start_date: startDate,
      p_end_date: endDate
    });

    if (error) {
      console.error('Error getting platform revenue:', error);
      throw new Error('Failed to get platform revenue');
    }

    return data[0];
  } catch (error) {
    console.error('Error in getPlatformRevenue:', error);
    throw error;
  }
};

// Complete payment flow
export const completePaymentFlow = async (
  bookingData: BookingData,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  paymentAmount: number
): Promise<BookingWithPayment> => {
  try {
    // 1. Create booking with payment
    const bookingId = await createBookingWithPayment(bookingData);

    // 2. Update payment with Razorpay order ID
    const { error: updateError } = await supabase
      .from('payments')
      .update({ razorpay_order_id: razorpayOrderId })
      .eq('booking_id', bookingId);

    if (updateError) {
      throw new Error('Failed to update payment with order ID');
    }

    // 3. Process successful payment
    await processSuccessfulPayment(bookingId, razorpayPaymentId, razorpaySignature, paymentAmount);

    // 4. Get updated booking details
    const bookingDetails = await getBookingWithPayment(bookingId);
    if (!bookingDetails) {
      throw new Error('Failed to get booking details');
    }

    return bookingDetails;
  } catch (error) {
    console.error('Error in completePaymentFlow:', error);
    throw error;
  }
};

// Handle payment webhook
export const handlePaymentWebhook = async (
  eventType: string,
  eventId: string,
  payload: any
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('handle_razorpay_webhook', {
      p_event_type: eventType,
      p_event_id: eventId,
      p_payload: payload
    });

    if (error) {
      console.error('Error handling webhook:', error);
      throw new Error('Failed to handle webhook');
    }

    return data;
  } catch (error) {
    console.error('Error in handlePaymentWebhook:', error);
    throw error;
  }
};

// Get payment statistics
export const getPaymentStatistics = async (userId?: string) => {
  try {
    let query = supabase
      .from('payments')
      .select('payment_status, total_amount, created_at');

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting payment statistics:', error);
      throw new Error('Failed to get payment statistics');
    }

    const stats = {
      totalPayments: data.length,
      successfulPayments: data.filter(p => p.payment_status === 'paid').length,
      failedPayments: data.filter(p => p.payment_status === 'failed').length,
      totalRevenue: data
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + (p.total_amount || 0), 0),
      platformFees: data
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + ((p as any).platform_fee || 0), 0)
    };

    return stats;
  } catch (error) {
    console.error('Error in getPaymentStatistics:', error);
    throw error;
  }
}; 