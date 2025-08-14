import { useSearchParams } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

export interface ModalData {
  action?: string | null;
  id?: string | null;
  index?: string | null;
  [key: string]: any;
}

/**
 * Hook for managing modal state in URL
 * Allows modals to persist across page refreshes
 */
export function useModalState(modalKey: string) {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if this modal is open
  const isOpen = searchParams.get('modal') === modalKey;
  
  // Get any additional modal data from URL
  const modalData = useMemo<ModalData>(() => {
    const data: ModalData = {};
    
    // Get common modal params
    data.action = searchParams.get('action');
    data.id = searchParams.get('modalId');
    data.index = searchParams.get('modalIndex');
    
    // Get any custom params that start with modal_
    searchParams.forEach((value, key) => {
      if (key.startsWith('modal_')) {
        data[key.replace('modal_', '')] = value;
      }
    });
    
    return data;
  }, [searchParams]);
  
  // Open modal with optional data
  const openModal = useCallback((additionalData?: ModalData) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', modalKey);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Use modal_ prefix for custom data to avoid conflicts
          if (['action', 'id', 'index'].includes(key)) {
            params.set(`modal${key.charAt(0).toUpperCase() + key.slice(1)}`, String(value));
          } else {
            params.set(`modal_${key}`, String(value));
          }
        }
      });
    }
    
    setSearchParams(params);
  }, [searchParams, setSearchParams, modalKey]);
  
  // Close modal and clean up URL params
  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    
    // Remove modal param
    params.delete('modal');
    
    // Remove common modal params
    params.delete('action');
    params.delete('modalId');
    params.delete('modalIndex');
    
    // Remove any custom modal_ params
    const keysToDelete: string[] = [];
    params.forEach((_, key) => {
      if (key.startsWith('modal_')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => params.delete(key));
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);
  
  return {
    isOpen,
    modalData,
    openModal,
    closeModal,
  };
}

/**
 * Hook for managing multiple modals on the same page
 */
export function useMultiModalState() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentModal = searchParams.get('modal');
  const modalData = useMemo(() => {
    const data: Record<string, any> = {};
    
    // Get all modal-related params
    searchParams.forEach((value, key) => {
      if (key !== 'modal' && (key.startsWith('modal') || key === 'action')) {
        data[key] = value;
      }
    });
    
    return data;
  }, [searchParams]);
  
  const openModal = useCallback((modalKey: string, data?: Record<string, any>) => {
    const params = new URLSearchParams(searchParams);
    params.set('modal', modalKey);
    
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.set(key, String(value));
        }
      });
    }
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);
  
  const closeModal = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    
    // Get all keys that need to be deleted
    const keysToDelete: string[] = ['modal', 'action', 'modalId', 'modalIndex'];
    
    // Add any modal_ prefixed keys
    params.forEach((_, key) => {
      if (key.startsWith('modal') || key === 'editIndex' || key.startsWith('delete')) {
        keysToDelete.push(key);
      }
    });
    
    // Delete all modal-related params
    keysToDelete.forEach(key => params.delete(key));
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);
  
  const isModalOpen = useCallback((modalKey: string) => {
    return currentModal === modalKey;
  }, [currentModal]);
  
  return {
    currentModal,
    modalData,
    openModal,
    closeModal,
    isModalOpen,
  };
}