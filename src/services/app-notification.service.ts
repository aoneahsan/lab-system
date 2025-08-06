import NotificationKit from 'notification-kit';
import { firebaseConfig } from '@/config/firebase.config';

// Initialize notification kit with v2.0.3 API
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
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'success',
      duration: 4000
    });
  },
  error: (title: string, message?: string) => {
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'error',
      duration: 6000
    });
  },
  warning: (title: string, message?: string) => {
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'warning',
      duration: 5000
    });
  },
  info: (title: string, message?: string) => {
    NotificationKit.showInApp({
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
    return await NotificationKit.requestPermission();
  },
  
  getToken: async () => {
    return await NotificationKit.getToken();
  },
  
  onNotificationReceived: (callback: (notification: any) => void) => {
    NotificationKit.onPush(callback);
  },
  
  onNotificationOpened: (callback: (notification: any) => void) => {
    NotificationKit.onPushOpened(callback);
  },
  
  subscribeTopic: async (topic: string) => {
    await NotificationKit.subscribe(topic);
  },
  
  unsubscribeTopic: async (topic: string) => {
    await NotificationKit.unsubscribe(topic);
  }
};

// Local notification helpers
export const localNotifications = {
  schedule: async (options: {
    title: string;
    body: string;
    id?: number;
    in?: { minutes?: number; hours?: number; days?: number };
    at?: Date;
    every?: 'day' | 'week' | 'month';
    actions?: Array<{ id: string; title: string }>;
    data?: Record<string, any>;
  }) => {
    return await NotificationKit.schedule(options);
  },
  
  cancel: async (id: number) => {
    await NotificationKit.cancel(id);
  },
  
  cancelAll: async () => {
    await NotificationKit.cancelAll();
  },
  
  getPending: async () => {
    return await NotificationKit.getPending();
  },
  
  onAction: (callback: (notification: any) => void) => {
    NotificationKit.onLocalNotificationAction(callback);
  }
};

// Export NotificationKit for advanced use
export { NotificationKit };