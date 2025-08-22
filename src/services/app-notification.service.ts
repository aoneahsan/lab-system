import { notifications } from 'notification-kit';
import app, { firebaseConfig } from '@/config/firebase.config';
import { logger } from '@/services/logger.service';

// Initialize notification kit with v2.0.3 API
export const initializeNotifications = async () => {
  try {
    // Check if Firebase config is properly loaded
    if (!firebaseConfig.apiKey) {
      logger.warn('Firebase configuration is missing. Notifications will be disabled.');
      logger.warn('Please ensure VITE_FIREBASE_API_KEY is set in your .env file');
      return;
    }

    // Try both methods - with app instance and with config
    try {
      // Method 1: Try with existing Firebase app instance
      await notifications.init({
        provider: 'firebase',
        inApp: {
          position: 'top-right',
          duration: 4000,
        },
        config: {
          app,
        },
      });
    } catch (appError) {
      // Method 2: If app instance fails, try with config directly
      logger.warn('App instance initialization failed, trying with config:', appError);
      await notifications.init({
        provider: 'firebase',
        config: {
          app,
          ...firebaseConfig,
        },
        inApp: {
          position: 'top-right',
          duration: 4000,
        },
      });
    }

    isInitialized = true;
    logger.log('✅ Notifications initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize notifications:', error);
    // Don't throw - allow app to continue without notifications
  }
};

// Track initialization state
let isInitialized = false;

// Export convenience methods that match our existing toast API
export const toast = {
  success: (title: string, message?: string) => {
    if (!isInitialized) {
      logger.log(`✅ ${title}`, message || '');
      return;
    }
    notifications.showInApp({
      title,
      message: message || '',
      type: 'success',
      duration: 4000,
    });
  },
  error: (title: string, message?: string) => {
    if (!isInitialized) {
      logger.error(`❌ ${title}`, message || '');
      return;
    }
    notifications.showInApp({
      title,
      message: message || '',
      type: 'error',
      duration: 6000,
    });
  },
  warning: (title: string, message?: string) => {
    if (!isInitialized) {
      logger.warn(`⚠️ ${title}`, message || '');
      return;
    }
    notifications.showInApp({
      title,
      message: message || '',
      type: 'warning',
      duration: 5000,
    });
  },
  info: (title: string, message?: string) => {
    if (!isInitialized) {
      logger.info(`ℹ️ ${title}`, message || '');
      return;
    }
    notifications.showInApp({
      title,
      message: message || '',
      type: 'info',
      duration: 4000,
    });
  },
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
  },
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
      schedule: {},
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
  },
};

// Export notifications for advanced use
export { notifications };
