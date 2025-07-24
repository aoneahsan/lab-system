import { useToastStore, toast } from '@/stores/toast.store';

/**
 * Hook to interact with the toast notification system
 * @returns Object containing toast methods and the showToast function
 */
export const useToast = () => {
  const { addToast, removeToast, toasts } = useToastStore();

  const showToast = ({
    type,
    title,
    message,
    duration = 5000,
  }: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    duration?: number;
  }) => {
    addToast({ type, title, message, duration });
  };

  return {
    showToast,
    toasts,
    removeToast,
    toast, // Export the toast helper methods
  };
};

// Re-export the toast helper for direct imports
export { toast };