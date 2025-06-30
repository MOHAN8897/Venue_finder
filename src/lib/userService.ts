import { supabase } from './supabase';

// Types for user management
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  preferences?: Record<string, unknown>;
  notification_settings?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    marketing_emails: boolean;
    booking_reminders: boolean;
    new_venue_alerts: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface UserFavorite {
  id: string;
  user_id: string;
  venue_id: string;
  created_at: string;
  venue?: {
    id: string;
    name: string;
    description: string;
    address: string;
    city: string;
    image_urls: string[];
    rating: number;
    hourly_rate: number;
  };
}

export interface UserReview {
  id: string;
  user_id: string;
  venue_id: string;
  rating: number;
  review_text?: string;
  created_at: string;
  updated_at: string;
  venue?: {
    id: string;
    name: string;
    address: string;
  };
}

export interface UserBooking {
  id: string;
  venue_id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_status: 'pending' | 'paid' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
  venue?: {
    id: string;
    name: string;
    address: string;
    image_urls: string[];
  };
}

// User Profile Management
export const userService = {
  // Get current user profile
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_profile', {});
      if (error) throw error;
      // If data is null, undefined, or an empty object, treat as no profile
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        return null;
      }
      // Defensive: ensure required fields exist
      return {
        id: data.id || data.user_id || '',
        email: data.email || '',
        full_name: data.full_name || data.name || '',
        phone: (data.phone || '').replace(/\D/g, ''),
        avatar_url: data.avatar_url || '',
        date_of_birth: data.date_of_birth || '',
        gender: data.gender || 'prefer_not_to_say',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || '',
        preferences: data.preferences || {},
        notification_settings: data.notification_settings || {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          booking_reminders: true,
          new_venue_alerts: true
        },
        created_at: data.created_at || '',
        updated_at: data.updated_at || ''
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      // Normalize date_of_birth
      const updateData = { ...updates };
      if ('date_of_birth' in updateData) {
        if (!updateData.date_of_birth || updateData.date_of_birth === '' || !/^\d{4}-\d{2}-\d{2}$/.test(updateData.date_of_birth)) {
          updateData.date_of_birth = undefined;
        }
      }
      // Normalize phone
      if ('phone' in updateData && typeof updateData.phone === 'string') {
        updateData.phone = updateData.phone.replace(/\D/g, '').trim();
      }
      // Always include notification_settings and preferences if present
      if ('notification_settings' in updateData && !updateData.notification_settings) {
        updateData.notification_settings = {
          email_notifications: true,
          sms_notifications: false,
          marketing_emails: true,
          booking_reminders: true,
          new_venue_alerts: true
        };
      }
      if ('preferences' in updateData && !updateData.preferences) {
        updateData.preferences = {};
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Upload user avatar
  async uploadUserAvatar(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const fileName = `${user.id}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('user-avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-avatars')
        .getPublicUrl(fileName);

      // Update user profile with new avatar URL
      await this.updateUserProfile({ avatar_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (error: unknown) {
      console.error('Error uploading avatar:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update notification settings
  async updateNotificationSettings(settings: Partial<UserProfile['notification_settings']>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('profiles')
        .update({ notification_settings: settings })
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating notification settings:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update user preferences
  async updateUserPreferences(preferences: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('profiles')
        .update({ preferences })
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: (error as Error).message };
    }
  }
};

// Favorites Management
export const favoritesService = {
  // Get user favorites
  async getUserFavorites(): Promise<UserFavorite[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_favorites', {});
      if (error) throw error;
      return data as UserFavorite[] || [];
    } catch (error) {
      console.error('Error fetching user favorites:', error);
      return [];
    }
  },

  // Add venue to favorites
  async addToFavorites(venueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_favorites')
        .insert([{ user_id: user.id, venue_id: venueId }]);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding to favorites:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Remove venue from favorites
  async removeFromFavorites(venueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('venue_id', venueId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error removing from favorites:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Check if venue is in favorites
  async isInFavorites(venueId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('venue_id', venueId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking favorites:', error);
      return false;
    }
  }
};

// Reviews Management
export const reviewsService = {
  // Get user reviews
  async getUserReviews(): Promise<UserReview[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_reviews')
        .select(`
          *,
          venue:venues(
            id,
            name,
            address
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }
  },

  // Add review
  async addReview(venueId: string, rating: number, reviewText?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_reviews')
        .upsert([{
          user_id: user.id,
          venue_id: venueId,
          rating,
          review_text: reviewText
        }], { onConflict: 'user_id,venue_id' });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error adding review:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update review
  async updateReview(venueId: string, rating: number, reviewText?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_reviews')
        .update({
          rating,
          review_text: reviewText,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('venue_id', venueId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating review:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Delete review
  async deleteReview(venueId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('user_reviews')
        .delete()
        .eq('user_id', user.id)
        .eq('venue_id', venueId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting review:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Get user's review for a specific venue
  async getUserReviewForVenue(venueId: string): Promise<UserReview | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('user_id', user.id)
        .eq('venue_id', venueId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user review:', error);
      return null;
    }
  }
};

// Bookings Management
export const bookingsService = {
  // Get user bookings
  async getUserBookings(): Promise<UserBooking[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_bookings', {});
      if (error) throw error;
      return data as UserBooking[] || [];
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      return [];
    }
  },

  // Create booking
  async createBooking(venueId: string, startDate: string, endDate: string, totalPrice: number, notes?: string): Promise<{ success: boolean; bookingId?: string; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('bookings')
        .insert([{
          venue_id: venueId,
          user_id: user.id,
          start_date: startDate,
          end_date: endDate,
          total_price: totalPrice,
          notes
        }])
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, bookingId: data.id };
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Update booking
  async updateBooking(bookingId: string, updates: Partial<UserBooking>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  // Cancel booking
  async cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: (error as Error).message };
    }
  }
};

// Venue Management (for venue owners)
export const venueOwnerService = {
  // Get user's venues
  async getUserVenues(): Promise<unknown[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_venues', {});
      if (error) throw error;
      return data as unknown[];
    } catch (error: unknown) {
      console.error('Error fetching user venues:', error);
      return [];
    }
  },

  // Get bookings for user's venues
  async getVenueBookings(): Promise<unknown[]> {
    try {
      const { data, error } = await supabase.rpc('get_venue_bookings', {});
      if (error) throw error;
      return data as unknown[];
    } catch (error: unknown) {
      console.error('Error fetching venue bookings:', error);
      return [];
    }
  }
};

// Dashboard Statistics
export const dashboardService = {
  // Get user dashboard statistics
  async getDashboardStats(): Promise<{
    totalBookings: number;
    totalFavorites: number;
    totalReviews: number;
    totalVenues: number;
    recentBookings: UserBooking[];
    recentFavorites: UserFavorite[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          totalBookings: 0,
          totalFavorites: 0,
          totalReviews: 0,
          totalVenues: 0,
          recentBookings: [],
          recentFavorites: []
        };
      }

      // Try to use the RPC function first
      try {
        const { data: statsData, error: statsError } = await supabase.rpc('get_user_dashboard_stats', {});
        if (!statsError && statsData) {
          return {
            totalBookings: statsData.totalBookings || 0,
            totalFavorites: statsData.totalFavorites || 0,
            totalReviews: statsData.totalReviews || 0,
            totalVenues: statsData.totalVenues || 0,
            recentBookings: statsData.recentBookings || [],
            recentFavorites: statsData.recentFavorites || []
          };
        }
      } catch (rpcError) {
        console.warn('RPC function not available, falling back to direct queries:', rpcError);
      }

      // Fallback to direct queries if RPC function is not available
      const [bookingsCount, favoritesCount, reviewsCount, venuesCount] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_favorites').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('user_reviews').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('venues').select('id', { count: 'exact' }).eq('owner_id', user.id)
      ]);

      // Get recent data
      const [recentBookings, recentFavorites] = await Promise.all([
        bookingsService.getUserBookings().then(bookings => bookings.slice(0, 5)),
        favoritesService.getUserFavorites().then(favorites => favorites.slice(0, 5))
      ]);

      return {
        totalBookings: bookingsCount.count || 0,
        totalFavorites: favoritesCount.count || 0,
        totalReviews: reviewsCount.count || 0,
        totalVenues: venuesCount.count || 0,
        recentBookings,
        recentFavorites
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalBookings: 0,
        totalFavorites: 0,
        totalReviews: 0,
        totalVenues: 0,
        recentBookings: [],
        recentFavorites: []
      };
    }
  }
};

// Export all services
export default {
  userService,
  favoritesService,
  reviewsService,
  bookingsService,
  venueOwnerService,
  dashboardService
}; 