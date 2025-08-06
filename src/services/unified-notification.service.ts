import NotificationKit from 'notification-kit';
import { Capacitor } from '@capacitor/core';
import { auth } from '@/config/firebase';
import { notificationService } from './notification.service';
import type { User } from 'firebase/auth';

export interface UnifiedNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, any>;
  actions?: Array<{ id: string; title: string }>;
  icon?: string;
  badge?: string;
  sound?: string;
}

export interface ScheduledNotificationOptions extends UnifiedNotificationOptions {
  id?: number;
  at?: Date;
  in?: { minutes?: number; hours?: number; days?: number };
  every?: 'day' | 'week' | 'month' | 'year';
  repeats?: boolean;
}

class UnifiedNotificationService {
  private initialized = false;
  private pushToken: string | null = null;
  private currentUser: User | null = null;

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize NotificationKit is already done in app-notification.service.ts
      // But we'll set up listeners here
      this.setupPushListeners();
      this.setupLocalListeners();
      
      // Subscribe to auth state changes
      auth.onAuthStateChanged((user) => {
        this.currentUser = user;
        if (user) {
          this.subscribeTenantTopics();
        }
      });

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize unified notifications:', error);
    }
  }

  private setupPushListeners() {
    // Handle push notification received
    NotificationKit.onPush((notification) => {
      console.log('Push notification received:', notification);
      
      // Show as in-app notification if app is in foreground
      if (notification.data?.showInApp !== false) {
        NotificationKit.showInApp({
          title: notification.title || 'New Notification',
          message: notification.body || '',
          type: notification.data?.type || 'info',
          duration: 5000
        });
      }
    });

    // Handle push notification opened
    NotificationKit.onPushOpened((notification) => {
      console.log('Push notification opened:', notification);
      
      // Handle deep linking based on notification data
      if (notification.data?.route) {
        window.location.href = notification.data.route;
      }
    });
  }

  private setupLocalListeners() {
    // Handle local notification actions
    NotificationKit.onLocalNotificationAction((notification) => {
      console.log('Local notification action:', notification);
      
      // Handle specific actions
      if (notification.actionId === 'view') {
        if (notification.data?.route) {
          window.location.href = notification.data.route;
        }
      }
    });
  }

  // Push Notification Methods
  async requestPushPermission(): Promise<boolean> {
    try {
      const result = await NotificationKit.requestPermission();
      
      if (result.receive === 'granted') {
        // Get and store push token
        this.pushToken = await NotificationKit.getToken();
        
        // Subscribe to default topics
        await this.subscribeTenantTopics();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      return false;
    }
  }

  async getPushToken(): Promise<string | null> {
    if (!this.pushToken) {
      try {
        this.pushToken = await NotificationKit.getToken();
      } catch (error) {
        console.error('Failed to get push token:', error);
      }
    }
    return this.pushToken;
  }

  private async subscribeTenantTopics() {
    if (!this.currentUser) return;

    try {
      // Subscribe to tenant-specific topic
      const tenantId = (this.currentUser as any).tenantId;
      if (tenantId) {
        await NotificationKit.subscribe(`tenant_${tenantId}`);
      }

      // Subscribe to user role topics
      const userRole = (this.currentUser as any).role;
      if (userRole) {
        await NotificationKit.subscribe(`role_${userRole}`);
      }

      // Subscribe to user-specific topic
      await NotificationKit.subscribe(`user_${this.currentUser.uid}`);
    } catch (error) {
      console.error('Failed to subscribe to topics:', error);
    }
  }

  // Local Notification Methods
  async scheduleAppointmentReminder(
    appointmentId: string,
    patientName: string,
    appointmentDate: Date,
    reminderMinutesBefore: number = 60
  ): Promise<number> {
    const reminderTime = new Date(appointmentDate.getTime() - reminderMinutesBefore * 60 * 1000);
    
    const notificationId = await NotificationKit.schedule({
      id: parseInt(appointmentId.replace(/\D/g, '').slice(-9)), // Generate numeric ID from appointment ID
      title: 'Appointment Reminder',
      body: `${patientName}, you have an appointment in ${reminderMinutesBefore} minutes`,
      at: reminderTime,
      data: {
        type: 'appointment_reminder',
        appointmentId,
        route: `/appointments/${appointmentId}`
      },
      actions: [
        { id: 'view', title: 'View Details' },
        { id: 'dismiss', title: 'Dismiss' }
      ]
    });

    return notificationId;
  }

  async scheduleSampleCollectionReminder(
    orderId: string,
    patientName: string,
    testName: string
  ): Promise<number> {
    const notificationId = await NotificationKit.schedule({
      id: parseInt(orderId.replace(/\D/g, '').slice(-9)),
      title: 'Sample Collection Required',
      body: `${patientName}, please visit the lab for ${testName} sample collection`,
      in: { hours: 24 }, // Remind after 24 hours
      data: {
        type: 'sample_collection',
        orderId,
        route: `/orders/${orderId}`
      }
    });

    return notificationId;
  }

  async scheduleQCReminder(
    qcTestId: string,
    testName: string,
    nextRunTime: Date
  ): Promise<number> {
    const notificationId = await NotificationKit.schedule({
      id: parseInt(qcTestId.replace(/\D/g, '').slice(-9)),
      title: 'QC Test Due',
      body: `Quality control test for ${testName} is due`,
      at: nextRunTime,
      data: {
        type: 'qc_reminder',
        qcTestId,
        route: `/quality-control/${qcTestId}`
      }
    });

    return notificationId;
  }

  async cancelScheduledNotification(notificationId: number): Promise<void> {
    await NotificationKit.cancel(notificationId);
  }

  async getAllScheduledNotifications() {
    return await NotificationKit.getPending();
  }

  // In-App Notification Methods (Re-export from app-notification.service)
  showSuccess(title: string, message?: string) {
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'success',
      duration: 4000
    });
  }

  showError(title: string, message?: string) {
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'error',
      duration: 6000
    });
  }

  showWarning(title: string, message?: string) {
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'warning',
      duration: 5000
    });
  }

  showInfo(title: string, message?: string) {
    NotificationKit.showInApp({
      title,
      message: message || '',
      type: 'info',
      duration: 4000
    });
  }

  // Critical Notifications (Combine local + push + backend)
  async sendCriticalResultNotification(
    patientId: string,
    patientName: string,
    testName: string,
    value: string,
    flag: string,
    recipientPhone: string,
    recipientEmail: string
  ) {
    const platform = Capacitor.getPlatform();
    
    // 1. Send backend notification (SMS/Email/Phone)
    await notificationService.sendCriticalResultNotification({
      method: 'sms',
      recipient: recipientPhone,
      patientName,
      testName,
      value,
      flag
    });

    // 2. Show in-app notification immediately
    this.showError(
      'Critical Result Alert',
      `${patientName} - ${testName}: ${value} (${flag})`
    );

    // 3. Schedule local notification for mobile platforms
    if (platform !== 'web') {
      await NotificationKit.schedule({
        title: 'Critical Result Alert',
        body: `${patientName} - ${testName}: ${value} (${flag})`,
        in: { seconds: 1 }, // Show immediately
        data: {
          type: 'critical_result',
          patientId,
          route: `/patients/${patientId}/results`
        },
        sound: 'critical_alert.wav'
      });
    }
  }

  // Inventory Alert Notifications
  async sendInventoryAlert(
    itemName: string,
    currentStock: number,
    minimumStock: number,
    managerId: string
  ) {
    // Show in-app notification
    this.showWarning(
      'Low Inventory Alert',
      `${itemName} stock is low (${currentStock}/${minimumStock})`
    );

    // Send push notification to inventory managers
    await NotificationKit.subscribe('inventory_managers');
    
    // Backend will handle sending the actual push notification
    await notificationService.sendInventoryAlert(
      '', // Email will be resolved on backend
      itemName,
      currentStock,
      minimumStock
    );
  }

  // Helper Methods
  async checkNotificationPermissions(): Promise<{
    push: boolean;
    local: boolean;
  }> {
    const platform = Capacitor.getPlatform();
    
    if (platform === 'web') {
      // Web only has push notifications via service workers
      const pushPermission = 'Notification' in window && Notification.permission === 'granted';
      return {
        push: pushPermission,
        local: false // Web doesn't have local notifications
      };
    } else {
      // Mobile platforms
      const permissions = await NotificationKit.checkPermissions();
      return {
        push: permissions.receive === 'granted',
        local: permissions.receive === 'granted' // Same permission for both on mobile
      };
    }
  }

  async openNotificationSettings() {
    const platform = Capacitor.getPlatform();
    
    if (platform !== 'web') {
      // This would open device settings on mobile
      // Implementation depends on additional Capacitor plugins
      console.log('Opening notification settings...');
    }
  }
}

export const unifiedNotificationService = new UnifiedNotificationService();