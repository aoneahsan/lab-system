import { notifications } from 'notification-kit';
import { firebaseConfig } from '@/config/firebase.config';

// Initialize notification kit with v2.0.3 API
export const initializeNotifications = async () => {
  await notifications.init({
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
  
  onNotificationReceived: (callback: (notification: any) => void) => {
    notifications.onPush(callback);
  },
  
  onNotificationOpened: (callback: (notification: any) => void) => {
    notifications.onPushOpened(callback);
  },
  
  subscribeTopic: async (topic: string) => {
    await notifications.subscribe(topic);
  },
  
  unsubscribeTopic: async (topic: string) => {
    await notifications.unsubscribe(topic);
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
    const scheduleOptions: any = {
      id: options.id,
      title: options.title,
      body: options.body,
      actions: options.actions,
      data: options.data,
      schedule: {}
    };
    
    if (options.at) {
      scheduleOptions.schedule.at = options.at;
    } else if (options.in) {
      scheduleOptions.schedule.in = options.in;
    }
    
    if (options.every) {
      scheduleOptions.schedule.every = options.every;
      scheduleOptions.schedule.repeats = true;
    }
    
    return await notifications.schedule(scheduleOptions);
  },
  
  cancel: async (id: number) => {
    await notifications.cancel(id);
  },
  
  cancelAll: async () => {
    await notifications.cancelAll();
  },
  
  getPending: async () => {
    return await notifications.getPending();
  },
  
  onAction: (callback: (notification: any) => void) => {
    // notification-kit v2.0.3 uses 'on' for event handling
    notifications.on('notificationActionPerformed', callback);
  }
};

// Export notifications for advanced use
export { notifications };