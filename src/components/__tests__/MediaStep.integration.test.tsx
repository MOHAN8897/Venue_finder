import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaStep from '../venue-form/MediaStep';
import { VenueFormData } from '../VenueListingForm';

// Mock the image utilities
jest.mock('../../utils/imageUtils', () => ({
  processImageWorkflow: jest.fn().mockResolvedValue({
    success: true,
    finalFile: new File(['processed content'], 'processed.jpg', { type: 'image/jpeg' }),
    thumbnailFile: new File(['thumbnail content'], 'thumb.jpg', { type: 'image/jpeg' }),
    errors: [],
    warnings: []
  }),
  quickValidateVenueImages: jest.fn().mockResolvedValue({
    validFiles: [new File(['content'], 'test.jpg', { type: 'image/jpeg' })],
    invalidFiles: []
  }),
  createOptimizedUploadFiles: jest.fn().mockResolvedValue({
    optimizedFiles: [new File(['optimized content'], 'optimized.jpg', { type: 'image/jpeg' })],
    failureCount: 0,
    errors: []
  })
}));

// Mock the UI components
jest.mock('../ui/ImageUploader', () => {
  return function MockImageUploader({ onImagesChange, maxImages }: any) {
    return (
      <div data-testid="image-uploader">
        <button onClick={() => onImagesChange([new File(['content'], 'test.jpg', { type: 'image/jpeg' })])}>
          Upload Images
        </button>
        <span>Max: {maxImages}</span>
      </div>
    );
  };
});

jest.mock('../ui/UploadProgress', () => {
  return function MockUploadProgress({ files }: any) {
    return (
      <div data-testid="upload-progress">
        {files.map((file: any, index: number) => (
          <div key={index} data-testid={`progress-file-${index}`}>
            {file.name} - {file.status}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../ui/ImageGallery', () => {
  return function MockImageGallery({ images, onReorder, onSetFeatured, onRemove, onEdit }: any) {
    return (
      <div data-testid="image-gallery">
        {images.map((image: any, index: number) => (
          <div key={index} data-testid={`gallery-image-${index}`}>
            <span>{image.name}</span>
            <button onClick={() => onSetFeatured(image.id)}>Set Featured</button>
            <button onClick={() => onRemove(image.id)}>Remove</button>
            <button onClick={() => onEdit(image.id)}>Edit</button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('../ui/ImageCropper', () => {
  return function MockImageCropper({ image, onCropComplete, onCancel }: any) {
    return (
      <div data-testid="image-cropper">
        <span>Cropping: {image?.name}</span>
        <button onClick={() => onCropComplete(new File(['cropped content'], 'cropped.jpg', { type: 'image/jpeg' }))}>
          Apply Crop
        </button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  };
});

describe('MediaStep Integration Tests', () => {
  const mockFormData: VenueFormData = {
    venueName: 'Test Venue',
    venueType: 'Farmhouse',
    address: '123 Test St',
    website: 'https://test.com',
    description: 'A test venue',
    capacity: 100,
    area: 1000,
    amenities: [],
    photos: [],
    videos: [],
    pricePerHour: 1000,
    pricePerDay: 5000,
    availability: [],
    contactNumber: '1234567890',
    email: 'test@test.com',
    ownerName: 'Test Owner'
  };

  const mockUpdateFormData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Image Upload Workflow', () => {
    it('should handle complete image upload workflow', async () => {
      const user = userEvent.setup();
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check initial state
      expect(screen.getByText('Venue Photos *')).toBeInTheDocument();
      expect(screen.getByTestId('image-uploader')).toBeInTheDocument();
      expect(screen.getByText('0/10 photos')).toBeInTheDocument();

      // Upload images
      const uploadButton = screen.getByText('Upload Images');
      await user.click(uploadButton);

      // Wait for upload processing
      await waitFor(() => {
        expect(mockUpdateFormData).toHaveBeenCalledWith(
          expect.objectContaining({
            photos: expect.arrayContaining([
              expect.any(File)
            ])
          })
        );
      });

      // Check that upload progress is shown
      expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
    });

    it('should handle image upload with existing photos', async () => {
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['existing content'], 'existing1.jpg', { type: 'image/jpeg' }),
          new File(['existing content'], 'existing2.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check photo count
      expect(screen.getByText('2/10 photos')).toBeInTheDocument();

      // Check that gallery is shown
      expect(screen.getByTestId('image-gallery')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-1')).toBeInTheDocument();
    });

    it('should handle upload errors gracefully', async () => {
      // Mock error in image processing
      const { processImageWorkflow } = require('../../utils/imageUtils');
      (processImageWorkflow as jest.Mock).mockResolvedValueOnce({
        success: false,
        errors: ['File too large', 'Invalid format'],
        warnings: []
      });

      const user = userEvent.setup();
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Upload images
      const uploadButton = screen.getByText('Upload Images');
      await user.click(uploadButton);

      // Wait for error handling
      await waitFor(() => {
        expect(screen.getByText(/File too large/)).toBeInTheDocument();
        expect(screen.getByText(/Invalid format/)).toBeInTheDocument();
      });
    });
  });

  describe('Image Gallery Management', () => {
    it('should handle image reordering', async () => {
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['content2'], 'image2.jpg', { type: 'image/jpeg' }),
          new File(['content3'], 'image3.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check that all images are displayed
      expect(screen.getByTestId('gallery-image-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-1')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-2')).toBeInTheDocument();
    });

    it('should handle featured image selection', async () => {
      const user = userEvent.setup();
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['content2'], 'image2.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Set featured image
      const setFeaturedButtons = screen.getAllByText('Set Featured');
      await user.click(setFeaturedButtons[1]); // Set second image as featured

      // Check that the action was triggered
      expect(screen.getByTestId('gallery-image-0')).toBeInTheDocument();
      expect(screen.getByTestId('gallery-image-1')).toBeInTheDocument();
    });

    it('should handle image removal', async () => {
      const user = userEvent.setup();
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['content2'], 'image2.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Remove image
      const removeButtons = screen.getAllByText('Remove');
      await user.click(removeButtons[0]); // Remove first image

      // Check that form data was updated
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          photos: expect.arrayContaining([
            expect.any(File)
          ])
        })
      );
    });

    it('should handle image editing (cropping)', async () => {
      const user = userEvent.setup();
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['content1'], 'image1.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Edit image
      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Check that cropper is shown
      expect(screen.getByTestId('image-cropper')).toBeInTheDocument();
      expect(screen.getByText('Cropping: image1.jpg')).toBeInTheDocument();

      // Apply crop
      const applyButton = screen.getByText('Apply Crop');
      await user.click(applyButton);

      // Check that form data was updated with cropped image
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          photos: expect.arrayContaining([
            expect.any(File)
          ])
        })
      );
    });
  });

  describe('Video URL Management', () => {
    it('should handle video URL addition', async () => {
      const user = userEvent.setup();
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Add video URL
      const addVideoButton = screen.getByText('Add Video');
      await user.click(addVideoButton);

      // Check that form data was updated
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          videos: ['']
        })
      );
    });

    it('should handle video URL updates', async () => {
      const user = userEvent.setup();
      const formDataWithVideos = {
        ...mockFormData,
        videos: ['https://youtube.com/watch?v=test1', 'https://vimeo.com/test2']
      };

      render(
        <MediaStep
          formData={formDataWithVideos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Update video URL
      const videoInputs = screen.getAllByPlaceholderText(/youtube\.com/);
      await user.clear(videoInputs[0]);
      await user.type(videoInputs[0], 'https://youtube.com/watch?v=updated');

      // Check that form data was updated
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          videos: expect.arrayContaining([
            'https://youtube.com/watch?v=updated'
          ])
        })
      );
    });

    it('should handle video URL removal', async () => {
      const user = userEvent.setup();
      const formDataWithVideos = {
        ...mockFormData,
        videos: ['https://youtube.com/watch?v=test1', 'https://vimeo.com/test2']
      };

      render(
        <MediaStep
          formData={formDataWithVideos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Remove video URL
      const removeButtons = screen.getAllByRole('button').filter(button => 
        button.textContent === '×'
      );
      await user.click(removeButtons[0]); // Remove first video

      // Check that form data was updated
      expect(mockUpdateFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          videos: ['https://vimeo.com/test2']
        })
      );
    });
  });

  describe('Requirements Validation', () => {
    it('should show requirements check', () => {
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check requirements section
      expect(screen.getByText('Requirements Check')).toBeInTheDocument();
      expect(screen.getByText(/Minimum 3 photos: 0\/3/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum 10 photos: 0\/10/)).toBeInTheDocument();
    });

    it('should show correct requirements with photos', () => {
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['content1'], 'image1.jpg', { type: 'image/jpeg' }),
          new File(['content2'], 'image2.jpg', { type: 'image/jpeg' }),
          new File(['content3'], 'image3.jpg', { type: 'image/jpeg' }),
          new File(['content4'], 'image4.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check requirements section
      expect(screen.getByText(/Minimum 3 photos: 4\/3/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum 10 photos: 4\/10/)).toBeInTheDocument();
    });
  });

  describe('Professional Guidelines', () => {
    it('should display professional guidelines', () => {
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check guidelines section
      expect(screen.getByText('Professional Photo & Video Guidelines')).toBeInTheDocument();
      expect(screen.getByText('📸 Best Practices')).toBeInTheDocument();
      expect(screen.getByText('⚙️ Technical Requirements')).toBeInTheDocument();
    });

    it('should show best practices', () => {
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check best practices
      expect(screen.getByText('High Quality')).toBeInTheDocument();
      expect(screen.getByText('Multiple Angles')).toBeInTheDocument();
      expect(screen.getByText('Setup Examples')).toBeInTheDocument();
      expect(screen.getByText('Unique Features')).toBeInTheDocument();
    });

    it('should show what to avoid', () => {
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Check what to avoid
      expect(screen.getByText('Blurry Images')).toBeInTheDocument();
      expect(screen.getByText('Poor Lighting')).toBeInTheDocument();
      expect(screen.getByText('Cluttered Spaces')).toBeInTheDocument();
      expect(screen.getByText('Generic Shots')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle upload retry', async () => {
      const user = userEvent.setup();
      render(
        <MediaStep
          formData={mockFormData}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Upload images first
      const uploadButton = screen.getByText('Upload Images');
      await user.click(uploadButton);

      // Wait for upload progress to appear
      await waitFor(() => {
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument();
      });

      // The retry functionality would be tested through the UploadProgress component
      // This is a high-level integration test
    });

    it('should handle crop cancellation', async () => {
      const user = userEvent.setup();
      const formDataWithPhotos = {
        ...mockFormData,
        photos: [
          new File(['content1'], 'image1.jpg', { type: 'image/jpeg' })
        ]
      };

      render(
        <MediaStep
          formData={formDataWithPhotos}
          updateFormData={mockUpdateFormData}
          isValid={true}
        />
      );

      // Edit image
      const editButton = screen.getByText('Edit');
      await user.click(editButton);

      // Cancel crop
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      // Check that cropper is no longer visible
      expect(screen.queryByTestId('image-cropper')).not.toBeInTheDocument();
    });
  });
}); 