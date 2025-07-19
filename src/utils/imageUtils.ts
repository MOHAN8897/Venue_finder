/**
 * Image Utilities Integration
 * 
 * Comprehensive integration of validation and processing utilities
 * Provides seamless workflow for venue image uploads
 */

import { 
  validateImage, 
  validateImages, 
  ValidationResult, 
  ImageValidationOptions,
  getImageDimensions,
  formatFileSize,
  getValidationSummary
} from './imageValidation';

import {
  optimizeImage,
  autoCropTo16_9,
  createThumbnail,
  optimizeImages,
  autoCropImagesTo16_9,
  ProcessingResult,
  ProcessingOptions,
  getProcessingSummary,
  getCompressionPercentage
} from './imageProcessing';

import { convertToWebP, getCroppedImg } from './cropImage';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ImageWorkflowOptions {
  validation?: Partial<ImageValidationOptions>;
  processing?: Partial<ProcessingOptions>;
  autoCrop?: boolean;
  createThumbnail?: boolean;
  thumbnailSize?: number;
}

export interface ImageWorkflowResult {
  originalFile: File;
  validationResult: ValidationResult;
  processingResult?: ProcessingResult;
  thumbnailResult?: ProcessingResult;
  finalFile?: File;
  thumbnailFile?: File;
  success: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface BatchWorkflowResult {
  results: ImageWorkflowResult[];
  successCount: number;
  failureCount: number;
  totalOriginalSize: number;
  totalProcessedSize: number;
  averageCompression: number;
  validationSummary: {
    totalErrors: number;
    totalWarnings: number;
    commonErrors: string[];
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_WORKFLOW_OPTIONS: Required<ImageWorkflowOptions> = {
  validation: {
    minWidth: 1200,
    minHeight: 675,
    maxWidth: 4000,
    maxHeight: 3000,
    maxFileSize: 5 * 1024 * 1024,
    allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
    aspectRatioTolerance: 0.05,
    qualityThreshold: 0.3
  },
  processing: {
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'webp',
    maintainAspectRatio: true,
    targetAspectRatio: 16 / 9
  },
  autoCrop: true,
  createThumbnail: true,
  thumbnailSize: 300
};

// ============================================================================
// CORE WORKFLOW FUNCTIONS
// ============================================================================

/**
 * Complete image workflow: validate → auto-fix → process → optimize
 * Enhanced to automatically fix common issues instead of just showing errors
 */
export async function processImageWorkflow(
  file: File,
  options: Partial<ImageWorkflowOptions> = {}
): Promise<ImageWorkflowResult> {
  const opts = { ...DEFAULT_WORKFLOW_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  try {
    // Step 1: Initial validation to identify issues
    const validationResult = await validateImage(file, opts.validation);
    
    // Step 2: Auto-fix common issues instead of failing
    let currentFile = file;
    let autoFixed = false;

    // Get image dimensions for analysis
    const dimensions = await getImageDimensions(file);
    const currentRatio = dimensions.width / dimensions.height;
    const targetRatio = 16 / 9;

    // Auto-fix: Resize if too large
    if (dimensions.width > (opts.validation.maxWidth || 4000) || dimensions.height > (opts.validation.maxHeight || 3000)) {
      warnings.push(`Image was automatically resized from ${dimensions.width}x${dimensions.height} to fit maximum dimensions`);
      
      const resizeResult = await optimizeImage(currentFile, {
        ...opts.processing,
        maxWidth: opts.validation.maxWidth || 4000,
        maxHeight: opts.validation.maxHeight || 3000,
        maintainAspectRatio: true
      });
      
      if (resizeResult.success && resizeResult.file) {
        currentFile = resizeResult.file;
        autoFixed = true;
      }
    }

    // Auto-fix: Crop to 16:9 if aspect ratio is significantly off
    const updatedDimensions = await getImageDimensions(currentFile);
    const updatedRatio = updatedDimensions.width / updatedDimensions.height;
    const ratioDifference = Math.abs(updatedRatio - targetRatio);
    
    if (ratioDifference > 0.1) { // More lenient threshold for auto-fixing
      warnings.push(`Image was automatically cropped to 16:9 aspect ratio (was ${updatedRatio.toFixed(2)}:1)`);
      
      const cropResult = await autoCropTo16_9(currentFile, opts.processing);
      if (cropResult.success && cropResult.file) {
        currentFile = cropResult.file;
        autoFixed = true;
      }
    }

    // Auto-fix: Compress if file size is too large
    if (currentFile.size > (opts.validation.maxFileSize || 5 * 1024 * 1024)) {
      warnings.push(`Image was automatically compressed to reduce file size`);
      
      const compressResult = await optimizeImage(currentFile, {
        ...opts.processing,
        quality: 0.7 // Lower quality for compression
      });
      
      if (compressResult.success && compressResult.file) {
        currentFile = compressResult.file;
        autoFixed = true;
      }
    }

    // Step 3: Final optimization
    let processingResult: ProcessingResult | undefined;
    let finalFile: File | undefined;

    // Always optimize for web delivery
    processingResult = await optimizeImage(currentFile, opts.processing);
    if (processingResult.success && processingResult.file) {
      finalFile = processingResult.file;
    }

    if (!finalFile) {
      // Fallback: use the current file if optimization fails
      finalFile = currentFile;
      warnings.push('Image optimization failed, using original file');
    }

    // Step 4: Create thumbnail if requested
    let thumbnailResult: ProcessingResult | undefined;
    let thumbnailFile: File | undefined;

    if (opts.createThumbnail && finalFile) {
      try {
        thumbnailResult = await createThumbnail(finalFile, opts.thumbnailSize, opts.processing);
        if (thumbnailResult.success && thumbnailResult.file) {
          thumbnailFile = thumbnailResult.file;
        }
      } catch (error) {
        warnings.push(`Thumbnail creation failed: ${(error as Error).message}`);
      }
    }

    // Step 5: Final validation of processed image
    const finalValidation = await validateImage(finalFile, opts.validation);
    
    // Add any remaining warnings from final validation
    warnings.push(...finalValidation.warnings);
    suggestions.push(...(finalValidation.suggestions || []));

    // Success message if auto-fixes were applied
    if (autoFixed) {
      suggestions.push('Image was automatically optimized for better display and performance');
    }

    return {
      originalFile: file,
      validationResult: finalValidation,
      processingResult: processingResult,
      thumbnailResult: thumbnailResult,
      finalFile: finalFile,
      thumbnailFile: thumbnailFile,
      success: true,
      errors,
      warnings,
      suggestions
    };

  } catch (error) {
    errors.push(`Processing failed: ${(error as Error).message}`);
    return {
      originalFile: file,
      validationResult: { isValid: false, errors: [], warnings: [] },
      success: false,
      errors,
      warnings,
      suggestions
    };
  }
}

/**
 * Process multiple images with complete workflow
 */
export async function processImagesWorkflow(
  files: File[],
  options: Partial<ImageWorkflowOptions> = {}
): Promise<BatchWorkflowResult> {
  const results: ImageWorkflowResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalOriginalSize = 0;
  let totalProcessedSize = 0;
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const file of files) {
    const result = await processImageWorkflow(file, options);
    results.push(result);
    
    if (result.success) {
      successCount++;
      if (result.finalFile) {
        totalProcessedSize += result.finalFile.size;
      }
    } else {
      failureCount++;
    }
    
    totalOriginalSize += file.size;
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  // Calculate compression
  const averageCompression = totalOriginalSize > 0 
    ? getCompressionPercentage(totalOriginalSize, totalProcessedSize)
    : 0;

  // Get common errors
  const errorCounts = allErrors.reduce((acc, error) => {
    acc[error] = (acc[error] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonErrors = Object.entries(errorCounts)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([error]) => error);

  return {
    results,
    successCount,
    failureCount,
    totalOriginalSize,
    totalProcessedSize,
    averageCompression,
    validationSummary: {
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      commonErrors
    }
  };
}

// ============================================================================
// VENUE-SPECIFIC UTILITIES
// ============================================================================

/**
 * Process venue images with venue-specific optimizations
 */
export async function processVenueImages(
  files: File[],
  options: Partial<ImageWorkflowOptions> = {}
): Promise<BatchWorkflowResult> {
  const venueOptions: ImageWorkflowOptions = {
    ...DEFAULT_WORKFLOW_OPTIONS,
    ...options,
    validation: {
      ...DEFAULT_WORKFLOW_OPTIONS.validation,
      ...options.validation,
      // Venue-specific validation
      minWidth: 1200,
      minHeight: 675,
      maxFileSize: 5 * 1024 * 1024 // 5MB
    },
    processing: {
      ...DEFAULT_WORKFLOW_OPTIONS.processing,
      ...options.processing,
      // Venue-specific processing
      format: 'webp',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    },
    autoCrop: true, // Always auto-crop venue images to 16:9
    createThumbnail: true,
    thumbnailSize: 300
  };

  return processImagesWorkflow(files, venueOptions);
}

/**
 * Quick validation for venue images (before upload)
 */
export async function quickValidateVenueImages(
  files: File[]
): Promise<{
  validFiles: File[];
  invalidFiles: { file: File; errors: string[] }[];
  summary: string;
}> {
  const validFiles: File[] = [];
  const invalidFiles: { file: File; errors: string[] }[] = [];

  for (const file of files) {
    const validationResult = await validateImage(file, {
      minWidth: 1200,
      minHeight: 675,
      maxFileSize: 5 * 1024 * 1024,
      allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (validationResult.isValid) {
      validFiles.push(file);
    } else {
      invalidFiles.push({ file, errors: validationResult.errors });
    }
  }

  const summary = `${validFiles.length} valid, ${invalidFiles.length} invalid files`;

  return {
    validFiles,
    invalidFiles,
    summary
  };
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

/**
 * Get comprehensive image information for UI display
 */
export async function getImageInfo(file: File): Promise<{
  name: string;
  size: string;
  type: string;
  dimensions?: { width: number; height: number };
  aspectRatio?: number;
  validationStatus: 'valid' | 'invalid' | 'pending';
  errors: string[];
  warnings: string[];
}> {
  const size = formatFileSize(file.size);
  const type = file.type;
  let dimensions: { width: number; height: number } | undefined;
  let aspectRatio: number | undefined;
  let validationStatus: 'valid' | 'invalid' | 'pending' = 'pending';
  let errors: string[] = [];
  let warnings: string[] = [];

  try {
    // Get dimensions
    dimensions = await getImageDimensions(file);
    aspectRatio = dimensions.width / dimensions.height;

    // Quick validation
    const validationResult = await validateImage(file, {
      minWidth: 1200,
      minHeight: 675,
      maxFileSize: 5 * 1024 * 1024
    });

    validationStatus = validationResult.isValid ? 'valid' : 'invalid';
    errors = validationResult.errors;
    warnings = validationResult.warnings;

  } catch (error) {
    validationStatus = 'invalid';
    errors.push('Failed to analyze image');
  }

  return {
    name: file.name,
    size,
    type,
    dimensions,
    aspectRatio,
    validationStatus,
    errors,
    warnings
  };
}

/**
 * Create optimized file for upload
 */
export async function createOptimizedUploadFile(
  file: File,
  options: Partial<ProcessingOptions> = {}
): Promise<{
  success: boolean;
  file?: File;
  error?: string;
  compressionRatio?: number;
}> {
  try {
    const result = await optimizeImage(file, {
      quality: 0.8,
      format: 'webp',
      maxWidth: 1920,
      maxHeight: 1080,
      ...options
    });

    if (result.success && result.file) {
      return {
        success: true,
        file: result.file,
        compressionRatio: result.compressionRatio
      };
    } else {
      return {
        success: false,
        error: result.error || 'Optimization failed'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Batch create optimized files for upload
 */
export async function createOptimizedUploadFiles(
  files: File[],
  options: Partial<ProcessingOptions> = {}
): Promise<{
  successCount: number;
  failureCount: number;
  optimizedFiles: File[];
  errors: string[];
  averageCompression: number;
}> {
  const optimizedFiles: File[] = [];
  const errors: string[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const file of files) {
    const result = await createOptimizedUploadFile(file, options);
    
    if (result.success && result.file) {
      optimizedFiles.push(result.file);
      successCount++;
      totalOriginalSize += file.size;
      totalOptimizedSize += result.file.size;
    } else {
      failureCount++;
      if (result.error) {
        errors.push(`${file.name}: ${result.error}`);
      }
    }
  }

  const averageCompression = totalOriginalSize > 0 
    ? getCompressionPercentage(totalOriginalSize, totalOptimizedSize)
    : 0;

  return {
    successCount,
    failureCount,
    optimizedFiles,
    errors,
    averageCompression
  };
}

// ============================================================================
// LEGACY COMPATIBILITY
// ============================================================================

/**
 * Legacy function for backward compatibility
 * @deprecated Use processImageWorkflow instead
 */
export async function processImageLegacy(
  file: File,
  options: { quality?: number; format?: 'webp' | 'jpeg' | 'png' } = {}
): Promise<{ success: boolean; file?: File; error?: string }> {
  try {
    const result = await convertToWebP(file, options);
    const processedFile = new File([result], file.name, { 
      type: `image/${options.format || 'webp'}` 
    });
    
    return {
      success: true,
      file: processedFile
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// ============================================================================
// EXPORT ALL UTILITIES
// ============================================================================

export {
  // Validation utilities
  validateImage,
  validateImages,
  getImageDimensions,
  formatFileSize,
  getValidationSummary,
  
  // Processing utilities
  optimizeImage,
  autoCropTo16_9,
  createThumbnail,
  optimizeImages,
  autoCropImagesTo16_9,
  getProcessingSummary,
  getCompressionPercentage,
  
  // Legacy utilities
  convertToWebP,
  getCroppedImg
};

export type {
  ValidationResult,
  ImageValidationOptions,
  ProcessingResult,
  ProcessingOptions
}; 