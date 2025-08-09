// Re-export toast from notification-kit integration
export { toast } from '@/services/app-notification.service';

// Keep the Toast type for backward compatibility
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

// Deprecated: This store is now handled by notification-kit
// Keeping empty store for backward compatibility if needed
import { create } from 'zustand';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((_set) => ({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
}));
