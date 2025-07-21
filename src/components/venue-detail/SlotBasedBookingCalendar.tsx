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

interface SlotBasedBookingCalendarProps {
  venueId: string;
  venueName: string;
  pricePerHour: number;
  capacity?: number;
  rating?: number;
  reviewCount?: number;
  onBookingSubmit?: (bookingData: BookingData) => Promise<string | void>;
  weeklyAvailability?: Record<string, { start: string; end: string; available: boolean }>;
}

interface BookingData {
  date: Date;
  selectedSlots: TimeSlot[];
  totalHours: number;
  guests: number;
  totalPrice: number;
}

interface TimeSlot {
  id: string;
  time: string;
  available: boolean;
  price: number;
  selected: boolean;
}

const PLATFORM_FEE = 35;

// Helper to fetch the current user's profile and return profiles.id
const getCurrentProfileId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();
  if (error || !data) throw new Error('User profile not found');
  return data.id;
};

// All slot and date availability is now fetched from the backend. No dummy data.
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [guests, setGuests] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateStatusMap, setDateStatusMap] = useState<Record<string, 'available' | 'partial' | 'booked'>>({});
  const [slotPreview, setSlotPreview] = useState<{date: string, slots: string[]} | null>(null);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Enhanced: Fetch all slots for the next 30 days and classify each date
  useEffect(() => {
    const fetchDateStatuses = async () => {
      if (!venueId) return;
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 30);
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
      // Group by date
      const byDate: Record<string, { total: number, available: number, slots: string[] }> = {};
      (data || []).forEach((row: any) => {
        if (!byDate[row.date]) byDate[row.date] = { total: 0, available: 0, slots: [] };
        byDate[row.date].total++;
        if (row.available) {
          byDate[row.date].available++;
          byDate[row.date].slots.push(row.start_time);
        }
      });
      const availableDates: string[] = [];
      const statusMap: Record<string, 'available' | 'partial' | 'booked'> = {};
      Object.entries(byDate).forEach(([date, info]) => {
        if (info.available === 0) {
          statusMap[date] = 'booked';
        } else if (info.available === info.total) {
          statusMap[date] = 'available';
          availableDates.push(date);
        } else {
          statusMap[date] = 'partial';
          availableDates.push(date);
        }
      });
      setAvailableDates(availableDates);
      setDateStatusMap(statusMap);
    };
    fetchDateStatuses();
  }, [venueId]);

  // Fetch available slots from Supabase for the selected venue and date
  useEffect(() => {
    const fetchSlots = async () => {
      if (!venueId || !selectedDate) return;
      setFetchingSlots(true);
      try {
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

  // Handle slot selection/deselection
  const handleSlotToggle = (slotTime: string) => {
    const slotIndex = availableSlots.findIndex(slot => slot.time === slotTime);
    if (slotIndex === -1) return;
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

  // Calculate total price (venue only)
  const calculateVenuePrice = (): number => selectedSlots.length * pricePerHour;
  // Calculate total (venue + platform fee)
  const calculateTotal = (): number => calculateVenuePrice() + PLATFORM_FEE;

  // Handle booking submission
  const handleBookingSubmit = async () => {
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

  // Clear all selections
  const clearSelections = () => {
    setSelectedSlots([]);
    const updatedSlots = availableSlots.map(slot => ({ ...slot, selected: false }));
    // Update the slots state if needed
  };

  // Get selected time range
  const getSelectedTimeRange = (): string => {
    if (selectedSlots.length === 0) return '';
    
    const sortedSlots = selectedSlots.sort((a, b) => a.time.localeCompare(b.time));
    const startTime = sortedSlots[0].time;
    const endTime = sortedSlots[sortedSlots.length - 1].time;
    const endHour = parseInt(endTime) + 1;
    
    return `${startTime} - ${endHour.toString().padStart(2, '0')}:00`;
  };

  return (
    <Card className="w-full max-w-md mx-auto lg:max-w-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book Time Slots
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Venue Info */}
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

        {/* Pricing */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              ₹{pricePerHour.toLocaleString()}
            </span>
            <span className="text-gray-600">per hour</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">Select multiple time slots as needed</p>
        </div>

        {/* Date Selection */}
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
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
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
                  const ymd = date.toISOString().split('T')[0];
                  const day = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                  // Block if not available in weeklyAvailability
                  if (Object.keys(weeklyAvailability).length > 0 && !weeklyAvailability[day]?.available) return true;
                  // Block if fully booked or not in dateStatusMap
                  return dateStatusMap[ymd] === 'booked' || !dateStatusMap[ymd];
                }}
                onDayMouseEnter={date => {
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

        {/* Time Slot Selection */}
        {selectedDate && (
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
            
            {selectedSlots.length === 0 && (
              <div className="text-center py-4">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Select time slots to book</p>
              </div>
            )}
          </div>
        )}

        {/* Selected Slots Summary */}
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

        {/* Guest Count */}
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

        {/* Booking Summary */}
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

        {/* Book Now Button */}
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

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Select multiple time slots for flexible booking</p>
          <p>• Free cancellation up to 24 hours before booking</p>
          <p>• Instant confirmation</p>
          <p>• Secure payment processing</p>
        </div>

        {/* Slot preview tooltip */}
        {slotPreview && (
          <div className="mt-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
            {slotPreview.slots.length > 0
              ? `Available: ${slotPreview.slots.join(', ')}`
              : 'All slots booked'}
          </div>
        )}
        {/* Legend */}
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