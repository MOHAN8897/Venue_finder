import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Settings, 
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabase';
import { AvailabilityCalendar } from './AvailabilityCalendar';
import { BlockoutManager } from './BlockoutManager';
import { QuickBlockActions } from './QuickBlockActions';

// TypeScript Interfaces for Real Data
interface VenueBlockout {
  id: string;
  venue_id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason: string;
  block_type: 'maintenance' | 'personal' | 'event' | 'other';
  is_recurring: boolean;
  recurrence_pattern?: any;
  created_at: string;
  updated_at: string;
}

interface AvailabilityData {
  date: string;
  status: 'available' | 'partial' | 'blocked' | 'closed';
  slots_available: number;
  total_slots: number;
  blockouts: VenueBlockout[];
  bookings_count: number;
}

interface VenueAvailabilityStats {
  total_blockouts: number;
  upcoming_blockouts: number;
  days_blocked_this_month: number;
  availability_percentage: number;
  revenue?: number;
  revenueTarget?: number;
  trend?: number;
}

interface VenueAvailabilityControllerProps {
  venueId: string;
  compact?: boolean;
  venues?: any[]; // For multi-venue mode
}

export function VenueAvailabilityController({ 
  venueId, 
  compact = false, 
  venues = [] 
}: VenueAvailabilityControllerProps) {
  // State Management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState(venueId);
  const [activeTab, setActiveTab] = useState('calendar'); // Changed default to calendar
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  
  // Multi-selection state
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedHourSlots, setSelectedHourSlots] = useState<string[]>([]);
  
  // Data State
  const [availabilityData, setAvailabilityData] = useState<AvailabilityData[]>([]);
  const [activeBlockouts, setActiveBlockouts] = useState<VenueBlockout[]>([]);
  const [stats, setStats] = useState<VenueAvailabilityStats | null>(null);
  const [venueBookingType, setVenueBookingType] = useState<'hourly' | 'daily' | 'both'>('hourly');
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  });

  // State for weekly availability
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, { available: boolean; start: string; end: string }>>({});

  // Load venue availability data
  const loadAvailabilityData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get venue blockouts
      const { data: blockouts, error: blockoutsError } = await supabase
        .from('venue_blockouts')
        .select('*')
        .eq('venue_id', selectedVenueId)
        .gte('end_date', new Date().toISOString())
        .order('start_date', { ascending: true });

      if (blockoutsError) {
        console.warn('Blockouts table may not exist yet:', blockoutsError.message);
        setActiveBlockouts([]);
      } else {
        setActiveBlockouts(blockouts || []);
      }

      // Get venue info and weekly availability
      const { data: venue, error: venueError } = await supabase
        .from('venues')
        .select('weekly_availability, venue_name, status, booking_type, availability')
        .eq('id', selectedVenueId)
        .single();

      if (venueError) {
        throw new Error(`Failed to load venue: ${venueError.message}`);
      }

      // Debug logging
      console.log('Venue data:', venue);
      console.log('Weekly availability:', venue?.weekly_availability);
      console.log('Old availability:', venue?.availability);

      setVenueBookingType(venue.booking_type || 'hourly');

      // Convert old availability format to new format if needed
      let processedWeeklyAvailability = venue?.weekly_availability || {};
      
      // If weekly_availability is empty but old availability exists, convert it
      if ((!processedWeeklyAvailability || Object.keys(processedWeeklyAvailability).length === 0) && venue?.availability && Array.isArray(venue.availability)) {
        console.log('Converting old availability format to new format');
        processedWeeklyAvailability = {};
        
        // Convert array format to object format
        const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        allDays.forEach(day => {
          const isAvailable = venue.availability.some((availDay: string) => 
            availDay.toLowerCase() === day
          );
          processedWeeklyAvailability[day] = {
            available: isAvailable,
            start: isAvailable ? '09:00' : '',
            end: isAvailable ? '18:00' : ''
          };
        });
        
        console.log('Converted weekly availability:', processedWeeklyAvailability);
      }

      // ✅ Store weekly availability in state
      setWeeklyAvailability(processedWeeklyAvailability);

      // Calculate availability for the next 30 days
      const calculatedAvailability = calculateAvailabilityForPeriod(
        processedWeeklyAvailability,
        blockouts || [],
        selectedDateRange.start,
        selectedDateRange.end
      );

      setAvailabilityData(calculatedAvailability);
      console.log('Updated availabilityData:', calculatedAvailability); // Debug: confirm blocked dates
      
      // Calculate stats
      const calculatedStats = calculateAvailabilityStats(calculatedAvailability, blockouts || []);
      setStats(calculatedStats);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability data');
      toast.error('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate availability for a date range
  const calculateAvailabilityForPeriod = (
    weeklyAvailability: any,
    blockouts: VenueBlockout[],
    startDate: Date,
    endDate: Date
  ): AvailabilityData[] => {
    const availability: AvailabilityData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      
      // Check if venue is open this day
      const daySchedule = weeklyAvailability?.[dayName];
      const isOpenThisDay = daySchedule?.available && daySchedule?.start && daySchedule?.end;
      
      // Check for blockouts on this date
      const dayBlockouts = blockouts.filter(blockout => {
        // ✅ FIX: Use string comparison instead of Date objects to avoid timezone issues
        const currentDateStr = dateStr; // Already in YYYY-MM-DD format
        const blockoutStartStr = blockout.start_date; // Should be YYYY-MM-DD from database
        const blockoutEndStr = blockout.end_date; // Should be YYYY-MM-DD from database
        
        // Simple string comparison for date ranges (works because YYYY-MM-DD is sortable)
        return currentDateStr >= blockoutStartStr && currentDateStr <= blockoutEndStr;
      });

      console.log(`Date ${dateStr}: Found ${dayBlockouts.length} blockouts`, dayBlockouts.map(b => b.start_date)); // Debug log

      // ✅ NEW: Calculate partial blocking for hour-level blockouts
      let status: 'available' | 'partial' | 'blocked' | 'closed' = 'closed';
      
      if (!isOpenThisDay) {
        status = 'closed';
      } else {
        // Check if any day-level blockouts exist (no start_time means whole day blocked)
        const dayLevelBlockouts = dayBlockouts.filter(b => !b.start_time);
        
        if (dayLevelBlockouts.length > 0) {
          status = 'blocked'; // Entire day is blocked
        } else {
          // Check hour-level blockouts
          const hourLevelBlockouts = dayBlockouts.filter(b => b.start_time);
          
          if (hourLevelBlockouts.length === 0) {
            status = 'available'; // No blockouts at all
          } else {
            // Calculate if all hours are blocked or just some
            const startTime = daySchedule?.start || '09:00';
            const endTime = daySchedule?.end || '18:00';
            const startHour = parseInt(startTime.split(':')[0]);
            const endHour = parseInt(endTime.split(':')[0]);
            const totalHours = endHour - startHour;
            
            // Count unique blocked hours
            const blockedHours = new Set();
            hourLevelBlockouts.forEach(blockout => {
              if (blockout.start_time) {
                const hour = parseInt(blockout.start_time.split(':')[0]);
                blockedHours.add(hour);
              }
            });
            
            if (blockedHours.size >= totalHours) {
              status = 'blocked'; // All hours blocked
            } else {
              status = 'partial'; // Some hours blocked
            }
          }
        }
      }

      // Calculate slots based on booking type and actual venue hours
      let slotsAvailable = 0;
      let totalSlots = 0;

      if (isOpenThisDay) {
        if (venueBookingType === 'daily') {
          // ✅ Daily booking: Only 1 slot per day (the whole day)
          totalSlots = 1;
          slotsAvailable = status === 'blocked' ? 0 : 1;
        } else {
          // ✅ Hourly or both: Calculate based on actual operating hours
          const startTime = daySchedule?.start || '09:00';
          const endTime = daySchedule?.end || '18:00';
          
          // Parse hours (assume format is HH:MM)
          const startHour = parseInt(startTime.split(':')[0]);
          const endHour = parseInt(endTime.split(':')[0]);
          
          // Calculate total hourly slots
          totalSlots = Math.max(0, endHour - startHour);
          
          if (status === 'available') {
            slotsAvailable = totalSlots; // All hours available
          } else if (status === 'blocked') {
            slotsAvailable = 0; // All hours blocked
          } else if (status === 'partial') {
            // ✅ Calculate available hours for partial blocking
            const hourLevelBlockouts = dayBlockouts.filter(b => b.start_time);
            const blockedHours = new Set();
            hourLevelBlockouts.forEach(blockout => {
              if (blockout.start_time) {
                const hour = parseInt(blockout.start_time.split(':')[0]);
                blockedHours.add(hour);
              }
            });
            slotsAvailable = Math.max(0, totalSlots - blockedHours.size);
          }
        }
      } else {
        // ✅ Closed: No slots
        slotsAvailable = 0;
        totalSlots = 0;
      }

      availability.push({
        date: dateStr,
        status,
        slots_available: slotsAvailable,
        total_slots: totalSlots,
        blockouts: dayBlockouts,
        bookings_count: 0 // TODO: Get actual booking count
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availability;
  };

  // Calculate availability statistics
  const calculateAvailabilityStats = (
    availability: AvailabilityData[],
    blockouts: VenueBlockout[]
  ): VenueAvailabilityStats => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const upcomingBlockouts = blockouts.filter(b => new Date(b.start_date) > now);
    const thisMonthBlockouts = blockouts.filter(b => {
      const blockoutDate = new Date(b.start_date);
      return blockoutDate.getMonth() === thisMonth && blockoutDate.getFullYear() === thisYear;
    });

    const availableDays = availability.filter(day => day.status === 'available').length;
    const totalDays = availability.length;
    const availabilityPercentage = totalDays > 0 ? Math.round((availableDays / totalDays) * 100) : 0;

    return {
      total_blockouts: blockouts.length,
      upcoming_blockouts: upcomingBlockouts.length,
      days_blocked_this_month: thisMonthBlockouts.length,
      availability_percentage: availabilityPercentage,
      revenue: 0, // Placeholder, replace with actual revenue calculation
      revenueTarget: 75000, // Placeholder, replace with actual target
      trend: 0 // Placeholder, replace with actual trend calculation
    };
  };

  // Handle blocking a date
  const handleQuickBlock = async (date: string, reason: string = 'Maintenance') => {
    try {
      // ✅ FIX: Check if blockout already exists for this date to prevent duplicates
      const { data: existingBlockout, error: checkError } = await supabase
        .from('venue_blockouts')
        .select('id')
        .eq('venue_id', selectedVenueId)
        .eq('start_date', date)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing blockout:', checkError);
        toast.error('Failed to check existing blockout');
        return;
      }
      
      if (existingBlockout) {
        toast.info('This date is already blocked');
        return;
      }

      const { error } = await supabase
        .from('venue_blockouts')
        .insert({
          venue_id: selectedVenueId,
          start_date: date,
          end_date: date,
          reason,
          block_type: 'maintenance',
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Date blocked successfully');
      loadAvailabilityData(); // Refresh data
    } catch (err) {
      toast.error('Failed to block date. Feature requires database setup.');
      console.error(err);
    }
  };

  // Update handleCalendarDateClick to only select the date (or do nothing)
  const handleCalendarDateClick = (date: string) => {
    setSelectedDate(date);
    // Do not show any confirmation or block/unblock here
    // All block/unblock/toggle actions must go through the bulk action buttons
  };

  // Handle multi-selection change
  const handleSelectionChange = (dates: string[]) => {
    setSelectedDates(dates);
    console.log('Selection changed:', dates);
  };

  // Handle hourly slot selection change
  const handleHourSlotSelectionChange = (hourSlots: string[]) => {
    setSelectedHourSlots(hourSlots);
    console.log('Hour slot selection changed:', hourSlots);
  };

  // Load data on component mount and venue change
  useEffect(() => {
    if (selectedVenueId) {
      // Reset tab to overview when venue changes
      setActiveTab('calendar');
      // Reset other state
      setSelectedDate(undefined);
      setError(null);
      // Load new venue data
      loadAvailabilityData();
    }
  }, [selectedVenueId]);

  // Additional effect to handle venueId prop changes from parent
  useEffect(() => {
    if (venueId !== selectedVenueId) {
      setSelectedVenueId(venueId);
    }
  }, [venueId]);

  // Render loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadAvailabilityData}
            className="ml-2"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Calendar grid display
  // Calculate real values for visualization
  const totalSlots = availabilityData.reduce((sum, d) => sum + d.total_slots, 0);
  const bookedSlots = availabilityData.reduce((sum, d) => sum + d.bookings_count, 0);

  return (
    <div className="space-y-6" id="venue-availability-controller">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {compact ? 'Availability Control' : 'Venue Availability Management'}
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage your venue's availability, blockouts, and schedule
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadAvailabilityData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Multi-venue selector */}
      {venues.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {venues.map((venue) => (
            <Button
              key={venue.id}
              variant={selectedVenueId === venue.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedVenueId(venue.id)}
            >
              {venue.name}
            </Button>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.availability_percentage}%</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.upcoming_blockouts}</p>
                  <p className="text-xs text-muted-foreground">Upcoming Blockouts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.days_blocked_this_month}</p>
                  <p className="text-xs text-muted-foreground">Blocked This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_blockouts}</p>
                  <p className="text-xs text-muted-foreground">Total Blockouts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      {loading ? (
        <div id="loading-calendar" className="loading-skeleton py-12 flex flex-col items-center">
          <RefreshCw className="h-8 w-8 animate-spin loading-spinner mb-4 text-blue-500" />
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-7 w-80 mb-2" />
          <Skeleton className="h-7 w-80 mb-2" />
          <p className="text-muted-foreground mt-4">Loading calendar and availability...</p>
        </div>
      ) : error ? (
        <div id="error-boundary">
          <Alert variant="destructive" id="error-message">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button id="retry-button" variant="outline" className="mt-4" onClick={loadAvailabilityData}>
            Retry
          </Button>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" key={selectedVenueId}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar" id="tab-calendar">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="blockouts" id="tab-blockouts">
              <Settings className="h-4 w-4 mr-1" />
              Blockouts
            </TabsTrigger>
          </TabsList>

          {/* Calendar Tab */}
          <TabsContent value="calendar" id="content-calendar" className="p-2 sm:p-6">
            <Card>
              <AvailabilityCalendar
                venueId={selectedVenueId}
                onDateClick={handleCalendarDateClick}
                availabilityData={availabilityData}
                selectedDate={selectedDate}
                compact={compact}
                bookingType={venueBookingType}
                enableMultiSelection={true}
                onSelectionChange={handleSelectionChange}
                onHourSlotSelectionChange={handleHourSlotSelectionChange}
                onBulkOperationComplete={loadAvailabilityData}
                weeklyAvailability={weeklyAvailability}
              />
            </Card>
          </TabsContent>

          {/* Blockouts Tab */}
          <TabsContent value="blockouts" id="content-blockouts" className="p-2 sm:p-6">
            <Card>
              <BlockoutManager 
                venueId={selectedVenueId}
                onBlockoutChange={() => {
                  loadAvailabilityData();
                  toast.success('Availability updated due to blockout changes');
                }}
              />
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Quick Actions */}
      {!compact && (
        <QuickBlockActions
          venueId={selectedVenueId}
          selectedDate={selectedDate}
          onBlockoutChange={() => {
            loadAvailabilityData();
            toast.success('Availability updated due to quick block action');
          }}
        />
      )}
    </div>
  );
} 