import { useState, useCallback } from 'react';
import fileUploadService, { UploadOptions, UploadResult, FileData } from '@/services/FileUploadService';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import { logger } from '@/services/logger.service';

export interface UseFileUploadOptions extends Omit<UploadOptions, 'onProgress' | 'onError' | 'onComplete'> {
  multiple?: boolean;
  autoUpload?: boolean;
  showToast?: boolean;
}

export interface UseFileUploadReturn {
  files: File[];
  uploadedFiles: FileData[];
  uploading: boolean;
  progress: number;
  error: Error | null;
  
  selectFiles: (files: FileList | File[]) => void;
  uploadFiles: (files?: File[]) => Promise<UploadResult[]>;
  uploadSingleFile: (file: File) => Promise<UploadResult>;
  removeFile: (index: number) => void;
  clearFiles: () => void;
  deleteUploadedFile: (fileData: FileData) => Promise<void>;
  
  // Drag and drop handlers
  isDragging: boolean;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { currentUser } = useAuthStore();
  const tenantId = currentUser?.tenantId;

  /**
   * Select files for upload
   */
  const selectFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    
    if (options.multiple) {
      setFiles(prev => [...prev, ...newFiles]);
    } else {
      setFiles(newFiles.slice(0, 1));
    }
    
    setError(null);
    
    // Auto upload if enabled
    if (options.autoUpload) {
      uploadFiles(newFiles);
    }
  }, [options.multiple, options.autoUpload]);

  /**
   * Upload multiple files
   */
  const uploadFiles = useCallback(async (filesToUpload?: File[]): Promise<UploadResult[]> => {
    const targetFiles = filesToUpload || files;
    
    if (targetFiles.length === 0) {
      if (options.showToast) {
        toast.error('No files selected', 'Please select files to upload');
      }
      return [];
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const results: UploadResult[] = [];
      const totalFiles = targetFiles.length;
      let completedFiles = 0;

      for (const file of targetFiles) {
        try {
          const result = await fileUploadService.uploadFile(file, {
            ...options,
            tenantId,
            onProgress: (fileProgress) => {
              const overallProgress = ((completedFiles + fileProgress / 100) / totalFiles) * 100;
              setProgress(overallProgress);
            },
            onError: (err) => {
              logger.error('Upload error:', err);
              setError(err);
              if (options.showToast) {
                toast.error('Upload failed', err.message);
              }
            },
            onComplete: (url, fileData) => {
              setUploadedFiles(prev => [...prev, fileData]);
              if (options.showToast) {
                toast.success('File uploaded', `${file.name} uploaded successfully`);
              }
            },
          });

          results.push(result);
          completedFiles++;
        } catch (err) {
          logger.error(`Failed to upload ${file.name}:`, err);
          if (options.showToast) {
            toast.error('Upload failed', `Failed to upload ${file.name}`);
          }
        }
      }

      // Clear selected files after successful upload
      if (!filesToUpload) {
        setFiles([]);
      }

      return results;
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (options.showToast) {
        toast.error('Upload failed', error.message);
      }
      return [];
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [files, options, tenantId]);

  /**
   * Upload a single file
   */
  const uploadSingleFile = useCallback(async (file: File): Promise<UploadResult> => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const result = await fileUploadService.uploadFile(file, {
        ...options,
        tenantId,
        onProgress: setProgress,
        onError: (err) => {
          setError(err);
          if (options.showToast) {
            toast.error('Upload failed', err.message);
          }
        },
        onComplete: (url, fileData) => {
          setUploadedFiles(prev => [...prev, fileData]);
          if (options.showToast) {
            toast.success('File uploaded', `${file.name} uploaded successfully`);
          }
        },
      });

      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      if (options.showToast) {
        toast.error('Upload failed', error.message);
      }
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [options, tenantId]);

  /**
   * Remove a file from the selection
   */
  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  /**
   * Clear all selected files
   */
  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
    setProgress(0);
  }, []);

  /**
   * Delete an uploaded file
   */
  const deleteUploadedFile = useCallback(async (fileData: FileData) => {
    try {
      await fileUploadService.deleteFile(
        fileData.path,
        fileData.id,
        options.firestoreCollection
      );
      
      setUploadedFiles(prev => prev.filter(f => f.id !== fileData.id));
      
      if (options.showToast) {
        toast.success('File deleted', 'File deleted successfully');
      }
    } catch (err) {
      const error = err as Error;
      if (options.showToast) {
        toast.error('Delete failed', error.message);
      }
      throw error;
    }
  }, [options.firestoreCollection, options.showToast]);

  /**
   * Drag and drop handlers
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set dragging to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      selectFiles(droppedFiles);
    }
  }, [selectFiles]);

  return {
    files,
    uploadedFiles,
    uploading,
    progress,
    error,
    
    selectFiles,
    uploadFiles,
    uploadSingleFile,
    removeFile,
    clearFiles,
    deleteUploadedFile,
    
    isDragging,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
};