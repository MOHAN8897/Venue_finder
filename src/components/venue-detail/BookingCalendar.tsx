import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Fetch available dates for the venue
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!venue?.id) return;

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 365); // 1 year ahead

      const { data, error } = await supabase
        .from('venue_slots')
        .select('date')
        .eq('venue_id', venue.id)
        .eq('available', true)
        .is('booked_by', null)
        .gte('date', formatDate(today))
        .lte('date', formatDate(futureDate));

      if (!error && data) {
        const dates = new Set(data.map((slot: any) => slot.date));
        setAvailableDates(dates);
      }
    };

    fetchAvailableDates();
  }, [venue?.id]);

  // Fetch available slots for selected date (for hourly booking)
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !venue?.id || bookingType === 'daily') return;

      setLoading(true);
      const { data, error } = await supabase
        .from('venue_slots')
        .select('*')
        .eq('venue_id', venue.id)
        .eq('date', selectedDate)
        .eq('available', true)
        .is('booked_by', null)
        .order('start_time');

      if (!error && data) {
        setAvailableSlots(data);
      }
      setLoading(false);
    };

    fetchAvailableSlots();
  }, [selectedDate, venue?.id, bookingType]);

  // Handle date selection
  const handleDateClick = (date: Date) => {
    const dateStr = formatDate(date);
    
    if (!availableDates.has(dateStr)) {
      alert('This date is not available for booking');
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

  // Handle slot selection for hourly booking
  const handleSlotToggle = (slotId: string) => {
    setSelectedSlots(prev => {
      if (prev.includes(slotId)) {
        return prev.filter(id => id !== slotId);
      } else {
        // For hourly booking, limit to 5 consecutive slots
        const newSelection = [...prev, slotId];
        if (newSelection.length > 5) {
          alert('You can select maximum 5 slots');
          return prev;
        }
        return newSelection;
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
      return selectedSlotData.reduce((total, slot) => total + slot.price, 0);
    }
  };

  const venuePrice = calculatePrice();
  const platformFee = bookingType === 'daily' ? selectedDates.length * 35 : 35;
  const totalPrice = venuePrice + platformFee;

  // Handle booking submission
  const handleBooking = () => {
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
      const startTime = selectedSlotData[0]?.start_time;
      const endTime = selectedSlotData[selectedSlotData.length - 1]?.end_time;

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

  // Calendar tile styling
  const getTileClassName = ({ date }: { date: Date }) => {
    const dateStr = formatDate(date);
    const isToday = dateStr === formatDate(new Date());
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const isAvailable = availableDates.has(dateStr);
    const isSelected = bookingType === 'daily' 
      ? selectedDates.includes(dateStr)
      : selectedDate === dateStr;

    let classes = 'text-sm ';

    if (isPast) {
      classes += 'opacity-40 cursor-not-allowed ';
    } else if (isSelected && isAvailable) {
      classes += 'bg-blue-500 text-white font-bold ';
    } else if (isAvailable) {
      classes += 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 ';
    } else {
      classes += 'bg-red-100 text-red-600 cursor-not-allowed ';
    }

    if (isToday) {
      classes += 'ring-2 ring-blue-400 ';
    }

    return classes;
  };

  return (
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
            <ReactCalendar
              onClickDay={handleDateClick}
              tileClassName={getTileClassName}
              minDate={new Date()}
              maxDate={new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)} // 1 year ahead
            />
            
            {/* Calendar Legend */}
            <div className="p-3 border-t">
              <div className="flex flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-100 border"></div>
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 border"></div>
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-100 border"></div>
                  <span>Unavailable</span>
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
          </label>
          
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Loading slots...</p>
            </div>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              No slots available for this date
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.id}
                  size="sm"
                  variant={selectedSlots.includes(slot.id) ? 'default' : 'outline'}
                  onClick={() => handleSlotToggle(slot.id)}
                  className={`text-xs ${
                    selectedSlots.includes(slot.id) 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'hover:bg-blue-50'
                  }`}
                >
                  {formatTime(slot.start_time)}
                  <br />
                  ₹{slot.price}
                </Button>
              ))}
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
  );
};

export default BookingCalendar; 
