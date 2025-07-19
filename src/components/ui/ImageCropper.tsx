import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { Button } from './button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './dialog';
import { Slider } from './slider';
import { AspectRatio } from './aspect-ratio';
import { RotateCcw, ZoomIn, ZoomOut, Check, X, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processImageWorkflow } from '@/utils/imageUtils';

export interface ImageCropperProps {
  image: File | string;
  onCropComplete: (croppedImage: File) => void;
  onCancel: () => void;
  aspectRatio?: number;
  showDialog?: boolean;
  className?: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageCropperState {
  crop: { x: number; y: number };
  zoom: number;
  rotation: number;
  croppedAreaPixels: CropArea | null;
  isProcessing: boolean;
  error: string | null;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9,
  showDialog = true,
  className
}) => {
  const [state, setState] = useState<ImageCropperState>({
    crop: { x: 0, y: 0 },
    zoom: 1,
    rotation: 0,
    croppedAreaPixels: null,
    isProcessing: false,
    error: null
  });

  const imageRef = useRef<HTMLImageElement>(null);

  // Handle crop change
  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setState(prev => ({ ...prev, crop }));
  }, []);

  // Handle zoom change
  const onZoomChange = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom }));
  }, []);

  // Handle crop complete
  const handleCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropArea) => {
    setState(prev => ({ ...prev, croppedAreaPixels }));
  }, []);

  // Handle rotation
  const handleRotation = useCallback((direction: 'left' | 'right') => {
    setState(prev => ({
      ...prev,
      rotation: prev.rotation + (direction === 'left' ? -90 : 90)
    }));
  }, []);

  // Handle zoom controls
  const handleZoom = useCallback((direction: 'in' | 'out') => {
    setState(prev => ({
      ...prev,
      zoom: Math.min(Math.max(
        prev.zoom + (direction === 'in' ? 0.1 : -0.1),
        0.5
      ), 3)
    }));
  }, []);

  // Reset to default values
  const handleReset = useCallback(() => {
    setState({
      crop: { x: 0, y: 0 },
      zoom: 1,
      rotation: 0,
      croppedAreaPixels: null,
      isProcessing: false,
      error: null
    });
  }, []);

  // Apply crop
  const handleApplyCrop = useCallback(async () => {
    if (!state.croppedAreaPixels) {
      setState(prev => ({ ...prev, error: 'No crop area selected' }));
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Convert image to canvas for processing
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Create image element
      const img = new Image();
      const imageUrl = typeof image === 'string' ? image : URL.createObjectURL(image);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Set canvas dimensions to cropped area
      canvas.width = state.croppedAreaPixels.width;
      canvas.height = state.croppedAreaPixels.height;

      // Apply rotation if needed
      if (state.rotation !== 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((state.rotation * Math.PI) / 180);
        ctx.drawImage(
          img,
          -state.croppedAreaPixels.width / 2,
          -state.croppedAreaPixels.height / 2,
          state.croppedAreaPixels.width,
          state.croppedAreaPixels.height
        );
        ctx.restore();
      } else {
        // Draw cropped area
        ctx.drawImage(
          img,
          state.croppedAreaPixels.x,
          state.croppedAreaPixels.y,
          state.croppedAreaPixels.width,
          state.croppedAreaPixels.height,
          0,
          0,
          state.croppedAreaPixels.width,
          state.croppedAreaPixels.height
        );
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.9);
      });

      // Create file from blob
      const croppedFile = new File([blob], 'cropped-image.jpg', {
        type: 'image/jpeg',
        lastModified: Date.now()
      });

      // Process the cropped image for venue optimization
      const workflowResult = await processImageWorkflow(croppedFile);
      const processedFile = workflowResult.finalFile || croppedFile;

      // Clean up object URL if created
      if (typeof image !== 'string') {
        URL.revokeObjectURL(imageUrl);
      }

      onCropComplete(processedFile);
    } catch (error) {
      console.error('Crop processing error:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to process cropped image'
      }));
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [state.croppedAreaPixels, state.rotation, image, onCropComplete]);

  // Get image URL for cropper
  const getImageUrl = () => {
    if (typeof image === 'string') {
      return image;
    }
    return URL.createObjectURL(image);
  };

  const cropperContent = (
    <div className={cn("relative w-full h-full min-h-[400px]", className)}>
      {/* Error Display */}
      {state.error && (
        <div className="absolute top-4 left-4 right-4 z-10 bg-destructive text-destructive-foreground p-3 rounded-md text-sm">
          {state.error}
        </div>
      )}

      {/* Cropper Container */}
      <div className="relative w-full h-full bg-black rounded-lg overflow-hidden">
        <Cropper
          image={getImageUrl()}
          crop={state.crop}
          zoom={state.zoom}
          rotation={state.rotation}
          aspect={aspectRatio}
          onCropChange={onCropChange}
          onZoomChange={onZoomChange}
          onCropComplete={handleCropComplete}
          showGrid={true}
          objectFit="horizontal-cover"
          style={{
            containerStyle: {
              width: '100%',
              height: '100%',
              backgroundColor: '#000'
            }
          }}
        />
      </div>

      {/* Controls */}
      <div className="mt-4 space-y-4">
        {/* Zoom Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Zoom:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('out')}
            disabled={state.zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Slider
            value={[state.zoom]}
            onValueChange={([value]) => onZoomChange(value)}
            min={0.5}
            max={3}
            step={0.1}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleZoom('in')}
            disabled={state.zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Rotation Controls */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-muted-foreground">Rotation:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotation('left')}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[3rem] text-center">
            {state.rotation}°
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRotation('right')}
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button
            onClick={handleApplyCrop}
            disabled={!state.croppedAreaPixels || state.isProcessing}
            className="flex items-center gap-2"
          >
            {state.isProcessing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Apply Crop
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  if (showDialog) {
    return (
      <Dialog open={true} onOpenChange={() => onCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>
          {cropperContent}
        </DialogContent>
      </Dialog>
    );
  }

  return cropperContent;
};

export default ImageCropper; 