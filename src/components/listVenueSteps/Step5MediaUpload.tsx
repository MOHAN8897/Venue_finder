import React, { useRef } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertCircle, Camera, Video, Trash2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step5MediaUploadProps {
  formData: any;
  errors: Record<string, string>;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  onNext: () => void;
  onPrev: () => void;
  imageUrls: string[];
  videoUrls: string[];
}

const Step5MediaUpload: React.FC<Step5MediaUploadProps> = ({
  formData,
  errors,
  onImageUpload,
  onVideoUpload,
  onRemoveImage,
  onRemoveVideo,
  onNext,
  onPrev,
  imageUrls,
  videoUrls
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const maxImages = 10;
  const maxVideos = 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Card className="rounded-2xl shadow-xl bg-white dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Venue Media</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Images */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-semibold">Venue Images (max {maxImages}) *</label>
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={formData.images.length >= maxImages}
              >
                <Camera className="h-5 w-5" /> Add Image
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={imageInputRef}
                onChange={onImageUpload}
                className="hidden"
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {imageUrls.map((url, idx) => (
                <div
                  key={url}
                  className="relative group w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow hover:scale-105 transition-transform bg-gray-50 dark:bg-gray-900"
                >
                  <img
                    src={url}
                    alt={`venue-img-${idx}`}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-110 transition-transform duration-200"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveImage(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <CheckCircle className="absolute bottom-1 left-1 h-5 w-5 text-green-500 bg-white rounded-full p-0.5 shadow" />
                </div>
              ))}
              {formData.images.length < maxImages && (
                <div
                  className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 bg-gray-50 dark:bg-gray-900"
                  onClick={() => imageInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Add Image</span>
                </div>
              )}
            </div>
            {errors.images && (
              <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.images}
              </div>
            )}
          </div>
          {/* Videos */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-base font-semibold">Venue Videos (max {maxVideos})</label>
              <Button
                type="button"
                variant="outline"
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-2"
                disabled={formData.videos.length >= maxVideos}
              >
                <Video className="h-5 w-5" /> Add Video
              </Button>
              <input
                type="file"
                multiple
                accept="video/*"
                ref={videoInputRef}
                onChange={onVideoUpload}
                className="hidden"
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-2">
              {videoUrls.map((url, idx) => (
                <div
                  key={url}
                  className="relative group w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow bg-gray-50 dark:bg-gray-900"
                >
                  <video
                    src={url}
                    className="w-full h-full object-cover rounded-lg"
                    controls
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                    onClick={() => onRemoveVideo(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {formData.videos.length < maxVideos && (
                <div
                  className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-blue-400 bg-gray-50 dark:bg-gray-900"
                  onClick={() => videoInputRef.current?.click()}
                >
                  <Video className="h-8 w-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">Add Video</span>
                </div>
              )}
            </div>
            {errors.videos && (
              <div className="flex items-center gap-1 mt-2 text-red-500 text-sm">
                <AlertCircle className="h-4 w-4" />
                {errors.videos}
              </div>
            )}
          </div>
          <div className="flex justify-between mt-8">
            <Button onClick={onPrev} variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={onNext} className="bg-blue-600 dark:bg-blue-400 text-white px-8 py-2 rounded-lg shadow hover:scale-105 transition-transform disabled:opacity-50" type="button">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default Step5MediaUpload; 