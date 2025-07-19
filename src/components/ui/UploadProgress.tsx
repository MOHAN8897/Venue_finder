import React, { useState, useEffect } from 'react';
import { Progress } from './progress';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  RotateCcw, 
  X,
  FileImage,
  FileVideo,
  File
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  uploadedAt?: Date;
  completedAt?: Date;
}

export interface UploadProgressProps {
  files: UploadFile[];
  onRetry?: (fileId: string) => void;
  onCancel?: (fileId: string) => void;
  onCancelAll?: () => void;
  showFileInfo?: boolean;
  showSpeed?: boolean;
  className?: string;
}

export interface UploadStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  cancelledFiles: number;
  totalProgress: number;
  totalSize: number;
  uploadedSize: number;
  averageSpeed: number;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  files,
  onRetry,
  onCancel,
  onCancelAll,
  showFileInfo = true,
  showSpeed = true,
  className
}) => {
  const [stats, setStats] = useState<UploadStats>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    cancelledFiles: 0,
    totalProgress: 0,
    totalSize: 0,
    uploadedSize: 0,
    averageSpeed: 0
  });

  // Calculate upload statistics
  useEffect(() => {
    const totalFiles = files.length;
    const completedFiles = files.filter(f => f.status === 'completed').length;
    const failedFiles = files.filter(f => f.status === 'error').length;
    const cancelledFiles = files.filter(f => f.status === 'cancelled').length;
    
    const totalProgress = files.length > 0 
      ? files.reduce((sum, file) => sum + file.progress, 0) / files.length 
      : 0;
    
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const uploadedSize = files.reduce((sum, file) => {
      if (file.status === 'completed') return sum + file.size;
      return sum + (file.size * file.progress / 100);
    }, 0);

    setStats({
      totalFiles,
      completedFiles,
      failedFiles,
      cancelledFiles,
      totalProgress,
      totalSize,
      uploadedSize,
      averageSpeed: 0 // Would need time tracking for accurate speed
    });
  }, [files]);

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="h-4 w-4" />;
    if (type.startsWith('video/')) return <FileVideo className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  // Get status icon
  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-bounce" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  // Get status badge
  const getStatusBadge = (status: UploadFile['status']) => {
    const variants = {
      completed: 'default',
      error: 'destructive',
      cancelled: 'secondary',
      processing: 'default',
      uploading: 'default',
      pending: 'outline'
    } as const;

    const labels = {
      completed: 'Completed',
      error: 'Failed',
      cancelled: 'Cancelled',
      processing: 'Processing',
      uploading: 'Uploading',
      pending: 'Pending'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload speed
  const formatSpeed = (bytesPerSecond: number) => {
    if (bytesPerSecond === 0) return '0 B/s';
    const k = 1024;
    const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
    const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
    return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overall Progress */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Upload Progress</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {stats.completedFiles}/{stats.totalFiles} Complete
              </Badge>
              {onCancelAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancelAll}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(stats.totalProgress)}%</span>
            </div>
            <Progress value={stats.totalProgress} className="h-2" />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-green-600">{stats.completedFiles}</div>
              <div className="text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">{stats.failedFiles}</div>
              <div className="text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-gray-600">{stats.cancelledFiles}</div>
              <div className="text-muted-foreground">Cancelled</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{formatFileSize(stats.uploadedSize)}</div>
              <div className="text-muted-foreground">Uploaded</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual File Progress */}
      <div className="space-y-3">
        {files.map((file) => (
          <Card key={file.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                {/* File Icon */}
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium truncate">{file.name}</span>
                    {getStatusIcon(file.status)}
                    {getStatusBadge(file.status)}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{Math.round(file.progress)}%</span>
                    </div>
                    <Progress value={file.progress} className="h-1.5" />
                  </div>

                  {/* Error Message */}
                  {file.status === 'error' && file.error && (
                    <Alert className="mt-2 py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {file.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {file.status === 'error' && onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRetry(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  {(file.status === 'pending' || file.status === 'uploading' || file.status === 'processing') && onCancel && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCancel(file.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UploadProgress; 