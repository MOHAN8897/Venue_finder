import { Building, Home, Sun, Dumbbell, Utensils, Waves } from 'lucide-react';

export interface VenueField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface VenueTypeConfig {
  [key: string]: {
    name: string;
    icon: React.ElementType;
    fields: VenueField[];
    specific_options: VenueField[];
  };
}

export const venueTypesConfig: VenueTypeConfig = {
  farmhouse: {
    name: 'Farmhouse',
    icon: Home,
    fields: [
      { id: 'capacity', label: 'Guest Capacity', type: 'number', placeholder: 'e.g., 50', required: true },
      { id: 'bedrooms', label: 'Number of Bedrooms', type: 'number', placeholder: 'e.g., 4', required: true },
      { id: 'bathrooms', label: 'Number of Bathrooms', type: 'number', placeholder: 'e.g., 5', required: true },
    ],
    specific_options: [
        { id: 'pool_available', label: 'Swimming Pool', type: 'checkbox' },
        { id: 'checkin_time', label: 'Check-in Time', type: 'text', placeholder: 'e.g., 2:00 PM' },
        { id: 'checkout_time', label: 'Check-out Time', type: 'text', placeholder: 'e.g., 11:00 AM' },
    ]
  },
  cricket_box: {
    name: 'Sports Venue', // Renamed for display
    icon: Dumbbell,
    fields: [
        { id: 'pitch_type', label: 'Pitch Type', type: 'select', options: [{value: 'turf', label: 'Turf'}, {value: 'matting', label: 'Matting'}, {value: 'cement', label: 'Cement'}], required: true },
        { id: 'number_of_pitches', label: 'Number of Pitches', type: 'number', placeholder: 'e.g., 2', required: true },
    ],
    specific_options: [
        { id: 'nets_type', label: 'Nets Type', type: 'select', options: [{value: 'indoor', label: 'Indoor'}, {value: 'outdoor', label: 'Outdoor'}] },
        { id: 'lighting_available', label: 'Floodlights Available', type: 'checkbox' },
    ]
  }
}; 