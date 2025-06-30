import { supabase } from './supabase';
import { EmailService } from './emailService';

export interface DraftData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: string;
  longitude: string;
  capacity: string;
  area: string;
  hourlyRate: string;
  dailyRate: string;
  venueType: string;
  specificOptions: Record<string, string[]>;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  images: File[];
  videos: File[];
  googleMapsLink: string;
}

export interface DraftResponse {
  success: boolean;
  draft_id?: string;
  draft_data?: DraftData;
  step_completed?: number;
  created_at?: string;
  updated_at?: string;
  message?: string;
  error?: string;
}

export class DraftService {
  /**
   * Save venue draft to database
   */
  static async saveDraft(email: string, formData: DraftData, currentStep: number): Promise<DraftResponse> {
    try {
      const { data, error } = await supabase.rpc('save_venue_draft', {
        user_email: email,
        draft_data: formData,
        current_step: currentStep
      });

      if (error) {
        console.error('Error saving draft:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        draft_id: data.draft_id,
        message: data.message
      };
    } catch (error) {
      console.error('Error saving draft:', error);
      return {
        success: false,
        error: 'Failed to save draft'
      };
    }
  }

  /**
   * Retrieve venue draft from database
   */
  static async getDraft(email: string): Promise<DraftResponse> {
    try {
      const { data, error } = await supabase.rpc('get_venue_draft', {
        user_email: email
      });

      if (error) {
        console.error('Error retrieving draft:', error);
        return {
          success: false,
          error: error.message
        };
      }

      if (!data.success) {
        return {
          success: false,
          error: data.error
        };
      }

      return {
        success: true,
        draft_data: data.draft_data,
        step_completed: data.step_completed,
        created_at: data.created_at,
        updated_at: data.updated_at
      };
    } catch (error) {
      console.error('Error retrieving draft:', error);
      return {
        success: false,
        error: 'Failed to retrieve draft'
      };
    }
  }

  /**
   * Delete venue draft from database
   */
  static async deleteDraft(email: string): Promise<DraftResponse> {
    try {
      const { data, error } = await supabase.rpc('delete_venue_draft', {
        user_email: email
      });

      if (error) {
        console.error('Error deleting draft:', error);
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
      console.error('Error deleting draft:', error);
      return {
        success: false,
        error: 'Failed to delete draft'
      };
    }
  }

  /**
   * Send draft recovery email
   */
  static async sendDraftRecoveryEmail(email: string, venueName: string, draftId: string): Promise<boolean> {
    try {
      const recoveryLink = `${window.location.origin}/list-venue?draft=${draftId}`;
      
      const response = await EmailService.sendDraftRecoveryEmail({
        to: email,
        venueName,
        draftId,
        recoveryLink
      });
      
      return response.success;
    } catch (error) {
      console.error('Error sending draft recovery email:', error);
      return false;
    }
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    return EmailService.isValidEmail(email);
  }
} 