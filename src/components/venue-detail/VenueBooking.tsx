import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Plus, Minus, Star, MapPin, Users, Clock } from 'lucide-react';
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
import { format } from 'date-fns';

interface VenueBookingProps {
  pricePerHour: number;
  venueId?: string;
  venueName?: string;
  capacity?: number;
  rating?: number;
  reviewCount?: number;
}

const VenueBooking: React.FC<VenueBookingProps> = ({ 
  pricePerHour, 
  venueId, 
  venueName, 
  capacity = 0, 
  rating = 0, 
  reviewCount = 0 
}) => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [guests, setGuests] = useState<number>(1);

  const handleBooking = () => {
    if (venueId) {
      // Open the main booking page in a new tab
      window.open(`/book/${venueId}`, '_blank');
    } else {
      alert('Venue ID not available for booking.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md sticky top-24">
      {/* Venue Info */}
      {venueName && (
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">{venueName}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
            {rating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                {rating.toFixed(1)} ({reviewCount})
              </span>
            )}
            {capacity > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                Up to {capacity} guests
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Pricing */}
      <div className="mb-6">
        <p className="text-2xl font-bold">
          ₹{pricePerHour} <span className="text-base font-normal text-gray-500">/ hour</span>
        </p>
        <p className="text-sm text-gray-600">Minimum 2 hours booking</p>
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={'outline'}
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
          <Select onValueChange={setTimeSlot} value={timeSlot}>
            <SelectTrigger>
              <SelectValue placeholder="Select a time slot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="09:00-11:00">09:00 AM - 11:00 AM</SelectItem>
              <SelectItem value="11:00-13:00">11:00 AM - 01:00 PM</SelectItem>
              <SelectItem value="14:00-16:00">02:00 PM - 04:00 PM</SelectItem>
              <SelectItem value="16:00-18:00">04:00 PM - 06:00 PM</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
          <div className="flex items-center">
            <Button variant="outline" size="icon" onClick={() => setGuests(Math.max(1, guests - 1))}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-full text-center">{guests}</span>
            <Button variant="outline" size="icon" onClick={() => setGuests(guests + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <Button onClick={handleBooking} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-3">
        Book Now - Open Booking Page
      </Button>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Click to open the full booking system with payment gateway
      </div>
    </div>
  );
};

export default VenueBooking; 