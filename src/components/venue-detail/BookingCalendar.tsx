import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

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

// Helper to format a Date as YYYY-MM-DD in local time
function formatLocalYMD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
  bookingType,
  venue,
  user,
  bookedDates,
  selectedDate,
  setSelectedDate,
  dailyGuests,
  setDailyGuests,
  dailySpecialRequests,
  setDailySpecialRequests,
  handleSlotBookingSubmit,
  navigate,
}) => {
  // State for hourly/both
  const [dateStatusMap, setDateStatusMap] = useState<Record<string, 'available' | 'partial' | 'booked' | 'pending'>>({});
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<any[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  // Fetch date statuses for hourly/both and daily
  useEffect(() => {
    const fetchDateStatuses = async () => {
      const today = new Date();
      const end = new Date();
      end.setDate(today.getDate() + 30);
      const { data, error } = await supabase
        .from('venue_slots')
        .select('date, status')
        .eq('venue_id', venue.id)
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);
      if (error) return setDateStatusMap({});
      const byDate: Record<string, { total: number, available: number, booked: number, pending: number }> = {};
      (data || []).forEach((row: any) => {
        if (!byDate[row.date]) byDate[row.date] = { total: 0, available: 0, booked: 0, pending: 0 };
        byDate[row.date].total++;
        if (row.status === 'available') byDate[row.date].available++;
        else if (row.status === 'booked') byDate[row.date].booked++;
        else if (row.status === 'pending') byDate[row.date].pending++;
      });
      const statusMap: Record<string, 'available' | 'partial' | 'booked' | 'pending'> = {};
      Object.entries(byDate).forEach(([date, info]) => {
        if (bookingType === 'daily') {
          if (info.booked === info.total) statusMap[date] = 'booked';
          else if (info.pending > 0) statusMap[date] = 'pending';
          else statusMap[date] = 'available';
        } else {
          if (info.booked === info.total) statusMap[date] = 'booked';
          else if (info.available === info.total) statusMap[date] = 'available';
          else if (info.pending > 0 && info.booked + info.pending === info.total) statusMap[date] = 'pending';
          else statusMap[date] = 'partial';
        }
      });
      setDateStatusMap(statusMap);
    };
    fetchDateStatuses();
  }, [venue.id, bookingType]);

  // Fetch slots for selected date (hourly/both)
  useEffect(() => {
    if ((bookingType === 'hourly' || bookingType === 'both') && selectedDate) {
      setFetchingSlots(true);
      supabase
        .from('venue_slots')
        .select('id, time: start_time, status, pending_until, price')
        .eq('venue_id', venue.id)
        .eq('date', selectedDate)
        .then(({ data, error }) => {
          if (error) setAvailableSlots([]);
          else setAvailableSlots((data || []).map((slot: any) => ({ ...slot, selected: false })));
        })
        .finally(() => setFetchingSlots(false));
    }
  }, [venue.id, bookingType, selectedDate]);

  // Add a useEffect to refetch slots after booking/payment attempt
  useEffect(() => {
    // Optionally, refetch slots after a booking/payment attempt to ensure UI is up-to-date
    // This can be triggered by a prop or context change (e.g., bookingSuccess)
    // For now, refetch when selectedDate changes (already handled), but you can add a dependency if needed
  }, [selectedDate]);

  // Handle slot selection
  const handleSlotToggle = (slotTime: string) => {
    const slotIndex = availableSlots.findIndex(slot => slot.time === slotTime);
    if (slotIndex === -1) return;
    const selectedIndices = availableSlots
      .map((slot, idx) => (slot.selected ? idx : -1))
      .filter(idx => idx !== -1);
    if (selectedIndices.length === 0) {
      const updatedSlots = availableSlots.map((slot, idx) => ({ ...slot, selected: idx === slotIndex }));
      setAvailableSlots(updatedSlots);
      setSelectedSlots([availableSlots[slotIndex]]);
      return;
    }
    if (availableSlots[slotIndex].selected) {
      const updatedSlots = availableSlots.map((slot, idx) => ({ ...slot, selected: idx === slotIndex ? false : slot.selected }));
      setAvailableSlots(updatedSlots);
      setSelectedSlots(updatedSlots.filter(slot => slot.selected));
      return;
    }
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

  // Save booking to localStorage and go to payment
  const handleMakePayment = () => {
    if (!selectedDate) return alert('Please select a date.');
    if ((bookingType === 'hourly' || bookingType === 'both') && selectedSlots.length === 0) return alert('Please select at least one slot.');
    const slotIds = (bookingType === 'hourly' || bookingType === 'both') ? selectedSlots.map(slot => slot.id) : [];
    const venueAmount = bookingType === 'daily'
      ? (venue.price_per_day || venue.daily_rate || 0) * 100
      : selectedSlots.length * (venue.price_per_hour || venue.hourly_rate || 0) * 100;
    const bookingPayload = {
      venueId: venue.id,
      userId: user.id,
      eventDate: selectedDate,
      startTime: (bookingType === 'hourly' || bookingType === 'both') ? selectedSlots[0]?.time || '' : '',
      endTime: (bookingType === 'hourly' || bookingType === 'both') ? selectedSlots[selectedSlots.length - 1]?.time || '' : '',
      guestCount: dailyGuests,
      specialRequests: dailySpecialRequests,
      venueAmount,
      platformFee: 35 * 100,
      bookingType,
      slot_ids: slotIds,
    };
    localStorage.setItem('pendingBooking', JSON.stringify(bookingPayload));
    navigate('/payment');
  };

  // Price breakdown
  const venuePrice = bookingType === 'daily'
    ? (venue.price_per_day || venue.daily_rate || 0)
    : selectedSlots.length * (venue.price_per_hour || venue.hourly_rate || 0);
  const platformFee = 35;
  const total = venuePrice + platformFee;

  return (
    <div className="relative max-w-xs mx-auto w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-blue-100">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-green-700">₹{bookingType === 'daily' ? (venue.price_per_day || venue.daily_rate || 0) : (venue.price_per_hour || venue.hourly_rate || 0)}</span>
          <span className="text-gray-600 font-medium text-sm">{bookingType === 'daily' ? 'per day' : 'per hour'}</span>
        </div>
        <span className="bg-green-100 text-green-700 text-xs font-semibold px-2 py-1 rounded-full">Best Price</span>
      </div>
      <div className="flex-1 px-4 py-2 space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
            <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> Select Date
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <span className="mr-2">{selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Pick a date'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate ? new Date(selectedDate) : undefined}
                onSelect={date => {
                  if (!date) return setSelectedDate(undefined);
                  // Use local date string to avoid timezone issues
                  setSelectedDate(formatLocalYMD(date));
                }}
                disabled={date => {
                  if (bookingType === 'daily') return bookedDates.has(date.toISOString().split('T')[0]);
                  const ymd = date.toISOString().split('T')[0];
                  return dateStatusMap[ymd] === 'booked' || !dateStatusMap[ymd];
                }}
                modifiers={{
                  available: (date: Date) => {
                    const ymd = date.toISOString().split('T')[0];
                    return bookingType === 'daily'
                      ? !bookedDates.has(ymd) && dateStatusMap[ymd] === 'available'
                      : dateStatusMap[ymd] === 'available';
                  },
                  booked: (date: Date) => {
                    const ymd = date.toISOString().split('T')[0];
                    return bookingType === 'daily'
                      ? bookedDates.has(ymd) || dateStatusMap[ymd] === 'booked'
                      : dateStatusMap[ymd] === 'booked';
                  },
                  pending: (date: Date) => {
                    const ymd = date.toISOString().split('T')[0];
                    return dateStatusMap[ymd] === 'pending';
                  },
                  partial: (date: Date) => {
                    const ymd = date.toISOString().split('T')[0];
                    return dateStatusMap[ymd] === 'partial';
                  },
                }}
                modifiersClassNames={{
                  available: 'bg-blue-200 text-blue-900 font-bold border-blue-400 border-2',
                  partial: 'bg-yellow-200 text-yellow-900 font-bold border-yellow-400 border-2',
                  booked: 'bg-red-200 text-red-900 font-bold border-red-400 border-2 opacity-60',
                  pending: 'bg-gray-300 text-gray-600',
                }}
                className="p-1 max-w-xs rounded-xl shadow-md"
                classNames={{
                  cell: 'h-7 w-7 text-xs rounded-lg transition-all duration-150',
                  day: 'h-7 w-7 p-0 text-xs rounded-lg hover:bg-yellow-100 hover:text-yellow-900 transition-all duration-150',
                  day_selected: 'bg-yellow-300 text-yellow-900 font-bold border-yellow-500 border-2',
                  month: 'space-y-2',
                  caption: 'pt-0 pb-1',
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Slot selection for hourly/both */}
        {(bookingType === 'hourly' || bookingType === 'both') && selectedDate && (
          <div className="space-y-2 mt-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Time Slots</label>
            {fetchingSlots && (
              <div className="flex justify-center items-center py-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-blue-600 text-xs">Loading slots...</span>
              </div>
            )}
            <div className="grid grid-cols-3 gap-1 max-h-40 overflow-y-auto sm:grid-cols-4 sm:gap-2">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={slot.selected ? "default" : slot.status === 'available' ? "outline" : slot.status === 'pending' ? "secondary" : "destructive"}
                  size="sm"
                  onClick={() => slot.status === 'available' && handleSlotToggle(slot.time)}
                  className={`h-8 text-xs relative ${slot.status === 'pending' ? 'bg-gray-300 text-gray-600' : slot.status === 'booked' ? 'bg-red-200 text-red-700' : ''}`}
                  disabled={slot.status !== 'available'}
                >
                  {slot.time}
                  {slot.selected && (
                    <span className="absolute top-0.5 right-1 text-green-600">✔</span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
            <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg> Number of Guests
          </label>
          <div className="flex items-center gap-2 mt-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDailyGuests(Math.max(1, dailyGuests - 1))}
              disabled={dailyGuests <= 1}
            >-</Button>
            <span className="flex-1 text-center font-medium text-sm">{dailyGuests}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDailyGuests(venue.capacity ? Math.min(venue.capacity, dailyGuests + 1) : dailyGuests + 1)}
              disabled={venue.capacity ? dailyGuests >= venue.capacity : false}
            >+</Button>
          </div>
          {venue.capacity && (
            <p className="text-xs text-gray-500 text-center">Maximum {venue.capacity} guests</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
            <svg className="h-3 w-3 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg> Special Requests
          </label>
          <textarea
            className="border rounded px-2 py-1 w-full mt-1 text-xs"
            rows={2}
            placeholder="Any special requests? (optional)"
            value={dailySpecialRequests}
            onChange={e => setDailySpecialRequests(e.target.value)}
          />
        </div>
      </div>
      {/* Price breakdown and Book Now button */}
      <div className="border-t border-gray-200 px-4 py-2 bg-white">
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="font-medium text-gray-700">Venue Price</span>
          <span className="font-semibold text-gray-900">₹{venuePrice}</span>
        </div>
        <div className="flex items-center justify-between mb-1 text-xs">
          <span className="font-medium text-gray-700">Platform Fee</span>
          <span className="font-semibold text-gray-900">₹{platformFee}</span>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 pt-1 mb-2 text-sm">
          <span className="font-bold text-blue-900">Total</span>
          <span className="font-bold text-blue-900">₹{total}</span>
        </div>
        <Button
          onClick={handleMakePayment}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold text-base py-2 rounded-xl shadow-lg mt-2"
        >
          Book Now - ₹{total}/{bookingType === 'daily' ? 'day' : 'hour'}
        </Button>
      </div>
      {/* Legend for color codes */}
      <div className="flex flex-wrap gap-2 mt-2 text-xs items-center">
        <span className="inline-block w-4 h-4 bg-blue-200 border-blue-400 border-2 rounded mr-1"></span> Available
        <span className="inline-block w-4 h-4 bg-yellow-200 border-yellow-400 border-2 rounded mr-1"></span> Partially Booked
        <span className="inline-block w-4 h-4 bg-red-200 border-red-400 border-2 rounded mr-1"></span> Booked
        <span className="inline-block w-4 h-4 bg-gray-300 border-gray-400 border-2 rounded mr-1"></span> Pending
      </div>
    </div>
  );
};

export default BookingCalendar; 