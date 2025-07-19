import {
  validateImageDimensions,
  validateImageQuality,
  validateImageFormat,
  validateAspectRatio,
  detectDuplicateImages,
  ValidationResult,
  ImageValidationOptions,
  getImageDimensions
} from '../imageValidation';

// Mock canvas for testing
const mockCanvas = {
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(1000).fill(128) // Mock image data
    }))
  })),
  width: 1920,
  height: 1080
};

// Mock createElement
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockCanvas)
});

describe('Image Validation Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateImageDimensions', () => {
    it('should validate minimum dimensions correctly', () => {
      const options: Partial<ImageValidationOptions> = {
        minWidth: 1200,
        minHeight: 675,
        maxWidth: 4000,
        maxHeight: 3000
      };

      const result = validateImageDimensions(1920, 1080, options);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect images below minimum dimensions', () => {
      const options: Partial<ImageValidationOptions> = {
        minWidth: 1200,
        minHeight: 675
      };

      const result = validateImageDimensions(800, 600, options);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image dimensions are too small. Minimum required: 1200x675 pixels.');
    });

    it('should detect images above maximum dimensions', () => {
      const options: Partial<ImageValidationOptions> = {
        maxWidth: 2000,
        maxHeight: 1500
      };

      const result = validateImageDimensions(3000, 2000, options);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image dimensions are too large. Maximum allowed: 4000x3000 pixels.');
    });
  });

  describe('validateImageFormat', () => {
    it('should validate supported formats', () => {
      const supportedFiles = [
        new File([''], 'test.jpg', { type: 'image/jpeg' }),
        new File([''], 'test.png', { type: 'image/png' }),
        new File([''], 'test.webp', { type: 'image/webp' })
      ];

      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

      supportedFiles.forEach(file => {
        const result = validateImageFormat(file, allowedFormats);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    it('should reject unsupported formats', () => {
      const unsupportedFile = new File([''], 'test.gif', { type: 'image/gif' });
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

      const result = validateImageFormat(unsupportedFile, allowedFormats);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file format. Supported formats: JPG, PNG, WebP, HEIC.');
    });

    it('should validate file extensions', () => {
      const file = new File([''], 'test.txt', { type: 'image/jpeg' });
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

      const result = validateImageFormat(file, allowedFormats);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file format. Supported formats: JPG, PNG, WebP, HEIC.');
    });
  });

  describe('validateAspectRatio', () => {
    it('should validate correct aspect ratio', () => {
      const result = validateAspectRatio(1920, 1080, 16 / 9, 0.05);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect incorrect aspect ratio', () => {
      const result = validateAspectRatio(1000, 1000, 16 / 9, 0.05);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image aspect ratio should be close to 16:9 (landscape).');
    });

    it('should provide cropping suggestions', () => {
      const result = validateAspectRatio(2000, 1500, 16 / 9, 0.05);
      expect(result.isValid).toBe(false);
      expect(result.suggestions).toContain('Consider cropping this image to 16:9 aspect ratio for better display.');
    });
  });

  describe('validateImageQuality', () => {
    it('should validate good quality images', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const threshold = 0.3;

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any
      };

      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.Image = jest.fn(() => mockImage) as any;

      const result = await validateImageQuality(mockFile, threshold);

      expect(result.isValid).toBe(true);
    });

    it('should detect low quality images', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const threshold = 0.8;

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any
      };

      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.Image = jest.fn(() => mockImage) as any;

      const result = await validateImageQuality(mockFile, threshold);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Image quality is too low. Please use a higher quality image.');
    });
  });

  describe('detectDuplicateImages', () => {
    it('should detect duplicate files', async () => {
      const file1 = new File(['same content'], 'image1.jpg', { type: 'image/jpeg' });
      const file2 = new File(['same content'], 'image2.jpg', { type: 'image/jpeg' });
      const file3 = new File(['different content'], 'image3.jpg', { type: 'image/jpeg' });

      const files = [file1, file2, file3];
      const result = await detectDuplicateImages(files);

      expect(result.duplicates.length).toBeGreaterThan(0);
    });

    it('should handle empty file array', async () => {
      const result = await detectDuplicateImages([]);
      expect(result.duplicates).toHaveLength(0);
    });
  });

  describe('getImageDimensions', () => {
    it('should get image dimensions correctly', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any
      };

      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.Image = jest.fn(() => mockImage) as any;

      const dimensions = await getImageDimensions(mockFile);

      expect(dimensions.width).toBe(1920);
      expect(dimensions.height).toBe(1080);
    });
  });

  describe('Integration Tests', () => {
    it('should validate a complete image workflow', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const options: Partial<ImageValidationOptions> = {
        minWidth: 1200,
        minHeight: 675,
        maxFileSize: 5 * 1024 * 1024,
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        aspectRatioTolerance: 0.05,
        qualityThreshold: 0.3
      };

      const mockImage = {
        width: 1920,
        height: 1080,
        onload: null as any,
        onerror: null as any
      };

      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.Image = jest.fn(() => mockImage) as any;

      // Test all validation functions
      const dimensionResult = validateImageDimensions(1920, 1080, options);
      const formatResult = validateImageFormat(mockFile, options.allowedFormats || []);
      const aspectRatioResult = validateAspectRatio(1920, 1080, 16 / 9, 0.05);
      const qualityResult = await validateImageQuality(mockFile, 0.3);

      expect(dimensionResult.isValid).toBe(true);
      expect(formatResult.isValid).toBe(true);
      expect(aspectRatioResult.isValid).toBe(true);
      expect(qualityResult.isValid).toBe(true);
    });

    it('should handle validation errors gracefully', () => {
      const mockFile = new File([''], 'test.txt', { type: 'text/plain' });
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];

      const formatResult = validateImageFormat(mockFile, allowedFormats);
      expect(formatResult.isValid).toBe(false);
      expect(formatResult.errors.length).toBeGreaterThan(0);
    });
  });
}); 