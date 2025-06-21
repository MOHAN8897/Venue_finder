export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'user' | 'owner' | 'admin';
  profilePicture?: string;
  createdAt: Date;
}

export interface Owner extends User {
  role: 'owner';
  businessName?: string;
  description?: string;
  verified: boolean;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  type: 'cricket-box' | 'farmhouse' | 'banquet-hall' | 'sports-complex' | 'party-hall' | 'conference-room';
  location: {
    address: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  images: string[];
  videos?: string[];
  amenities: string[];
  specifications: {
    capacity: number;
    area: string;
    dimensions?: string;
  };
  pricing: {
    hourlyRate: number;
    currency: string;
  };
  ownerId: string;
  owner: Owner;
  availability: VenueSlot[];
  rating: number;
  reviewCount: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface VenueSlot {
  id: string;
  venueId: string;
  date: string;
  startTime: string;
  endTime: string;
  available: boolean;
  price: number;
  bookedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Booking {
  id: string;
  userId: string;
  venueId: string;
  venue: Venue;
  slots: VenueSlot[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  bookingDate: Date;
  eventDate: string;
  eventDuration: string;
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SearchFilters {
  location?: string;
  type?: string;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  capacity?: number;
}

export interface BookmarkVenue {
  id: string;
  userId: string;
  venueId: string;
  venue: Venue;
  createdAt: Date;
}