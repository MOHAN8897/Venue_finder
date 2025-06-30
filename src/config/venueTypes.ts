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
  banquet_hall: {
    name: 'Banquet Hall',
    icon: Building,
    fields: [
      { id: 'capacity', label: 'Capacity', type: 'number', placeholder: 'e.g., 250', required: true },
      { id: 'area', label: 'Area (sq. ft.)', type: 'number', placeholder: 'e.g., 3000', required: true },
    ],
    specific_options: [
      { id: 'catering_policy', label: 'Catering Policy', type: 'select', options: [{value: 'inhouse', label: 'In-house Only'}, {value: 'outside_allowed', label: 'Outside Allowed'}, {value: 'flexible', label: 'Flexible'}] },
      { id: 'decor_policy', label: 'Decor Policy', type: 'select', options: [{value: 'inhouse', label: 'In-house Only'}, {value: 'outside_allowed', label: 'Outside Allowed'}] },
    ]
  },
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
    name: 'Cricket Box',
    icon: Dumbbell,
    fields: [
        { id: 'pitch_type', label: 'Pitch Type', type: 'select', options: [{value: 'turf', label: 'Turf'}, {value: 'matting', label: 'Matting'}, {value: 'cement', label: 'Cement'}], required: true },
        { id: 'number_of_pitches', label: 'Number of Pitches', type: 'number', placeholder: 'e.g., 2', required: true },
    ],
    specific_options: [
        { id: 'nets_type', label: 'Nets Type', type: 'select', options: [{value: 'indoor', label: 'Indoor'}, {value: 'outdoor', label: 'Outdoor'}] },
        { id: 'lighting_available', label: 'Floodlights Available', type: 'checkbox' },
    ]
  },
  resort: {
    name: 'Resort',
    icon: Sun,
    fields: [
        { id: 'room_count', label: 'Number of Rooms', type: 'number', placeholder: 'e.g., 100', required: true },
        { id: 'star_rating', label: 'Star Rating', type: 'number', placeholder: 'e.g., 5', required: true },
    ],
    specific_options: [
        { id: 'has_spa', label: 'Spa On-site', type: 'checkbox' },
        { id: 'has_pool', label: 'Swimming Pool', type: 'checkbox' },
        { id: 'restaurant_on_site', label: 'Restaurant On-site', type: 'checkbox' },
    ]
  },
  restaurant: {
      name: 'Restaurant / Cafe',
      icon: Utensils,
      fields: [
          { id: 'seating_capacity', label: 'Seating Capacity', type: 'number', placeholder: 'e.g., 80', required: true },
          { id: 'cuisine_type', label: 'Cuisine Type', type: 'text', placeholder: 'e.g., Italian, Indian, Multi-cuisine', required: true },
      ],
      specific_options: [
          { id: 'private_dining', label: 'Private Dining Available', type: 'checkbox' },
          { id: 'alcohol_served', label: 'Serves Alcohol', type: 'checkbox' },
      ]
  },
  swimming_pool: {
      name: 'Swimming Pool',
      icon: Waves,
      fields: [
          { id: 'pool_size', label: 'Pool Size (e.g., 25m x 10m)', type: 'text', placeholder: 'e.g., 25m x 10m', required: true },
          { id: 'max_depth', label: 'Max Depth (ft)', type: 'number', placeholder: 'e.g., 6', required: true },
      ],
      specific_options: [
          { id: 'is_heated', label: 'Heated Pool', type: 'checkbox' },
          { id: 'has_lifeguard', label: 'Lifeguard On-duty', type: 'checkbox' },
      ]
  }
}; 