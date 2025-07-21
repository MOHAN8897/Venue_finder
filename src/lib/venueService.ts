import { supabase } from './supabase';

export interface Venue {
  id: string;
  name: string;
  description: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  zip_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  area: string;
  dimensions?: string;
  hourly_rate: number;
  daily_rate?: number;
  price_per_hour?: number;
  price_per_day?: number;
  currency: string;
  images: string[];
  image_urls?: string[];
  videos: string[];
  amenities?: string[];
  photos?: string[];
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  owner_id: string;
  status: string;
  verified: boolean;
  rating: number;
  review_count: number;
  average_rating?: number;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  owner_name?: string;
  google_maps_link?: string;
  google_maps_embed_code?: string;
  is_published: boolean;
  approval_date?: string;
  rejection_reason?: string;
  approval_status?: 'pending' | 'approved' | 'rejected';
  is_approved?: boolean;
  // --- Added for booking type/availability logic ---
  booking_type?: 'hourly' | 'daily' | 'both';
  availability?: string[];
}

interface VenueWithOwner extends Venue {
  owner: {
    email: string;
    name: string;
    full_name: string;
  } | null;
}

export interface VenueFilters {
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  capacity?: number;
  amenities?: string[];
}

export type VenueUpdateData = Record<string, never>;

// Add this type for venue creation
export interface VenueCreateInput {
  venue_name: string;
  venue_type: string;
  address: string;
  website: string;
  description: string;
  capacity: number;
  area: number;
  amenities: string[];
  image_urls: string[];
  videos: string[];
  price_per_hour: number;
  price_per_day: number;
  availability: string[];
  contact_number: string;
  email: string;
  owner_name: string;
  user_id: string;
  owner_id: string;
  submitted_by: string;
  status: string;
  approval_status: string;
  is_approved: boolean;
  is_active: boolean;
}

// --- Subvenue/Space Management ---
export interface Subvenue {
  id: string;
  venue_id: string;
  // Canonical DB columns:
  name?: string;
  description?: string;
  features?: string[];
  images?: string[];
  videos?: string[];
  amenities?: string[];
  status?: 'active' | 'inactive' | 'maintenance' | 'draft';
  subvenue_availability?: any;
  capacity?: number;
  price_per_hour?: number;
  price_per_day?: number;
  // Legacy/compatibility fields (used in frontend forms, not DB):
  subvenue_name?: string;
  subvenue_description?: string;
  subvenue_features?: string[];
  subvenue_images?: string[];
  subvenue_videos?: string[];
  subvenue_amenities?: string[];
  subvenue_capacity?: number;
  subvenue_type?: string;
  subvenue_status?: 'active' | 'inactive' | 'maintenance';
  created_at?: string;
  updated_at?: string;
}

export const venueService = {
  // Get featured venues for homepage
  getFeaturedVenues: async (limit: number = 6): Promise<Venue[]> => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('status', 'approved')
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured venues:', error);
        throw error;
      }

      return (data || []);
    } catch (error) {
      console.error('Error in getFeaturedVenues:', error);
      return [];
    }
  },

  // Get all approved venues for browse page
  getAllVenues: async (): Promise<Venue[]> => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .or('approval_status.eq.approved,is_approved.eq.true')
        .not('owner_id','is',null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all venues:', error);
        throw error;
      }

      return (data || []);
    } catch (error) {
      console.error('Error in getAllVenues:', error);
      return [];
    }
  },

  // Get filtered venues based on criteria, with pagination
  getFilteredVenues: async (filters: VenueFilters, page: number = 1, pageSize: number = 12): Promise<{ venues: Venue[]; total: number }> => {
    try {
      let query = supabase
        .from('venues')
        .select('*', { count: 'exact' })
        .or('approval_status.eq.approved,is_approved.eq.true');

      // Apply location filter
      if (filters.location) {
        query = query.or(`city.ilike.%${filters.location}%,address.ilike.%${filters.location}%`);
      }

      // Apply price filters
      if (filters.minPrice !== undefined) {
        query = query.gte('hourly_rate', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('hourly_rate', filters.maxPrice);
      }

      // Apply capacity filter
      if (filters.capacity) {
        query = query.gte('capacity', filters.capacity);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching filtered venues:', error);
        throw error;
      }

      return {
        venues: (data || []).map((venue: any) => ({
          ...venue,
          venue_name: venue.name || venue.venue_name || '',
          venue_type: venue.type || venue.venue_type || '',
          price_per_hour: venue.price_per_hour || venue.hourly_rate || 0,
          price_per_day: venue.price_per_day || venue.daily_rate || 0,
          avg_rating: venue.avg_rating || venue.rating || 0,
          rating_count: venue.rating_count || venue.review_count || 0,
          photos: venue.photos || venue.images || [],
          image_urls: venue.image_urls || venue.images || [],
          owner_email: venue.owner_email || '',
          owner_name: venue.owner_name || ''
        })),
        total: count || 0
      };
    } catch (error) {
      console.error('Error in getFilteredVenues:', error);
      return { venues: [], total: 0 };
    }
  },

  // Get single venue by ID
  getVenueById: async (id: string): Promise<Venue | null> => {
    try {
      console.log('Fetching venue with ID:', id);
      
      // First, try to get the venue without approval filter to see if it exists
      const { data: allVenues, error: allError } = await supabase
        .from('venues')
        .select('*')
        .eq('id', id);

      if (allError) {
        console.error('Error fetching venue (no filter):', allError);
        throw allError;
      }

      console.log('All venues with this ID:', allVenues);

      if (!allVenues || allVenues.length === 0) {
        console.log('No venue found with ID:', id);
        return null;
      }

      const venue = allVenues[0];
      console.log('Found venue:', venue);
      console.log('Venue approval status:', venue.approval_status, 'is_approved:', venue.is_approved);

      // Check if venue is approved
      const isApproved = venue.approval_status === 'approved' || venue.is_approved === true;
      
      if (!isApproved) {
        console.log('Venue is not approved. Status:', venue.approval_status, 'is_approved:', venue.is_approved);
        return null;
      }

      return {
        ...venue,
        venue_name: venue.name || venue.venue_name || '',
        venue_type: venue.type || venue.venue_type || '',
        price_per_hour: venue.price_per_hour || venue.hourly_rate || 0,
        price_per_day: venue.price_per_day || venue.daily_rate || 0,
        avg_rating: venue.avg_rating || venue.rating || 0,
        rating_count: venue.rating_count || venue.review_count || 0,
        photos: venue.photos || venue.images || [],
        image_urls: venue.image_urls || venue.images || [],
        owner_email: venue.owner_email || '',
        owner_name: venue.owner_name || ''
      };
    } catch (error) {
      console.error('Error in getVenueById:', error);
      return null;
    }
  },

  // Get user's venues
  getUserVenues: async (userId: string): Promise<Venue[]> => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user venues:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserVenues:', error);
      return [];
    }
  },

  // Get user's favorite venues
  getUserFavorites: async (userId: string): Promise<Venue[]> => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          venue:venues(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user favorites:', error);
        throw error;
      }

      const favorites = data as unknown as { venue: any }[] | null;

      return favorites?.map((item) => ({
        ...item.venue,
        venue_name: item.venue.name || item.venue.venue_name || '',
        venue_type: item.venue.type || item.venue.venue_type || '',
        price_per_hour: item.venue.price_per_hour || item.venue.hourly_rate || 0,
        price_per_day: item.venue.price_per_day || item.venue.daily_rate || 0,
        avg_rating: item.venue.avg_rating || item.venue.rating || 0,
        rating_count: item.venue.rating_count || item.venue.review_count || 0,
        photos: item.venue.photos || item.venue.images || [],
        image_urls: item.venue.image_urls || item.venue.images || [],
        owner_email: item.venue.owner_email || '',
        owner_name: item.venue.owner_name || ''
      })) || [];
    } catch (error) {
      console.error('Error in getUserFavorites:', error);
      return [];
    }
  },

  // Add venue to favorites
  addToFavorites: async (userId: string, venueId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: userId,
          venue_id: venueId
        });

      if (error) {
        console.error('Error adding to favorites:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in addToFavorites:', error);
      return false;
    }
  },

  // Remove venue from favorites
  removeFromFavorites: async (userId: string, venueId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('venue_id', venueId);

      if (error) {
        console.error('Error removing from favorites:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in removeFromFavorites:', error);
      return false;
    }
  },

  // Check if venue is in user's favorites
  isFavorite: async (userId: string, venueId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('venue_id', venueId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking favorite status:', error);
        throw error;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isFavorite:', error);
      return false;
    }
  },

  // Create new venue
  createVenue: async (venueData: VenueCreateInput): Promise<string | null> => {
    try {
      // Ensure required fields are present
      const fullVenueData: VenueCreateInput = {
        ...venueData,
        capacity: venueData.capacity ?? 0,
        area: venueData.area ?? 0,
        amenities: venueData.amenities ?? [],
      };
      const { data, error } = await supabase
        .from('venues')
        .insert(fullVenueData)
        .select('id')
        .single();
      console.log('[DEBUG] Insert response:', { data, error });
      if (error) {
        console.error('Error creating venue:', error);
        throw error;
      }
      // Only return the id if data is present
      return data?.id || null;
    } catch (error) {
      console.error('Error in createVenue:', error);
      // Return the error object for UI display
      return error as string;
    }
  },

  /**
   * Generate slots for a venue for the next 30 days using the Supabase backend function.
   * Calls the generate_slots_for_venue SQL function via RPC.
   */
  generateVenueSlots: async (
    venueId: string,
    bookingType: 'hourly' | 'daily' | 'both',
    weeklyAvailability: Record<string, { start: string; end: string; available: boolean }> = {},
    pricePerHour?: number,
    pricePerDay?: number
  ) => {
    if (!venueId || !bookingType) return;
    // Call the backend function to generate slots
    await supabase.rpc('generate_slots_for_venue', {
      venue_id: venueId,
      booking_type: bookingType,
      weekly_availability: weeklyAvailability,
      price_per_hour: pricePerHour || 0,
      price_per_day: pricePerDay || 0
    });
  },

  // Update venue
  async updateVenue(venueId: string, updatedData: Partial<Venue>): Promise<Venue | null> {
    const { data, error } = await supabase
      .from('venues')
      .update(updatedData)
      .eq('id', venueId)
      .select()
      .single();
    if (error) {
      console.error('Error updating venue:', error);
      return null;
    }
    // After update, generate slots if booking_type and availability are present
    if (updatedData.booking_type && updatedData.availability) {
      await venueService.generateVenueSlots(
        venueId,
        updatedData.booking_type,
        updatedData.availability,
        updatedData.price_per_hour,
        updatedData.price_per_day
      );
    }
    return data;
  },

  // Delete venue
  deleteVenue: async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting venue:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteVenue:', error);
      return false;
    }
  },

  async getVenuesForOwner(ownerId: string): Promise<Venue[]> {
    const { data, error } = await supabase
      .from('venues')
      .select(`
        *,
        owner:profiles(full_name)
      `)
      .or(`owner_id.eq.${ownerId},submitted_by.eq.${ownerId}`);

    if (error) {
      console.error('Error fetching venues for owner:', error);
      throw error;
    }

    // For now, we cast to any to bypass the strict type check.
    // This is part of the "frontend-first" approach where we will adjust backend/types later.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data as any as Venue[];
  },

  // Fetch all subvenues for a main venue
  async getSubvenuesByVenue(venueId: string): Promise<Subvenue[]> {
    const { data, error } = await supabase
      .from('subvenues')
      .select('*')
      .eq('venue_id', venueId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching subvenues:', error);
      return [];
    }
    return data || [];
  },

  // Create a new subvenue
  async createSubvenue(subvenue: Omit<Subvenue, 'id' | 'created_at' | 'updated_at'>): Promise<Subvenue | null> {
    const { data, error } = await supabase
      .from('subvenues')
      .insert(subvenue)
      .select('*')
      .single();
    if (error) {
      console.error('Error creating subvenue:', error);
      return null;
    }
    return data as Subvenue;
  },

  // Update an existing subvenue
  async updateSubvenue(subvenueId: string, updates: Partial<Subvenue>): Promise<Subvenue | null> {
    const { data, error } = await supabase
      .from('subvenues')
      .update(updates)
      .eq('id', subvenueId)
      .select('*')
      .single();
    if (error) {
      console.error('Error updating subvenue:', error);
      return null;
    }
    return data as Subvenue;
  },

  // Delete a subvenue by id
  async deleteSubvenue(subvenueId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('subvenues')
        .delete()
        .eq('id', subvenueId);
      if (error) {
        console.error('Error deleting subvenue:', error);
        throw error;
      }
      return true;
    } catch (error) {
      console.error('Error in deleteSubvenue:', error);
      return false;
    }
  },

  // Fetch all daily bookings for a venue (for disabling booked dates)
  getDailyBookingsForVenue: async (venueId: string) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('event_date')
        .eq('venue_id', venueId)
        .eq('booking_type', 'daily');
      return { data, error };
    } catch (error) {
      return { data: [], error };
    }
  }
}; 