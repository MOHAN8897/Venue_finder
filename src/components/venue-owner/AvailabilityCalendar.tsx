import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Eye,
  AlertTriangle,
  Clock,
  X,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isBefore, isAfter, isSameDay, addHours, setHours, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// TypeScript Interfaces
interface AvailabilityData {
  date: string;
  status: 'available' | 'partial' | 'blocked' | 'closed';
  slots_available: number;
  total_slots: number;
  blockouts: any[];
  bookings_count: number;
}

// Multi-Selection State Interface
interface CalendarSelectionState {
  selectedDates: Set<string>;           // ISO date strings (YYYY-MM-DD)
  selectedHourSlots: Set<string>;       // ISO datetime strings (YYYY-MM-DDTHH:MM) for hourly slots
  isSelectionMode: boolean;             // Toggle for selection mode
  lastSelectedDate: string | null;      // For range selection calculations
  selectionStartPoint: string | null;   // For drag selection origin
  selectionType: 'single' | 'range' | 'multi' | 'drag';
  expandedDate: string | null;          // Currently expanded date for hourly slots
}

// Selection Actions Interface
interface SelectionActions {
  toggleSelectionMode: () => void;
  clearSelection: () => void;
  selectAll: (dateRange: string[]) => void;
  selectRange: (startDate: string, endDate: string) => void;
  toggleDateSelection: (date: string) => void;
  toggleHourSlotSelection: (datetime: string) => void;
  expandDateForHours: (date: string) => void;
  collapseHourSlots: () => void;
}

interface AvailabilityCalendarProps {
  venueId: string;
  onDateClick: (date: string) => void;
  availabilityData: AvailabilityData[];
  selectedDate?: string;
  compact?: boolean;
  bookingType?: 'hourly' | 'daily' | 'both';
  weeklyAvailability?: Record<string, { available: boolean; start: string; end: string }>; // ✅ NEW: Weekly venue hours
  // New props for multi-selection
  onSelectionChange?: (selectedDates: string[]) => void;
  onHourSlotSelectionChange?: (selectedHourSlots: string[]) => void;
  enableMultiSelection?: boolean;
  onBulkOperationComplete?: () => void;
}

export function AvailabilityCalendar({ 
  venueId, 
  onDateClick, 
  availabilityData = [],
  selectedDate,
  compact = false,
  bookingType = 'hourly', // default to hourly
  weeklyAvailability = {}, // ✅ NEW: Default to empty object
  onSelectionChange,
  onHourSlotSelectionChange,
  enableMultiSelection = false,
  onBulkOperationComplete,
}: AvailabilityCalendarProps) {
  const { user } = useAuth();
  // State Management
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  // Multi-Selection State Management
  const [selectionState, setSelectionState] = useState<CalendarSelectionState>({
    selectedDates: new Set(),
    selectedHourSlots: new Set(),
    isSelectionMode: false,
    lastSelectedDate: null,
    selectionStartPoint: null,
    selectionType: 'single',
    expandedDate: null
  });

  // Selection Action Handlers
  const toggleSelectionMode = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      isSelectionMode: !prev.isSelectionMode,
      selectionType: !prev.isSelectionMode ? 'multi' : 'single'
    }));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedDates: new Set(),
      selectedHourSlots: new Set(),
      lastSelectedDate: null,
      selectionStartPoint: null
    }));
  }, []);

  const selectAll = useCallback((dateRange: string[]) => {
    const newSelectedDates = new Set(dateRange);
    setSelectionState(prev => ({
      ...prev,
      selectedDates: newSelectedDates,
      selectionType: 'multi'
    }));
  }, []);

  const selectRange = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Ensure start is before end
    const [actualStart, actualEnd] = isBefore(start, end) ? [start, end] : [end, start];
    
    const dateRange: string[] = [];
    let current = new Date(actualStart);
    
    while (!isAfter(current, actualEnd)) {
      dateRange.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    
    const newSelectedDates = new Set(dateRange);
    setSelectionState(prev => ({
      ...prev,
      selectedDates: newSelectedDates,
      selectionType: 'range'
    }));
  }, []);

  const toggleDateSelection = useCallback((date: string) => {
    setSelectionState(prev => {
      const newSelectedDates = new Set(prev.selectedDates);
      
      if (newSelectedDates.has(date)) {
        newSelectedDates.delete(date);
      } else {
        newSelectedDates.add(date);
      }
      
      const updatedState: CalendarSelectionState = {
        ...prev,
        selectedDates: newSelectedDates,
        lastSelectedDate: date,
        selectionType: 'multi'
      };
      
      return updatedState;
    });
  }, []);

  // Hourly slot management
  const expandDateForHours = useCallback((date: string) => {
    setSelectionState(prev => ({
      ...prev,
      expandedDate: prev.expandedDate === date ? null : date
    }));
  }, []);

  const collapseHourSlots = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      expandedDate: null
    }));
  }, []);

  const toggleHourSlotSelection = useCallback((datetime: string) => {
    setSelectionState(prev => {
      const newSelectedHourSlots = new Set(prev.selectedHourSlots);
      
      if (newSelectedHourSlots.has(datetime)) {
        newSelectedHourSlots.delete(datetime);
      } else {
        newSelectedHourSlots.add(datetime);
      }
      
      return {
        ...prev,
        selectedHourSlots: newSelectedHourSlots,
        selectionType: 'multi'
      };
    });
  }, []);

  // Generate hour slots for a given date based on actual venue hours
  const generateHourSlots = useCallback((date: string) => {
    const slots = [];
    const baseDate = new Date(date);
    const dayName = baseDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    // ✅ Get actual venue hours for this day from weekly availability
    const daySchedule = weeklyAvailability[dayName];
    
    if (!daySchedule || !daySchedule.available || !daySchedule.start || !daySchedule.end) {
      // If no schedule or venue closed, return empty slots
      return [];
    }
    
    // Parse start and end times (format: "HH:MM")
    const startHour = parseInt(daySchedule.start.split(':')[0]);
    const endHour = parseInt(daySchedule.end.split(':')[0]);
    
    // ✅ Get blockouts for this date to check hour-level blocking
    const dateBlockouts = availabilityData.find(d => d.date === date)?.blockouts || [];
    
    // ✅ FIX: Check for full-day blockouts (where start_time and end_time are null)
    const fullDayBlockout = dateBlockouts.find(b => !b.start_time && !b.end_time);
    const hourBlockouts = dateBlockouts.filter(b => b.start_time); // Only hour-level blockouts
    
    // Generate slots for each hour within venue operating hours
    for (let hour = startHour; hour < endHour; hour++) {
      const slotStartTime = setHours(baseDate, hour);
      const slotEndTime = setHours(baseDate, hour + 1);
      const datetime = format(slotStartTime, 'yyyy-MM-dd\'T\'HH:mm');
      const hourString = hour.toString().padStart(2, '0') + ':00';
      
      // ✅ FIX: Check if this hour is blocked (either by full-day or hour-specific blockout)
      const isBlockedByHour = hourBlockouts.some(blockout => {
        if (!blockout.start_time) return false;
        const blockoutHour = blockout.start_time.split(':')[0].padStart(2, '0') + ':00';
        return blockoutHour === hourString;
      });
      
      const isBlocked = fullDayBlockout || isBlockedByHour;
      
      slots.push({
        datetime,
        hour,
        startTime: format(slotStartTime, 'h:mm a'),
        endTime: format(slotEndTime, 'h:mm a'),
        time: `${format(slotStartTime, 'h:mm')} - ${format(slotEndTime, 'h:mm a')}`, // ✅ Show range format
        isSelected: selectionState.selectedHourSlots.has(datetime),
        isBlocked, // ✅ Track blocking status
        fullDayBlocked: !!fullDayBlockout, // ✅ NEW: Track if blocked by full-day blockout
        hourString // ✅ For debugging and blocking operations
      });
    }
    
    console.log(`Generated ${slots.length} hour slots for ${date} (${dayName}):`, slots.map(s => `${s.time} ${s.isBlocked ? (s.fullDayBlocked ? '🔒' : '🔴') : '🟢'}`)); // Debug log
    return slots;
  }, [selectionState.selectedHourSlots, weeklyAvailability, availabilityData]);

  // Use useEffect to handle selection changes
  // Use refs to track previous values and prevent unnecessary callback calls
  const prevSelectedDatesRef = useRef<string[]>([]);
  const prevSelectedHourSlotsRef = useRef<string[]>([]);

  useEffect(() => {
    const current = Array.from(selectionState.selectedDates);
    if (JSON.stringify(current) !== JSON.stringify(prevSelectedDatesRef.current)) {
      onSelectionChange?.(current);
      prevSelectedDatesRef.current = current;
    }
  }, [selectionState.selectedDates, onSelectionChange]);

  useEffect(() => {
    const current = Array.from(selectionState.selectedHourSlots);
    if (JSON.stringify(current) !== JSON.stringify(prevSelectedHourSlotsRef.current)) {
      onHourSlotSelectionChange?.(current);
      prevSelectedHourSlotsRef.current = current;
    }
  }, [selectionState.selectedHourSlots, onHourSlotSelectionChange]);

  // Get calendar data for current month
  const calendarData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = new Date(monthStart);
    const calendarEnd = new Date(monthEnd);
    
    // Adjust to show full weeks (start from Sunday, end on Saturday)
    calendarStart.setDate(calendarStart.getDate() - calendarStart.getDay());
    calendarEnd.setDate(calendarEnd.getDate() + (6 - calendarEnd.getDay()));
    
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    
    return days.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const availability = availabilityData.find(data => data.date === dateStr);
      
      // ✅ DEBUG: Log status for debugging
      if (availability && isSameMonth(day, currentMonth)) {
        console.log(`Calendar Debug - ${dateStr}: status=${availability.status}, blockouts=${availability.blockouts?.length || 0}`);
      }
      
      return {
        date: day,
        dateStr,
        availability: availability || {
          date: dateStr,
          status: 'closed' as const,
          slots_available: 0,
          total_slots: 0,
          blockouts: [],
          bookings_count: 0
        },
        isCurrentMonth: isSameMonth(day, currentMonth),
        isToday: isToday(day),
        isPast: isBefore(day, new Date().setHours(0, 0, 0, 0))
      };
    });
  }, [currentMonth, availabilityData]);

  // --- Enhanced Visual Selection Feedback for Task 1.4 ---

  // Get enhanced status classes with improved visual feedback
  const getStatusClasses = (status: string, isCurrentMonth: boolean, isToday: boolean, isPast: boolean, dateStr?: string) => {
    const baseClasses = "calendar-cell transition-all duration-200 hover:shadow-md";
    
    // ✅ DEBUG: Log status for debugging
    if (dateStr && isCurrentMonth) {
      console.log(`Status Classes Debug - ${dateStr}: status=${status}, isCurrentMonth=${isCurrentMonth}, isPast=${isPast}`);
    }
    
    if (isPast) {
      return `${baseClasses} calendar-past bg-gray-50 text-gray-400 cursor-not-allowed`;
    }
    
    if (!isCurrentMonth) {
      return `${baseClasses} bg-gray-50 text-gray-400`;
    }

    const todayClasses = isToday ? "ring-2 ring-blue-500 ring-offset-1" : "";
    
    // Enhanced selection classes with different states
    let selectionClasses = "";
    if (dateStr) {
      if (selectionState.selectedDates.has(dateStr)) {
        selectionClasses = "ring-2 ring-blue-600 ring-offset-2 bg-blue-50 border-blue-300 shadow-md";
      } else if (dragSelecting && dragStartDate && dragCurrentDate) {
        // Show preview for drag selection
        const dragRange = getDateRange(dragStartDate, dragCurrentDate);
        if (dragRange.includes(dateStr)) {
          selectionClasses = "ring-2 ring-blue-400 ring-offset-1 bg-blue-25 border-blue-200 shadow-sm";
        }
      }
    }
    
    // Enhanced hover states for selectable dates
    const hoverClasses = enableMultiSelection && !isPast && isCurrentMonth 
      ? "hover:scale-105 hover:shadow-lg hover:z-10" 
      : "hover:shadow-md";
    
    switch (status) {
      case 'available':
        return `${baseClasses} calendar-available bg-green-100 hover:bg-green-200 border-green-300 text-green-900 cursor-pointer ${todayClasses} ${selectionClasses} ${hoverClasses}`;
      case 'partial':
        return `${baseClasses} calendar-partial bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-900 cursor-pointer ${todayClasses} ${selectionClasses} ${hoverClasses}`;
      case 'blocked':
        return `${baseClasses} calendar-blocked bg-red-100 hover:bg-red-200 border-red-300 text-red-900 cursor-pointer ${todayClasses} ${selectionClasses} ${hoverClasses}`;
      case 'closed':
        return `${baseClasses} calendar-closed bg-gray-100 hover:bg-gray-200 border-gray-300 text-gray-700 ${todayClasses} ${selectionClasses} ${hoverClasses}`;
      default:
        return `${baseClasses} bg-white border-gray-200 ${todayClasses} ${selectionClasses} ${hoverClasses}`;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string, isToday: boolean) => {
    if (isToday) {
      return <div className="w-2 h-2 bg-blue-500 rounded-full absolute top-1 right-1"></div>;
    }
    
    switch (status) {
      case 'available':
        return <Eye className="w-3 h-3 text-green-600" />;
      case 'partial':
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case 'blocked':
        return <X className="w-3 h-3 text-red-600" />;
      case 'closed':
        return <AlertTriangle className="w-3 h-3 text-gray-400" />;
      default:
        return null;
    }
  };

  // Handle date click based on booking type
  const handleDateClick = (dateStr: string, isPast: boolean, isCurrentMonth: boolean) => {
    if (isPast || !isCurrentMonth) return;
    
    if (bookingType === 'daily') {
      // ✅ Daily venues: Just select the date
      onDateClick(dateStr);
      setSelectionState(prev => ({
        ...prev,
        selectedDates: new Set([dateStr]),
        expandedDate: null // Collapse any expanded hours
      }));
    } else {
      // ✅ Hourly or both venues: Expand hour slots for this date
      if (enableMultiSelection) {
        // In multi-selection mode, select the date but also expand hours
        toggleDateSelection(dateStr);
        expandDateForHours(dateStr);
      } else {
        // In single selection mode, just expand hours
        expandDateForHours(dateStr);
        onDateClick(dateStr);
      }
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Week view data
  const weekData = useMemo(() => {
    if (viewMode !== 'week') return [];
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
    
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startOfWeek, i);
      const dateStr = format(day, 'yyyy-MM-dd');
      const availability = availabilityData.find(data => data.date === dateStr);
      
      return {
        date: day,
        dateStr,
        availability: availability || {
          date: dateStr,
          status: 'closed' as const,
          slots_available: 0,
          total_slots: 0,
          blockouts: [],
          bookings_count: 0
        },
        isToday: isToday(day),
        isPast: isBefore(day, new Date().setHours(0, 0, 0, 0))
      };
    });
  }, [viewMode, availabilityData]);

  // Get all selectable dates in current view
  const getSelectableDates = useCallback(() => {
    const selectableDates: string[] = [];
    
    if (viewMode === 'month') {
      calendarData.forEach(({ dateStr, isCurrentMonth, isPast, availability }) => {
        if (isCurrentMonth && !isPast && availability.status !== 'closed') {
          selectableDates.push(dateStr);
        }
      });
    } else {
      weekData.forEach(({ dateStr, isPast, availability }) => {
        if (!isPast && availability.status !== 'closed') {
          selectableDates.push(dateStr);
        }
      });
    }
    
    return selectableDates;
  }, [viewMode, calendarData, weekData]);

  // --- Add mouse and touch event handlers for multi-selection ---

  // Track drag selection state
  const [dragSelecting, setDragSelecting] = useState(false);
  const [dragStartDate, setDragStartDate] = useState<string | null>(null);
  const [dragCurrentDate, setDragCurrentDate] = useState<string | null>(null);

  // Helper: get all dates between two dates (inclusive)
  const getDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const [actualStart, actualEnd] = isBefore(startDate, endDate)
      ? [startDate, endDate]
      : [endDate, startDate];
    const range: string[] = [];
    let current = new Date(actualStart);
    while (!isAfter(current, actualEnd)) {
      range.push(format(current, 'yyyy-MM-dd'));
      current = addDays(current, 1);
    }
    return range;
  };

  // Mouse event handlers for calendar cells
  const handleCellMouseDown = (dateStr: string, isPast: boolean, isCurrentMonth: boolean, e: React.MouseEvent) => {
    if (isPast || !isCurrentMonth || !enableMultiSelection) return;
    if (e.button !== 0) return; // Only left click
    setDragSelecting(true);
    setDragStartDate(dateStr);
    setDragCurrentDate(dateStr);
  };

  const handleCellMouseEnter = (dateStr: string) => {
    if (dragSelecting && dragStartDate) {
      setDragCurrentDate(dateStr);
    }
  };

  const handleCellMouseUp = (dateStr: string, isPast: boolean, isCurrentMonth: boolean, e: React.MouseEvent) => {
    if (!dragSelecting || !dragStartDate || isPast || !isCurrentMonth || !enableMultiSelection) return;
    setDragSelecting(false);
    setDragCurrentDate(dateStr);
    // Select range
    const range = getDateRange(dragStartDate, dateStr);
    setSelectionState(prev => ({
      ...prev,
      selectedDates: new Set([...prev.selectedDates, ...range]),
      selectionType: 'drag',
      lastSelectedDate: dateStr
    }));
    setDragStartDate(null);
    setDragCurrentDate(null);
  };

  // Keyboard and modifier logic for Ctrl+Click and Shift+Click
  const handleCellClick = (dateStr: string, isPast: boolean, isCurrentMonth: boolean, e: React.MouseEvent) => {
    if (isPast || !isCurrentMonth) return;
    if (!enableMultiSelection) {
      handleDateClick(dateStr, isPast, isCurrentMonth);
      return;
    }
    if (e.shiftKey && selectionState.lastSelectedDate) {
      // Shift+Click: select range
      const range = getDateRange(selectionState.lastSelectedDate, dateStr);
      setSelectionState(prev => ({
        ...prev,
        selectedDates: new Set([...prev.selectedDates, ...range]),
        selectionType: 'range',
        lastSelectedDate: dateStr
      }));
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl+Click or Cmd+Click: toggle individual
      toggleDateSelection(dateStr);
    } else {
      // Normal click: single select or expand
      handleDateClick(dateStr, isPast, isCurrentMonth);
    }
  };

  // Touch event handlers for mobile drag selection
  const handleCellTouchStart = (dateStr: string, isPast: boolean, isCurrentMonth: boolean, e: React.TouchEvent) => {
    if (isPast || !isCurrentMonth || !enableMultiSelection) return;
    setDragSelecting(true);
    setDragStartDate(dateStr);
    setDragCurrentDate(dateStr);
  };
  const handleCellTouchMove = (dateStr: string) => {
    if (dragSelecting && dragStartDate) {
      setDragCurrentDate(dateStr);
    }
  };
  const handleCellTouchEnd = (dateStr: string, isPast: boolean, isCurrentMonth: boolean, e: React.TouchEvent) => {
    if (!dragSelecting || !dragStartDate || isPast || !isCurrentMonth || !enableMultiSelection) return;
    setDragSelecting(false);
    setDragCurrentDate(dateStr);
    // Select range
    const range = getDateRange(dragStartDate, dateStr);
    setSelectionState(prev => ({
      ...prev,
      selectedDates: new Set([...prev.selectedDates, ...range]),
      selectionType: 'drag',
      lastSelectedDate: dateStr
    }));
    setDragStartDate(null);
    setDragCurrentDate(null);
  };

  // Enhanced selection indicator component
  const SelectionIndicator = ({ dateStr, isSelected, isInDragRange }: { 
    dateStr: string; 
    isSelected: boolean; 
    isInDragRange?: boolean;
  }) => {
    if (!enableMultiSelection) return null;
    
    if (isSelected) {
      return (
        <div className="absolute top-1 left-1 z-10">
          <CheckSquare className="h-4 w-4 text-blue-600 drop-shadow-sm" />
        </div>
      );
    }
    
    if (isInDragRange) {
      return (
        <div className="absolute top-1 left-1 z-10">
          <div className="h-4 w-4 bg-blue-400 rounded-sm opacity-60"></div>
        </div>
      );
    }
    
    return null;
  };

  // Selection preview overlay for drag operations
  const SelectionPreview = () => {
    if (!dragSelecting || !dragStartDate || !dragCurrentDate) return null;
    
    const dragRange = getDateRange(dragStartDate, dragCurrentDate);
    
    return (
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg">
          <div className="text-sm font-medium">Selecting {dragRange.length} dates</div>
          <div className="text-xs opacity-90">
            {format(new Date(dragStartDate), 'MMM d')} - {format(new Date(dragCurrentDate), 'MMM d')}
          </div>
        </div>
      </div>
    );
  };

  // --- Bulk Operations UI for Task 1.5 ---

  // Bulk operation types
  type BulkOperationType = 'block' | 'unblock' | 'toggle' | 'pricing';

  // Bulk operation state
  const [showBulkOperations, setShowBulkOperations] = useState(false);
  const [bulkOperationType, setBulkOperationType] = useState<BulkOperationType | null>(null);
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);
  const [bulkOperationReason, setBulkOperationReason] = useState('');
  const [isBulkOperationLoading, setIsBulkOperationLoading] = useState(false);

  // Add a useEffect to clear selection and close dialog after parent data refetch
  useEffect(() => {
    if (!showBulkConfirmation && bulkOperationReason !== '') {
      setBulkOperationReason('');
    }
  }, [showBulkConfirmation]);

  // Bulk operation handlers
  const handleBulkBlock = async () => {
    if (!user) {
      toast.error('You must be logged in as the venue owner to block or unblock slots.');
      return;
    }
    if (selectionState.selectedDates.size === 0) return;
    setIsBulkOperationLoading(true);
    try {
      // ✅ FIX: Check for existing blockouts first to prevent duplicates
      const selectedDatesArray = Array.from(selectionState.selectedDates);
      
      // Check which dates already have blockouts
      const { data: existingBlockouts, error: checkError } = await supabase
        .from('venue_blockouts')
        .select('start_date')
        .eq('venue_id', venueId)
        .in('start_date', selectedDatesArray);
        
      if (checkError) {
        console.error('Error checking existing blockouts:', checkError);
        toast.error('Failed to check existing blockouts');
        return;
      }
      
      // Filter out dates that already have blockouts
      const existingDates = new Set(existingBlockouts?.map(b => b.start_date) || []);
      const newDates = selectedDatesArray.filter(date => !existingDates.has(date));
      
      if (newDates.length === 0) {
        toast.info('All selected dates are already blocked');
        clearSelection();
        setShowBulkConfirmation(false);
        return;
      }
      
      if (newDates.length < selectedDatesArray.length) {
        const skippedCount = selectedDatesArray.length - newDates.length;
        toast.info(`Skipping ${skippedCount} already blocked date(s)`);
      }
      
      // Create payload only for new dates
      const payload = newDates.map(date => ({
        venue_id: venueId,
        start_date: date,
        end_date: date,
        reason: bulkOperationReason || 'Bulk block',
        block_type: 'maintenance',
        created_by: user.id, // Required for RLS
      }));
      
      console.log('Blockout payload (duplicates filtered):', payload);
      
      const { data, error } = await supabase
        .from('venue_blockouts')
        .insert(payload);
        
      if (error) {
        console.error('Supabase insert error:', error, 'Payload:', payload);
        toast.error(`Failed to block slots: ${error.message}`);
        return;
      }
      
      clearSelection();
      setShowBulkConfirmation(false);
      setBulkOperationReason('');
      onBulkOperationComplete?.();
      toast.success(`${newDates.length} slots blocked successfully!`);
    } catch (error) {
      toast.error('Bulk block failed. See console for details.');
      console.error('Bulk block failed:', error);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleBulkUnblock = async () => {
    if (!user) {
      toast.error('You must be logged in as the venue owner to block or unblock slots.');
      return;
    }
    if (selectionState.selectedDates.size === 0) return;
    setIsBulkOperationLoading(true);
    try {
      // ✅ FIX: Only unblock dates that are actually blocked
      const selectedDatesArray = Array.from(selectionState.selectedDates);
      
      // Check which dates actually have blockouts to unblock
      const { data: existingBlockouts, error: checkError } = await supabase
        .from('venue_blockouts')
        .select('start_date')
        .eq('venue_id', venueId)
        .in('start_date', selectedDatesArray);
        
      if (checkError) {
        console.error('Error checking existing blockouts:', checkError);
        toast.error('Failed to check existing blockouts');
        return;
      }
      
      const blockedDates = existingBlockouts?.map(b => b.start_date) || [];
      
      if (blockedDates.length === 0) {
        toast.info('No blocked dates found in selection');
        clearSelection();
        setShowBulkConfirmation(false);
        return;
      }
      
      if (blockedDates.length < selectedDatesArray.length) {
        const nonBlockedCount = selectedDatesArray.length - blockedDates.length;
        toast.info(`Skipping ${nonBlockedCount} non-blocked date(s)`);
      }
      
      console.log('Unblock payload (blocked dates only):', {
        venue_id: venueId,
        dates: blockedDates
      });
      
      const { error } = await supabase
        .from('venue_blockouts')
        .delete()
        .eq('venue_id', venueId)
        .in('start_date', blockedDates);
        
      if (error) {
        console.error('Supabase delete error:', error);
        toast.error(`Failed to unblock slots: ${error.message}`);
        return;
      }
      
      clearSelection();
      setShowBulkConfirmation(false);
      onBulkOperationComplete?.();
      toast.success(`${blockedDates.length} slots unblocked successfully!`);
    } catch (error) {
      toast.error('Bulk unblock failed. See console for details.');
      console.error('Bulk unblock failed:', error);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleBulkToggle = async () => {
    if (!user) {
      toast.error('You must be logged in as the venue owner to block or unblock slots.');
      return;
    }
    if (selectionState.selectedDates.size === 0) return;
    setIsBulkOperationLoading(true);
    try {
      const toBlock: string[] = [];
      const toUnblock: string[] = [];
      selectionState.selectedDates.forEach(date => {
        const day = availabilityData.find(d => d.date === date);
        if (day && day.status === 'blocked') {
          toUnblock.push(date);
        } else {
          toBlock.push(date);
        }
      });
      if (toBlock.length > 0) {
        // Add created_by: user.id to pass RLS policy
        const payload = toBlock.map(date => ({
          venue_id: venueId,
          start_date: date,
          end_date: date,
          reason: bulkOperationReason || 'Bulk block',
          block_type: 'maintenance',
          created_by: user.id, // Required for RLS
        }));
        const { error } = await supabase.from('venue_blockouts').insert(payload);
        if (error) {
          console.error('Supabase toggle block error:', error, 'Payload:', payload);
          toast.error(`Failed to block slots: ${error.message}`);
          return;
        }
      }
      if (toUnblock.length > 0) {
        const { error } = await supabase
          .from('venue_blockouts')
          .delete()
          .eq('venue_id', venueId)
          .in('start_date', toUnblock);
        if (error) {
          console.error('Supabase toggle unblock error:', error, 'Dates:', toUnblock);
          toast.error(`Failed to unblock slots: ${error.message}`);
          return;
        }
      }
      clearSelection();
      setShowBulkConfirmation(false);
      setBulkOperationReason('');
      onBulkOperationComplete?.();
      toast.success('Slots toggled successfully!');
    } catch (error) {
      toast.error('Bulk toggle failed. See console for details.');
      console.error('Bulk toggle failed:', error);
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  // ✅ NEW: Hour-level blocking functions
  const handleHourSlotBlock = async (datetime: string, reason: string = 'Hour block') => {
    if (!user) {
      toast.error('You must be logged in as the venue owner to block slots.');
      return;
    }
    
    try {
      // Parse datetime to get date and time
      const [dateStr, timeStr] = datetime.split('T');
      // Format time properly for PostgreSQL time column (HH:MM:SS)
      const hour = parseInt(timeStr.split(':')[0]);
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
      
      console.log('handleHourSlotBlock: Blocking hour slot', { datetime, dateStr, startTime, endTime });
      
      // Check if this hour slot is already blocked
      const { data: existingBlockout, error: checkError } = await supabase
        .from('venue_blockouts')
        .select('id')
        .eq('venue_id', venueId)
        .eq('start_date', dateStr)
        .eq('start_time', startTime)
        .maybeSingle();
        
      if (checkError) {
        console.error('Error checking existing hour blockout:', checkError);
        toast.error('Failed to check existing blockout');
        return;
      }
      
      if (existingBlockout) {
        toast.info('This hour slot is already blocked');
        return;
      }

      const { error } = await supabase
        .from('venue_blockouts')
        .insert({
          venue_id: venueId,
          start_date: dateStr,
          end_date: dateStr,
          start_time: startTime,
          end_time: endTime,
          reason,
          block_type: 'maintenance',
          created_by: user.id
        });

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('handleHourSlotBlock: Successfully blocked hour slot');
      toast.success('Hour slot blocked successfully');
      onBulkOperationComplete?.(); // Refresh data
    } catch (err) {
      console.error('Hour block failed:', err);
      toast.error('Failed to block hour slot');
    }
  };

  const handleHourSlotUnblock = async (datetime: string) => {
    if (!user) {
      toast.error('You must be logged in as the venue owner to unblock slots.');
      return;
    }
    
    try {
      // Parse datetime to get date and time
      const [dateStr, timeStr] = datetime.split('T');
      // Format time properly for PostgreSQL time column (HH:MM:SS)
      const hour = parseInt(timeStr.split(':')[0]);
      const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
      
      console.log('handleHourSlotUnblock: Unblocking hour slot', { datetime, dateStr, startTime });
      
      const { error } = await supabase
        .from('venue_blockouts')
        .delete()
        .eq('venue_id', venueId)
        .eq('start_date', dateStr)
        .eq('start_time', startTime);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      console.log('handleHourSlotUnblock: Successfully unblocked hour slot');
      toast.success('Hour slot unblocked successfully');
      onBulkOperationComplete?.(); // Refresh data
    } catch (err) {
      console.error('Hour unblock failed:', err);
      toast.error('Failed to unblock hour slot');
    }
  };

  const handleBulkHourBlock = async (selectedHours: string[], reason: string = 'Bulk hour block') => {
    if (!user || selectedHours.length === 0) {
      console.log('handleBulkHourBlock: No user or no selected hours', { user: !!user, selectedHours });
      return;
    }
    
    console.log('handleBulkHourBlock: Starting bulk hour block', { selectedHours, reason });
    setIsBulkOperationLoading(true);
    try {
      // Step 1: Fetch existing blockouts for these slots
      const hourSlotFilters = selectedHours.map(datetime => {
        const [dateStr, timeStr] = datetime.split('T');
        const hour = parseInt(timeStr.split(':')[0]);
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        return { dateStr, startTime };
      });
      const dateList = hourSlotFilters.map(f => f.dateStr);
      const timeList = hourSlotFilters.map(f => f.startTime);
      const { data: existingBlockouts, error: fetchError } = await supabase
        .from('venue_blockouts')
        .select('start_date, start_time')
        .eq('venue_id', venueId)
        .in('start_date', dateList)
        .in('start_time', timeList);
      if (fetchError) {
        console.error('Supabase fetch error:', fetchError);
        throw fetchError;
      }
      // Step 2: Filter out already-blocked slots
      const alreadyBlocked = new Set(
        (existingBlockouts || []).map(b => `${b.start_date}T${b.start_time.slice(0,5)}`)
      );
      const toInsert = selectedHours.filter(datetime => !alreadyBlocked.has(datetime));
      if (toInsert.length === 0) {
        toast.info('All selected hour slots are already blocked.');
        setIsBulkOperationLoading(false);
        return;
      }
      const payload = toInsert.map(datetime => {
        const [dateStr, timeStr] = datetime.split('T');
        const hour = parseInt(timeStr.split(':')[0]);
        const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
        const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
        return {
          venue_id: venueId,
          start_date: dateStr,
          end_date: dateStr,
          start_time: startTime,
          end_time: endTime,
          reason,
          block_type: 'maintenance',
          created_by: user.id
        };
      });
      console.log('handleBulkHourBlock: Inserting payload', payload);
      const { error } = await supabase
        .from('venue_blockouts')
        .insert(payload);
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      console.log('handleBulkHourBlock: Successfully blocked hours');
      toast.success(`${toInsert.length} hour slots blocked successfully!`);
      setSelectionState(prev => ({ ...prev, selectedHourSlots: new Set() }));
      onBulkOperationComplete?.();
    } catch (error) {
      console.error('Bulk hour block failed:', error);
      toast.error('Failed to block hour slots');
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  const handleBulkHourUnblock = async (dateStr: string, selectedHours: string[] = []) => {
    if (!user) {
      toast.error('You must be logged in as the venue owner to unblock slots.');
      return;
    }
    
    console.log('handleBulkHourUnblock: Starting bulk hour unblock', { dateStr, selectedHours });
    setIsBulkOperationLoading(true);
    try {
      // ✅ FIX: Handle both full-day blockouts and hour-specific blockouts
      if (selectedHours.length === 0) {
        // Unblock entire day - remove all blockouts for this date (both full-day and hour-specific)
        console.log('handleBulkHourUnblock: Unblocking entire day', { dateStr });
        
        const { error } = await supabase
          .from('venue_blockouts')
          .delete()
          .eq('venue_id', venueId)
          .eq('start_date', dateStr);

        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }
        
        console.log('handleBulkHourUnblock: Successfully unblocked entire day');
        toast.success('Entire day unblocked successfully!');
      } else {
        // Unblock specific hours
        const payload = selectedHours.map(datetime => {
          const [dateStr, timeStr] = datetime.split('T');
          const hour = parseInt(timeStr.split(':')[0]);
          const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
          
          console.log('Creating unblock payload:', { dateStr, startTime, hour });
          
          return {
            venue_id: venueId,
            start_date: dateStr,
            start_time: startTime
          };
        });

        console.log('handleBulkHourUnblock: Deleting hour-specific blockouts', payload);

        // ✅ FIX: Delete hour-specific blockouts only
        const { error } = await supabase
          .from('venue_blockouts')
          .delete()
          .eq('venue_id', venueId)
          .in('start_date', payload.map(p => p.start_date))
          .not('start_time', 'is', null); // Only delete hour-specific blockouts

        if (error) {
          console.error('Supabase delete error:', error);
          throw error;
        }

        console.log('handleBulkHourUnblock: Successfully unblocked specific hours');
        toast.success(`${selectedHours.length} hour slots unblocked successfully!`);
      }
      
      setSelectionState(prev => ({ ...prev, selectedHourSlots: new Set() }));
      onBulkOperationComplete?.();
    } catch (error) {
      console.error('Bulk hour unblock failed:', error);
      toast.error('Failed to unblock hour slots');
    } finally {
      setIsBulkOperationLoading(false);
    }
  };

  // Bulk Operations Toolbar Component
  const BulkOperationsToolbar = () => {
    if (!enableMultiSelection || selectionState.selectedDates.size === 0) return null;
    
    // ✅ NEW: Analyze selected dates to show contextual actions
    const selectedDatesArray = Array.from(selectionState.selectedDates);
    const selectedStatuses = selectedDatesArray.map(dateStr => {
      const dayData = availabilityData.find(d => d.date === dateStr);
      console.log(`Debug: Date ${dateStr} has status: ${dayData?.status}, blockouts: ${dayData?.blockouts?.length || 0}`); // Debug log
      return { date: dateStr, status: dayData?.status || 'unknown' };
    });
    
    const blockedCount = selectedStatuses.filter(s => s.status === 'blocked').length;
    const availableCount = selectedStatuses.filter(s => s.status === 'available').length;
    const partialCount = selectedStatuses.filter(s => s.status === 'partial').length;
    const closedCount = selectedStatuses.filter(s => s.status === 'closed').length;
    
    console.log(`Debug Toolbar: ${blockedCount} blocked, ${availableCount} available, ${partialCount} partial, ${closedCount} closed`); // Debug log
    
    const totalSelected = selectedDatesArray.length;
    const hasBlocked = blockedCount > 0;
    const hasAvailable = availableCount > 0 || partialCount > 0;
    const hasOnlyBlocked = blockedCount === totalSelected;
    const hasOnlyAvailable = (availableCount + partialCount) === totalSelected;
    const hasClosed = closedCount > 0;
    
    // Determine which buttons to show/enable
    const canBlock = hasAvailable && !hasOnlyBlocked;
    const canUnblock = hasBlocked && !hasOnlyAvailable;
    const showToggle = hasBlocked && hasAvailable; // Mixed selection
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectionState.selectedDates.size} dates selected
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Array.from(selectionState.selectedDates).slice(0, 3).join(', ')}
                {selectionState.selectedDates.size > 3 && ` +${selectionState.selectedDates.size - 3} more`}
              </span>
            </div>
            
            {/* ✅ NEW: Show status breakdown */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {availableCount > 0 && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                  {availableCount} Available
                </span>
              )}
              {partialCount > 0 && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                  {partialCount} Partial
                </span>
              )}
              {blockedCount > 0 && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                  {blockedCount} Blocked
                </span>
              )}
              {closedCount > 0 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
                  {closedCount} Closed
                </span>
              )}
            </div>
          </div>
           
          <div className="flex flex-wrap items-center gap-2">
            {/* ✅ Block Selected - Only show if there are available/partial slots */}
            {canBlock && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkOperationType('block');
                  setShowBulkConfirmation(true);
                }}
                disabled={isBulkOperationLoading}
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4 mr-1" />
                Block {availableCount + partialCount} Available
              </Button>
            )}
            
            {/* ✅ Unblock Selected - Only show if there are blocked slots */}
            {canUnblock && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkOperationType('unblock');
                  setShowBulkConfirmation(true);
                }}
                disabled={isBulkOperationLoading}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <CheckSquare className="h-4 w-4 mr-1" />
                Unblock {blockedCount} Blocked
              </Button>
            )}
            
            {/* ✅ Toggle Selected - Only show for mixed selections */}
            {showToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setBulkOperationType('toggle');
                  setShowBulkConfirmation(true);
                }}
                disabled={isBulkOperationLoading}
              >
                <Eye className="h-4 w-4 mr-1" />
                Toggle Mixed ({blockedCount}→Available, {availableCount + partialCount}→Blocked)
              </Button>
            )}
            
            {/* ✅ Disabled state messaging */}
            {hasOnlyBlocked && (
              <div className="text-sm text-muted-foreground italic">
                All selected dates are blocked
              </div>
            )}
            
            {hasClosed && (
              <div className="text-sm text-orange-600 italic">
                Note: {closedCount} closed dates cannot be modified
              </div>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              disabled={isBulkOperationLoading}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear Selection
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Bulk Operation Confirmation Dialog
  const BulkOperationConfirmation = () => {
    if (!showBulkConfirmation || !bulkOperationType) return null;
    
    // ✅ NEW: Get contextual information about selected dates
    const selectedDatesArray = Array.from(selectionState.selectedDates);
    const selectedStatuses = selectedDatesArray.map(dateStr => {
      const dayData = availabilityData.find(d => d.date === dateStr);
      return { date: dateStr, status: dayData?.status || 'unknown' };
    });
    
    const blockedCount = selectedStatuses.filter(s => s.status === 'blocked').length;
    const availableCount = selectedStatuses.filter(s => s.status === 'available').length;
    const partialCount = selectedStatuses.filter(s => s.status === 'partial').length;
    const closedCount = selectedStatuses.filter(s => s.status === 'closed').length;
    
    const getOperationDetails = () => {
      switch (bulkOperationType) {
        case 'block':
          const blockableCount = availableCount + partialCount;
          return {
            title: 'Block Available Dates',
            description: blockableCount > 0 
              ? `Are you sure you want to block ${blockableCount} available dates?${closedCount > 0 ? ` (${closedCount} closed dates will be skipped)` : ''}${blockedCount > 0 ? ` (${blockedCount} already blocked dates will be skipped)` : ''}`
              : 'No available dates to block in your selection.',
            actionText: `Block ${blockableCount} Dates`,
            actionClass: 'bg-red-600 hover:bg-red-700',
            icon: <X className="h-5 w-5" />,
            disabled: blockableCount === 0
          };
        case 'unblock':
          return {
            title: 'Unblock Blocked Dates',
            description: blockedCount > 0 
              ? `Are you sure you want to unblock ${blockedCount} blocked dates?${availableCount + partialCount > 0 ? ` (${availableCount + partialCount} already available dates will be skipped)` : ''}${closedCount > 0 ? ` (${closedCount} closed dates will be skipped)` : ''}`
              : 'No blocked dates to unblock in your selection.',
            actionText: `Unblock ${blockedCount} Dates`,
            actionClass: 'bg-green-600 hover:bg-green-700',
            icon: <CheckSquare className="h-5 w-5" />,
            disabled: blockedCount === 0
          };
        case 'toggle':
          return {
            title: 'Toggle Mixed Selection',
            description: `Are you sure you want to toggle availability? This will:\n• Block ${availableCount + partialCount} available dates\n• Unblock ${blockedCount} blocked dates${closedCount > 0 ? `\n• Skip ${closedCount} closed dates` : ''}`,
            actionText: 'Toggle Mixed Dates',
            actionClass: 'bg-blue-600 hover:bg-blue-700',
            icon: <Eye className="h-5 w-5" />,
            disabled: false
          };
        default:
          return {
            title: 'Bulk Operation',
            description: 'Are you sure you want to perform this operation?',
            actionText: 'Confirm',
            actionClass: 'bg-blue-600 hover:bg-blue-700',
            icon: <AlertTriangle className="h-5 w-5" />,
            disabled: false
          };
      }
    };
    
    const details = getOperationDetails();
    
    const handleConfirm = async () => {
      switch (bulkOperationType) {
        case 'block':
          await handleBulkBlock();
          break;
        case 'unblock':
          await handleBulkUnblock();
          break;
        case 'toggle':
          await handleBulkToggle();
          break;
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
          {/* X close button */}
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl font-bold focus:outline-none"
            onClick={() => {
              setShowBulkConfirmation(false);
              setBulkOperationReason('');
            }}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
          <div className="flex items-center gap-3 mb-4">
            {details.icon}
            <h3 className="text-lg font-semibold">{details.title}</h3>
          </div>
          <div className="text-muted-foreground mb-4">
            {/* ✅ Handle line breaks for toggle operation */}
            {bulkOperationType === 'toggle' ? (
              <div>
                <p>Are you sure you want to toggle availability? This will:</p>
                <ul className="mt-2 ml-4 list-disc">
                  <li>Block {availableCount + partialCount} available dates</li>
                  <li>Unblock {blockedCount} blocked dates</li>
                  {closedCount > 0 && <li>Skip {closedCount} closed dates</li>}
                </ul>
              </div>
            ) : (
              <p>{details.description}</p>
            )}
          </div>
          {bulkOperationType === 'block' && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Reason (optional)</label>
              <input
                type="text"
                value={bulkOperationReason}
                onChange={e => setBulkOperationReason(e.target.value)}
                placeholder="e.g., Maintenance, Private event"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}
          <div className="flex items-center gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkConfirmation(false);
                setBulkOperationReason('');
              }}
              disabled={isBulkOperationLoading}
            >
              Cancel
            </Button>
            <Button
              className={details.actionClass}
              onClick={handleConfirm}
              disabled={isBulkOperationLoading || details.disabled}
            >
              {isBulkOperationLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                details.actionText
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // --- Task 2.2: Layout Customization ---

  // Layout density presets
  const DENSITY_PRESETS = {
    compact: { cellPadding: 2, fontSize: 12, borderWidth: 1, iconSize: 16, touchTargetSize: 32 },
    comfortable: { cellPadding: 6, fontSize: 14, borderWidth: 1, iconSize: 20, touchTargetSize: 44 },
    spacious: { cellPadding: 12, fontSize: 16, borderWidth: 2, iconSize: 24, touchTargetSize: 56 }
  };

  const getInitialDensity = () => {
    return localStorage.getItem('calendar_density') || 'comfortable';
  };
  const getInitialWeekStart = () => {
    return localStorage.getItem('calendar_week_start') || 'sunday';
  };
  const getInitialDisplayControls = () => {
    try {
      return JSON.parse(localStorage.getItem('calendar_display_controls') || '') || {
        showWeekNumbers: true,
        showWeekends: true,
        showTodayIndicator: true
      };
    } catch {
      return { showWeekNumbers: true, showWeekends: true, showTodayIndicator: true };
    }
  };

  const [density, setDensity] = useState(getInitialDensity());
  const [weekStart, setWeekStart] = useState(getInitialWeekStart());
  const [displayControls, setDisplayControls] = useState(getInitialDisplayControls());

  useEffect(() => {
    localStorage.setItem('calendar_density', density);
  }, [density]);
  useEffect(() => {
    localStorage.setItem('calendar_week_start', weekStart);
  }, [weekStart]);
  useEffect(() => {
    localStorage.setItem('calendar_display_controls', JSON.stringify(displayControls));
  }, [displayControls]);

  const densityConfig = DENSITY_PRESETS[density as keyof typeof DENSITY_PRESETS];

   // 5. Add a try/catch around the main render to catch and log any runtime errors, and show a fallback UI if an error occurs.
  let renderError: Error | null = null;
  let calendarContent: React.ReactNode = null;
  try {
    calendarContent = (
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {compact ? 'Calendar' : 'Availability Calendar'}
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {!compact && (
                <div className="flex bg-muted rounded-lg p-1">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                    className="h-8 px-3"
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                    className="h-8 px-3"
                  >
                    Week
                  </Button>
                </div>
              )}
              
              {enableMultiSelection && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={selectionState.isSelectionMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="h-8 px-3"
                  >
                    {selectionState.isSelectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    {selectionState.isSelectionMode ? 'Selection Mode' : 'Select'}
                  </Button>
                  
                  {selectionState.selectedDates.size > 0 && (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        {selectionState.selectedDates.size} selected
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearSelection}
                        className="h-8 px-2 text-red-600 hover:text-red-700"
                      >
                        Clear
                      </Button>
                    </>
                  )}
                </div>
              )}
              
            </div>
          </div>

          {/* Month Navigation */}
          {viewMode === 'month' && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 px-3"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">
                  {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={goToToday}
                  className="text-xs"
                >
                  Today
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 px-3"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {/* Calendar Grid */}
          {viewMode === 'month' ? (
            <div id="calendar-grid" className="space-y-2">
              {/* Week Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {calendarData.map(({ date, dateStr, availability, isCurrentMonth, isToday, isPast }) => (
                  <div key={dateStr}>
                    <div
                      id={`calendar-cell-${dateStr}`}
                      className={getStatusClasses(availability.status, isCurrentMonth, isToday, isPast, dateStr)}
                      onClick={(e) => handleCellClick(dateStr, isPast, isCurrentMonth, e)}
                      onMouseDown={(e) => handleCellMouseDown(dateStr, isPast, isCurrentMonth, e)}
                      onMouseEnter={() => handleCellMouseEnter(dateStr)}
                      onMouseUp={(e) => handleCellMouseUp(dateStr, isPast, isCurrentMonth, e)}
                      onTouchStart={(e) => handleCellTouchStart(dateStr, isPast, isCurrentMonth, e)}
                      onTouchMove={() => handleCellTouchMove(dateStr)}
                      onTouchEnd={(e) => handleCellTouchEnd(dateStr, isPast, isCurrentMonth, e)}
                    >
                      <div className="p-2 h-16 sm:h-20 relative flex flex-col justify-between" style={{ padding: densityConfig.cellPadding, fontSize: densityConfig.fontSize }}>
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${selectedDate === dateStr ? 'font-bold' : ''}`}>
                            {format(date, 'd')}
                          </span>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(availability.status, isToday)}
                            {/* ✅ DEBUG: Show status for debugging */}
                            <span className="text-xs opacity-50">{availability.status[0]}</span>
                            {/* Expand/collapse icon for hourly venues */}
                            {(bookingType === 'hourly' || bookingType === 'both') && isCurrentMonth && !isPast && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  expandDateForHours(dateStr);
                                }}
                                className="p-0.5 hover:bg-white/20 rounded"
                              >
                                {selectionState.expandedDate === dateStr ? (
                                  <ChevronUp className="h-3 w-3 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-3 w-3 text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {isCurrentMonth && !isPast && (
                          <div className="flex items-center justify-between text-xs">
                            {/* ✅ Only show slot count for hourly/both booking types */}
                            {(bookingType === 'hourly' || bookingType === 'both') && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {availability.slots_available}/{availability.total_slots}
                              </Badge>
                            )}
                            {availability.bookings_count > 0 && (
                              <span className="text-xs text-blue-600 font-medium">
                                {availability.bookings_count}b
                              </span>
                            )}
                          </div>
                        )}
                        
                        {selectedDate === dateStr && (
                          <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"></div>
                        )}
                        
                        {/* Selection indicator */}
                        <SelectionIndicator 
                          dateStr={dateStr}
                          isSelected={selectionState.selectedDates.has(dateStr)}
                          isInDragRange={!!(dragSelecting && dragStartDate && dragCurrentDate && 
                            getDateRange(dragStartDate, dragCurrentDate).includes(dateStr))}
                        />
                      </div>
                    </div>

                    {/* Hourly Slots Expansion */}
                    {selectionState.expandedDate === dateStr && (bookingType === 'hourly' || bookingType === 'both') && (
                      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-xs font-medium text-gray-700">Hour Slots</div>
                          {/* Contextual hour slot bulk actions */}
                          {generateHourSlots(dateStr).length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {/* Block/Unblock Entire Day */}
                              {generateHourSlots(dateStr).every(slot => slot.isBlocked) ? (
                                <button
                                  onClick={() => handleBulkHourUnblock(dateStr)}
                                  disabled={isBulkOperationLoading}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  Unblock Entire Day
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBulkHourBlock(generateHourSlots(dateStr).filter(slot => !slot.isBlocked).map(slot => slot.datetime))}
                                  disabled={isBulkOperationLoading}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Block Entire Day
                                </button>
                              )}
                              {/* Block/Unblock Selected Hour Slots */}
                              {selectionState.selectedHourSlots.size > 0 && (
                                <>
                                  {Array.from(selectionState.selectedHourSlots).every(dt => generateHourSlots(dateStr).find(s => s.datetime === dt)?.isBlocked) ? (
                                    <button
                                      onClick={() => handleBulkHourUnblock(dateStr, Array.from(selectionState.selectedHourSlots))}
                                      disabled={isBulkOperationLoading}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      Unblock Selected
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBulkHourBlock(Array.from(selectionState.selectedHourSlots))}
                                      disabled={isBulkOperationLoading}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                      Block Selected
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectionState(prev => ({ ...prev, selectedHourSlots: new Set() }))}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                  >
                                    Clear
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {generateHourSlots(dateStr).map((slot) => (
                            <button
                              key={slot.datetime}
                              onClick={() => toggleHourSlotSelection(slot.datetime)}
                              onDoubleClick={() => {
                                if (slot.isBlocked) {
                                  if (slot.fullDayBlocked) {
                                    // If full-day blocked, unblock entire day
                                    handleBulkHourUnblock(dateStr);
                                  } else {
                                    // If hour-specific blocked, unblock just this hour
                                    handleHourSlotUnblock(slot.datetime);
                                  }
                                } else {
                                  handleHourSlotBlock(slot.datetime);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (slot.isBlocked) {
                                  if (slot.fullDayBlocked) {
                                    // If full-day blocked, unblock entire day
                                    handleBulkHourUnblock(dateStr);
                                  } else {
                                    // If hour-specific blocked, unblock just this hour
                                    handleHourSlotUnblock(slot.datetime);
                                  }
                                } else {
                                  handleHourSlotBlock(slot.datetime);
                                }
                              }}
                              className={`p-1 text-xs rounded border transition-colors relative ${
                                slot.isBlocked
                                  ? slot.isSelected
                                    ? 'bg-yellow-200 border-yellow-400 text-yellow-900 cursor-pointer hover:bg-yellow-300'
                                    : slot.fullDayBlocked
                                      ? 'bg-red-200 border-red-400 text-red-900 cursor-pointer hover:bg-red-300'
                                      : 'bg-red-100 border-red-300 text-red-800 cursor-pointer hover:bg-red-200'
                                  : slot.isSelected
                                    ? 'bg-blue-200 border-blue-400 text-blue-900 hover:bg-blue-300'
                                    : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                              }`}
                              title={
                                slot.isBlocked 
                                  ? slot.fullDayBlocked
                                    ? `Full-day blocked: ${slot.time} (Double-click to unblock entire day)`
                                    : `Hour blocked: ${slot.time} (Double-click to unblock this hour)`
                                  : `Available: ${slot.time} (Double-click to block)`
                              }
                            >
                              {slot.isBlocked && (
                                <span className="absolute top-0 right-0 text-red-600 text-xs">
                                  {slot.fullDayBlocked ? '🔒' : '🔴'}
                                </span>
                              )}
                              {slot.time}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          💡 Click to select slots (yellow=selected blocked, blue=selected available). Double-click or right-click to block/unblock individual hours
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Week View */
            <div id="calendar-grid" className="space-y-2">
              <h4 className="text-sm font-medium mb-3">This Week</h4>
              <div className="grid gap-3">
                {weekData.map(({ date, dateStr, availability, isToday, isPast }) => (
                  <div key={dateStr}>
                    <div
                      id={`calendar-cell-${dateStr}`}
                      className={`p-4 border rounded-lg ${getStatusClasses(availability.status, true, isToday, isPast, dateStr)} ${
                        selectedDate === dateStr ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => handleDateClick(dateStr, isPast, true)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {format(date, 'EEEE, MMM d')}
                            {isToday && <span className="ml-2 text-blue-600">(Today)</span>}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {availability.status}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {/* ✅ Only show slot count for hourly/both booking types */}
                          {(bookingType === 'hourly' || bookingType === 'both') && (
                            <Badge variant="secondary">
                              {availability.slots_available}/{availability.total_slots} slots
                            </Badge>
                          )}
                          {availability.bookings_count > 0 && (
                            <Badge variant="outline">
                              {availability.bookings_count} bookings
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            {getStatusIcon(availability.status, isToday)}
                            {/* Expand/collapse icon for hourly venues */}
                            {(bookingType === 'hourly' || bookingType === 'both') && !isPast && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  expandDateForHours(dateStr);
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {selectionState.expandedDate === dateStr ? (
                                  <ChevronUp className="h-4 w-4 text-gray-600" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {availability.blockouts.length > 0 && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Blockout: {availability.blockouts[0].reason}
                        </div>
                      )}
                      
                      {/* Selection indicator for week view */}
                      <SelectionIndicator 
                        dateStr={dateStr}
                        isSelected={selectionState.selectedDates.has(dateStr)}
                        isInDragRange={!!(dragSelecting && dragStartDate && dragCurrentDate && 
                          getDateRange(dragStartDate, dragCurrentDate).includes(dateStr))}
                      />
                    </div>

                    {/* Hourly Slots Expansion for Week View */}
                    {selectionState.expandedDate === dateStr && (bookingType === 'hourly' || bookingType === 'both') && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-gray-700">Hour Slots</div>
                          {/* Contextual hour slot bulk actions for week view */}
                          {generateHourSlots(dateStr).length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {/* Block/Unblock Entire Day */}
                              {generateHourSlots(dateStr).every(slot => slot.isBlocked) ? (
                                <button
                                  onClick={() => handleBulkHourUnblock(dateStr, generateHourSlots(dateStr).map(slot => slot.datetime))}
                                  disabled={isBulkOperationLoading}
                                  className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  Unblock Entire Day
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleBulkHourBlock(generateHourSlots(dateStr).filter(slot => !slot.isBlocked).map(slot => slot.datetime))}
                                  disabled={isBulkOperationLoading}
                                  className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                >
                                  Block Entire Day
                                </button>
                              )}
                              {/* Block/Unblock Selected Hour Slots */}
                              {selectionState.selectedHourSlots.size > 0 && (
                                <>
                                  {Array.from(selectionState.selectedHourSlots).every(dt => generateHourSlots(dateStr).find(s => s.datetime === dt)?.isBlocked) ? (
                                    <button
                                      onClick={() => handleBulkHourUnblock(dateStr, Array.from(selectionState.selectedHourSlots))}
                                      disabled={isBulkOperationLoading}
                                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                    >
                                      Unblock Selected
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBulkHourBlock(Array.from(selectionState.selectedHourSlots))}
                                      disabled={isBulkOperationLoading}
                                      className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                                    >
                                      Block Selected
                                    </button>
                                  )}
                                  <button
                                    onClick={() => setSelectionState(prev => ({ ...prev, selectedHourSlots: new Set() }))}
                                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                  >
                                    Clear
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {generateHourSlots(dateStr).map((slot) => (
                            <button
                              key={slot.datetime}
                              onClick={() => toggleHourSlotSelection(slot.datetime)}
                              onDoubleClick={() => {
                                if (slot.isBlocked) {
                                  if (slot.fullDayBlocked) {
                                    // If full-day blocked, unblock entire day
                                    handleBulkHourUnblock(dateStr);
                                  } else {
                                    // If hour-specific blocked, unblock just this hour
                                    handleHourSlotUnblock(slot.datetime);
                                  }
                                } else {
                                  handleHourSlotBlock(slot.datetime);
                                }
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (slot.isBlocked) {
                                  if (slot.fullDayBlocked) {
                                    // If full-day blocked, unblock entire day
                                    handleBulkHourUnblock(dateStr);
                                  } else {
                                    // If hour-specific blocked, unblock just this hour
                                    handleHourSlotUnblock(slot.datetime);
                                  }
                                } else {
                                  handleHourSlotBlock(slot.datetime);
                                }
                              }}
                              className={`p-2 text-sm rounded border transition-colors relative ${
                                slot.isBlocked
                                  ? slot.isSelected
                                    ? 'bg-yellow-200 border-yellow-400 text-yellow-900 cursor-pointer hover:bg-yellow-300'
                                    : slot.fullDayBlocked
                                      ? 'bg-red-200 border-red-400 text-red-900 cursor-pointer hover:bg-red-300'
                                      : 'bg-red-100 border-red-300 text-red-800 cursor-pointer hover:bg-red-200'
                                  : slot.isSelected
                                    ? 'bg-blue-200 border-blue-400 text-blue-900 hover:bg-blue-300'
                                    : 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                              }`}
                              title={
                                slot.isBlocked 
                                  ? slot.fullDayBlocked
                                    ? `Full-day blocked: ${slot.time} (Double-click to unblock entire day)`
                                    : `Hour blocked: ${slot.time} (Double-click to unblock this hour)`
                                  : `Available: ${slot.time} (Double-click to block)`
                              }
                            >
                              {slot.isBlocked && (
                                <span className="absolute top-1 right-1 text-red-600 text-xs">🔒</span>
                              )}
                              {slot.time}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          💡 Click to select slots (yellow=selected blocked, blue=selected available). Double-click or right-click to block/unblock individual hours
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mobile-optimized summary */}
          {compact && (
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Tap dates to block/unblock • {availabilityData.filter(d => d.status === 'available').length} available days
              </p>
            </div>
          )}
          <SelectionPreview />


          <BulkOperationsToolbar />
          <BulkOperationConfirmation />
        </CardContent>
      </Card>
    );
  } catch (err) {
    renderError = err as Error;
    console.error('Calendar render error:', renderError);
  }

  if (renderError) {
    return (
      <div className="p-8 text-center text-red-600">
        <h2 className="text-xl font-bold mb-2">Calendar Error</h2>
        <p>There was an error rendering the calendar. Please check the console for details.</p>
        <pre className="mt-4 text-xs text-red-800">{renderError.message}</pre>
      </div>
    );
  }

  return calendarContent;
} 