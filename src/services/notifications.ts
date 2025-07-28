import { api } from './api';
import { Preferences } from '@capacitor/preferences';

export interface Notification {
  id: string;
  type: 'critical_value' | 'result_ready' | 'qc_alert' | 'system' | 'general';
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  createdAt: Date;
  metadata?: any;
}

export interface CriticalValueNotification {
  patientId: string;
  patientName: string;
  testName: string;
  value: string;
  criticalRange: string;
  orderingProvider: string;
  requiresAcknowledgment: boolean;
}

class NotificationService {
  private readonly STORAGE_KEY = 'labflow_notifications';
  private listeners: Array<(notification: Notification) => void> = [];

  // Subscribe to notifications
  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Send notification to all listeners
  private notifyListeners(notification: Notification) {
    this.listeners.forEach(callback => callback(notification));
  }

  // Get all notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/api/notifications');
    return response.data;
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/api/notifications/unread-count');
    return response.data.count;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    await api.patch(`/api/notifications/${notificationId}/read`);
  }

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    await api.post('/api/notifications/mark-all-read');
  }

  // Acknowledge critical value
  async acknowledgeCriticalValue(notificationId: string, notes?: string): Promise<void> {
    await api.post(`/api/notifications/${notificationId}/acknowledge`, { notes });
  }

  // Create critical value notification
  async createCriticalValueNotification(data: CriticalValueNotification): Promise<void> {
    const notification: Notification = {
      id: Date.now().toString(),
      type: 'critical_value',
      title: 'Critical Value Alert',
      message: `${data.patientName} - ${data.testName}: ${data.value} (Critical: ${data.criticalRange})`,
      priority: 'high',
      read: false,
      createdAt: new Date(),
      metadata: data
    };

    await api.post('/api/notifications', notification);
    this.notifyListeners(notification);
    
    // Store locally for offline access
    await this.storeNotificationLocally(notification);
    
    // Show system notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        requireInteraction: true,
        tag: notification.id
      });
    }
  }

  // Store notification locally
  private async storeNotificationLocally(notification: Notification): Promise<void> {
    const stored = await Preferences.get({ key: this.STORAGE_KEY });
    const notifications = stored.value ? JSON.parse(stored.value) : [];
    notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.length = 100;
    }
    
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(notifications)
    });
  }

  // Get local notifications (for offline access)
  async getLocalNotifications(): Promise<Notification[]> {
    const stored = await Preferences.get({ key: this.STORAGE_KEY });
    return stored.value ? JSON.parse(stored.value) : [];
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Check if critical value requires notification
  checkCriticalValue(testName: string, value: number, _referenceRange: { min: number; max: number }): boolean {
    // Define critical ranges for common tests
    const criticalRanges: Record<string, { low?: number; high?: number }> = {
      'Glucose': { low: 40, high: 500 },
      'Potassium': { low: 2.5, high: 6.5 },
      'Sodium': { low: 120, high: 160 },
      'Hemoglobin': { low: 7, high: 20 },
      'Platelet': { low: 20000, high: 1000000 },
      'INR': { high: 4.5 },
      'Creatinine': { high: 6 },
      'Troponin': { high: 0.04 }
    };

    const critical = criticalRanges[testName];
    if (!critical) return false;

    if (critical.low && value < critical.low) return true;
    if (critical.high && value > critical.high) return true;

    return false;
  }
}

export const notificationService = new NotificationService();