import { api } from './api';
import { unifiedStorage } from './unified-storage.service';
import { unifiedNotificationService } from './unified-notification.service';

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
  private readonly STORAGE_KEY = 'notifications';
  private listeners: Array<(notification: Notification) => void> = [];

  // Subscribe to notifications
  subscribe(callback: (notification: Notification) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  // Send notification to all listeners
  private notifyListeners(notification: Notification) {
    this.listeners.forEach((callback) => callback(notification));
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
      metadata: data,
    };

    await api.post('/api/notifications', notification);
    this.notifyListeners(notification);

    // Store locally for offline access
    await this.storeNotificationLocally(notification);

    // Use unified notification service for all notification types
    await unifiedNotificationService.sendCriticalResultNotification(
      data.patientId,
      data.patientName,
      data.testName,
      data.value,
      data.criticalRange,
      '', // Phone would be fetched from patient record
      ''  // Email would be fetched from patient record
    );
  }

  // Store notification locally
  private async storeNotificationLocally(notification: Notification): Promise<void> {
    const notifications = (await unifiedStorage.get<Notification[]>(this.STORAGE_KEY)) || [];
    notifications.unshift(notification);

    // Keep only last 100 notifications
    if (notifications.length > 100) {
      notifications.length = 100;
    }

    await unifiedStorage.set(this.STORAGE_KEY, notifications, {
      tags: ['notifications'],
      compression: true
    });
  }

  // Get local notifications (for offline access)
  async getLocalNotifications(): Promise<Notification[]> {
    return (await unifiedStorage.get<Notification[]>(this.STORAGE_KEY)) || [];
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    // Use unified notification service for permission handling
    return await unifiedNotificationService.requestPushPermission();
  }

  // Check if critical value requires notification
  checkCriticalValue(
    testName: string,
    value: number,
    _referenceRange: { min: number; max: number }
  ): boolean {
    // Define critical ranges for common tests
    const criticalRanges: Record<string, { low?: number; high?: number }> = {
      Glucose: { low: 40, high: 500 },
      Potassium: { low: 2.5, high: 6.5 },
      Sodium: { low: 120, high: 160 },
      Hemoglobin: { low: 7, high: 20 },
      Platelet: { low: 20000, high: 1000000 },
      INR: { high: 4.5 },
      Creatinine: { high: 6 },
      Troponin: { high: 0.04 },
    };

    const critical = criticalRanges[testName];
    if (!critical) return false;

    if (critical.low && value < critical.low) return true;
    if (critical.high && value > critical.high) return true;

    return false;
  }
}

export const notificationService = new NotificationService();
