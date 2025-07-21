import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, Users, DollarSign, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, addDays, isSameDay, parseISO, startOfDay } from 'date-fns';

interface HourlyBookingCalendarProps {
  venueId: string;
  venueName: string;
  pricePerHour: number;
  capacity?: number;
  rating?: number;
  reviewCount?: number;
  onBookingSubmit?: (bookingData: BookingData) => void;
}

interface BookingData {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  guests: number;
  totalPrice: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

const HourlyBookingCalendar: React.FC<HourlyBookingCalendarProps> = ({
  venueId,
  venueName,
  pricePerHour,
  capacity = 0,
  rating = 0,
  reviewCount = 0,
  onBookingSubmit
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [guests, setGuests] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time,
        available: Math.random() > 0.3, // Simulate availability
        price: pricePerHour
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate end time based on start time and duration
  const getEndTime = (startTime: string, duration: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = hours + duration;
    return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Check if time slot is available for selected duration
  const isTimeSlotAvailable = (startTime: string, duration: number): boolean => {
    const startIndex = timeSlots.findIndex(slot => slot.time === startTime);
    if (startIndex === -1) return false;
    
    // Check if all required slots are available
    for (let i = 0; i < duration; i++) {
      if (startIndex + i >= timeSlots.length || !timeSlots[startIndex + i].available) {
        return false;
      }
    }
    return true;
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    return pricePerHour * selectedDuration;
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedStartTime) {
      alert('Please select a date and start time');
      return;
    }

    if (!isTimeSlotAvailable(selectedStartTime, selectedDuration)) {
      alert('Selected time slot is not available');
      return;
    }

    setIsLoading(true);

    const bookingData: BookingData = {
      date: selectedDate,
      startTime: selectedStartTime,
      endTime: getEndTime(selectedStartTime, selectedDuration),
      duration: selectedDuration,
      guests,
      totalPrice: calculateTotalPrice()
    };

    try {
      if (onBookingSubmit) {
        await onBookingSubmit(bookingData);
      } else {
        // Default behavior - navigate to booking page
        window.open(`/book/${venueId}?date=${selectedDate.toISOString()}&startTime=${selectedStartTime}&duration=${selectedDuration}&guests=${guests}`, '_blank');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to process booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get available time slots for selected date
  const getAvailableTimeSlots = (): TimeSlot[] => {
    return timeSlots.filter(slot => 
      isTimeSlotAvailable(slot.time, selectedDuration)
    );
  };

  const availableSlots = getAvailableTimeSlots();

  return (
    <Card className="w-full max-w-md mx-auto lg:max-w-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Book This Venue
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
          <p className="text-sm text-gray-600 mt-1">Minimum 2 hours booking</p>
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
                disabled={(date) => date < startOfDay(new Date())}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Duration Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Duration</label>
          <Select value={selectedDuration.toString()} onValueChange={(value) => setSelectedDuration(Number(value))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2, 3, 4, 5, 6, 8, 10, 12].map(hours => (
                <SelectItem key={hours} value={hours.toString()}>
                  {hours} hour{hours > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Slot Selection */}
        {selectedDate && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Available Times ({selectedDuration}h slots)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {availableSlots.map((slot) => (
                <Button
                  key={slot.time}
                  variant={selectedStartTime === slot.time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStartTime(slot.time)}
                  className="h-12 text-sm relative"
                  disabled={!slot.available}
                >
                  {slot.time}
                  {selectedStartTime === slot.time && (
                    <Check className="h-3 w-3 absolute top-1 right-1" />
                  )}
                </Button>
              ))}
            </div>
            {availableSlots.length === 0 && (
              <div className="text-center py-6">
                <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  No available slots for {selectedDuration} hour{selectedDuration > 1 ? 's' : ''} on this date
                </p>
                <p className="text-xs text-gray-400 mt-1">Try a different date or duration</p>
              </div>
            )}
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
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex-1 text-center font-medium">{guests}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setGuests(guests + 1)}
              disabled={capacity > 0 && guests >= capacity}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {capacity > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Maximum {capacity} guests
            </p>
          )}
        </div>

        {/* Booking Summary */}
        {selectedDate && selectedStartTime && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-blue-900">Booking Summary</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(selectedDate, 'PPP')}</span>
              </div>
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{selectedStartTime} - {getEndTime(selectedStartTime, selectedDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span>Duration:</span>
                <span>{selectedDuration} hour{selectedDuration > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span>Guests:</span>
                <span>{guests}</span>
              </div>
              <div className="border-t border-blue-200 pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{calculateTotalPrice().toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Book Now Button */}
        <Button
          onClick={handleBookingSubmit}
          disabled={!selectedDate || !selectedStartTime || isLoading || availableSlots.length === 0}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </div>
          ) : (
            `Book Now - ₹${calculateTotalPrice().toLocaleString()}`
          )}
        </Button>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• Free cancellation up to 24 hours before booking</p>
          <p>• Instant confirmation</p>
          <p>• Secure payment processing</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default HourlyBookingCalendar; 