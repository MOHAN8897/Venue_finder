import React, { useState, useCallback, useRef } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { 
  Image, 
  Video, 
  Upload, 
  X, 
  Plus, 
  Info,
  CheckCircle,
  AlertCircle,
  Star,
  StarOff,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { VenueFormData } from '../VenueListingForm';
import ImageUploader from '../ui/ImageUploader';
import ImageCropper from '../ui/ImageCropper';
import UploadProgress from '../ui/UploadProgress';
import ImageGallery from '../ui/ImageGallery';
import { processImageWorkflow } from '../../utils/imageUtils';
import { UploadFile } from '../ui/UploadProgress';
import { GalleryImage } from '../ui/ImageGallery';

interface MediaStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

interface MediaStepState {
  uploadFiles: UploadFile[];
  galleryImages: GalleryImage[];
  isUploading: boolean;
  showCropper: boolean;
  imageToCrop: File | null;
  uploadProgress: number;
  errors: string[];
  warnings: string[];
}

export default function MediaStep({ formData, updateFormData }: MediaStepProps) {
  const [state, setState] = useState<MediaStepState>({
    uploadFiles: [],
    galleryImages: [],
    isUploading: false,
    showCropper: false,
    imageToCrop: null,
    uploadProgress: 0,
    errors: [],
    warnings: []
  });

  // Convert existing photos to gallery format
  React.useEffect(() => {
    const galleryImages: GalleryImage[] = formData.photos.map((file, index) => ({
      id: `existing-${index}`,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      isFeatured: index === 0, // First image is featured by default
      order: index,
      uploadedAt: new Date(),
      quality: file.size > 2 * 1024 * 1024 ? 'high' : file.size > 1 * 1024 * 1024 ? 'medium' : 'low',
      validationStatus: 'valid'
    }));

    setState(prev => ({ ...prev, galleryImages }));
  }, [formData.photos]);

  // Handle file upload from ImageUploader
  const handleFilesUploaded = useCallback(async (files: File[]) => {
    setState(prev => ({ 
      ...prev, 
      isUploading: true, 
      errors: [], 
      warnings: [] 
    }));

    const uploadFiles: UploadFile[] = files.map((file, index) => ({
      id: `upload-${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      progress: 0,
      status: 'pending' as const
    }));

    setState(prev => ({ ...prev, uploadFiles }));

    // Process each file
    for (let i = 0; i < uploadFiles.length; i++) {
      const uploadFile = uploadFiles[i];
      
      try {
        // Update status to processing
        setState(prev => ({
          ...prev,
          uploadFiles: prev.uploadFiles.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'processing', progress: 10 }
              : f
          )
        }));

        // Process image with our workflow
        const result = await processImageWorkflow(uploadFile.file, {
          autoCrop: true,
          createThumbnail: true,
          validation: {
            minWidth: 1200,
            minHeight: 675,
            maxFileSize: 5 * 1024 * 1024
          }
        });

        if (result.success && result.finalFile) {
          // Update status to completed
          setState(prev => ({
            ...prev,
            uploadFiles: prev.uploadFiles.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'completed', progress: 100, completedAt: new Date() }
                : f
            )
          }));

          // Add to form data
          const newPhotos = [...formData.photos, result.finalFile];
          updateFormData({ photos: newPhotos });

          // Add warnings and suggestions if any
          if (result.warnings.length > 0) {
            setState(prev => ({
              ...prev,
              warnings: [...prev.warnings, ...result.warnings]
            }));
          }
          
          // Add suggestions if any (these are positive feedback)
          if (result.suggestions.length > 0) {
            setState(prev => ({
              ...prev,
              warnings: [...prev.warnings, ...result.suggestions.map(s => `✓ ${s}`)]
            }));
          }
        } else {
          // Update status to error
          setState(prev => ({
            ...prev,
            uploadFiles: prev.uploadFiles.map(f => 
              f.id === uploadFile.id 
                ? { ...f, status: 'error', error: result.errors.join(', ') }
                : f
            ),
            errors: [...prev.errors, ...result.errors]
          }));
        }
      } catch (error) {
        // Update status to error
        setState(prev => ({
          ...prev,
          uploadFiles: prev.uploadFiles.map(f => 
            f.id === uploadFile.id 
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
              : f
          ),
          errors: [...prev.errors, error instanceof Error ? error.message : 'Unknown error']
        }));
      }
    }

    setState(prev => ({ ...prev, isUploading: false }));
  }, [formData.photos, updateFormData]);

  // Handle retry upload
  const handleRetryUpload = useCallback(async (fileId: string) => {
    const uploadFile = state.uploadFiles.find(f => f.id === fileId);
    if (!uploadFile) return;

    setState(prev => ({
      ...prev,
      uploadFiles: prev.uploadFiles.map(f => 
        f.id === fileId 
          ? { ...f, status: 'pending', progress: 0, error: undefined }
          : f
      )
    }));

    // Retry the upload
    await handleFilesUploaded([uploadFile.file]);
  }, [state.uploadFiles, handleFilesUploaded]);

  // Handle cancel upload
  const handleCancelUpload = useCallback((fileId: string) => {
    setState(prev => ({
      ...prev,
      uploadFiles: prev.uploadFiles.map(f => 
        f.id === fileId 
          ? { ...f, status: 'cancelled' }
          : f
      )
    }));
  }, []);

  // Handle cancel all uploads
  const handleCancelAllUploads = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadFiles: prev.uploadFiles.map(f => ({ ...f, status: 'cancelled' as const }))
    }));
  }, []);

  // Handle image reordering
  const handleImageReorder = useCallback((images: GalleryImage[]) => {
    // Convert gallery images back to files and update form data
    const newPhotos = images
      .filter(img => img.id.startsWith('existing-'))
      .map(img => {
        const index = parseInt(img.id.split('-')[1]);
        return formData.photos[index];
      });

    updateFormData({ photos: newPhotos });
  }, [formData.photos, updateFormData]);

  // Handle set featured image
  const handleSetFeatured = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      galleryImages: prev.galleryImages.map(img => ({
        ...img,
        isFeatured: img.id === imageId
      }))
    }));
  }, []);

  // Handle remove image
  const handleRemoveImage = useCallback((imageId: string) => {
    if (imageId.startsWith('existing-')) {
      const index = parseInt(imageId.split('-')[1]);
      const newPhotos = formData.photos.filter((_, i) => i !== index);
      updateFormData({ photos: newPhotos });
    }
  }, [formData.photos, updateFormData]);

  // Handle edit image (show cropper)
  const handleEditImage = useCallback((imageId: string) => {
    if (imageId.startsWith('existing-')) {
      const index = parseInt(imageId.split('-')[1]);
      const file = formData.photos[index];
      setState(prev => ({
        ...prev,
        showCropper: true,
        imageToCrop: file
      }));
    }
  }, [formData.photos]);

  // Handle crop complete
  const handleCropComplete = useCallback((croppedFile: File) => {
    // Replace the original file with the cropped one
    const index = formData.photos.findIndex((_, i) => `existing-${i}` === state.imageToCrop?.name);
    if (index !== -1) {
      const newPhotos = [...formData.photos];
      newPhotos[index] = croppedFile;
      updateFormData({ photos: newPhotos });
    }

    setState(prev => ({
      ...prev,
      showCropper: false,
      imageToCrop: null
    }));
  }, [formData.photos, updateFormData, state.imageToCrop]);

  // Handle crop cancel
  const handleCropCancel = useCallback(() => {
    setState(prev => ({
      ...prev,
      showCropper: false,
      imageToCrop: null
    }));
  }, []);

  // Video URL management
  const addVideoUrl = () => {
    updateFormData({ videos: [...formData.videos, ''] });
  };

  const updateVideoUrl = (index: number, url: string) => {
    const updatedVideos = [...formData.videos];
    updatedVideos[index] = url;
    updateFormData({ videos: updatedVideos });
  };

  const removeVideo = (index: number) => {
    const updatedVideos = formData.videos.filter((_, i) => i !== index);
    updateFormData({ videos: updatedVideos });
  };

  return (
    <div className="space-y-8">
      {/* Photo Upload Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-lg font-semibold">
            <Image className="w-5 h-5 text-primary" />
            Venue Photos *
          </Label>
          <Badge variant="outline">
            {formData.photos.length}/10 photos
          </Badge>
        </div>

        {/* Professional Image Uploader */}
        <ImageUploader
          onImagesChange={handleFilesUploaded}
          maxImages={10 - formData.photos.length}
          label="Upload Venue Photos"
          helperText="Drag and drop or click to upload. Max 10 images, 5MB each, JPG/PNG/WebP. Images will be automatically resized, cropped to 16:9, and optimized for best performance."
        />

        {/* Upload Progress */}
        {state.uploadFiles.length > 0 && (
          <UploadProgress
            files={state.uploadFiles}
            onRetry={handleRetryUpload}
            onCancel={handleCancelUpload}
            onCancelAll={handleCancelAllUploads}
          />
        )}

        {/* Error and Warning Display */}
        {(state.errors.length > 0 || state.warnings.length > 0) && (
          <div className="space-y-2">
            {state.errors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
            {state.warnings.map((warning, index) => (
              <Alert key={index} variant="default">
                <Info className="h-4 w-4" />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Image Gallery */}
        {formData.photos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-medium">Uploaded Images</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Drag to reorder • Click to select • Star to feature
                </span>
              </div>
            </div>
            
            <ImageGallery
              images={state.galleryImages}
              onReorder={handleImageReorder}
              onSetFeatured={handleSetFeatured}
              onRemove={handleRemoveImage}
              onEdit={handleEditImage}
              maxImages={10}
              showQuality={true}
              showValidation={true}
            />
          </div>
        )}

        {/* Requirements Check */}
        <Card className="bg-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Requirements Check</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div>
                <span className={formData.photos.length >= 3 ? 'text-green-600' : 'text-red-600'}>
                  ✓ Minimum 3 photos: {formData.photos.length}/3
                </span>
              </div>
              <div>
                <span className={formData.photos.length <= 10 ? 'text-green-600' : 'text-red-600'}>
                  ✓ Maximum 10 photos: {formData.photos.length}/10
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Video URLs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-lg font-semibold">
            <Video className="w-5 h-5 text-primary" />
            Video URLs (Optional)
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVideoUrl}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </Button>
        </div>

        {formData.videos.map((video, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={video}
              onChange={(e) => updateVideoUrl(index, e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => removeVideo(index)}
              className="text-destructive hover:bg-destructive/10"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}

        {formData.videos.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add YouTube or Vimeo video links to showcase your venue
          </p>
        )}
      </div>

      {/* Professional Guidelines */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Info className="w-5 h-5" />
            Professional Photo & Video Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">📸 Best Practices</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Use high-quality, well-lit photos (16:9 aspect ratio)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Show different angles and key areas of the venue</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Include setup examples and event configurations</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Capture the venue's unique features and amenities</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-3">⚙️ Technical Requirements</h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Minimum 3 photos, maximum 10 photos</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Maximum file size: 5MB per photo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Supported formats: JPG, PNG, WebP</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Videos: YouTube/Vimeo links only</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Cropper Dialog */}
      {state.showCropper && state.imageToCrop && (
        <ImageCropper
          image={state.imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
          showDialog={true}
        />
      )}
    </div>
  );
}