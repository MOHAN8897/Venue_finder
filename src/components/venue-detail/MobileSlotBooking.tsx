import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronUp, ChevronDown, CalendarIcon, Check, X, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format, startOfDay } from 'date-fns';

interface MobileSlotBookingProps {
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
  selected: boolean;
}

const MobileSlotBooking: React.FC<MobileSlotBookingProps> = ({
  venueId,
  venueName,
  pricePerHour,
  capacity = 0,
  onBookingSubmit
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [guests, setGuests] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<'collapsed' | 'date' | 'slots' | 'summary'>('collapsed');

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time,
        available: Math.random() > 0.3, // Simulate availability
        price: pricePerHour,
        selected: false
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Handle slot selection/deselection
  const handleSlotToggle = (slotTime: string) => {
    const updatedSlots = timeSlots.map(slot => {
      if (slot.time === slotTime) {
        return { ...slot, selected: !slot.selected };
      }
      return slot;
    });
    
    const selected = updatedSlots.filter(slot => slot.selected);
    setSelectedSlots(selected);
  };

  // Calculate total price
  const calculateTotalPrice = (): number => {
    return selectedSlots.length * pricePerHour;
  };

  // Clear all selections
  const clearSelections = () => {
    setSelectedSlots([]);
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

  const handleQuickBook = () => {
    setCurrentStep('date');
    setIsExpanded(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedDate || selectedSlots.length === 0) {
      alert('Please select a date and at least one time slot');
      return;
    }

    const bookingData = {
      venueId,
      date: selectedDate,
      selectedSlots,
      totalHours: selectedSlots.length,
      guests,
      totalPrice: calculateTotalPrice()
    };

    if (onBookingSubmit) {
      await onBookingSubmit(bookingData);
    } else {
      // Default behavior - navigate to booking page
      const slotTimes = selectedSlots.map(slot => slot.time).join(',');
      window.open(`/book/${venueId}?date=${selectedDate.toISOString()}&slots=${slotTimes}&guests=${guests}`, '_blank');
    }
  };

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
                  Book
                </Button>
                <Button
                  onClick={handleQuickBook}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Select Slots
                </Button>
              </div>
            </div>
          )}

          {/* Date Selection State */}
          {currentStep === 'date' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Select Date</h3>
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
                  onClick={() => setCurrentStep('slots')}
                  disabled={!selectedDate}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Slot Selection State */}
          {currentStep === 'slots' && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between sticky top-0 bg-white pb-2">
                <h3 className="font-semibold text-lg">Select Time Slots</h3>
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

              {/* Selected Date Display */}
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Booking for:</p>
                <p className="font-medium">{format(selectedDate!, 'PPP')}</p>
              </div>

              {/* Slot Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Time Slots
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
                
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {timeSlots.map((slot) => (
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

              {/* Selected Slots Summary */}
              {selectedSlots.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold text-blue-900">Selected Slots</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSlots.map((slot) => (
                      <Badge key={slot.time} variant="secondary" className="bg-blue-100 text-blue-800">
                        {slot.time}
                      </Badge>
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
                    className="h-10 w-10"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="flex-1 text-center font-medium text-lg">{guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(capacity > 0 ? Math.min(capacity, guests + 1) : guests + 1)}
                    disabled={capacity > 0 && guests >= capacity}
                    className="h-10 w-10"
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

              {/* Action Buttons */}
              <div className="flex gap-2 sticky bottom-0 bg-white pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('date')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setCurrentStep('summary')}
                  disabled={selectedSlots.length === 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Review
                </Button>
              </div>
            </div>
          )}

          {/* Summary State */}
          {currentStep === 'summary' && (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Booking Summary</h3>
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

              {/* Booking Summary */}
              <div className="bg-green-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-green-900">Booking Details</h4>
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
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{calculateTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep('slots')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleBookingSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  Confirm Booking
                </Button>
              </div>

              {/* Quick Info */}
              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Select multiple time slots for flexible booking</p>
                <p>• Free cancellation up to 24 hours</p>
                <p>• Instant confirmation</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileSlotBooking; 