import React, { useRef } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Image, Video, Upload, X, Plus } from 'lucide-react';
import { VenueFormData } from '../VenueListingForm';

interface MediaStepProps {
  formData: VenueFormData;
  updateFormData: (updates: Partial<VenueFormData>) => void;
  isValid: boolean;
}

export default function MediaStep({ formData, updateFormData }: MediaStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const newFiles = Array.from(files);
      const updatedPhotos = [...formData.photos, ...newFiles].slice(0, 10);
      updateFormData({ photos: updatedPhotos });
    }
  };

  const removePhoto = (index: number) => {
    const updatedPhotos = formData.photos.filter((_, i) => i !== index);
    updateFormData({ photos: updatedPhotos });
  };

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
      {/* Photo Upload */}
      <div className="space-y-4">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Image className="w-4 h-4 text-primary" />
          Venue Photos *
        </Label>
        
        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-all duration-200 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">
            Click to upload photos or drag and drop
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum 10 photos, up to 5MB each (JPG, PNG, WebP)
          </p>
          <Button type="button" variant="outline" className="mt-4">
            Choose Files
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        {/* Photo Preview */}
        {formData.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.photos.map((photo, index) => (
              <div key={index} className="relative group">
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Venue photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {formData.photos.length}/10 photos uploaded
        </p>
      </div>

      {/* Video URLs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Video className="w-4 h-4 text-primary" />
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
              className="flex-1 transition-all duration-200 focus:shadow-md"
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

      {/* Guidelines */}
      <div className="bg-accent/50 rounded-lg p-6 border border-accent">
        <h3 className="font-semibold text-foreground mb-3">Photo & Video Guidelines</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Best Practices:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use high-quality, well-lit photos</li>
              <li>Show different angles and areas</li>
              <li>Include setup examples if possible</li>
              <li>Capture the venue's unique features</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Requirements:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>At least 3 photos required</li>
              <li>Maximum file size: 5MB per photo</li>
              <li>Supported formats: JPG, PNG, WebP</li>
              <li>Videos: YouTube/Vimeo links only</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}