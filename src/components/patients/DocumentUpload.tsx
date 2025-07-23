import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuthStore } from '@stores/auth.store';
import { useTenant } from '@hooks/useTenant';
import { patientService } from '@/services/patient.service';
import { useToast } from '@hooks/useToast';
import { storage } from '@config/firebase.config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStoragePath } from '@constants/tenant.constants';
import type { PatientDocument } from '@/types/patient.types';

interface DocumentUploadProps {
  patientId: string;
  onUploadComplete?: () => void;
  onCancel?: () => void;
}

export const DocumentUpload = ({ patientId, onUploadComplete, onCancel }: DocumentUploadProps) => {
  const { currentUser } = useAuthStore();
  const { currentTenant } = useTenant();
  const { showToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PatientDocument['category']>('other');
  const [description, setDescription] = useState('');
  
  const categories: { value: PatientDocument['category']; label: string }[] = [
    { value: 'report', label: 'Lab Report' },
    { value: 'prescription', label: 'Prescription' },
    { value: 'insurance', label: 'Insurance Document' },
    { value: 'consent', label: 'Consent Form' },
    { value: 'referral', label: 'Referral Letter' },
    { value: 'imaging', label: 'Imaging/X-Ray' },
    { value: 'other', label: 'Other' },
  ];
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!currentTenant?.id || !currentUser?.id) {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: 'No tenant or user selected',
      });
      return;
    }
    
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    const file = acceptedFiles[0];
    
    try {
      // Upload to Firebase Storage
      const storagePath = getStoragePath(currentTenant.id, `patients/${patientId}/documents/${Date.now()}_${file.name}`);
      const storageRef = ref(storage, storagePath);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      
      // Create document record
      const document: Omit<PatientDocument, 'id' | 'uploadedAt'> = {
        name: file.name,
        type: file.type,
        size: file.size,
        url: downloadUrl,
        category: selectedCategory,
        description: description.trim() || undefined,
        uploadedBy: currentUser.id,
      };
      
      await patientService.addDocument(currentTenant.id, patientId, document, currentUser.id);
      
      showToast({
        type: 'success',
        title: 'Document Uploaded',
        message: `${file.name} has been uploaded successfully`,
      });
      
      onUploadComplete?.();
    } catch (error) {
      console.error('Document upload error:', error);
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: error instanceof Error ? error.message : 'Failed to upload document',
      });
    } finally {
      setIsUploading(false);
    }
  }, [currentTenant?.id, currentUser?.id, patientId, selectedCategory, description, showToast, onUploadComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isUploading,
  });
  
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="category" className="label">
          Document Category
        </label>
        <select
          id="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as PatientDocument['category'])}
          className="input"
          disabled={isUploading}
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label htmlFor="description" className="label">
          Description (Optional)
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          rows={2}
          placeholder="Add a brief description of the document..."
          disabled={isUploading}
        />
      </div>
      
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {isDragActive
            ? 'Drop the file here...'
            : 'Drag and drop a file here, or click to select'}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          PDF, Images, DOC, DOCX up to 10MB
        </p>
      </div>
      
      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <div className="loading-spinner"></div>
          <span>Uploading document...</span>
        </div>
      )}
      
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isUploading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => {
            const input = document.querySelector('input[type="file"]') as HTMLInputElement;
            input?.click();
          }}
          className="btn btn-primary"
          disabled={isUploading}
        >
          Select File
        </button>
      </div>
    </div>
  );
};