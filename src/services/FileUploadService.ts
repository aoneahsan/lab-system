import { storage, firestore } from '@/config/firebase.config';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, UploadTask } from 'firebase/storage';
import { doc, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@/services/logger.service';

export interface UploadOptions {
  folder?: string;
  fileName?: string;
  metadata?: Record<string, any>;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  imageOptions?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  };
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (url: string, fileData: FileData) => void;
  saveToFirestore?: boolean;
  firestoreCollection?: string;
  tenantId?: string;
}

export interface FileData {
  id: string;
  name: string;
  originalName: string;
  url: string;
  path: string;
  size: number;
  type: string;
  metadata?: Record<string, any>;
  uploadedAt: Date;
  uploadedBy?: string;
  tenantId?: string;
}

export interface UploadResult {
  url: string;
  fileData: FileData;
  uploadTask?: UploadTask;
}

class FileUploadService {
  private defaultMaxSize = 10 * 1024 * 1024; // 10MB
  private imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  private documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  private videoTypes = ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo'];
  private audioTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4'];

  /**
   * Upload a single file to Firebase Storage
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file, options);

      // Process image if needed
      let processedFile = file;
      if (this.isImage(file) && options.imageOptions) {
        processedFile = await this.processImage(file, options.imageOptions);
      }

      // Generate file path
      const fileName = options.fileName || this.generateFileName(processedFile);
      const folder = options.folder || 'uploads';
      const tenantPrefix = options.tenantId ? `${options.tenantId}/` : '';
      const filePath = `${tenantPrefix}${folder}/${fileName}`;

      // Create storage reference
      const storageRef = ref(storage, filePath);

      // Set metadata
      const metadata = {
        contentType: processedFile.type,
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
          ...options.metadata,
        },
      };

      // Start upload
      const uploadTask = uploadBytesResumable(storageRef, processedFile, metadata);

      // Handle upload progress
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            options.onProgress?.(progress);
          },
          (error) => {
            options.onError?.(error);
            reject(error);
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              // Create file data
              const fileData: FileData = {
                id: uuidv4(),
                name: fileName,
                originalName: file.name,
                url: downloadURL,
                path: filePath,
                size: processedFile.size,
                type: processedFile.type,
                metadata: options.metadata,
                uploadedAt: new Date(),
                tenantId: options.tenantId,
              };

              // Save to Firestore if requested
              if (options.saveToFirestore) {
                await this.saveFileDataToFirestore(fileData, options);
              }

              // Call complete callback
              options.onComplete?.(downloadURL, fileData);

              resolve({
                url: downloadURL,
                fileData,
                uploadTask,
              });
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      options.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<UploadResult[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Firebase Storage
   */
  async deleteFile(filePath: string, firestoreId?: string, firestoreCollection?: string): Promise<void> {
    try {
      // Delete from Storage
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);

      // Delete from Firestore if ID provided
      if (firestoreId && firestoreCollection) {
        await deleteDoc(doc(firestore, firestoreCollection, firestoreId));
      }
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, options: UploadOptions): void {
    // Check file size
    const maxSize = options.maxSize || this.defaultMaxSize;
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum of ${this.formatFileSize(maxSize)}`);
    }

    // Check file type
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      if (!options.allowedTypes.includes(file.type)) {
        throw new Error(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
      }
    }
  }

  /**
   * Process image (resize, compress, convert format)
   */
  private async processImage(
    file: File,
    options: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      format?: 'jpeg' | 'png' | 'webp';
    }
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          // Calculate new dimensions
          let { width, height } = img;
          const maxWidth = options.maxWidth || 1920;
          const maxHeight = options.maxHeight || 1080;

          if (width > maxWidth || height > maxHeight) {
            const aspectRatio = width / height;
            
            if (width > height) {
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              height = maxHeight;
              width = height * aspectRatio;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not process image'));
                return;
              }

              // Create new file with processed image
              const processedFile = new File(
                [blob],
                file.name.replace(/\.[^/.]+$/, `.${options.format || 'jpeg'}`),
                { type: `image/${options.format || 'jpeg'}` }
              );

              resolve(processedFile);
            },
            `image/${options.format || 'jpeg'}`,
            options.quality || 0.9
          );
        };

        img.onerror = () => reject(new Error('Could not load image'));
        img.src = e.target?.result as string;
      };

      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Save file data to Firestore
   */
  private async saveFileDataToFirestore(
    fileData: FileData,
    options: UploadOptions
  ): Promise<void> {
    const collection = options.firestoreCollection || 'files';
    const docRef = doc(firestore, collection, fileData.id);
    
    await setDoc(docRef, {
      ...fileData,
      uploadedAt: serverTimestamp(),
    });
  }

  /**
   * Generate unique file name
   */
  private generateFileName(file: File): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    return `${timestamp}_${randomString}.${extension}`;
  }

  /**
   * Check if file is an image
   */
  private isImage(file: File): boolean {
    return this.imageTypes.includes(file.type);
  }

  /**
   * Check if file is a document
   */
  isDocument(file: File): boolean {
    return this.documentTypes.includes(file.type);
  }

  /**
   * Check if file is a video
   */
  isVideo(file: File): boolean {
    return this.videoTypes.includes(file.type);
  }

  /**
   * Check if file is audio
   */
  isAudio(file: File): boolean {
    return this.audioTypes.includes(file.type);
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file type category
   */
  getFileCategory(file: File): 'image' | 'document' | 'video' | 'audio' | 'other' {
    if (this.isImage(file)) return 'image';
    if (this.isDocument(file)) return 'document';
    if (this.isVideo(file)) return 'video';
    if (this.isAudio(file)) return 'audio';
    return 'other';
  }

  /**
   * Validate image dimensions
   */
  async validateImageDimensions(
    file: File,
    minWidth?: number,
    minHeight?: number,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        let valid = true;
        if (minWidth && img.width < minWidth) valid = false;
        if (minHeight && img.height < minHeight) valid = false;
        if (maxWidth && img.width > maxWidth) valid = false;
        if (maxHeight && img.height > maxHeight) valid = false;
        
        resolve(valid);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(false);
      };
      
      img.src = url;
    });
  }
}

export const fileUploadService = new FileUploadService();
export default fileUploadService;