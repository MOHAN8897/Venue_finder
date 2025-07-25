import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/sonner';

// TypeScript Interfaces
interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'booked' | 'blocked' | 'closed';
  price?: number;
  isSelected?: boolean;
}

interface VenueBlockout {
  id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  block_type: 'maintenance' | 'personal' | 'event' | 'other';
}

interface VenueBooking {
  id: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface UseDynamicSlotsReturn {
  // Data
  slots: TimeSlot[];
  selectedSlots: TimeSlot[];
  
  // Loading States
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Error Handling
  error: string | null;
  
  // Actions
  refreshSlots: () => Promise<void>;
  selectSlot: (slotId: string) => void;
  selectMultipleSlots: (slotIds: string[]) => void;
  clearSelection: () => void;
  
  // Computed Values
  stats: {
    available: number;
    booked: number;
    blocked: number;
    total: number;
  };
  
  // Utilities
  getSlotById: (slotId: string) => TimeSlot | undefined;
  getAvailableSlots: () => TimeSlot[];
  getSelectedSlotsTotal: () => number;
}

interface UseDynamicSlotsOptions {
  venueId: string;
  date: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  onSlotSelect?: (slots: TimeSlot[]) => void;
}

export function useDynamicSlots({
  venueId,
  date,
  autoRefresh = false,
  refreshInterval = 30000, // 30 seconds
  onSlotSelect
}: UseDynamicSlotsOptions): UseDynamicSlotsReturn {
  // State Management
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate available slots based on weekly availability, blockouts, and bookings
  const calculateAvailableSlots = useCallback((
    weeklyAvailability: any,
    oldAvailability: string[],
    blockouts: VenueBlockout[],
    bookings: VenueBooking[],
    targetDate: string,
    pricePerHour: number
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = new Date(targetDate).getDay();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    
    // Check if venue is available on this day
    let isDayAvailable = false;
    let startHour = 6; // Default start time
    let endHour = 22; // Default end time
    
    // Check new weekly availability format first
    if (weeklyAvailability && Object.keys(weeklyAvailability).length > 0) {
      const dayAvailability = weeklyAvailability[dayName];
      if (dayAvailability && dayAvailability.available) {
        isDayAvailable = true;
        if (dayAvailability.start && dayAvailability.end) {
          startHour = parseInt(dayAvailability.start.split(':')[0]);
          endHour = parseInt(dayAvailability.end.split(':')[0]);
        }
      }
    } else if (oldAvailability && oldAvailability.length > 0) {
      // Fallback to old availability array format
      const dayNamesOld = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNameOld = dayNamesOld[dayOfWeek];
      isDayAvailable = oldAvailability.includes(dayNameOld);
    } else {
      // If no availability data, assume all days are available
      isDayAvailable = true;
    }
    
    if (!isDayAvailable) {
      return slots; // Venue closed on this day
    }
    
    // Generate hourly slots
    for (let hour = startHour; hour < endHour; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // Check if slot is blocked
      const isBlocked = blockouts.some(blockout => {
        if (!blockout.start_time && !blockout.end_time) {
          // All-day blockout
          return true;
        }
        
        const blockStart = blockout.start_time || '00:00';
        const blockEnd = blockout.end_time || '23:59';
        
        return startTime >= blockStart && startTime < blockEnd;
      });

      // Check if slot is booked
      const isBooked = bookings.some(booking => {
        const bookingStart = booking.start_time;
        const bookingEnd = booking.end_time;
        
        return startTime >= bookingStart && startTime < bookingEnd;
      });

      // Determine slot status
      let status: 'available' | 'booked' | 'blocked' | 'closed' = 'available';
      if (isBlocked) status = 'blocked';
      else if (isBooked) status = 'booked';
      else if (new Date(`${targetDate}T${startTime}`) < new Date()) status = 'closed';

      slots.push({
        id: `${targetDate}-${startTime}`,
        startTime,
        endTime,
        status,
        price: pricePerHour,
        isSelected: false
      });
    }

    return slots;
  }, []);

  // Load slot data from database
  const loadSlotData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch venue details
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('weekly_availability, price_per_hour, capacity, availability')
        .eq('id', venueId)
        .single();

      if (venueError) throw venueError;

      // Fetch blockouts for the date
      let blockouts: VenueBlockout[] = [];
      try {
        const { data: blockoutData, error: blockoutError } = await supabase
          .from('venue_blockouts')
          .select('*')
          .eq('venue_id', venueId)
          .lte('start_date', date)
          .gte('end_date', date);

        if (blockoutError && !blockoutError.message.includes('relation "venue_blockouts" does not exist')) {
          throw blockoutError;
        }
        blockouts = blockoutData || [];
      } catch (err: any) {
        // Blockouts table might not exist yet - that's okay
        console.log('Blockouts table not available yet:', err.message);
      }

      // Fetch bookings for the date
      let bookings: VenueBooking[] = [];
      try {
        const { data: bookingData, error: bookingError } = await supabase
          .from('bookings')
          .select('id, start_time, end_time, status')
          .eq('venue_id', venueId)
          .eq('booking_date', date)
          .eq('status', 'confirmed');

        if (bookingError) throw bookingError;
        bookings = bookingData || [];
      } catch (err: any) {
        console.error('Error loading bookings:', err);
        bookings = [];
      }

      // Calculate available slots
      const calculatedSlots = calculateAvailableSlots(
        venueData.weekly_availability,
        venueData.availability, // Pass old availability array
        blockouts,
        bookings,
        date,
        venueData.price_per_hour
      );

      setSlots(calculatedSlots);

      if (isRefresh) {
        toast.success('Availability refreshed successfully');
      }

    } catch (err: any) {
      console.error('Error loading slot data:', err);
      setError(err.message || 'Failed to load availability');
      toast.error('Failed to load availability data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [venueId, date, calculateAvailableSlots]);

  // Refresh slots manually
  const refreshSlots = useCallback(async () => {
    await loadSlotData(true);
  }, [loadSlotData]);

  // Select a single slot
  const selectSlot = useCallback((slotId: string) => {
    setSlots(prevSlots => {
      const updatedSlots = prevSlots.map(slot => ({
        ...slot,
        isSelected: slot.id === slotId ? !slot.isSelected : slot.isSelected
      }));
      
      const newSelectedSlots = updatedSlots.filter(slot => slot.isSelected);
      setSelectedSlots(newSelectedSlots);
      
      // Call callback if provided
      if (onSlotSelect) {
        onSlotSelect(newSelectedSlots);
      }
      
      return updatedSlots;
    });
  }, [onSlotSelect]);

  // Select multiple slots
  const selectMultipleSlots = useCallback((slotIds: string[]) => {
    setSlots(prevSlots => {
      const updatedSlots = prevSlots.map(slot => ({
        ...slot,
        isSelected: slotIds.includes(slot.id)
      }));
      
      const newSelectedSlots = updatedSlots.filter(slot => slot.isSelected);
      setSelectedSlots(newSelectedSlots);
      
      // Call callback if provided
      if (onSlotSelect) {
        onSlotSelect(newSelectedSlots);
      }
      
      return updatedSlots;
    });
  }, [onSlotSelect]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSlots(prevSlots => 
      prevSlots.map(slot => ({ ...slot, isSelected: false }))
    );
    setSelectedSlots([]);
    
    // Call callback if provided
    if (onSlotSelect) {
      onSlotSelect([]);
    }
  }, [onSlotSelect]);

  // Utility functions
  const getSlotById = useCallback((slotId: string) => {
    return slots.find(slot => slot.id === slotId);
  }, [slots]);

  const getAvailableSlots = useCallback(() => {
    return slots.filter(slot => slot.status === 'available');
  }, [slots]);

  const getSelectedSlotsTotal = useCallback(() => {
    return selectedSlots.reduce((sum, slot) => sum + (slot.price || 0), 0);
  }, [selectedSlots]);

  // Computed stats
  const stats = useMemo(() => {
    const available = slots.filter(s => s.status === 'available').length;
    const booked = slots.filter(s => s.status === 'booked').length;
    const blocked = slots.filter(s => s.status === 'blocked').length;
    const total = slots.length;

    return { available, booked, blocked, total };
  }, [slots]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !venueId || !date) return;

    const interval = setInterval(() => {
      refreshSlots();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, venueId, date, refreshInterval, refreshSlots]);

  // Load data on mount and when dependencies change
  useEffect(() => {
    if (venueId && date) {
      loadSlotData();
    }
  }, [venueId, date, loadSlotData]);

  // Reset selections when date changes
  useEffect(() => {
    clearSelection();
  }, [date, clearSelection]);

  return {
    // Data
    slots,
    selectedSlots,
    
    // Loading States
    isLoading,
    isRefreshing,
    
    // Error Handling
    error,
    
    // Actions
    refreshSlots,
    selectSlot,
    selectMultipleSlots,
    clearSelection,
    
    // Computed Values
    stats,
    
    // Utilities
    getSlotById,
    getAvailableSlots,
    getSelectedSlotsTotal,
  };
} 