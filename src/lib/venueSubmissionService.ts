import { supabase } from './supabase';
import { EmailService } from './emailService';

export interface VenueSubmissionData {
  name: string;
  description: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: string;
  longitude?: string;
  capacity: string;
  area: string;
  hourly_rate: string;
  daily_rate?: string;
  specific_options: Record<string, string[]>;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  google_maps_link: string;
  images: string[];
  videos: string[];
}

export interface UserVenueStats {
  total_submitted: number;
  pending_review: number;
  approved: number;
  rejected: number;
  active_venues: number;
}

export interface UserVenue {
  id: string;
  name: string;
  description: string;
  type: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  capacity: number;
  area: string;
  hourly_rate: number;
  daily_rate?: number;
  images: string[];
  videos: string[];
  approval_status: string;
  submission_date: string;
  approval_date?: string;
  rejection_reason?: string;
  is_approved: boolean;
  is_active: boolean;
}

export interface SubmissionResponse {
  success: boolean;
  message?: string;
  venue_id?: string;
  error?: string;
}

export class VenueSubmissionService {
  /**
   * Submit a new venue for review
   */
  static async submitVenue(venueData: VenueSubmissionData): Promise<SubmissionResponse> {
    try {
      const { data, error } = await supabase.rpc('submit_venue', {
        venue_data: venueData
      });

      if (error) {
        console.error('Error submitting venue:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Send confirmation email
      if (data?.venue_id) {
        await EmailService.sendVenueSubmissionConfirmation(
          venueData.contact_email,
          venueData.name,
          data.venue_id
        );
      }

      return {
        success: true,
        message: data.message,
        venue_id: data.venue_id
      };
    } catch (error) {
      console.error('Error submitting venue:', error);
      return {
        success: false,
        error: 'Failed to submit venue'
      };
    }
  }

  /**
   * Get user's submitted venues
   */
  static async getUserSubmittedVenues(): Promise<UserVenue[]> {
    try {
      const { data, error } = await supabase.rpc('get_user_submitted_venues');

      if (error) {
        console.error('Error fetching user venues:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user venues:', error);
      return [];
    }
  }

  /**
   * Get user's venue submission statistics
   */
  static async getUserVenueStats(): Promise<UserVenueStats | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_venue_stats');

      if (error) {
        console.error('Error fetching user venue stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user venue stats:', error);
      return null;
    }
  }

  /**
   * Update an existing venue submission
   */
  static async updateVenueSubmission(
    venueId: string, 
    venueData: Partial<VenueSubmissionData>
  ): Promise<SubmissionResponse> {
    try {
      const { data, error } = await supabase.rpc('update_venue_submission', {
        venue_uuid: venueId,
        venue_data: venueData
      });

      if (error) {
        console.error('Error updating venue:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating venue:', error);
      return {
        success: false,
        error: 'Failed to update venue'
      };
    }
  }

  /**
   * Delete a venue submission (only if pending or rejected)
   */
  static async deleteVenueSubmission(venueId: string): Promise<SubmissionResponse> {
    try {
      const { data, error } = await supabase.rpc('delete_venue_submission', {
        venue_uuid: venueId
      });

      if (error) {
        console.error('Error deleting venue:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Error deleting venue:', error);
      return {
        success: false,
        error: 'Failed to delete venue'
      };
    }
  }

  /**
   * Upload files to Supabase storage
   */
  static async uploadFiles(files: File[], bucket: string): Promise<string[]> {
    const urls: string[] = [];
    
    for (const file of files) {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
      const { error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);
      
      if (error) {
        console.error('Upload error:', error);
        throw error;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);
      
      urls.push(publicUrl);
    }
    
    return urls;
  }

  /**
   * Delete files from Supabase storage
   */
  static async deleteFiles(fileUrls: string[], bucket: string): Promise<void> {
    for (const url of fileUrls) {
      const fileName = url.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from(bucket)
          .remove([fileName]);
      }
    }
  }

  /**
   * Validate venue submission data
   */
  static validateVenueData(data: VenueSubmissionData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name?.trim()) errors.push('Venue name is required');
    if (!data.description?.trim()) errors.push('Description is required');
    if (data.description && data.description.length < 50) {
      errors.push('Description must be at least 50 characters');
    }
    if (!data.type) errors.push('Venue type is required');
    if (!data.address?.trim()) errors.push('Address is required');
    if (!data.city?.trim()) errors.push('City is required');
    if (!data.state?.trim()) errors.push('State is required');
    if (!data.pincode?.trim()) errors.push('Pincode is required');
    if (!/^\d{6}$/.test(data.pincode)) errors.push('Pincode must be 6 digits');
    if (!data.capacity) errors.push('Capacity is required');
    if (parseInt(data.capacity) < 1) errors.push('Capacity must be at least 1');
    if (!data.area?.trim()) errors.push('Area is required');
    if (!data.hourly_rate) errors.push('Hourly rate is required');
    if (parseInt(data.hourly_rate) < 100) errors.push('Hourly rate must be at least ₹100');
    if (!data.contact_name?.trim()) errors.push('Contact name is required');
    if (!data.contact_phone?.trim()) errors.push('Contact phone is required');
    if (!/^\d{10}$/.test(data.contact_phone.replace(/\D/g, ''))) {
      errors.push('Phone must be 10 digits');
    }
    if (!data.contact_email?.trim()) errors.push('Contact email is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contact_email)) {
      errors.push('Invalid email format');
    }
    if (!data.google_maps_link?.trim()) errors.push('Google Maps link is required');
    if (data.images.length === 0) errors.push('At least one image is required');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get venue submission status text
   */
  static getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  }

  /**
   * Get status color for UI
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }
} 