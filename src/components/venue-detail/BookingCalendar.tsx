import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './venue-calendar.css';
import { useDynamicSlots } from '@/hooks/useDynamicSlots';
import SignInModal from './SignInModal';
import { bookingRestorationService } from '@/lib/bookingRestorationService';

interface BookingCalendarProps {
  bookingType: 'hourly' | 'daily' | 'both';
  venue: any;
  user: any;
  bookedDates: Set<string>;
  selectedDate: string | undefined;
  setSelectedDate: (date: string | undefined) => void;
  dailyGuests: number;
  setDailyGuests: (guests: number) => void;
  dailySpecialRequests: string;
  setDailySpecialRequests: (val: string) => void;
  handleSlotBookingSubmit: (data: any) => Promise<string | void>;
  navigate: any;
}

interface SlotData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
  price: number;
  booked_by: string | null;
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Helper function to format time for display
const formatTime = (timeString: string): string => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Helper function to check if a date is available based on weekly availability
const isDateAvailable = (date: Date, weeklyAvailability: any, oldAvailability: string[]): boolean => {
  const dayOfWeek = date.getDay();
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayName = dayNames[dayOfWeek];
  
  // Check new weekly availability format first
  if (weeklyAvailability && Object.keys(weeklyAvailability).length > 0) {
    const dayAvailability = weeklyAvailability[dayName];
    return dayAvailability && dayAvailability.available;
  }
  
  // Fallback to old availability array format
  if (oldAvailability && oldAvailability.length > 0) {
    const dayNamesOld = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNameOld = dayNamesOld[dayOfWeek];
    return oldAvailability.includes(dayNameOld);
  }
  
  // If no availability data, assume all days are available
  return true;
};

// Helper function to generate available dates for the next 365 days
const generateAvailableDates = (weeklyAvailability: any, oldAvailability: string[]): Set<string> => {
  const availableDates = new Set<string>();
  const today = new Date();
  const oneYearFromNow = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
  
  for (let date = new Date(today); date <= oneYearFromNow; date.setDate(date.getDate() + 1)) {
    if (isDateAvailable(date, weeklyAvailability, oldAvailability)) {
      availableDates.add(formatDate(date));
    }
  }
  
  return availableDates;
};

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookingType,
  venue,
  user,
  selectedDate,
  setSelectedDate,
  dailyGuests,
  setDailyGuests,
  dailySpecialRequests,
  setDailySpecialRequests,
  handleSlotBookingSubmit,
  navigate,
}) => {
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Use dynamic slots hook for hourly/both booking
  const { slots: availableSlots, isLoading: loading, error } = useDynamicSlots({
    venueId: venue?.id,
    date: selectedDate || ''
  });

  // Generate available dates based on venue's weekly availability
  useEffect(() => {
    if (venue) {
      const weeklyAvailability = venue.weekly_availability || {};
      const oldAvailability = venue.availability || [];
      const availableDatesSet = generateAvailableDates(weeklyAvailability, oldAvailability);
      setAvailableDates(availableDatesSet);
      
      // Debug log for availability calculation
      console.log('Venue availability debug:', {
        venueName: venue.venue_name,
        weeklyAvailability,
        oldAvailability,
        availableDatesCount: availableDatesSet.size,
        sampleAvailableDates: Array.from(availableDatesSet).slice(0, 10)
      });
    }
  }, [venue]);

  // Handle date selection with proper availability checking
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    
    // Prevent selection of past dates
    if (isPast) {
      alert('Cannot select past dates');
      return;
    }
    
    // Prevent selection of unavailable dates
    if (!availableDates.has(dateStr)) {
      alert('This date is not available for booking according to venue schedule');
      return;
    }

    if (bookingType === 'daily') {
      // For daily booking, allow multiple date selection
      setSelectedDates(prev => {
        if (prev.includes(dateStr)) {
          return prev.filter(d => d !== dateStr);
        } else {
          return [...prev, dateStr];
        }
      });
    } else {
      // For hourly booking, select single date
      setSelectedDate(dateStr);
      setCalendarOpen(false);
    }
  };

  // Handle slot selection for hourly booking (consecutive slots only)
  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        // Check if this slot can be added to maintain consecutive sequence
        const selectedIndices = prev.map(id => 
          availableSlots.findIndex(slot => slot.id === id)
        ).sort((a, b) => a - b);
        
        const newSlotIndex = availableSlots.findIndex(slot => slot.id === slotId);
        
        if (selectedIndices.length === 0) {
          // First slot selection
          return [slotId];
        }
        
        // Check if new slot is consecutive to existing selection
        const minIndex = Math.min(...selectedIndices);
        const maxIndex = Math.max(...selectedIndices);
        
        const isConsecutive = 
          newSlotIndex === minIndex - 1 || // Before the sequence
          newSlotIndex === maxIndex + 1;   // After the sequence
        
        if (!isConsecutive) {
          alert('Please select consecutive time slots only');
          return prev;
        }
        
        // Check maximum limit
        if (prev.length >= 5) {
          alert('You can select maximum 5 consecutive slots');
          return prev;
        }
        
        return [...prev, slotId];
      }
    });
  };

  // Calculate pricing
  const calculatePrice = () => {
    if (bookingType === 'daily') {
      const pricePerDay = venue.price_per_day || venue.daily_rate || 0;
      return selectedDates.length * pricePerDay;
    } else {
      const selectedSlotData = availableSlots.filter(slot => selectedSlots.includes(slot.id));
      return selectedSlotData.reduce((total, slot) => total + (slot.price ?? 0), 0);
    }
  };

  const venuePrice = calculatePrice();
  const platformFee = bookingType === 'daily' ? selectedDates.length * 35 : 35;
  const totalPrice = venuePrice + platformFee;

  // Handle booking submission
  const handleBooking = () => {
    // Check if user is authenticated
    if (!user || !user.id) {
      // Store current booking data for restoration after sign-in
      const bookingData = {
        venueId: venue.id,
        venueName: venue.venue_name || venue.name,
        selectedDate,
        selectedDates,
        selectedSlots,
        dailyGuests,
        dailySpecialRequests,
        bookingType,
        returnUrl: window.location.pathname
      };
      bookingRestorationService.storePendingBooking(bookingData);
      setShowSignInModal(true);
      return;
    }

    if (bookingType === 'daily') {
      if (selectedDates.length === 0) {
        alert('Please select at least one date');
        return;
      }
      
      const payload = {
        venueId: venue.id,
        venueName: venue.venue_name || venue.name,
        userId: user.id,
        eventDates: selectedDates,
        eventDate: selectedDates[0], // Primary date for payment page
        guestCount: dailyGuests.toString(),
        specialRequests: dailySpecialRequests,
        venueAmount: String(venuePrice * 100), // Convert to paisa as string
        platformFee: String(platformFee * 100), // Convert to paisa as string
        totalAmount: String(totalPrice * 100), // Convert to paisa as string
        bookingType: 'daily',
        slot_ids: [], // Empty for daily bookings
        startTime: '00:00:00',
        endTime: '23:59:59',
      };
      
      localStorage.setItem('pendingBooking', JSON.stringify(payload));
      navigate('/payment');
    } else {
      if (!selectedDate || selectedSlots.length === 0) {
        alert('Please select a date and at least one time slot');
        return;
      }

      const selectedSlotData = availableSlots.filter(slot => selectedSlots.includes(slot.id));
      const startTime = selectedSlotData[0]?.startTime;
      const endTime = selectedSlotData[selectedSlotData.length - 1]?.endTime;

      const payload = {
        venueId: venue.id,
        venueName: venue.venue_name || venue.name,
        userId: user.id,
        eventDates: [selectedDate],
        eventDate: selectedDate,
        startTime,
        endTime,
        guestCount: dailyGuests.toString(),
        specialRequests: dailySpecialRequests,
        venueAmount: String(venuePrice * 100), // Convert to paisa as string
        platformFee: String(platformFee * 100), // Convert to paisa as string
        totalAmount: String(totalPrice * 100), // Convert to paisa as string
        bookingType: 'hourly',
        slot_ids: selectedSlots,
      };

      localStorage.setItem('pendingBooking', JSON.stringify(payload));
      navigate('/payment');
    }
  };

  // Calendar tile styling with distinct classes to prevent conflicts
  const getTileClassName = ({ date }: { date: Date }) => {
    const dateStr = formatDate(date);
    const isToday = dateStr === formatDate(new Date());
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const isAvailable = availableDates.has(dateStr);

    const isSelected = bookingType === 'daily' 
      ? selectedDates.includes(dateStr)
      : selectedDate === dateStr;

    // Debug log for specific date (date 27)
    if (dateStr.includes('2024-12-27')) {
      console.log('Date 27 debug:', {
        dateStr,
        isToday,
        isPast,
        isAvailable,
        isSelected,
        availableDatesSize: availableDates.size,
        selectedDate,
        selectedDates
      });
    }

    let classes = 'venue-calendar-tile text-sm font-medium ';

    // Handle past dates first
    if (isPast) {
      classes += 'venue-calendar-past opacity-40 cursor-not-allowed bg-gray-50 text-gray-400 ';
    }
    // Handle unavailable dates (not in availableDates set)
    else if (!isAvailable) {
      classes += 'venue-calendar-unavailable bg-red-50 text-red-600 cursor-not-allowed border border-red-200 ';
    }
    // Handle selected dates (only if they are available)
    else if (isSelected && isAvailable) {
      classes += 'venue-calendar-selected bg-blue-600 text-white font-bold border-2 border-blue-700 shadow-md ';
    }
    // Handle available dates (not selected)
    else if (isAvailable) {
      classes += 'venue-calendar-available bg-green-50 text-green-700 cursor-pointer hover:bg-green-100 border border-green-200 hover:border-green-300 ';
    }
    // Fallback for any edge cases
    else {
      classes += 'venue-calendar-default bg-gray-100 text-gray-600 cursor-not-allowed ';
    }

    // Add today indicator
    if (isToday) {
      classes += 'venue-calendar-today ring-2 ring-blue-400 ring-opacity-50 ';
    }

    return classes;
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg border p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="mb-4 text-center">
        <h3 className="text-lg font-semibold text-gray-800">Book {venue.venue_name || venue.name}</h3>
        <p className="text-sm text-gray-600">
          {bookingType === 'daily' ? 'Daily' : bookingType === 'hourly' ? 'Hourly' : 'Flexible'} Booking
        </p>
        <p className="text-lg font-bold text-green-600 mt-1">
          ₹{bookingType === 'daily' ? venue.price_per_day || venue.daily_rate : venue.price_per_hour || venue.hourly_rate}
          <span className="text-sm font-normal"> per {bookingType === 'daily' ? 'day' : 'hour'}</span>
        </p>
      </div>

      {/* Date Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {bookingType === 'daily' ? 'Select Dates' : 'Select Date'}
        </label>
        
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-start text-left"
              onClick={() => setCalendarOpen(true)}
            >
              {bookingType === 'daily' ? (
                selectedDates.length > 0 
                  ? `${selectedDates.length} date(s) selected`
                  : 'Pick dates'
              ) : (
                selectedDate 
                  ? new Date(selectedDate).toLocaleDateString()
                  : 'Pick a date'
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="venue-calendar-container">
              <ReactCalendar
                onClickDay={handleDateClick}
                tileClassName={getTileClassName}
                minDate={new Date()}
                maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year ahead
              />
            </div>
            
            {/* Calendar Legend */}
            <div className="p-3 border-t">
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-50 border border-green-200"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 border border-blue-700"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-50 border border-red-200"></div>
                  <span>Unavailable</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-gray-50 border border-gray-200"></div>
                  <span>Past</span>
                </div>
              </div>
            </div>

            {/* Action buttons for daily booking */}
            {bookingType === 'daily' && (
              <div className="flex gap-2 p-3 border-t">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setSelectedDates([])}
                >
                  Clear
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => setCalendarOpen(false)}
                >
                  Done
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slots for Hourly Booking */}
      {(bookingType === 'hourly' || bookingType === 'both') && selectedDate && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Time Slots
            <span className="block text-xs text-gray-500 font-normal mt-1">
              Select consecutive time slots (max 5 slots)
            </span>
          </label>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading slots...</p>
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 text-center py-4">Error loading slots: {typeof error === 'string' ? error : (error && (error as any).message) || 'Unknown error'}</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No slots available for this date
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableSlots.map((slot, index) => {
                const isSelected = selectedSlots.includes(slot.id);
                
                // Check if this slot is selectable (consecutive)
                const isSelectable = (() => {
                  if (selectedSlots.length === 0) return true; // First slot
                  if (isSelected) return true; // Already selected
                  
                  const selectedIndices = selectedSlots.map(id => 
                    availableSlots.findIndex(s => s.id === id)
                  ).sort((a, b) => a - b);
                  
                  const minIndex = Math.min(...selectedIndices);
                  const maxIndex = Math.max(...selectedIndices);
                  
                  return index === minIndex - 1 || index === maxIndex + 1;
                })();
                
                return (
                  <Button
                    key={slot.id}
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => handleSlotToggle(slot.id)}
                    disabled={!isSelectable && selectedSlots.length > 0}
                    className={`text-xs ${
                      isSelected 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : isSelectable 
                          ? 'hover:bg-blue-50' 
                          : 'opacity-50 cursor-not-allowed bg-gray-100'
                    }`}
                  >
                    {formatTime(slot.startTime)}
                    <br />
                    ₹{slot.price}
                  </Button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Guest Count */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Guests
        </label>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDailyGuests(Math.max(1, dailyGuests - 1))}
            disabled={dailyGuests <= 1}
          >
            -
          </Button>
          <span className="font-medium text-center min-w-[2rem]">{dailyGuests}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDailyGuests(
              venue.capacity ? Math.min(venue.capacity, dailyGuests + 1) : dailyGuests + 1
            )}
            disabled={venue.capacity && dailyGuests >= venue.capacity}
          >
            +
          </Button>
        </div>
        {venue.capacity && (
          <p className="text-xs text-gray-500 mt-1">
            Maximum {venue.capacity} guests
          </p>
        )}
      </div>

      {/* Special Requests */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Special Requests (Optional)
        </label>
        <textarea
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
          rows={3}
          placeholder="Any special requirements..."
          value={dailySpecialRequests}
          onChange={(e) => setDailySpecialRequests(e.target.value)}
        />
      </div>

      {/* Selected Summary for Daily Booking */}
      {bookingType === 'daily' && selectedDates.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-1">Selected Dates:</h4>
          <div className="text-xs text-blue-800">
            {selectedDates.map(date => (
              <div key={date}>{new Date(date).toLocaleDateString()}</div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      <div className="border-t pt-4 mb-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Venue Price</span>
            <span>₹{venuePrice}</span>
          </div>
          <div className="flex justify-between">
            <span>Platform Fee</span>
            <span>₹{platformFee}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-2">
            <span>Total</span>
            <span>₹{totalPrice}</span>
          </div>
        </div>
      </div>

      {/* Book Button */}
      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3"
        onClick={handleBooking}
        disabled={
          (bookingType === 'daily' && selectedDates.length === 0) ||
          (bookingType !== 'daily' && (!selectedDate || selectedSlots.length === 0))
        }
      >
        Book Now - ₹{totalPrice}
      </Button>

      {/* Booking Type Info */}
      <div className="mt-3 text-xs text-gray-500 text-center">
        {bookingType === 'daily' && 'Select multiple dates for daily booking'}
        {bookingType === 'hourly' && 'Select date and time slots for hourly booking'}
        {bookingType === 'both' && 'Flexible booking - select date and optional time slots'}
      </div>
          </div>

      {/* Sign In Modal */}
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSuccess={() => {
          setShowSignInModal(false);
          // After successful sign-in, proceed with booking
          handleBooking();
        }}
        title="Sign In to Book"
        message="Please sign in to complete your venue booking."
      />
    </>
  );
};

export default BookingCalendar; 
