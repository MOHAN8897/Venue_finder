/**
 * Enhanced cropping function with better error handling and format options
 * @param imageSrc - Image source (URL or File)
 * @param crop - Crop area coordinates and dimensions
 * @param options - Processing options (format, quality)
 * @returns Promise<Blob> - The cropped image blob
 */
export async function getCroppedImg(
  imageSrc: string | File, 
  crop: { x: number; y: number; width: number; height: number; },
  options: { format?: 'jpeg' | 'png' | 'webp'; quality?: number } = {}
): Promise<Blob> {
  const { format = 'webp', quality = 0.8 } = options;
  
  try {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Canvas is empty'));
        }
      }, `image/${format}`, quality);
    });
  } catch (error) {
    throw new Error(`Cropping failed: ${(error as Error).message}`);
  }
}

function createImage(source: string | File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error: unknown) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    
    if (typeof source === 'string') {
      image.src = source;
    } else {
      image.src = URL.createObjectURL(source);
    }
  });
}

/**
 * Enhanced WebP conversion with better error handling and options
 * @param file - The original image file
 * @param options - Conversion options (quality, format)
 * @returns Promise<Blob> - The converted image blob
 */
export async function convertToWebP(
  file: File, 
  options: { quality?: number; format?: 'webp' | 'jpeg' | 'png' } = {}
): Promise<Blob> {
  const { quality = 0.8, format = 'webp' } = options;
  
  try {
    const img = await createImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = img.width;
    canvas.height = img.height;
    
    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(img, 0, 0);
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error(`${format.toUpperCase()} conversion failed`));
        },
        `image/${format}`,
        quality
      );
    });
  } catch (error) {
    throw new Error(`Image conversion failed: ${(error as Error).message}`);
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use convertToWebP with options instead
 */
export async function convertToWebPLegacy(file: File, quality: number = 0.8): Promise<Blob> {
  return convertToWebP(file, { quality, format: 'webp' });
}