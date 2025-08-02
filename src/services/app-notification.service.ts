import { NotificationKit, notifications } from 'notification-kit';
import { firebaseConfig } from '@/config/firebase.config';

// Initialize notification kit
export const initializeNotifications = async () => {
  await NotificationKit.init({
    provider: 'firebase',
    config: firebaseConfig,
    inApp: {
      position: 'top-right',
      duration: 4000,
      theme: {
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',
        info: '#3B82F6'
      }
    }
  });
};

// Export convenience methods that match our existing toast API
export const toast = {
  success: (title: string, message?: string) => {
    notifications.showInApp({
      title,
      message: message || '',
      type: 'success',
      duration: 4000
    });
  },
  error: (title: string, message?: string) => {
    notifications.showInApp({
      title,
      message: message || '',
      type: 'error',
      duration: 6000
    });
  },
  warning: (title: string, message?: string) => {
    notifications.showInApp({
      title,
      message: message || '',
      type: 'warning',
      duration: 5000
    });
  },
  info: (title: string, message?: string) => {
    notifications.showInApp({
      title,
      message: message || '',
      type: 'info',
      duration: 4000
    });
  }
};

// Push notification helpers
export const pushNotifications = {
  requestPermission: async () => {
    return await notifications.requestPermission();
  },
  
  getToken: async () => {
    return await notifications.getToken();
  },
  
  onPush: (callback: (notification: any) => void) => {
    notifications.onPush(callback);
  },
  
  onPushOpened: (callback: (notification: any) => void) => {
    notifications.onPushOpened(callback);
  },
  
  subscribe: async (topic: string) => {
    await notifications.subscribe(topic);
  },
  
  unsubscribe: async (topic: string) => {
    await notifications.unsubscribe(topic);
  }
};

// Local notification helpers
export const localNotifications = {
  schedule: async (options: {
    title: string;
    body: string;
    in?: { minutes?: number; hours?: number; days?: number };
    at?: Date;
    every?: 'day' | 'week' | 'month';
    actions?: Array<{ id: string; title: string }>;
  }) => {
    return await notifications.schedule(options);
  },
  
  cancel: async (id: string) => {
    await notifications.cancel(id);
  },
  
  getPending: async () => {
    return await notifications.getPending();
  }
};

// Export the notifications object for advanced use
export { notifications };