import { supabase } from './supabase';

export interface Booking {
  id: string;
  venue_id: string;
  user_id: string;
  event_date: string; // Changed from booking_date to match DB
  start_time: string;
  end_time: string;
  total_amount: number;
  booking_status: 'confirmed' | 'cancelled' | 'completed' | 'pending';
  payment_status: 'paid' | 'pending' | 'refunded' | 'failed';
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_requests?: string;
  created_at: string;
  guest_count: number;
  venue_name?: string;
  booking_notes?: string;
}

export const bookingService = {
  /**
   * Get all bookings for a specific venue
   */
  getVenueBookings: async (venueId: string): Promise<Booking[]> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          venues(venue_name),
          profiles(name, email, phone)
        `)
        .eq('venue_id', venueId)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching venue bookings:', error);
        throw error;
      }

      // Transform the data to match component expectations
      return (data || []).map(booking => ({
        ...booking,
        venue_name: booking.venues?.venue_name,
        // Use profile data if booking customer fields are empty
        customer_name: booking.customer_name || booking.profiles?.name || 'Unknown',
        customer_email: booking.customer_email || booking.profiles?.email || 'No email',
        customer_phone: booking.customer_phone || booking.profiles?.phone || 'No phone'
      }));
    } catch (error) {
      console.error('Failed to fetch venue bookings:', error);
      throw error;
    }
  },

  /**
   * Cancel a booking
   */
  cancelBooking: async (bookingId: string, reason: string, cancelledBy: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: 'cancelled',
          cancellation_reason: reason,
          cancelled_by: cancelledBy,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error cancelling booking:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Failed to cancel booking:', error);
      throw error;
    }
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (bookingId: string, status: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({
          booking_status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (error) {
        console.error('Error updating booking status:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Failed to update booking status:', error);
      throw error;
    }
  }
}; 