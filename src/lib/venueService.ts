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
  price_per_hour?: number;
  price_per_day?: number;
  currency: string;
  images: string[];
  image_urls?: string[];
  videos: string[];
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  owner_id: string;
  status: string;
  verified: boolean;
  rating: number;
  review_count: number;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
  owner_email?: string;
  owner_name?: string;
  google_maps_link?: string;
  google_maps_embed_code?: string;
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

export const venueService = {
  // Get featured venues for homepage
  getFeaturedVenues: async (limit: number = 6): Promise<Venue[]> => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          owner:profiles!venues_owner_id_fkey(
            email,
            name,
            full_name
          )
        `)
        .eq('status', 'approved')
        .eq('verified', true)
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured venues:', error);
        throw error;
      }

      return (data || []).map((venue: VenueWithOwner) => ({
        ...venue,
        owner_email: venue.owner?.email,
        owner_name: venue.owner?.full_name || venue.owner?.name
      }));
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
        .select(`
          *,
          owner:profiles!venues_owner_id_fkey(
            email,
            name,
            full_name
          )
        `)
        .eq('status', 'approved')
        .eq('verified', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all venues:', error);
        throw error;
      }

      return (data || []).map((venue: VenueWithOwner) => ({
        ...venue,
        owner_email: venue.owner?.email,
        owner_name: venue.owner?.full_name || venue.owner?.name
      }));
    } catch (error) {
      console.error('Error in getAllVenues:', error);
      return [];
    }
  },

  // Get filtered venues based on criteria
  getFilteredVenues: async (filters: VenueFilters): Promise<Venue[]> => {
    try {
      let query = supabase
        .from('venues')
        .select(`
          *,
          owner:profiles!venues_owner_id_fkey(
            email,
            name,
            full_name
          )
        `)
        .eq('status', 'approved')
        .eq('verified', true);

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

      // Apply amenities filter
      if (filters.amenities && filters.amenities.length > 0) {
        // Note: This would need to be implemented with venue_amenities junction table
        // For now, we'll skip amenities filtering
      }

      const { data, error } = await query
        .order('rating', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching filtered venues:', error);
        throw error;
      }

      return (data || []).map((venue: VenueWithOwner) => ({
        ...venue,
        owner_email: venue.owner?.email,
        owner_name: venue.owner?.full_name || venue.owner?.name
      }));
    } catch (error) {
      console.error('Error in getFilteredVenues:', error);
      return [];
    }
  },

  // Get single venue by ID
  getVenueById: async (id: string): Promise<Venue | null> => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select(`
          *,
          owner:profiles!venues_owner_id_fkey(
            email,
            name,
            full_name,
            phone
          )
        `)
        .eq('id', id)
        .eq('status', 'approved')
        .eq('verified', true)
        .single();

      if (error) {
        console.error('Error fetching venue:', error);
        throw error;
      }

      if (!data) return null;

      return {
        ...data,
        owner_email: data.owner?.email,
        owner_name: data.owner?.full_name || data.owner?.name
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
          venue:venues(
            *,
            owner:profiles!venues_owner_id_fkey(
              email,
              full_name
            )
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user favorites:', error);
        throw error;
      }

      return data?.map((item: { venue: VenueWithOwner }) => ({
        ...item.venue,
        owner_email: item.venue.owner?.email,
        owner_name: item.venue.owner?.full_name
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
  createVenue: async (venueData: Omit<Venue, 'id' | 'created_at' | 'updated_at' | 'rating' | 'total_reviews'>): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .insert(venueData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating venue:', error);
        throw error;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in createVenue:', error);
      return null;
    }
  },

  // Update venue
  updateVenue: async (id: string, updates: Partial<Venue>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('venues')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating venue:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error in updateVenue:', error);
      return false;
    }
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
  }
}; 