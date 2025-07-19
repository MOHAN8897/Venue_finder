/**
 * Image Validation Utilities
 * 
 * Comprehensive validation functions for venue image uploads
 * Ensures industry-standard quality and format requirements
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions?: string[];
}

export interface ImageValidationOptions {
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  maxFileSize?: number; // in bytes
  allowedFormats?: string[];
  aspectRatioTolerance?: number; // percentage (0.05 = 5%)
  qualityThreshold?: number; // 0-1
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_VALIDATION_OPTIONS: Required<ImageValidationOptions> = {
  minWidth: 1200,
  minHeight: 675,
  maxWidth: 4000,
  maxHeight: 3000,
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
  aspectRatioTolerance: 0.05, // 5%
  qualityThreshold: 0.3
};

export const ASPECT_RATIO_16_9 = 16 / 9; // 1.777777...

export const ERROR_MESSAGES = {
  DIMENSIONS_TOO_SMALL: 'Image dimensions are too small. Minimum required: 1200x675 pixels.',
  DIMENSIONS_TOO_LARGE: 'Image dimensions are too large. Maximum allowed: 4000x3000 pixels.',
  FILE_SIZE_TOO_LARGE: 'File size is too large. Maximum allowed: 5MB.',
  INVALID_FORMAT: 'Invalid file format. Supported formats: JPG, PNG, WebP, HEIC.',
  ASPECT_RATIO_INVALID: 'Image aspect ratio should be close to 16:9 (landscape).',
  QUALITY_TOO_LOW: 'Image quality is too low. Please use a higher quality image.',
  DUPLICATE_IMAGE: 'This image appears to be a duplicate.',
  FILE_TOO_SMALL: 'File size is too small. Image may be corrupted.',
  UNSUPPORTED_FORMAT: 'Unsupported image format.'
} as const;

export const WARNING_MESSAGES = {
  DIMENSIONS_SUBOPTIMAL: 'Image dimensions are below optimal (1920x1080 pixels).',
  ASPECT_RATIO_CLOSE: 'Image aspect ratio is close to 16:9 but not exact.',
  QUALITY_ACCEPTABLE: 'Image quality is acceptable but could be improved.'
} as const;

export const SUGGESTION_MESSAGES = {
  CROP_TO_16_9: 'Consider cropping this image to 16:9 aspect ratio for better display.',
  USE_HIGHER_RESOLUTION: 'Consider using a higher resolution image for better quality.',
  OPTIMIZE_FILE_SIZE: 'Consider optimizing the file size for faster uploads.'
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for dimension analysis'));
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate aspect ratio from dimensions
 */
export function calculateAspectRatio(width: number, height: number): number {
  return width / height;
}

/**
 * Check if aspect ratio is close to target ratio within tolerance
 */
export function isAspectRatioValid(
  width: number, 
  height: number, 
  targetRatio: number = ASPECT_RATIO_16_9,
  tolerance: number = 0.05
): boolean {
  const actualRatio = calculateAspectRatio(width, height);
  const difference = Math.abs(actualRatio - targetRatio);
  return difference <= tolerance;
}

/**
 * Generate file hash for duplicate detection
 */
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number, 
  height: number, 
  options: Partial<ImageValidationOptions> = {}
): ValidationResult {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check minimum dimensions
  if (width < opts.minWidth || height < opts.minHeight) {
    errors.push(ERROR_MESSAGES.DIMENSIONS_TOO_SMALL);
  }

  // Check maximum dimensions
  if (width > opts.maxWidth || height > opts.maxHeight) {
    errors.push(ERROR_MESSAGES.DIMENSIONS_TOO_LARGE);
  }

  // Check if dimensions are suboptimal
  if (width < 1920 || height < 1080) {
    warnings.push(WARNING_MESSAGES.DIMENSIONS_SUBOPTIMAL);
    suggestions.push(SUGGESTION_MESSAGES.USE_HIGHER_RESOLUTION);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Validate image quality using canvas analysis
 */
export async function validateImageQuality(
  file: File, 
  threshold: number = 0.3
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check file size first
    if (file.size < 1024) { // Less than 1KB
      errors.push(ERROR_MESSAGES.FILE_TOO_SMALL);
      return { isValid: false, errors, warnings };
    }

    // Load image and analyze quality
    const img = await createImageFromFile(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      errors.push('Failed to create canvas context for quality analysis');
      return { isValid: false, errors, warnings };
    }

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Calculate average brightness and contrast
    let totalBrightness = 0;
    let totalContrast = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Calculate brightness (0-1)
      const brightness = (r + g + b) / (3 * 255);
      totalBrightness += brightness;
      
      // Calculate contrast (simplified)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const contrast = (max - min) / 255;
      totalContrast += contrast;
      
      pixelCount++;
    }

    const avgBrightness = totalBrightness / pixelCount;
    const avgContrast = totalContrast / pixelCount;

    // Quality assessment based on brightness and contrast
    let qualityScore = 0;
    
    // Brightness should be between 0.1 and 0.9 (not too dark or too bright)
    if (avgBrightness >= 0.1 && avgBrightness <= 0.9) {
      qualityScore += 0.5;
    }
    
    // Contrast should be above 0.1 (not too flat)
    if (avgContrast >= 0.1) {
      qualityScore += 0.5;
    }

    if (qualityScore < threshold) {
      errors.push(ERROR_MESSAGES.QUALITY_TOO_LOW);
    } else if (qualityScore < 0.7) {
      warnings.push(WARNING_MESSAGES.QUALITY_ACCEPTABLE);
    }

  } catch (error) {
    errors.push('Failed to analyze image quality');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate image format
 */
export function validateImageFormat(
  file: File, 
  allowedFormats: string[] = DEFAULT_VALIDATION_OPTIONS.allowedFormats
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check MIME type
  if (!allowedFormats.includes(file.type)) {
    errors.push(ERROR_MESSAGES.INVALID_FORMAT);
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp', 'heic'];
  
  if (!extension || !validExtensions.includes(extension)) {
    errors.push(ERROR_MESSAGES.UNSUPPORTED_FORMAT);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate aspect ratio
 */
export function validateAspectRatio(
  width: number, 
  height: number, 
  targetRatio: number = ASPECT_RATIO_16_9,
  tolerance: number = 0.05
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const actualRatio = calculateAspectRatio(width, height);
  const difference = Math.abs(actualRatio - targetRatio);

  if (difference > tolerance) {
    errors.push(ERROR_MESSAGES.ASPECT_RATIO_INVALID);
    suggestions.push(SUGGESTION_MESSAGES.CROP_TO_16_9);
  } else if (difference > tolerance * 0.5) {
    warnings.push(WARNING_MESSAGES.ASPECT_RATIO_CLOSE);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Detect duplicate images
 */
export async function detectDuplicateImages(
  files: File[], 
  existingHashes: string[] = []
): Promise<{ duplicates: string[]; hashes: string[] }> {
  const hashes: string[] = [];
  const duplicates: string[] = [];

  for (const file of files) {
    try {
      const hash = await generateFileHash(file);
      hashes.push(hash);
      
      // Check against existing hashes
      if (existingHashes.includes(hash)) {
        duplicates.push(file.name);
      }
      
      // Check against other files in the same batch
      const currentIndex = hashes.length - 1;
      for (let i = 0; i < currentIndex; i++) {
        if (hashes[i] === hash) {
          duplicates.push(file.name);
          break;
        }
      }
    } catch (error) {
      console.error('Failed to generate hash for file:', file.name);
    }
  }

  return { duplicates, hashes };
}

/**
 * Comprehensive image validation
 */
export async function validateImage(
  file: File, 
  options: Partial<ImageValidationOptions> = {},
  existingHashes: string[] = []
): Promise<ValidationResult> {
  const opts = { ...DEFAULT_VALIDATION_OPTIONS, ...options };
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Check file size
  if (file.size > opts.maxFileSize) {
    errors.push(ERROR_MESSAGES.FILE_SIZE_TOO_LARGE);
  }

  // Check format
  const formatResult = validateImageFormat(file, opts.allowedFormats);
  errors.push(...formatResult.errors);
  warnings.push(...formatResult.warnings);

  // If format is invalid, stop here
  if (formatResult.errors.length > 0) {
    return { isValid: false, errors, warnings, suggestions };
  }

  try {
    // Get dimensions
    const dimensions = await getImageDimensions(file);
    
    // Validate dimensions
    const dimensionResult = validateImageDimensions(dimensions.width, dimensions.height, opts);
    errors.push(...dimensionResult.errors);
    warnings.push(...dimensionResult.warnings);
    suggestions.push(...(dimensionResult.suggestions || []));

    // Validate aspect ratio
    const aspectRatioResult = validateAspectRatio(
      dimensions.width, 
      dimensions.height, 
      ASPECT_RATIO_16_9, 
      opts.aspectRatioTolerance
    );
    errors.push(...aspectRatioResult.errors);
    warnings.push(...aspectRatioResult.warnings);
    suggestions.push(...(aspectRatioResult.suggestions || []));

    // Validate quality
    const qualityResult = await validateImageQuality(file, opts.qualityThreshold);
    errors.push(...qualityResult.errors);
    warnings.push(...qualityResult.warnings);

  } catch (error) {
    errors.push('Failed to analyze image dimensions');
  }

  // Check for duplicates
  const { duplicates } = await detectDuplicateImages([file], existingHashes);
  if (duplicates.length > 0) {
    errors.push(ERROR_MESSAGES.DUPLICATE_IMAGE);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
}

/**
 * Validate multiple images
 */
export async function validateImages(
  files: File[], 
  options: Partial<ImageValidationOptions> = {}
): Promise<{
  results: ValidationResult[];
  overallValid: boolean;
  totalErrors: number;
  totalWarnings: number;
}> {
  const results: ValidationResult[] = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  const existingHashes: string[] = [];

  for (const file of files) {
    const result = await validateImage(file, options, existingHashes);
    results.push(result);
    
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;

    // Add hash to existing hashes for duplicate detection
    try {
      const hash = await generateFileHash(file);
      existingHashes.push(hash);
    } catch (error) {
      console.error('Failed to generate hash for file:', file.name);
    }
  }

  return {
    results,
    overallValid: totalErrors === 0,
    totalErrors,
    totalWarnings
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create Image object from File
 */
function createImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get validation summary for UI display
 */
export function getValidationSummary(results: ValidationResult[]): {
  validCount: number;
  invalidCount: number;
  totalErrors: number;
  totalWarnings: number;
} {
  let validCount = 0;
  let invalidCount = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  results.forEach(result => {
    if (result.isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  return {
    validCount,
    invalidCount,
    totalErrors,
    totalWarnings
  };
} 