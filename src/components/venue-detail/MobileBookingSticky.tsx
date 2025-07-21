import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronUp, ChevronDown, CalendarIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, addDays, isSameDay, startOfDay } from 'date-fns';

interface MobileBookingStickyProps {
  venueId: string;
  venueName: string;
  pricePerHour: number;
  capacity?: number;
  onBookingSubmit?: (bookingData: any) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
}

const MobileBookingSticky: React.FC<MobileBookingStickyProps> = ({
  venueId,
  venueName,
  pricePerHour,
  capacity = 0,
  onBookingSubmit
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<number>(2);
  const [guests, setGuests] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<'collapsed' | 'quick' | 'detailed'>('collapsed');

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

  // Get available time slots for selected date
  const getAvailableTimeSlots = (): TimeSlot[] => {
    return timeSlots.filter(slot => 
      isTimeSlotAvailable(slot.time, selectedDuration)
    );
  };

  const calculateTotalPrice = (): number => {
    return pricePerHour * selectedDuration;
  };

  const handleQuickBook = () => {
    setCurrentStep('quick');
    setIsExpanded(true);
  };

  const handleDetailedBook = () => {
    setCurrentStep('detailed');
    setIsExpanded(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || !selectedStartTime) {
      alert('Please select a date and start time');
      return;
    }

    if (!isTimeSlotAvailable(selectedStartTime, selectedDuration)) {
      alert('Selected time slot is not available');
      return;
    }

    const bookingData = {
      venueId,
      date: selectedDate,
      startTime: selectedStartTime,
      duration: selectedDuration,
      guests,
      totalPrice: calculateTotalPrice()
    };

    if (onBookingSubmit) {
      await onBookingSubmit(bookingData);
    } else {
      // Default behavior - navigate to booking page
      window.open(`/book/${venueId}?date=${selectedDate.toISOString()}&startTime=${selectedStartTime}&duration=${selectedDuration}&guests=${guests}`, '_blank');
    }
  };

  const availableSlots = getAvailableTimeSlots();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      <Card className="rounded-t-xl border-t-2 border-gray-200 shadow-lg">
        <CardContent className="p-4">
          {/* Collapsed State */}
          {currentStep === 'collapsed' && (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">
                    ₹{pricePerHour.toLocaleString()}
                  </span>
                  <span className="text-gray-600">per hour</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{venueName}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQuickBook}
                  className="flex items-center gap-1"
                >
                  <ChevronUp className="h-4 w-4" />
                  Quick
                </Button>
                <Button
                  onClick={handleDetailedBook}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Book Now
                </Button>
              </div>
            </div>
          )}

          {/* Quick Booking State */}
          {currentStep === 'quick' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Quick Book</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentStep('collapsed');
                    setIsExpanded(false);
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Duration Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[2, 3, 4, 6].map(hours => (
                    <Button
                      key={hours}
                      variant={selectedDuration === hours ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDuration(hours)}
                      className="text-xs h-10"
                    >
                      {hours}h
                    </Button>
                  ))}
                </div>
              </div>

              {/* Guest Count */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Guests</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="h-10 w-10"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <span className="flex-1 text-center font-medium text-lg">{guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(capacity > 0 ? Math.min(capacity, guests + 1) : guests + 1)}
                    disabled={capacity > 0 && guests >= capacity}
                    className="h-10 w-10"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                </div>
                {capacity > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    Maximum {capacity} guests
                  </p>
                )}
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Total for {selectedDuration} hour{selectedDuration > 1 ? 's' : ''}</p>
                    <p className="text-xs text-gray-500">{guests} guest{guests > 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-600">
                      ₹{calculateTotalPrice().toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">₹{pricePerHour.toLocaleString()}/hour</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep('collapsed');
                    setIsExpanded(false);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setCurrentStep('detailed')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Select Time
                </Button>
              </div>
            </div>
          )}

          {/* Detailed Booking State */}
          {currentStep === 'detailed' && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
                <h3 className="font-semibold text-lg">Select Date & Time</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setCurrentStep('collapsed');
                    setIsExpanded(false);
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>

              {/* Date Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      disabled={(date) => date < startOfDay(new Date())}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Slot Selection */}
              {selectedDate && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Times ({selectedDuration}h slots)
                  </label>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
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
                      <span>{selectedStartTime} - {`${(parseInt(selectedStartTime) + selectedDuration).toString().padStart(2, '0')}:00`}</span>
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

              {/* Action Buttons */}
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('quick')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleBookingSubmit}
                  disabled={!selectedDate || !selectedStartTime || availableSlots.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Confirm Booking
                </Button>
              </div>

              {/* Quick Info */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Free cancellation up to 24 hours</p>
                <p>• Instant confirmation</p>
                <p>• Secure payment processing</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileBookingSticky; 