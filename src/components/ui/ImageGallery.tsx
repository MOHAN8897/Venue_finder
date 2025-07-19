import React, { useState, useCallback } from 'react';
import { Card, CardContent } from './card';
import { Button } from './button';
import { Badge } from './badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog';
import { AspectRatio } from './aspect-ratio';
import { 
  Star, 
  StarOff, 
  Edit, 
  Trash2, 
  Eye, 
  Move, 
  MoreHorizontal,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';

export interface GalleryImage {
  id: string;
  url: string;
  name: string;
  size: number;
  type: string;
  isFeatured: boolean;
  order: number;
  uploadedAt: Date;
  quality?: 'high' | 'medium' | 'low';
  validationStatus?: 'valid' | 'warning' | 'error';
  validationErrors?: string[];
}

export interface ImageGalleryProps {
  images: GalleryImage[];
  onReorder?: (images: GalleryImage[]) => void;
  onSetFeatured?: (imageId: string) => void;
  onRemove?: (imageId: string) => void;
  onEdit?: (imageId: string) => void;
  onView?: (imageId: string) => void;
  maxImages?: number;
  showQuality?: boolean;
  showValidation?: boolean;
  className?: string;
}

export interface ImageGalleryState {
  selectedImages: string[];
  isDragging: boolean;
  draggedImageId: string | null;
  viewImage: GalleryImage | null;
  sortBy: 'uploadDate' | 'fileSize' | 'quality' | 'name';
  sortOrder: 'asc' | 'desc';
}

const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onReorder,
  onSetFeatured,
  onRemove,
  onEdit,
  onView,
  maxImages = 10,
  showQuality = true,
  showValidation = true,
  className
}) => {
  const [state, setState] = useState<ImageGalleryState>({
    selectedImages: [],
    isDragging: false,
    draggedImageId: null,
    viewImage: null,
    sortBy: 'uploadDate',
    sortOrder: 'desc'
  });

  // Sort images based on current sort settings
  const sortedImages = React.useMemo(() => {
    return [...images].sort((a, b) => {
      let comparison = 0;
      
      switch (state.sortBy) {
        case 'uploadDate':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'fileSize':
          comparison = a.size - b.size;
          break;
        case 'quality':
          const qualityOrder = { high: 3, medium: 2, low: 1 };
          comparison = (qualityOrder[a.quality || 'medium'] || 2) - (qualityOrder[b.quality || 'medium'] || 2);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return state.sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [images, state.sortBy, state.sortOrder]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, imageId: string) => {
    setState(prev => ({ ...prev, isDragging: true, draggedImageId: imageId }));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', imageId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    const draggedImageId = e.dataTransfer.getData('text/plain');
    
    if (draggedImageId && draggedImageId !== targetImageId && onReorder) {
      const draggedIndex = sortedImages.findIndex(img => img.id === draggedImageId);
      const targetIndex = sortedImages.findIndex(img => img.id === targetImageId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        const newImages = [...sortedImages];
        const [draggedImage] = newImages.splice(draggedIndex, 1);
        newImages.splice(targetIndex, 0, draggedImage);
        
        // Update order property
        const updatedImages = newImages.map((img, index) => ({
          ...img,
          order: index
        }));
        
        onReorder(updatedImages);
      }
    }
    
    setState(prev => ({ ...prev, isDragging: false, draggedImageId: null }));
  }, [sortedImages, onReorder]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setState(prev => ({ ...prev, isDragging: false, draggedImageId: null }));
  }, []);

  // Handle image selection
  const handleImageSelect = useCallback((imageId: string) => {
    setState(prev => ({
      ...prev,
      selectedImages: prev.selectedImages.includes(imageId)
        ? prev.selectedImages.filter(id => id !== imageId)
        : [...prev.selectedImages, imageId]
    }));
  }, []);

  // Handle featured image toggle
  const handleFeaturedToggle = useCallback((imageId: string) => {
    if (onSetFeatured) {
      onSetFeatured(imageId);
    }
  }, [onSetFeatured]);

  // Handle image view
  const handleImageView = useCallback((image: GalleryImage) => {
    setState(prev => ({ ...prev, viewImage: image }));
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get quality badge
  const getQualityBadge = (quality?: string) => {
    if (!quality) return null;
    
    const variants = {
      high: 'default',
      medium: 'secondary',
      low: 'destructive'
    } as const;

    return (
      <Badge variant={variants[quality as keyof typeof variants] || 'secondary'} className="text-xs">
        {quality.charAt(0).toUpperCase() + quality.slice(1)} Quality
      </Badge>
    );
  };

  // Get validation badge
  const getValidationBadge = (status?: string, errors?: string[]) => {
    if (!status) return null;
    
    const variants = {
      valid: 'default',
      warning: 'secondary',
      error: 'destructive'
    } as const;

    const icons = {
      valid: null,
      warning: <AlertCircle className="h-3 w-3" />,
      error: <AlertCircle className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="text-xs">
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (images.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-center", className)}>
        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Images</h3>
        <p className="text-muted-foreground">Upload some images to get started</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Gallery Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Image Gallery</h3>
          <Badge variant="outline">
            {images.length}/{maxImages} Images
          </Badge>
          {state.selectedImages.length > 0 && (
            <Badge variant="default">
              {state.selectedImages.length} Selected
            </Badge>
          )}
        </div>
        
        {/* Sort Controls */}
        <div className="flex items-center gap-2">
          <select
            value={state.sortBy}
            onChange={(e) => setState(prev => ({ ...prev, sortBy: e.target.value as any }))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="uploadDate">Upload Date</option>
            <option value="fileSize">File Size</option>
            <option value="quality">Quality</option>
            <option value="name">Name</option>
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState(prev => ({ 
              ...prev, 
              sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
            }))}
          >
            {state.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedImages.map((image, index) => (
          <Card
            key={image.id}
            className={cn(
              "group relative overflow-hidden cursor-pointer transition-all duration-200",
              state.isDragging && state.draggedImageId === image.id && "opacity-50",
              state.selectedImages.includes(image.id) && "ring-2 ring-primary"
            )}
            draggable={!!onReorder}
            onDragStart={(e) => handleDragStart(e, image.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, image.id)}
            onDragEnd={handleDragEnd}
            onClick={() => handleImageSelect(image.id)}
          >
            <CardContent className="p-0">
              {/* Image */}
              <AspectRatio ratio={16 / 9} className="relative">
                <img
                  src={image.url}
                  alt={image.name}
                  className="object-cover w-full h-full"
                  loading="lazy"
                />
                
                {/* Featured Badge */}
                {image.isFeatured && (
                  <div className="absolute top-2 left-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  </div>
                )}
                
                {/* Quality & Validation Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  {showQuality && getQualityBadge(image.quality)}
                  {showValidation && getValidationBadge(image.validationStatus, image.validationErrors)}
                </div>

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageView(image);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleFeaturedToggle(image.id)}>
                            {image.isFeatured ? (
                              <>
                                <StarOff className="h-4 w-4 mr-2" />
                                Remove Featured
                              </>
                            ) : (
                              <>
                                <Star className="h-4 w-4 mr-2" />
                                Set as Featured
                              </>
                            )}
                          </DropdownMenuItem>
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(image.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onRemove && (
                            <DropdownMenuItem 
                              onClick={() => onRemove(image.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* Drag Handle */}
                {onReorder && (
                  <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Move className="h-4 w-4 text-white/80" />
                  </div>
                )}
              </AspectRatio>

              {/* Image Info */}
              <div className="p-2">
                <p className="text-sm font-medium truncate">{image.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(image.size)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Image View Dialog */}
      <Dialog open={!!state.viewImage} onOpenChange={() => setState(prev => ({ ...prev, viewImage: null }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{state.viewImage?.name}</DialogTitle>
          </DialogHeader>
          {state.viewImage && (
            <div className="space-y-4">
              <AspectRatio ratio={16 / 9}>
                <img
                  src={state.viewImage.url}
                  alt={state.viewImage.name}
                  className="object-contain w-full h-full"
                />
              </AspectRatio>
              <div className="flex items-center justify-between text-sm">
                <span>{formatFileSize(state.viewImage.size)}</span>
                <span>{new Date(state.viewImage.uploadedAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ImageGallery; 