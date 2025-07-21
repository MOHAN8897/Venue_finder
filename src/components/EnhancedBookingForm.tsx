import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, Users, IndianRupee, Plus, Minus } from 'lucide-react';
import { format, addHours, addDays, isAfter, isBefore, startOfDay } from 'date-fns';

interface EnhancedBookingFormProps {
  venue: {
    id: string;
    venue_name: string;
    price_per_hour: number;
    price_per_day: number;
    address: string;
  };
  onBookingSubmit: (bookingData: BookingData) => void;
}

interface BookingData {
  venueId: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  specialRequests?: string;
  bookingType: 'hourly' | 'daily';
  totalHours: number;
  totalAmount: number;
  platformFee: number;
  finalAmount: number;
}

const EnhancedBookingForm: React.FC<EnhancedBookingFormProps> = ({
  venue,
  onBookingSubmit
}) => {
  const [bookingType, setBookingType] = useState<'hourly' | 'daily'>('hourly');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [guestCount, setGuestCount] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [totalHours, setTotalHours] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [platformFee, setPlatformFee] = useState(35);
  const [finalAmount, setFinalAmount] = useState(0);

  // Generate time slots from 6 AM to 10 PM
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 22; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push(time);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Calculate total hours and amount
  useEffect(() => {
    if (bookingType === 'hourly') {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      setTotalHours(Math.max(1, hours));
    } else {
      setTotalHours(24); // Daily booking
    }

    const venueAmount = bookingType === 'hourly' 
      ? venue.price_per_hour * totalHours
      : venue.price_per_day;
    
    setTotalAmount(venueAmount);
    setFinalAmount(venueAmount + platformFee);
  }, [bookingType, startTime, endTime, totalHours, venue.price_per_hour, venue.price_per_day, platformFee]);

  // Handle time selection for hourly booking
  const handleTimeChange = (type: 'start' | 'end', time: string) => {
    if (type === 'start') {
      setStartTime(time);
      // Ensure end time is after start time
      const start = new Date(`2000-01-01T${time}`);
      const end = new Date(`2000-01-01T${endTime}`);
      if (end <= start) {
        const newEnd = addHours(start, 1);
        setEndTime(newEnd.toTimeString().slice(0, 5));
      }
    } else {
      setEndTime(time);
    }
  };

  // Handle slot selection for multiple slots
  const handleSlotSelection = (slot: string) => {
    if (selectedSlots.includes(slot)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slot));
    } else {
      setSelectedSlots([...selectedSlots, slot].sort());
    }
  };

  // Calculate amount for multiple slots
  useEffect(() => {
    if (selectedSlots.length > 0) {
      const slotAmount = venue.price_per_hour * selectedSlots.length;
      setTotalAmount(slotAmount);
      setFinalAmount(slotAmount + platformFee);
    }
  }, [selectedSlots, venue.price_per_hour, platformFee]);

  const handleSubmit = () => {
    const bookingData: BookingData = {
      venueId: venue.id,
      eventDate,
      startTime: bookingType === 'hourly' ? startTime : '00:00',
      endTime: bookingType === 'hourly' ? endTime : '23:59',
      guestCount,
      specialRequests: specialRequests || undefined,
      bookingType,
      totalHours: bookingType === 'hourly' ? totalHours : 24,
      totalAmount,
      platformFee,
      finalAmount
    };

    onBookingSubmit(bookingData);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toFixed(2)}`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Booking Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Booking Type
          </CardTitle>
          <CardDescription>
            Choose between hourly or daily booking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={bookingType === 'hourly' ? 'default' : 'outline'}
              onClick={() => setBookingType('hourly')}
              className="h-16 flex-col"
            >
              <Clock className="h-5 w-5 mb-1" />
              <span>Hourly Booking</span>
              <span className="text-xs opacity-75">₹{venue.price_per_hour}/hour</span>
            </Button>
            <Button
              variant={bookingType === 'daily' ? 'default' : 'outline'}
              onClick={() => setBookingType('daily')}
              className="h-16 flex-col"
            >
              <Calendar className="h-5 w-5 mb-1" />
              <span>Daily Booking</span>
              <span className="text-xs opacity-75">₹{venue.price_per_day}/day</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date and Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Date & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
          <div className="space-y-2">
            <Label htmlFor="eventDate">Event Date</Label>
            <Input
              id="eventDate"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>

          {/* Time Selection based on booking type */}
          {bookingType === 'hourly' ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Select value={startTime} onValueChange={(value) => handleTimeChange('start', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Select value={endTime} onValueChange={(value) => handleTimeChange('end', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-500" />
              <p className="text-sm text-gray-600">Full day booking (24 hours)</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multiple Slot Selection (for hourly booking) */}
      {bookingType === 'hourly' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Multiple Slots (Optional)</CardTitle>
            <CardDescription>
              Choose specific time slots for your booking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={selectedSlots.includes(slot) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSlotSelection(slot)}
                  className="h-10"
                >
                  {slot}
                </Button>
              ))}
            </div>
            {selectedSlots.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Selected {selectedSlots.length} slot(s): {selectedSlots.join(', ')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Guest Count and Special Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guestCount">Number of Guests</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuestCount(Math.max(1, guestCount - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="guestCount"
                type="number"
                value={guestCount}
                onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                className="w-20 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setGuestCount(guestCount + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              placeholder="Any special requirements or requests..."
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Booking Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IndianRupee className="h-5 w-5" />
            Booking Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Venue Details */}
          <div className="space-y-2">
            <h3 className="font-semibold">{venue.venue_name}</h3>
            <p className="text-sm text-gray-600">{venue.address}</p>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Booking Type:</span>
              <Badge variant="secondary">
                {bookingType === 'hourly' ? 'Hourly' : 'Daily'}
              </Badge>
            </div>
            {eventDate && (
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{format(new Date(eventDate), 'EEEE, MMMM do, yyyy')}</span>
              </div>
            )}
            {bookingType === 'hourly' && (
              <div className="flex justify-between">
                <span>Time:</span>
                <span>{startTime} - {endTime}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{totalHours} {totalHours === 1 ? 'hour' : 'hours'}</span>
            </div>
            <div className="flex justify-between">
              <span>Guests:</span>
              <span>{guestCount} {guestCount === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>

          <Separator />

          {/* Cost Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Venue Amount ({totalHours} {totalHours === 1 ? 'hour' : 'hours'}):</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Platform Fee:</span>
              <span>{formatCurrency(platformFee)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span className="text-green-600">{formatCurrency(finalAmount)}</span>
            </div>
          </div>

          {/* Platform Fee Notice */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Platform Fee:</strong> A fixed ₹35 fee is charged per booking to cover 
              platform maintenance and support services.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!eventDate || (bookingType === 'hourly' && startTime >= endTime)}
        className="w-full h-12"
      >
        Proceed to Payment
      </Button>
    </div>
  );
};

export default EnhancedBookingForm; 