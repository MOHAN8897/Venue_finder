import React, { useRef, useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Camera, Video, Star, Trash2, GripVertical } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableItem } from './ui/sortable-item';
import { convertToWebP } from '../utils/cropImage';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video';
  isCover?: boolean;
}

const MAX_IMAGES = 10;
const MAX_VIDEOS = 3;

const VenueMediaManager: React.FC = () => {
  const [images, setImages] = useState<MediaFile[]>([]);
  const [videos, setVideos] = useState<MediaFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Remove video
  const removeVideo = (id: string) => {
    setVideos(prev => prev.filter(vid => vid.id !== id));
  };

  // Set cover image
  const setCoverImage = (id: string) => {
    setImages(prev => prev.map(img => ({ ...img, isCover: img.id === id })));
  };

  const memoizedImages = useMemo(() => images, [images]);
  const memoizedVideos = useMemo(() => videos, [videos]);
  const memoizedRemoveImage = useCallback(removeImage, [images]);
  const memoizedSetCoverImage = useCallback(setCoverImage, [images]);
  const memoizedRemoveVideo = useCallback(removeVideo, [videos]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }
    setError(null);
    // Convert all files to WebP
    const newFiles: MediaFile[] = [];
    for (const file of Array.from(files)) {
      try {
        const webpBlob = await convertToWebP(file);
        const webpFile = new File([webpBlob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' });
        newFiles.push({
          id: `${Date.now()}-img-${Math.random()}`,
          file: webpFile,
          url: URL.createObjectURL(webpFile),
          type: 'image',
          isCover: false
        });
      } catch (err) {
        setError('Failed to convert image to WebP.');
      }
    }
    setImages(prev => prev.concat(newFiles));
  };

  // Handle video upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (videos.length + files.length > MAX_VIDEOS) {
      setError(`Maximum ${MAX_VIDEOS} videos allowed.`);
      return;
    }
    const newFiles: MediaFile[] = Array.from(files).map((file) => ({
      id: `${Date.now()}-vid-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      type: 'video',
    }));
    setVideos(prev => prev.concat(newFiles));
    setError(null);
  };

  // Drag-and-drop reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex(i => i.id === active.id);
        const newIndex = prev.findIndex(i => i.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  // Memoized Image Item
  const ImageItem = React.memo(({ img, removeImage, setCoverImage }: { img: MediaFile, removeImage: (id: string) => void, setCoverImage: (id: string) => void }) => (
    <div className="relative group w-32 aspect-video">
      <img src={img.url} alt="venue" loading="lazy" className="w-full h-full object-cover rounded-lg border" />
      <Button size="icon" variant="ghost" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={() => removeImage(img.id)}><Trash2 className="h-4 w-4" /></Button>
      <Button size="icon" variant={img.isCover ? 'default' : 'outline'} className="absolute bottom-1 left-1" onClick={() => setCoverImage(img.id)}><Star className={img.isCover ? 'text-yellow-400' : 'text-gray-400'} /></Button>
      <GripVertical className="absolute bottom-1 right-1 text-gray-400 cursor-move" />
      {img.isCover && <Badge className="absolute top-1 left-1 bg-yellow-400 text-white">Cover</Badge>}
    </div>
  ));

  // Memoized Video Item
  const VideoItem = React.memo(({ vid, removeVideo }: { vid: MediaFile, removeVideo: (id: string) => void }) => (
  <div className="relative group w-32 h-32">
    <video src={vid.url} className="w-full h-full object-cover rounded-lg border" controls />
    <Button size="icon" variant="ghost" className="absolute top-1 right-1 opacity-0 group-hover:opacity-100" onClick={() => removeVideo(vid.id)}><Trash2 className="h-4 w-4" /></Button>
  </div>
));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Venue Media</CardTitle>
        <CardDescription>Upload, reorder, and manage your venue's images and videos. Drag to reorder images. Set a cover image by clicking the star.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Images */}
        <div>
          <Label className="text-base font-semibold mb-4">Venue Images (max {MAX_IMAGES})</Label>
          <div className="flex flex-wrap gap-4">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={memoizedImages.map(img => img.id)} strategy={verticalListSortingStrategy}>
                {memoizedImages.map((img) => (
                  <SortableItem key={img.id} id={img.id}>
                    <ImageItem img={img} removeImage={memoizedRemoveImage} setCoverImage={memoizedSetCoverImage} />
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
            {images.length < MAX_IMAGES && (
              <div className="w-32 aspect-video flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400" onClick={() => imageInputRef.current?.click()}>
                <Camera className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Add Image</span>
                <input type="file" multiple accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
              </div>
            )}
          </div>
        </div>
        {/* Videos */}
        <div>
          <Label className="text-base font-semibold mb-4">Venue Videos (max {MAX_VIDEOS})</Label>
          <div className="flex flex-wrap gap-4">
            {memoizedVideos.map((vid) => (
              <VideoItem key={vid.id} vid={vid} removeVideo={memoizedRemoveVideo} />
            ))}
            {videos.length < MAX_VIDEOS && (
              <div className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400" onClick={() => videoInputRef.current?.click()}>
                <Video className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Add Video</span>
                <input type="file" multiple accept="video/*" ref={videoInputRef} onChange={handleVideoUpload} className="hidden" />
              </div>
            )}
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VenueMediaManager; 