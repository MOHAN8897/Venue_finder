// SlotBasedBookingCalendar.tsx
// This component provides a slot-based booking calendar for venues with hourly or flexible booking types.
// It handles date and slot availability, user selection, and booking submission.

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, DollarSign, Check, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addDays, isSameDay, parseISO, startOfDay, addHours } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { Tooltip } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';

// Props for the SlotBasedBookingCalendar component
interface SlotBasedBookingCalendarProps {
  venueId: string; // Venue identifier
  venueName: string; // Venue display name
  pricePerHour: number; // Price per hour for booking
  capacity?: number; // Max guest capacity
  rating?: number; // Venue rating
  reviewCount?: number; // Number of reviews
  onBookingSubmit?: (bookingData: BookingData) => Promise<string | void>; // Callback for booking submission
  weeklyAvailability?: Record<string, { start: string; end: string; available: boolean }>; // Weekly schedule
}

// Booking data structure for submission
interface BookingData {
  date: Date;
  selectedSlots: TimeSlot[];
  totalHours: number;
  guests: number;
  totalPrice: number;
}

// Time slot structure
interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
  selected: boolean;
}

const PLATFORM_FEE = 35; // Flat platform fee per booking

// Helper to fetch the current user's profile and return profiles.id
const getCurrentProfileId = async () => {
  // Fetch the authenticated user from Supabase
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  // Fetch the user's profile from the database
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (error || !data) throw new Error('User profile not found');
  return data.id;
};

// Main component for slot-based booking
const SlotBasedBookingCalendar: React.FC<SlotBasedBookingCalendarProps> = ({
  venueId,
  venueName,
  pricePerHour,
  capacity = 0,
  rating = 0,
  reviewCount = 0,
  onBookingSubmit,
  weeklyAvailability = {}
}) => {
  // State for selected date in the calendar
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  // State for all available slots for the selected date
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  // State for user-selected slots
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  // State for guest count
  const [guests, setGuests] = useState<number>(1);
  // Loading state for booking submission
  const [isLoading, setIsLoading] = useState(false);
  // Loading state for fetching slots
  const [fetchingSlots, setFetchingSlots] = useState(false);
  // List of available dates (YYYY-MM-DD)
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  // Map of date to status: 'available', 'partial', or 'booked'
  const [dateStatusMap, setDateStatusMap] = useState<Record<string, 'available' | 'partial' | 'booked'>>({});
  // Slot preview for tooltip on hover
  const [slotPreview, setSlotPreview] = useState<{date: string, slots: string[]} | null>(null);
  // Navigation hook for redirecting after booking
  const navigate = useNavigate();
  // Error state for displaying errors
  const [error, setError] = useState<string | null>(null);

  // Fetch all slot statuses for the next 30 days and classify each date
  useEffect(() => {
    // Fetches slot availability for each date in the next 30 days
    const fetchDateStatuses = async () => {
      if (!venueId) return;
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 30);
      // Query venue_slots for slot availability by date
      const { data, error } = await supabase
        .from('venue_slots')
        .select('date, available, start_time')
        .eq('venue_id', venueId)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);
      if (error) {
        setAvailableDates([]);
        setDateStatusMap({});
        return;
      }
      // Group slots by date and count available/total
      const byDate: Record<string, { total: number, available: number, slots: string[] }> = {};
      (data || []).forEach((row: any) => {
        if (!byDate[row.date]) byDate[row.date] = { total: 0, available: 0, slots: [] };
        byDate[row.date].total++;
        if (row.available) {
          byDate[row.date].available++;
          byDate[row.date].slots.push(row.start_time);
        }
      });
      // Build status map and available dates list
      const availableDates: string[] = [];
      const statusMap: Record<string, 'available' | 'partial' | 'booked'> = {};
      Object.entries(byDate).forEach(([date, info]) => {
        if (info.available === 0) {
          statusMap[date] = 'booked'; // All slots booked
        } else if (info.available === info.total) {
          statusMap[date] = 'available'; // All slots available
          availableDates.push(date);
        } else {
          statusMap[date] = 'partial'; // Some slots available
          availableDates.push(date);
        }
      });
      setAvailableDates(availableDates);
      setDateStatusMap(statusMap);
    };
    fetchDateStatuses();
  }, [venueId]);

  // Fetch available slots for the selected date from Supabase
  useEffect(() => {
    // Fetches all slots for the selected date
    const fetchSlots = async () => {
      if (!venueId || !selectedDate) return;
      setFetchingSlots(true);
      try {
        // Query venue_slots for slots on the selected date
        const { data, error } = await supabase
          .from('venue_slots')
          .select('id, time: start_time, available, price')
          .eq('venue_id', venueId)
          .eq('date', selectedDate.toISOString().split('T')[0]);
        if (error) {
          setAvailableSlots([]);
          return;
        }
        // Map slots to TimeSlot interface
        const slots: TimeSlot[] = (data || []).map((slot: any) => ({
          id: slot.id,
          time: slot.time,
          available: slot.available,
          price: slot.price || pricePerHour,
          selected: false
        }));
        setAvailableSlots(slots);
      } catch (err) {
        setAvailableSlots([]);
      } finally {
        setFetchingSlots(false);
      }
    };
    fetchSlots();
  }, [venueId, selectedDate, pricePerHour]);

  // Handle user toggling a slot (select/deselect)
  const handleSlotToggle = (slotTime: string) => {
    // Find the index of the slot to toggle
    const slotIndex = availableSlots.findIndex(slot => slot.time === slotTime);
    if (slotIndex === -1) return;
    // Find indices of currently selected slots
    const selectedIndices = availableSlots
      .map((slot, idx) => (slot.selected ? idx : -1))
      .filter(idx => idx !== -1);
    // If no slots selected, allow any slot
    if (selectedIndices.length === 0) {
      const updatedSlots = availableSlots.map((slot, idx) => ({ ...slot, selected: idx === slotIndex }));
      setAvailableSlots(updatedSlots);
      setSelectedSlots([availableSlots[slotIndex]]);
      return;
    }
    // If already selected, allow deselect
    if (availableSlots[slotIndex].selected) {
      const updatedSlots = availableSlots.map((slot, idx) => ({ ...slot, selected: idx === slotIndex ? false : slot.selected }));
      setAvailableSlots(updatedSlots);
      setSelectedSlots(updatedSlots.filter(slot => slot.selected));
      return;
    }
    // Only allow selection if slot is adjacent to current selection
    const minIdx = Math.min(...selectedIndices);
    const maxIdx = Math.max(...selectedIndices);
    if (slotIndex === minIdx - 1 || slotIndex === maxIdx + 1) {
      const updatedSlots = availableSlots.map((slot, idx) => ({ ...slot, selected: slot.selected || idx === slotIndex }));
      setAvailableSlots(updatedSlots);
      setSelectedSlots(updatedSlots.filter(slot => slot.selected));
    } else {
      alert('Please select only consecutive time slots.');
    }
  };

  // Calculate the total venue price (selected slots * price per hour)
  const calculateVenuePrice = (): number => selectedSlots.length * pricePerHour;
  // Calculate the total price (venue + platform fee)
  const calculateTotal = (): number => calculateVenuePrice() + PLATFORM_FEE;

  // Handle booking submission (calls parent callback and navigates to payment)
  const handleBookingSubmit = async () => {
    // Validate that a date and at least one slot are selected
    if (!selectedDate) {
      setError('Please select a date.');
      return;
    }
    if (selectedSlots.length === 0) {
      setError('Please select at least one slot.');
      return;
    }
    // Ensure slot_ids is a non-empty array of valid UUIDs
    const slotIds = selectedSlots.map(slot => slot.id).filter(Boolean);
    if (slotIds.length === 0) {
      setError('No valid slots selected.');
      return;
    }

    setIsLoading(true);

    try {
      setError(null);
      if (onBookingSubmit) {
        // Call the parent callback with booking data
        const bookingId = await onBookingSubmit({
          date: selectedDate,
          selectedSlots,
          totalHours: selectedSlots.length,
          guests,
          totalPrice: calculateVenuePrice(),
        });
        // If bookingId is returned, navigate to payment page
        if (bookingId) {
          navigate(`/payment/${bookingId}`);
        }
      }
    } catch (err) {
      setError('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all selected slots
  const clearSelections = () => {
    setSelectedSlots([]);
    const updatedSlots = availableSlots.map(slot => ({ ...slot, selected: false }));
    // Optionally update the slots state if needed
  };

  // Get the selected time range as a string (e.g., "10:00 - 12:00")
  const getSelectedTimeRange = (): string => {
    if (selectedSlots.length === 0) return '';
    const sortedSlots = selectedSlots.sort((a, b) => a.time.localeCompare(b.time));
    const startTime = sortedSlots[0].time;
    const endTime = sortedSlots[sortedSlots.length - 1].time;
    const endHour = parseInt(endTime) + 1;
    return `${startTime} - ${endHour.toString().padStart(2, '0')}:00`;
  };

  // Helper to check if a date is available for selection
  const isDateAvailable = (date: Date) => {
    const ymd = date.toISOString().split('T')[0];
    const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    if (Object.keys(weeklyAvailability).length > 0 && !weeklyAvailability[day]?.available) return false;
    if (dateStatusMap[ymd] === 'booked' || !dateStatusMap[ymd]) return false;
    return true;
  };

  // --- Render ---
  return (
    <Card className="w-full max-w-md mx-auto lg:max-w-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book Time Slots
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Venue Info Section */}
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">{venueName}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {rating > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-400">★</span>
                {rating.toFixed(1)} ({reviewCount})
              </span>
            )}
            {capacity > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Up to {capacity} guests
              </span>
            )}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              ₹{pricePerHour.toLocaleString()}
            </span>
            <span className="text-gray-600">per hour</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Select multiple time slots as needed</p>
        </div>

        {/* Date Selection Calendar Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Select Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {/* Calendar component for date selection */}
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={date => {
                  // Only allow selecting available dates
                  if (date && isDateAvailable(date)) {
                    setSelectedDate(date);
                  }
                }}
                initialFocus
                modifiers={{
                  available: Object.keys(dateStatusMap).filter(date => dateStatusMap[date] === 'available').map(date => new Date(date)),
                  partial: Object.keys(dateStatusMap).filter(date => dateStatusMap[date] === 'partial').map(date => new Date(date)),
                  booked: Object.keys(dateStatusMap).filter(date => dateStatusMap[date] === 'booked').map(date => new Date(date)),
                }}
                modifiersClassNames={{
                  available: 'bg-blue-200 text-blue-900 font-bold border-blue-400 border-2',
                  partial: 'bg-yellow-200 text-yellow-900 font-bold border-yellow-400 border-2',
                  booked: 'bg-red-200 text-red-900 font-bold border-red-400 border-2 opacity-60',
                }}
                disabled={date => {
                  // Disable dates not available in weeklyAvailability or fully booked
                  const ymd = date.toISOString().split('T')[0];
                  const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  if (Object.keys(weeklyAvailability).length > 0 && !weeklyAvailability[day]?.available) return true;
                  if (dateStatusMap[ymd] === 'booked' || !dateStatusMap[ymd]) return true;
                  return false;
                }}
                onDayMouseEnter={date => {
                  // Show slot preview on hover
                  const ymd = date.toISOString().split('T')[0];
                  if (dateStatusMap[ymd]) {
                    setSlotPreview({ date: ymd, slots: dateStatusMap[ymd] === 'available' ? [] : dateStatusMap[ymd] === 'partial' ? [] : [] });
                  } else {
                    setSlotPreview(null);
                  }
                }}
                onDayMouseLeave={() => setSlotPreview(null)}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Slot Selection Section (only if date is available) */}
        {selectedDate && isDateAvailable(selectedDate) && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                Select Time Slots
              </label>
              {selectedSlots.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelections}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
            
            {fetchingSlots && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-600">Loading slots...</span>
              </div>
            )}

            {/* Slot buttons grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={slot.selected ? "default" : slot.available ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => slot.available && handleSlotToggle(slot.time)}
                  className="h-12 text-sm relative"
                  disabled={!slot.available}
                >
                  {slot.time}
                  {slot.selected && (
                    <Check className="h-3 w-3 absolute top-1 right-1" />
                  )}
                </Button>
              ))}
            </div>
            
            {/* Message if no slots selected */}
            {selectedSlots.length === 0 && (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Select time slots to book</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Slots Summary Section */}
        {selectedSlots.length > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-blue-900">Selected Slots</h4>
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map((slot) => (
                <Badge key={slot.time} variant="secondary" className={"bg-blue-100 text-blue-800 font-bold border-2 border-blue-400" + (slot.selected ? " shadow-lg" : "")}>{slot.time}</Badge>
              ))}
            </div>
            <div className="text-sm text-blue-800">
              <div className="flex justify-between">
                <span>Time Range:</span>
                <span>{getSelectedTimeRange()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Hours:</span>
                <span>{selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}

        {/* Guest Count Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-medium text-lg">{guests}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuests(capacity > 0 ? Math.min(capacity, guests + 1) : guests + 1)}
              disabled={capacity > 0 && guests >= capacity}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {capacity > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Maximum {capacity} guests
            </p>
          )}
        </div>

        {/* Booking Summary Section */}
        {selectedSlots.length > 0 && (
          <div className="bg-green-50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-green-900">Booking Summary</h4>
            <div className="text-sm text-green-800 space-y-1">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(selectedDate!, 'PPP')}</span>
              </div>
              <div className="flex justify-between">
                <span>Time Range:</span>
                <span>{getSelectedTimeRange()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Hours:</span>
                <span>{selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests:</span>
                <span>{guests}</span>
              </div>
              <div className="flex justify-between border-t border-green-200 pt-2 mt-2">
                <span>Venue Price:</span>
                <span>₹{calculateVenuePrice().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Fee:</span>
                <span>₹{PLATFORM_FEE}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-green-300 pt-2 mt-2 text-lg">
                <span>Total:</span>
                <span>₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Book Now Button Section */}
        <Button
          onClick={handleBookingSubmit}
          disabled={!selectedDate || selectedSlots.length === 0 || isLoading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </div>
          ) : (
            `Proceed to Payment - ₹${calculateTotal().toLocaleString()}`
          )}
        </Button>

        {/* Additional Info Section */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Select multiple time slots for flexible booking</p>
          <p>• Free cancellation up to 24 hours before booking</p>
          <p>• Instant confirmation</p>
          <p>• Secure payment processing</p>
        </div>

        {/* Slot preview tooltip on calendar hover */}
        {slotPreview && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
            {slotPreview.slots.length > 0
              ? `Available: ${slotPreview.slots.join(', ')}`
              : 'All slots booked'}
          </div>
        )}
        {/* Legend for calendar color codes */}
        <div className="flex gap-4 mt-2 text-xs items-center">
          <span className="inline-block w-4 h-4 bg-blue-200 border-blue-400 border-2 rounded mr-1"></span> Available
          <span className="inline-block w-4 h-4 bg-yellow-200 border-yellow-400 border-2 rounded mr-1"></span> Partially Booked
          <span className="inline-block w-4 h-4 bg-red-200 border-red-400 border-2 rounded mr-1"></span> Fully Booked
        </div>
      </CardContent>
    </Card>
  );
};

export default SlotBasedBookingCalendar; 