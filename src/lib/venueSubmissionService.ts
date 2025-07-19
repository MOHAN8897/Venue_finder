import { supabase } from './supabase';
import { EmailService } from './emailService';
import { 
  processVenueImages, 
  quickValidateVenueImages,
  createOptimizedUploadFiles,
  processImageWorkflow
} from '../utils/imageUtils';

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
  created_at: string;
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
    // Preprocess data for type safety
    const processedVenueData = {
      ...venueData,
      type: venueData.type, // already validated as enum string
      capacity: venueData.capacity === '' ? null : Number(venueData.capacity),
      hourly_rate: venueData.hourly_rate === '' ? null : Number(venueData.hourly_rate),
      daily_rate: venueData.daily_rate === '' ? null : Number(venueData.daily_rate),
      latitude: venueData.latitude === '' ? null : Number(venueData.latitude),
      longitude: venueData.longitude === '' ? null : Number(venueData.longitude),
      specific_options: venueData.specific_options,
      contact_name: venueData.contact_name,
      contact_phone: venueData.contact_phone,
      contact_email: venueData.contact_email,
      images: venueData.images,
      videos: venueData.videos
    };
    try {
      const { data, error } = await supabase.rpc('submit_venue', {
        venue_data: processedVenueData
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
   * Upload files to Supabase storage with advanced validation and optimization
   * Returns an array of { url, success, error } for each file
   */
  static async uploadFiles(
    files: File[], 
    bucket: string,
    options?: {
      validateImages?: boolean;
      optimizeImages?: boolean;
      createThumbnails?: boolean;
      maxFileSize?: number;
      allowedTypes?: string[];
      progressCallback?: (progress: number, currentFile: string) => void;
    }
  ): Promise<{ 
    url: string | null; 
    success: boolean; 
    error?: string; 
    originalFile?: File; 
    optimizedFile?: File;
    compressionRatio?: number;
  }[]> {
    const {
      validateImages = true,
      optimizeImages = true,
      createThumbnails = true,
      maxFileSize = 5 * 1024 * 1024, // 5MB
      allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      progressCallback
    } = options || {};

    const results: { 
      url: string | null; 
      success: boolean; 
      error?: string; 
      originalFile?: File; 
      optimizedFile?: File;
      compressionRatio?: number;
    }[] = [];

    try {
      // Step 1: Enhanced validation with auto-fix workflow
      if (validateImages) {
        // Use the enhanced workflow that automatically fixes common issues
        const processedFiles: File[] = [];
        const processingErrors: string[] = [];
        
        for (const file of files) {
          if (progressCallback) {
            progressCallback(0, `Processing ${file.name}...`);
          }
          
          const workflowResult = await processImageWorkflow(file, {
            validation: {
              minWidth: 1200,
              minHeight: 675,
              maxWidth: 4000,
              maxHeight: 3000,
              maxFileSize: maxFileSize,
              allowedFormats: allowedTypes,
              aspectRatioTolerance: 0.1 // More lenient for auto-fixing
            },
            processing: {
              quality: 0.8,
              format: 'webp',
              maxWidth: 1920,
              maxHeight: 1080,
              maintainAspectRatio: true,
              targetAspectRatio: 16 / 9
            },
            autoCrop: true,
            createThumbnail: createThumbnails
          });
          
          if (workflowResult.success && workflowResult.finalFile) {
            processedFiles.push(workflowResult.finalFile);
            
            // Log any warnings or suggestions for user feedback
            if (workflowResult.warnings.length > 0) {
              console.log(`Auto-fixes applied to ${file.name}:`, workflowResult.warnings);
            }
            if (workflowResult.suggestions.length > 0) {
              console.log(`Suggestions for ${file.name}:`, workflowResult.suggestions);
            }
          } else {
            processingErrors.push(`${file.name}: ${workflowResult.errors.join(', ')}`);
            results.push({
              url: null,
              success: false,
              error: `${file.name}: ${workflowResult.errors.join(', ')}`,
              originalFile: file
            });
          }
        }
        
        // Update files to use processed versions
        files = processedFiles;
        
        if (processingErrors.length > 0) {
          console.error('Processing errors:', processingErrors);
        }
      }

      // Step 2: Upload processed files with progress tracking
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          if (progressCallback) {
            progressCallback((i / files.length) * 100, `Uploading ${file.name}...`);
          }

          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          const filePath = `${bucket}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, file, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            console.error('Upload error:', uploadError);
            results.push({ 
              url: null, 
              success: false, 
              error: uploadError.message,
              originalFile: file
            });
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);
          
          if (!publicUrl) {
            results.push({ 
              url: null, 
              success: false, 
              error: 'Failed to get public URL',
              originalFile: file
            });
          } else {
            results.push({ 
              url: publicUrl, 
              success: true,
              originalFile: file,
              optimizedFile: file // Since it's already processed
            });
          }
        }
      }

      if (progressCallback) {
        progressCallback(100, 'Complete');
      }

    } catch (error) {
      console.error('Upload process failed:', error);
      results.push({ 
        url: null, 
        success: false, 
        error: (error as Error).message 
      });
    }

    return results;
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
   * Process and upload images with advanced features
   * Includes validation, optimization, thumbnail generation, and metadata extraction
   */
  static async processAndUploadImages(
    files: File[],
    bucket: string,
    options?: {
      generateThumbnails?: boolean;
      extractMetadata?: boolean;
      addWatermark?: boolean;
      watermarkText?: string;
      quality?: number;
      format?: 'webp' | 'jpeg' | 'png';
      maxWidth?: number;
      maxHeight?: number;
      aspectRatio?: number;
      progressCallback?: (progress: number, currentFile: string, stage: string) => void;
    }
  ): Promise<{
    success: boolean;
    results: Array<{
      url: string | null;
      thumbnailUrl?: string;
      metadata?: Record<string, any>;
      success: boolean;
      error?: string;
      originalFile: File;
      processedFile?: File;
      compressionRatio?: number;
      processingTime?: number;
    }>;
    summary: {
      totalFiles: number;
      successfulUploads: number;
      failedUploads: number;
      totalOriginalSize: number;
      totalProcessedSize: number;
      averageCompression: number;
      averageProcessingTime: number;
    };
  }> {
    const {
      generateThumbnails = true,
      extractMetadata = true,
      addWatermark = false,
      watermarkText = 'VenueFinder',
      quality = 0.8,
      format = 'webp',
      maxWidth = 1920,
      maxHeight = 1080,
      aspectRatio = 16 / 9,
      progressCallback
    } = options || {};

    const startTime = Date.now();
    const results: Array<{
      url: string | null;
      thumbnailUrl?: string;
      metadata?: Record<string, any>;
      success: boolean;
      error?: string;
      originalFile: File;
      processedFile?: File;
      compressionRatio?: number;
      processingTime?: number;
    }> = [];

    let totalOriginalSize = 0;
    let totalProcessedSize = 0;
    let successfulUploads = 0;
    let failedUploads = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileStartTime = Date.now();
        
        if (progressCallback) {
          progressCallback((i / files.length) * 100, file.name, 'Processing');
        }

        try {
          // Step 1: Validate and process image
          const { processImageWorkflow } = await import('../utils/imageUtils');
          const processingResult = await processImageWorkflow(file, {
            validation: {
              minWidth: 1200,
              minHeight: 675,
              maxFileSize: 5 * 1024 * 1024,
              allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
              aspectRatioTolerance: 0.05
            },
            processing: {
              quality,
              maxWidth,
              maxHeight,
              format,
              maintainAspectRatio: true,
              targetAspectRatio: aspectRatio
            },
            autoCrop: true,
            createThumbnail: generateThumbnails
          });

          if (!processingResult.success || !processingResult.finalFile) {
            results.push({
              url: null,
              success: false,
              error: processingResult.errors.join(', '),
              originalFile: file,
              processingTime: Date.now() - fileStartTime
            });
            failedUploads++;
            continue;
          }

          const processedFile = processingResult.finalFile;
          totalOriginalSize += file.size;
          totalProcessedSize += processedFile.size;

          // Step 2: Upload main image
          if (progressCallback) {
            progressCallback((i / files.length) * 100, file.name, 'Uploading');
          }

          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${processedFile.name}`;
          const filePath = `${bucket}/${fileName}`;
          
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(filePath, processedFile, {
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadError) {
            results.push({
              url: null,
              success: false,
              error: uploadError.message,
              originalFile: file,
              processedFile,
              processingTime: Date.now() - fileStartTime
            });
            failedUploads++;
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

          // Step 3: Upload thumbnail if generated
          let thumbnailUrl: string | undefined;
          if (generateThumbnails && processingResult.thumbnailFile) {
            const thumbnailFileName = `thumb-${fileName}`;
            const thumbnailPath = `${bucket}/${thumbnailFileName}`;
            
            const { error: thumbnailError } = await supabase.storage
              .from(bucket)
              .upload(thumbnailPath, processingResult.thumbnailFile, {
                cacheControl: '3600',
                upsert: false
              });
            
            if (!thumbnailError) {
              const { data: { publicUrl: thumbUrl } } = supabase.storage
                .from(bucket)
                .getPublicUrl(thumbnailPath);
              thumbnailUrl = thumbUrl;
            }
          }

          // Step 4: Extract metadata if requested
          let metadata: Record<string, any> | undefined;
          if (extractMetadata) {
            try {
              const { getImageInfo } = await import('../utils/imageUtils');
              const imageInfo = await getImageInfo(processedFile);
              metadata = {
                name: imageInfo.name,
                size: imageInfo.size,
                type: imageInfo.type,
                dimensions: imageInfo.dimensions,
                aspectRatio: imageInfo.aspectRatio,
                validationStatus: imageInfo.validationStatus,
                errors: imageInfo.errors,
                warnings: imageInfo.warnings
              };
            } catch (metadataError) {
              console.warn('Failed to extract metadata:', metadataError);
            }
          }

          // Calculate compression ratio
          const compressionRatio = ((file.size - processedFile.size) / file.size) * 100;
          const processingTime = Date.now() - fileStartTime;

          results.push({
            url: publicUrl || null,
            thumbnailUrl,
            metadata,
            success: true,
            originalFile: file,
            processedFile,
            compressionRatio: Math.round(compressionRatio),
            processingTime
          });

          successfulUploads++;

        } catch (error) {
          results.push({
            url: null,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            originalFile: file,
            processingTime: Date.now() - fileStartTime
          });
          failedUploads++;
        }
      }

      if (progressCallback) {
        progressCallback(100, 'Complete', 'Finished');
      }

    } catch (error) {
      console.error('Batch processing failed:', error);
    }

    const totalTime = Date.now() - startTime;
    const averageCompression = totalOriginalSize > 0 ? 
      ((totalOriginalSize - totalProcessedSize) / totalOriginalSize) * 100 : 0;
    const averageProcessingTime = successfulUploads > 0 ? 
      results.filter(r => r.processingTime).reduce((sum, r) => sum + (r.processingTime || 0), 0) / successfulUploads : 0;

    return {
      success: successfulUploads > 0,
      results,
      summary: {
        totalFiles: files.length,
        successfulUploads,
        failedUploads,
        totalOriginalSize,
        totalProcessedSize,
        averageCompression: Math.round(averageCompression),
        averageProcessingTime: Math.round(averageProcessingTime)
      }
    };
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

  /**
   * Save media (images/videos) for a venue to the venue_media table
   * @param venueId - The ID of the venue
   * @param media - Array of media objects: { url, type, order_index, alt_text, metadata }
   */
  static async saveVenueMedia(venueId: string, media: { url: string; type: string; order_index: number; alt_text?: string; metadata?: Record<string, unknown> }[]): Promise<void> {
    for (const [index, m] of media.entries()) {
      await supabase.from('venue_media').insert({
        venue_id: venueId,
        url: m.url,
        type: m.type,
        order_index: m.order_index ?? index,
        alt_text: m.alt_text ?? '',
        metadata: m.metadata
      });
    }
  }

  /**
   * Save amenities for a venue to the venue_amenities table
   * @param venueId - The ID of the venue
   * @param amenities - Array of amenity names (strings)
   *
   * This will ensure each amenity exists in the amenities table, then insert into venue_amenities.
   */
  static async saveVenueAmenities(venueId: string, amenities: string[]): Promise<void> {
    for (const amenityName of amenities) {
      // Ensure amenity exists in amenities table
      const { data: amenity } = await supabase
        .from('amenities')
        .select('id')
        .eq('name', amenityName)
        .single();
      let amenityId;
      if (!amenity) {
        // Insert new amenity
        const { data: inserted } = await supabase
          .from('amenities')
          .insert({ name: amenityName })
          .select('id')
          .single();
        amenityId = inserted?.id;
      } else {
        amenityId = amenity.id;
      }
      if (amenityId) {
        await supabase.from('venue_amenities').insert({
          venue_id: venueId,
          amenity_id: amenityId
        });
      }
    }
  }

  /**
   * Get the current user's most recent venue submission status
   */
  static async getUserVenueSubmissionStatus(): Promise<string> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return 'none';
      const { data, error } = await supabase
        .from('venues')
        .select('approval_status')
        .eq('submitted_by', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle to avoid errors if no venue exists
      if (error) {
        console.error('Error fetching user venue submission status:', error);
        return 'unknown';
      }
      return data?.approval_status || 'none';
    } catch (error) {
      console.error('Error in getUserVenueSubmissionStatus:', error);
      return 'unknown';
    }
  }
} 