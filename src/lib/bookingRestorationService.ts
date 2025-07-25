// Booking Restoration Service
// Handles restoring booking data after user sign-in

export interface PendingBookingData {
  venueId: string;
  venueName: string;
  selectedDate?: string;
  selectedDates?: string[];
  selectedSlots?: string[];
  dailyGuests: number;
  dailySpecialRequests: string;
  bookingType: 'hourly' | 'daily' | 'both';
  returnUrl: string;
}

class BookingRestorationService {
  private readonly STORAGE_KEY = 'pendingBookingAfterSignIn';

  // Store booking data for restoration after sign-in
  storePendingBooking(data: PendingBookingData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Get stored booking data
  getPendingBooking(): PendingBookingData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored booking data:', error);
      return null;
    }
  }

  // Clear stored booking data
  clearPendingBooking(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Check if there's pending booking data
  hasPendingBooking(): boolean {
    return this.getPendingBooking() !== null;
  }

  // Restore booking data to the main booking flow
  restoreBookingData(): PendingBookingData | null {
    const data = this.getPendingBooking();
    if (data) {
      // Convert to the format expected by the payment flow
      const paymentData = {
        venueId: data.venueId,
        venueName: data.venueName,
        userId: '', // Will be set by the payment page
        eventDates: data.selectedDates || [data.selectedDate || ''],
        eventDate: data.selectedDate || data.selectedDates?.[0] || '',
        startTime: '00:00:00',
        endTime: '23:59:59',
        guestCount: data.dailyGuests.toString(),
        specialRequests: data.dailySpecialRequests,
        venueAmount: '0', // Will be calculated by the payment page
        platformFee: '0', // Will be calculated by the payment page
        totalAmount: '0', // Will be calculated by the payment page
        bookingType: data.bookingType,
        slot_ids: data.selectedSlots || [],
      };

      // Store in the main booking flow
      localStorage.setItem('pendingBooking', JSON.stringify(paymentData));
      
      // Clear the restoration data
      this.clearPendingBooking();
      
      return data;
    }
    return null;
  }
}

export const bookingRestorationService = new BookingRestorationService(); 