import React, { useState } from 'react';
import { X, Calendar, Clock, Users, Check, Plus, Minus, CreditCard, ArrowLeft } from 'lucide-react';
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

interface MobileBookingModalProps {
  venueId: string;
  venueName: string;
  pricePerHour: number;
  capacity?: number;
  isOpen: boolean;
  onClose: () => void;
  onBookingSubmit?: (bookingData: any) => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
  price: number;
  selected: boolean;
}

type BookingStep = 'date' | 'slots' | 'guests' | 'summary' | 'payment';

const MobileBookingModal: React.FC<MobileBookingModalProps> = ({
  venueId,
  venueName,
  pricePerHour,
  capacity = 0,
  isOpen,
  onClose,
  onBookingSubmit
}) => {
  const [currentStep, setCurrentStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [guests, setGuests] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Handle payment
  const handlePayment = async () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      // Here you would integrate with Razorpay
      alert('Payment processed successfully!');
      onClose();
    }, 2000);
  };

  // Reset modal when closed
  const handleClose = () => {
    setCurrentStep('date');
    setSelectedSlots([]);
    setGuests(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      
      {/* Modal Content */}
      <div className="absolute inset-0 bg-white">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStep !== 'date' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentStep === 'slots') setCurrentStep('date');
                  else if (currentStep === 'guests') setCurrentStep('slots');
                  else if (currentStep === 'summary') setCurrentStep('guests');
                  else if (currentStep === 'payment') setCurrentStep('summary');
                }}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <h2 className="font-semibold text-lg">Book {venueName}</h2>
              <p className="text-sm text-gray-600">
                {currentStep === 'date' && 'Select Date'}
                {currentStep === 'slots' && 'Select Time Slots'}
                {currentStep === 'guests' && 'Number of Guests'}
                {currentStep === 'summary' && 'Booking Summary'}
                {currentStep === 'payment' && 'Payment'}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="h-full overflow-y-auto pb-20">
          {/* Date Selection Step */}
          {currentStep === 'date' && (
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Select Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal h-12"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
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

              <Button
                onClick={() => setCurrentStep('slots')}
                disabled={!selectedDate}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Continue to Time Slots
              </Button>
            </div>
          )}

          {/* Slot Selection Step */}
          {currentStep === 'slots' && (
            <div className="p-4 space-y-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Booking for:</p>
                <p className="font-medium">{format(selectedDate!, 'PPP')}</p>
              </div>

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
                      Clear All
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
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

              <Button
                onClick={() => setCurrentStep('guests')}
                disabled={selectedSlots.length === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Continue to Guests
              </Button>
            </div>
          )}

          {/* Guest Selection Step */}
          {currentStep === 'guests' && (
            <div className="p-4 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(Math.max(1, guests - 1))}
                    disabled={guests <= 1}
                    className="h-12 w-12"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="flex-1 text-center font-medium text-xl">{guests}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setGuests(capacity > 0 ? Math.min(capacity, guests + 1) : guests + 1)}
                    disabled={capacity > 0 && guests >= capacity}
                    className="h-12 w-12"
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

              <Button
                onClick={() => setCurrentStep('summary')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Review Booking
              </Button>
            </div>
          )}

          {/* Summary Step */}
          {currentStep === 'summary' && (
            <div className="p-4 space-y-6">
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
                  <div className="border-t border-green-200 pt-2 mt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>₹{calculateTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setCurrentStep('payment')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Proceed to Payment
              </Button>
            </div>
          )}

          {/* Payment Step */}
          {currentStep === 'payment' && (
            <div className="p-4 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-blue-900">Payment Details</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span>₹{calculateTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Booking:</span>
                    <span>{venueName}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Payment Methods</h4>
                
                {/* Credit/Debit Card */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <p className="font-medium">Credit/Debit Card</p>
                      <p className="text-sm text-gray-600">Visa, Mastercard, RuPay</p>
                    </div>
                  </div>
                </div>

                {/* UPI */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-purple-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">UPI</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">UPI</p>
                      <p className="text-sm text-gray-600">Google Pay, PhonePe, Paytm</p>
                    </div>
                  </div>
                </div>

                {/* Net Banking */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-green-600 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">NB</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Net Banking</p>
                      <p className="text-sm text-gray-600">All major banks</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing Payment...
                  </div>
                ) : (
                  `Pay ₹${calculateTotalPrice().toLocaleString()}`
                )}
              </Button>

              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Secure payment powered by Razorpay</p>
                <p>• Free cancellation up to 24 hours</p>
                <p>• Instant confirmation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileBookingModal; 