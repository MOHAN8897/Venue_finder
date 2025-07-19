import React, { useRef, useState } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { Progress } from './progress';
import { AlertCircle, Image as ImageIcon, UploadCloud, Trash2 } from 'lucide-react';
import { processImageWorkflow, getImageInfo } from '../../utils/imageUtils';

interface ImageUploaderProps {
  maxImages?: number;
  onImagesChange: (files: File[]) => void;
  initialFiles?: File[];
  label?: string;
  helperText?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  maxImages = 10,
  onImagesChange,
  initialFiles = [],
  label = 'Venue Photos',
  helperText = 'Drag and drop or click to upload. Max 10 images, 5MB each, JPG/PNG/WebP.'
}) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [previews, setPreviews] = useState<string[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    onImagesChange(files);
    // Generate previews
    setPreviews(files.map(file => URL.createObjectURL(file)));
    // Cleanup object URLs on unmount
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
    // eslint-disable-next-line
  }, [files]);

  const handleFiles = async (selectedFiles: FileList | File[]) => {
    setErrors([]);
    setValidating(true);
    let fileArr = Array.from(selectedFiles);
    if (files.length + fileArr.length > maxImages) {
      setErrors([`Maximum ${maxImages} images allowed.`]);
      setValidating(false);
      return;
    }

    // Process each file with enhanced workflow (auto-fix)
    const processedFiles: File[] = [];
    const processingErrors: string[] = [];
    
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      setProgress((i / fileArr.length) * 50); // First 50% for processing
      
      try {
        const workflowResult = await processImageWorkflow(file, {
          validation: {
            minWidth: 1200,
            minHeight: 675,
            maxWidth: 4000,
            maxHeight: 3000,
            maxFileSize: 5 * 1024 * 1024,
            allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            aspectRatioTolerance: 0.1 // More lenient for auto-fixing
          },
          processing: {
            quality: 0.8,
            format: 'webp',
            maxWidth: 1920,
            maxHeight: 1080,
            maintainAspectRatio: true,
            targetAspectRatio: 16 / 9
          },
          autoCrop: true,
          createThumbnail: true
        });
        
        if (workflowResult.success && workflowResult.finalFile) {
          processedFiles.push(workflowResult.finalFile);
          
          // Add warnings as info messages (not errors)
          if (workflowResult.warnings.length > 0) {
            console.log(`Auto-fixes applied to ${file.name}:`, workflowResult.warnings);
          }
          if (workflowResult.suggestions.length > 0) {
            console.log(`Suggestions for ${file.name}:`, workflowResult.suggestions);
          }
        } else {
          processingErrors.push(`${file.name}: ${workflowResult.errors.join(', ')}`);
        }
      } catch (error) {
        processingErrors.push(`${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Add any processing errors
    if (processingErrors.length > 0) {
      setErrors(processingErrors);
    }
    
    // Add successfully processed files
    const successful = processedFiles.slice(0, maxImages - files.length);
    setFiles(prev => [...prev, ...successful]);
    
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
    setValidating(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div
          className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-primary/50 transition-all duration-200 cursor-pointer mb-4"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">{helperText}</p>
          <Button type="button" variant="outline" className="mt-2">Choose Files</Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
        {progress > 0 && (
          <div className="mb-4">
            <Progress value={progress} />
          </div>
        )}
        {errors.length > 0 && (
          <div className="mb-4 text-red-600 text-sm flex flex-col gap-1">
            {errors.map((err, i) => (
              <div key={i} className="flex items-center gap-1"><AlertCircle className="w-4 h-4" />{err}</div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previews.map((url, i) => (
            <div key={i} className="relative aspect-video w-full rounded-lg border overflow-hidden group">
              <img src={url} alt={`Venue photo ${i + 1}`} className="w-full h-full object-cover" />
              <Button
                size="icon"
                variant="ghost"
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                onClick={() => removeFile(i)}
                tabIndex={-1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        {validating && <div className="mt-2 text-xs text-muted-foreground">Validating and optimizing images...</div>}
      </CardContent>
    </Card>
  );
};

export default ImageUploader; 