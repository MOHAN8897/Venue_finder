import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

// TypeScript Interfaces
interface VenueBooking {
  id: string;
  venue_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  special_requests?: string;
  created_at: string;
  updated_at: string;
}

interface CreateBookingData {
  venue_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  special_requests?: string;
}

interface UpdateBookingData {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed';
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  special_requests?: string;
}

interface BookingFilters {
  status?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  customer_name?: string;
  customer_email?: string;
}

interface UseBookingManagementReturn {
  // Data
  bookings: VenueBooking[];
  filteredBookings: VenueBooking[];
  
  // Loading States
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error Handling
  error: string | null;
  
  // CRUD Operations
  createBooking: (data: CreateBookingData) => Promise<VenueBooking | null>;
  updateBooking: (id: string, data: UpdateBookingData) => Promise<VenueBooking | null>;
  deleteBooking: (id: string) => Promise<boolean>;
  cancelBooking: (id: string, reason?: string) => Promise<boolean>;
  confirmBooking: (id: string) => Promise<boolean>;
  refreshBookings: () => Promise<void>;
  
  // Filtering and Search
  filters: BookingFilters;
  setFilters: (filters: BookingFilters) => void;
  clearFilters: () => void;
  
  // Computed Values
  stats: {
    total: number;
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
    totalRevenue: number;
    pendingRevenue: number;
    confirmedRevenue: number;
    byStatus: Record<string, number>;
    byPaymentStatus: Record<string, number>;
  };
  
  // Utilities
  getBookingById: (id: string) => VenueBooking | undefined;
  getBookingsByStatus: (status: string) => VenueBooking[];
  getBookingsByDate: (date: string) => VenueBooking[];
  getBookingsByDateRange: (startDate: string, endDate: string) => VenueBooking[];
  getBookingsByCustomer: (email: string) => VenueBooking[];
  getUpcomingBookings: () => VenueBooking[];
  getPastBookings: () => VenueBooking[];
  getTodayBookings: () => VenueBooking[];
}

interface UseBookingManagementOptions {
  venueId?: string; // Optional - if not provided, loads all bookings for the user
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  includePast?: boolean;
  includeFuture?: boolean;
  onBookingChange?: () => void;
}

export function useBookingManagement({
  venueId,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute
  includePast = true,
  includeFuture = true,
  onBookingChange
}: UseBookingManagementOptions = {}): UseBookingManagementReturn {
  // State Management
  const [bookings, setBookings] = useState<VenueBooking[]>([]);
  const [filters, setFilters] = useState<BookingFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bookings from database
  const loadBookings = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setIsLoading(true);
      }
      setError(null);

      let query = supabase
        .from('bookings')
        .select('*')
        .order('booking_date', { ascending: false });

      // Apply venue filter if provided
      if (venueId) {
        query = query.eq('venue_id', venueId);
      }

      // Apply date filters
      const today = new Date().toISOString().split('T')[0];
      
      if (!includePast) {
        query = query.gte('booking_date', today);
      }
      
      if (!includeFuture) {
        query = query.lte('booking_date', today);
      }

      const { data, error: bookingError } = await query;

      if (bookingError) throw bookingError;

      setBookings(data || []);

      if (isRefresh) {
        toast.success('Bookings refreshed successfully');
      }

    } catch (err: any) {
      console.error('Error loading bookings:', err);
      setError(err.message || 'Failed to load bookings');
      toast.error('Failed to load booking data');
    } finally {
      setIsLoading(false);
    }
  }, [venueId, includePast, includeFuture]);

  // Create a new booking
  const createBooking = useCallback(async (data: CreateBookingData): Promise<VenueBooking | null> => {
    try {
      setIsCreating(true);
      setError(null);

      const bookingData = {
        ...data,
        status: 'pending' as const,
        payment_status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => [newBooking, ...prev]);
      toast.success('Booking created successfully');
      
      // Call callback if provided
      if (onBookingChange) {
        onBookingChange();
      }

      return newBooking;

    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
      toast.error('Failed to create booking');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [onBookingChange]);

  // Update an existing booking
  const updateBooking = useCallback(async (id: string, data: UpdateBookingData): Promise<VenueBooking | null> => {
    try {
      setIsUpdating(true);
      setError(null);

      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: updatedBooking, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === id ? updatedBooking : booking
        )
      );
      toast.success('Booking updated successfully');
      
      // Call callback if provided
      if (onBookingChange) {
        onBookingChange();
      }

      return updatedBooking;

    } catch (err: any) {
      console.error('Error updating booking:', err);
      setError(err.message || 'Failed to update booking');
      toast.error('Failed to update booking');
      return null;
    } finally {
      setIsUpdating(false);
    }
  }, [onBookingChange]);

  // Delete a booking
  const deleteBooking = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsDeleting(true);
      setError(null);

      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBookings(prev => prev.filter(booking => booking.id !== id));
      toast.success('Booking deleted successfully');
      
      // Call callback if provided
      if (onBookingChange) {
        onBookingChange();
      }

      return true;

    } catch (err: any) {
      console.error('Error deleting booking:', err);
      setError(err.message || 'Failed to delete booking');
      toast.error('Failed to delete booking');
      return false;
    } finally {
      setIsDeleting(false);
    }
  }, [onBookingChange]);

  // Cancel a booking
  const cancelBooking = useCallback(async (id: string, reason?: string): Promise<boolean> => {
    try {
      setIsUpdating(true);
      setError(null);

      const updateData = {
        status: 'cancelled' as const,
        updated_at: new Date().toISOString(),
        ...(reason && { special_requests: reason })
      };

      const { data: cancelledBooking, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === id ? cancelledBooking : booking
        )
      );
      toast.success('Booking cancelled successfully');
      
      // Call callback if provided
      if (onBookingChange) {
        onBookingChange();
      }

      return true;

    } catch (err: any) {
      console.error('Error cancelling booking:', err);
      setError(err.message || 'Failed to cancel booking');
      toast.error('Failed to cancel booking');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [onBookingChange]);

  // Confirm a booking
  const confirmBooking = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsUpdating(true);
      setError(null);

      const updateData = {
        status: 'confirmed' as const,
        updated_at: new Date().toISOString()
      };

      const { data: confirmedBooking, error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setBookings(prev => 
        prev.map(booking => 
          booking.id === id ? confirmedBooking : booking
        )
      );
      toast.success('Booking confirmed successfully');
      
      // Call callback if provided
      if (onBookingChange) {
        onBookingChange();
      }

      return true;

    } catch (err: any) {
      console.error('Error confirming booking:', err);
      setError(err.message || 'Failed to confirm booking');
      toast.error('Failed to confirm booking');
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [onBookingChange]);

  // Refresh bookings manually
  const refreshBookings = useCallback(async () => {
    await loadBookings(true);
  }, [loadBookings]);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Apply filters to bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      // Status filter
      if (filters.status && booking.status !== filters.status) {
        return false;
      }

      // Payment status filter
      if (filters.payment_status && booking.payment_status !== filters.payment_status) {
        return false;
      }

      // Date range filter
      if (filters.date_from && booking.booking_date < filters.date_from) {
        return false;
      }

      if (filters.date_to && booking.booking_date > filters.date_to) {
        return false;
      }

      // Customer name filter (case-insensitive)
      if (filters.customer_name && 
          !booking.customer_name.toLowerCase().includes(filters.customer_name.toLowerCase())) {
        return false;
      }

      // Customer email filter (case-insensitive)
      if (filters.customer_email && 
          !booking.customer_email.toLowerCase().includes(filters.customer_email.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [bookings, filters]);

  // Utility functions
  const getBookingById = useCallback((id: string) => {
    return bookings.find(booking => booking.id === id);
  }, [bookings]);

  const getBookingsByStatus = useCallback((status: string) => {
    return bookings.filter(booking => booking.status === status);
  }, [bookings]);

  const getBookingsByDate = useCallback((date: string) => {
    return bookings.filter(booking => booking.booking_date === date);
  }, [bookings]);

  const getBookingsByDateRange = useCallback((startDate: string, endDate: string) => {
    return bookings.filter(booking => 
      booking.booking_date >= startDate && booking.booking_date <= endDate
    );
  }, [bookings]);

  const getBookingsByCustomer = useCallback((email: string) => {
    return bookings.filter(booking => 
      booking.customer_email.toLowerCase() === email.toLowerCase()
    );
  }, [bookings]);

  const getUpcomingBookings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => booking.booking_date > today);
  }, [bookings]);

  const getPastBookings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => booking.booking_date < today);
  }, [bookings]);

  const getTodayBookings = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return bookings.filter(booking => booking.booking_date === today);
  }, [bookings]);

  // Computed stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = getBookingsByStatus('pending').length;
    const confirmed = getBookingsByStatus('confirmed').length;
    const cancelled = getBookingsByStatus('cancelled').length;
    const completed = getBookingsByStatus('completed').length;
    
    const totalRevenue = bookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const pendingRevenue = getBookingsByStatus('pending').reduce((sum, booking) => sum + booking.total_amount, 0);
    const confirmedRevenue = getBookingsByStatus('confirmed').reduce((sum, booking) => sum + booking.total_amount, 0);
    
    const byStatus = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPaymentStatus = bookings.reduce((acc, booking) => {
      acc[booking.payment_status] = (acc[booking.payment_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { 
      total, 
      pending, 
      confirmed, 
      cancelled, 
      completed, 
      totalRevenue, 
      pendingRevenue, 
      confirmedRevenue, 
      byStatus, 
      byPaymentStatus 
    };
  }, [bookings, getBookingsByStatus]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshBookings();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshBookings]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return {
    // Data
    bookings,
    filteredBookings,
    
    // Loading States
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    
    // Error Handling
    error,
    
    // CRUD Operations
    createBooking,
    updateBooking,
    deleteBooking,
    cancelBooking,
    confirmBooking,
    refreshBookings,
    
    // Filtering and Search
    filters,
    setFilters,
    clearFilters,
    
    // Computed Values
    stats,
    
    // Utilities
    getBookingById,
    getBookingsByStatus,
    getBookingsByDate,
    getBookingsByDateRange,
    getBookingsByCustomer,
    getUpcomingBookings,
    getPastBookings,
    getTodayBookings,
  };
} 