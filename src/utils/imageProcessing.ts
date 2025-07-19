/**
 * Image Processing Utilities
 * 
 * Advanced image processing functions for venue image uploads
 * Includes cropping, compression, optimization, and aspect ratio adjustment
 */

import { ImageDimensions, ASPECT_RATIO_16_9 } from './imageValidation';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ProcessingOptions {
  quality?: number; // 0-1
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
  targetAspectRatio?: number;
}

export interface ProcessingResult {
  success: boolean;
  blob?: Blob;
  file?: File;
  error?: string;
  originalSize: number;
  processedSize: number;
  compressionRatio: number;
  dimensions: ImageDimensions;
}

export interface BatchProcessingResult {
  results: ProcessingResult[];
  successCount: number;
  failureCount: number;
  totalOriginalSize: number;
  totalProcessedSize: number;
  averageCompressionRatio: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_PROCESSING_OPTIONS: Required<ProcessingOptions> = {
  quality: 0.8,
  maxWidth: 1920,
  maxHeight: 1080,
  format: 'webp',
  maintainAspectRatio: true,
  targetAspectRatio: ASPECT_RATIO_16_9
};

export const SUPPORTED_FORMATS = {
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp'
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a canvas element with specified dimensions
 */
function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Load image from file or URL
 */
function loadImage(source: File | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (typeof source === 'string') {
      img.src = source;
    } else {
      img.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number,
  targetAspectRatio?: number
): ImageDimensions {
  let { width, height } = { width: originalWidth, height: originalHeight };

  // Apply target aspect ratio if specified
  if (targetAspectRatio) {
    const currentRatio = width / height;
    if (currentRatio > targetAspectRatio) {
      // Image is wider than target ratio, crop width
      width = height * targetAspectRatio;
    } else {
      // Image is taller than target ratio, crop height
      height = width / targetAspectRatio;
    }
  }

  // Scale down if exceeds maximum dimensions
  if (width > maxWidth || height > maxHeight) {
    const scaleX = maxWidth / width;
    const scaleY = maxHeight / height;
    const scale = Math.min(scaleX, scaleY);
    
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  return { width, height };
}

/**
 * Get MIME type for format
 */
function getMimeType(format: string): string {
  switch (format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/webp';
  }
}

// ============================================================================
// CORE PROCESSING FUNCTIONS
// ============================================================================

/**
 * Crop image to specified area
 */
export async function cropImage(
  file: File,
  cropArea: CropArea,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    const img = await loadImage(file);
    const canvas = createCanvas(cropArea.width, cropArea.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw cropped portion
    ctx.drawImage(
      img,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        getMimeType(opts.format),
        opts.quality
      );
    });

    const processedFile = new File([blob], file.name, { type: getMimeType(opts.format) });

    return {
      success: true,
      blob,
      file: processedFile,
      originalSize: file.size,
      processedSize: blob.size,
      compressionRatio: blob.size / file.size,
      dimensions: { width: cropArea.width, height: cropArea.height }
    };

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      dimensions: { width: 0, height: 0 }
    };
  }
}

/**
 * Resize image to specified dimensions
 */
export async function resizeImage(
  file: File,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    const img = await loadImage(file);
    const dimensions = calculateDimensions(
      img.width,
      img.height,
      opts.maxWidth,
      opts.maxHeight,
      opts.targetAspectRatio
    );

    const canvas = createCanvas(dimensions.width, dimensions.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw resized image
    ctx.drawImage(img, 0, 0, dimensions.width, dimensions.height);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        getMimeType(opts.format),
        opts.quality
      );
    });

    const processedFile = new File([blob], file.name, { type: getMimeType(opts.format) });

    return {
      success: true,
      blob,
      file: processedFile,
      originalSize: file.size,
      processedSize: blob.size,
      compressionRatio: blob.size / file.size,
      dimensions
    };

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      dimensions: { width: 0, height: 0 }
    };
  }
}

/**
 * Compress image with quality optimization
 */
export async function compressImage(
  file: File,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    const img = await loadImage(file);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw image at original size
    ctx.drawImage(img, 0, 0);

    // Convert to blob with specified quality
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        getMimeType(opts.format),
        opts.quality
      );
    });

    const processedFile = new File([blob], file.name, { type: getMimeType(opts.format) });

    return {
      success: true,
      blob,
      file: processedFile,
      originalSize: file.size,
      processedSize: blob.size,
      compressionRatio: blob.size / file.size,
      dimensions: { width: img.width, height: img.height }
    };

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      dimensions: { width: 0, height: 0 }
    };
  }
}

/**
 * Optimize image for web (resize + compress + convert to WebP)
 */
export async function optimizeImage(
  file: File,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    // First resize the image
    const resizeResult = await resizeImage(file, {
      ...opts,
      format: 'webp',
      quality: opts.quality
    });

    if (!resizeResult.success) {
      return resizeResult;
    }

    // Then compress if needed
    if (resizeResult.compressionRatio > 0.9) {
      const compressResult = await compressImage(resizeResult.file!, {
        ...opts,
        format: 'webp',
        quality: opts.quality * 0.9 // Slightly more aggressive compression
      });

      if (compressResult.success) {
        return {
          ...compressResult,
          originalSize: file.size,
          compressionRatio: compressResult.processedSize / file.size
        };
      }
    }

    return resizeResult;

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      dimensions: { width: 0, height: 0 }
    };
  }
}

// ============================================================================
// ADVANCED PROCESSING FUNCTIONS
// ============================================================================

/**
 * Auto-crop image to 16:9 aspect ratio
 */
export async function autoCropTo16_9(
  file: File,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    const img = await loadImage(file);
    const { width, height } = img;
    const currentRatio = width / height;
    const targetRatio = ASPECT_RATIO_16_9;

    let cropArea: CropArea;

    if (currentRatio > targetRatio) {
      // Image is wider than 16:9, crop width
      const newWidth = height * targetRatio;
      const x = (width - newWidth) / 2;
      cropArea = {
        x: Math.round(x),
        y: 0,
        width: Math.round(newWidth),
        height
      };
    } else {
      // Image is taller than 16:9, crop height
      const newHeight = width / targetRatio;
      const y = (height - newHeight) / 2;
      cropArea = {
        x: 0,
        y: Math.round(y),
        width,
        height: Math.round(newHeight)
      };
    }

    return await cropImage(file, cropArea, {
      ...opts,
      format: 'webp',
      quality: opts.quality
    });

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      dimensions: { width: 0, height: 0 }
    };
  }
}

/**
 * Create thumbnail from image
 */
export async function createThumbnail(
  file: File,
  thumbnailSize: number = 300,
  options: Partial<ProcessingOptions> = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    const img = await loadImage(file);
    const { width, height } = img;
    
    // Calculate thumbnail dimensions maintaining aspect ratio
    let thumbWidth, thumbHeight;
    if (width > height) {
      thumbWidth = thumbnailSize;
      thumbHeight = (height / width) * thumbnailSize;
    } else {
      thumbHeight = thumbnailSize;
      thumbWidth = (width / height) * thumbnailSize;
    }

    const canvas = createCanvas(thumbWidth, thumbHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Draw thumbnail
    ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        },
        getMimeType(opts.format),
        opts.quality
      );
    });

    const thumbnailName = `thumb_${file.name}`;
    const processedFile = new File([blob], thumbnailName, { type: getMimeType(opts.format) });

    return {
      success: true,
      blob,
      file: processedFile,
      originalSize: file.size,
      processedSize: blob.size,
      compressionRatio: blob.size / file.size,
      dimensions: { width: thumbWidth, height: thumbHeight }
    };

  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      originalSize: file.size,
      processedSize: 0,
      compressionRatio: 0,
      dimensions: { width: 0, height: 0 }
    };
  }
}

// ============================================================================
// BATCH PROCESSING FUNCTIONS
// ============================================================================

/**
 * Process multiple images with the same options
 */
export async function processImages(
  files: File[],
  processor: (file: File, options: Partial<ProcessingOptions>) => Promise<ProcessingResult>,
  options: Partial<ProcessingOptions> = {}
): Promise<BatchProcessingResult> {
  const results: ProcessingResult[] = [];
  let successCount = 0;
  let failureCount = 0;
  let totalOriginalSize = 0;
  let totalProcessedSize = 0;

  for (const file of files) {
    const result = await processor(file, options);
    results.push(result);
    
    if (result.success) {
      successCount++;
      totalProcessedSize += result.processedSize;
    } else {
      failureCount++;
    }
    
    totalOriginalSize += result.originalSize;
  }

  const averageCompressionRatio = totalOriginalSize > 0 ? totalProcessedSize / totalOriginalSize : 0;

  return {
    results,
    successCount,
    failureCount,
    totalOriginalSize,
    totalProcessedSize,
    averageCompressionRatio
  };
}

/**
 * Optimize multiple images for web
 */
export async function optimizeImages(
  files: File[],
  options: Partial<ProcessingOptions> = {}
): Promise<BatchProcessingResult> {
  return processImages(files, optimizeImage, options);
}

/**
 * Auto-crop multiple images to 16:9
 */
export async function autoCropImagesTo16_9(
  files: File[],
  options: Partial<ProcessingOptions> = {}
): Promise<BatchProcessingResult> {
  return processImages(files, autoCropTo16_9, options);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get file extension for format
 */
export function getFileExtension(format: string): string {
  switch (format) {
    case 'jpeg':
      return '.jpg';
    case 'png':
      return '.png';
    case 'webp':
      return '.webp';
    default:
      return '.webp';
  }
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
 * Calculate compression percentage
 */
export function getCompressionPercentage(originalSize: number, processedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - processedSize) / originalSize) * 100);
}

/**
 * Get processing summary for UI display
 */
export function getProcessingSummary(result: BatchProcessingResult): {
  totalFiles: number;
  successRate: number;
  averageCompression: number;
  totalSizeSaved: number;
} {
  const totalFiles = result.successCount + result.failureCount;
  const successRate = totalFiles > 0 ? (result.successCount / totalFiles) * 100 : 0;
  const averageCompression = getCompressionPercentage(result.totalOriginalSize, result.totalProcessedSize);
  const totalSizeSaved = result.totalOriginalSize - result.totalProcessedSize;

  return {
    totalFiles,
    successRate,
    averageCompression,
    totalSizeSaved
  };
} 