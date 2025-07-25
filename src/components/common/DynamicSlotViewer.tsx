import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  CheckCircle2, 
  X, 
  AlertTriangle, 
  Loader2,
  Calendar,
  Eye,
  EyeOff,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, parseISO, isToday, isBefore, addHours, startOfDay } from 'date-fns';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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

interface DynamicSlotViewerProps {
  venueId: string;
  date: string;
  onSlotSelect: (slots: TimeSlot[]) => void;
  compact?: boolean;
}

export function DynamicSlotViewer({ 
  venueId, 
  date, 
  onSlotSelect, 
  compact = false 
}: DynamicSlotViewerProps) {
  // State Management
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [showBlocked, setShowBlocked] = useState(false);
  const [showBooked, setShowBooked] = useState(false);

  // Load venue data and calculate slots
  const loadSlotData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch venue details
      const { data: venueData, error: venueError } = await supabase
        .from('venues')
        .select('weekly_availability, price_per_hour, capacity')
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
        blockouts,
        bookings,
        date,
        venueData.price_per_hour
      );

      setSlots(calculatedSlots);

    } catch (err: any) {
      console.error('Error loading slot data:', err);
      setError(err.message || 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  };

  // Calculate available slots based on weekly availability, blockouts, and bookings
  const calculateAvailableSlots = (
    weeklyAvailability: any,
    blockouts: VenueBlockout[],
    bookings: VenueBooking[],
    targetDate: string,
    pricePerHour: number
  ): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const dayOfWeek = new Date(targetDate).getDay();
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    
    // Get day's availability from weekly schedule
    const dayAvailability = weeklyAvailability?.[dayName];
    
    if (!dayAvailability || !dayAvailability.available) {
      return slots; // Venue closed on this day
    }

    const startHour = parseInt(dayAvailability.start.split(':')[0]);
    const endHour = parseInt(dayAvailability.end.split(':')[0]);
    
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
      else if (isBefore(new Date(`${targetDate}T${startTime}`), new Date())) status = 'closed';

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
  };

  // Handle slot selection
  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;

    const updatedSlots = slots.map(s => ({
      ...s,
      isSelected: s.id === slot.id ? !s.isSelected : s.isSelected
    }));

    setSlots(updatedSlots);
    
    const selectedSlots = updatedSlots.filter(s => s.isSelected);
    setSelectedSlots(selectedSlots);
    
    onSlotSelect(selectedSlots);
  };

  // Get slot status styling
  const getSlotStatusClasses = (status: string, isSelected: boolean) => {
    const baseClasses = 'relative p-3 rounded-lg border transition-all duration-200 cursor-pointer';
    
    if (isSelected) {
      return `${baseClasses} bg-primary text-primary-foreground border-primary shadow-md`;
    }

    switch (status) {
      case 'available':
        return `${baseClasses} bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/40`;
      case 'booked':
        return `${baseClasses} bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 cursor-not-allowed opacity-60`;
      case 'blocked':
        return `${baseClasses} bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800 cursor-not-allowed opacity-60`;
      case 'closed':
        return `${baseClasses} bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800 cursor-not-allowed opacity-40`;
      default:
        return `${baseClasses} bg-muted border-border`;
    }
  };

  // Get slot status icon
  const getSlotStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'booked':
        return <X className="h-4 w-4 text-red-600" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'closed':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Filter slots based on visibility settings
  const filteredSlots = useMemo(() => {
    return slots.filter(slot => {
      if (slot.status === 'blocked' && !showBlocked) return false;
      if (slot.status === 'booked' && !showBooked) return false;
      return true;
    });
  }, [slots, showBlocked, showBooked]);

  // Load data on mount and when props change
  useEffect(() => {
    if (venueId && date) {
      loadSlotData();
    }
  }, [venueId, date]);

  // Calculate stats
  const stats = useMemo(() => {
    const available = slots.filter(s => s.status === 'available').length;
    const booked = slots.filter(s => s.status === 'booked').length;
    const blocked = slots.filter(s => s.status === 'blocked').length;
    const total = slots.length;

    return { available, booked, blocked, total };
  }, [slots]);

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4 sm:mb-8 p-2 sm:p-6 rounded-lg shadow-md bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Available Slots
            {!compact && (
              <span className="text-sm font-normal text-muted-foreground">
                {format(parseISO(date), 'EEEE, MMM d, yyyy')}
              </span>
            )}
          </CardTitle>
          
          <Button
            variant="outline"
            size="sm"
            onClick={loadSlotData}
            disabled={loading}
            id="slot-refresh-btn"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-2 sm:p-6">
        {loading ? (
          <div id="loading-slots" className="loading-skeleton py-8 flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin loading-spinner mb-4 text-blue-500" />
            <Skeleton height={32} width={180} className="mb-2" />
            <Skeleton count={4} height={28} width={320} containerClassName="w-full max-w-xs" />
            <p className="text-muted-foreground mt-4">Loading available slots...</p>
          </div>
        ) : error ? (
          <div id="error-boundary">
            <Alert variant="destructive" id="error-message">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button id="retry-button" variant="outline" className="mt-4" onClick={loadSlotData}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Summary */}
            {!compact && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                  <div className="text-xs text-green-600">Available</div>
                </div>
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{stats.booked}</div>
                  <div className="text-xs text-red-600">Booked</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{stats.blocked}</div>
                  <div className="text-xs text-orange-600">Blocked</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            )}

            {/* Filter Controls */}
            {!compact && (
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant={showBlocked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBlocked(!showBlocked)}
                    id="filter-blocked"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Blocked
                  </Button>
                  <Button
                    variant={showBooked ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowBooked(!showBooked)}
                    id="filter-booked"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Booked
                  </Button>
                </div>
              </div>
            )}

            {/* Slots Grid */}
            <div 
              id="slot-grid"
              className={`grid gap-3 ${
                compact 
                  ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' 
                  : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
              }`}
            >
              {filteredSlots.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-2">No slots available</p>
                  <p className="text-sm text-muted-foreground">
                    {slots.length === 0 
                      ? 'Venue is closed on this date'
                      : 'All slots are booked or blocked'
                    }
                  </p>
                </div>
              ) : (
                filteredSlots.map((slot) => (
                  <div
                    key={slot.id}
                    id={`slot-item-${slot.startTime}`}
                    className={`${getSlotStatusClasses(slot.status, slot.isSelected || false)} ${
                      slot.status === 'available' ? 'slot-available' : 
                      slot.status === 'booked' ? 'slot-booked' : 
                      slot.status === 'blocked' ? 'slot-blocked' : 'slot-closed'
                    }`}
                    onClick={() => handleSlotClick(slot)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {getSlotStatusIcon(slot.status)}
                      {slot.isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium text-sm">
                        {slot.startTime} - {slot.endTime}
                      </div>
                      {slot.price && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ₹{slot.price}/hr
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Selection Summary */}
            {selectedSlots.length > 0 && (
              <div className="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary">
                      {selectedSlots.length} slot{selectedSlots.length !== 1 ? 's' : ''} selected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSlots.map(s => `${s.startTime}-${s.endTime}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      Total: ₹{selectedSlots.reduce((sum, slot) => sum + (slot.price || 0), 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSlots.length} hour{selectedSlots.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            {!compact && (
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4" />
                  <span className="font-medium text-sm">Legend</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span>Blocked</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                    <span>Closed</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 