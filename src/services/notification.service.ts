import { functions } from '@/config/firebase.config';
import { httpsCallable } from 'firebase/functions';
import type { NotificationChannel, NotificationTemplate } from '@/types/notification.types';
import { logger } from '@/services/logger.service';

interface CriticalResultNotificationData {
  method: 'phone' | 'sms' | 'email';
  recipient: string;
  patientName: string;
  testName: string;
  value: string;
  flag: string;
}

interface NotificationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

class NotificationService {
  async sendNotification(
    channel: NotificationChannel,
    recipient: string,
    template: NotificationTemplate,
    data: Record<string, any>
  ): Promise<NotificationResponse> {
    try {
      const sendNotification = httpsCallable<
        {
          channel: NotificationChannel;
          recipient: string;
          template: NotificationTemplate;
          data: Record<string, any>;
        },
        NotificationResponse
      >(functions, 'sendNotification');

      const result = await sendNotification({
        channel,
        recipient,
        template,
        data,
      });

      return result.data;
    } catch (error) {
      logger.error('Failed to send notification:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      };
    }
  }

  async sendCriticalResultNotification(data: CriticalResultNotificationData): Promise<NotificationResponse> {
    const templates: Record<string, NotificationTemplate> = {
      email: 'critical_result_email',
      sms: 'critical_result_sms',
      phone: 'critical_result_phone',
    };

    const template = templates[data.method];
    if (!template) {
      return {
        success: false,
        error: 'Invalid notification method',
      };
    }

    return this.sendNotification(data.method as NotificationChannel, data.recipient, template as NotificationTemplate, {
      patientName: data.patientName,
      testName: data.testName,
      value: data.value,
      flag: data.flag,
    });
  }

  async sendBulkNotifications(
    notifications: Array<{
      channel: NotificationChannel;
      recipient: string;
      template: NotificationTemplate;
      data: Record<string, any>;
    }>
  ): Promise<NotificationResponse[]> {
    try {
      const sendBulkNotifications = httpsCallable<
        {
          notifications: Array<{
            channel: NotificationChannel;
            recipient: string;
            template: NotificationTemplate;
            data: Record<string, any>;
          }>;
        },
        { results: NotificationResponse[] }
      >(functions, 'sendBulkNotifications');

      const result = await sendBulkNotifications({ notifications });
      return result.data.results;
    } catch (error) {
      logger.error('Failed to send bulk notifications:', error);
      return notifications.map(() => ({
        success: false,
        error: 'Failed to send notification',
      }));
    }
  }

  async sendTestResultReady(
    patientEmail: string,
    patientName: string,
    testName: string,
    orderId: string
  ): Promise<NotificationResponse> {
    return this.sendNotification('email', patientEmail, 'test_result_ready', {
      patientName,
      testName,
      orderId,
    });
  }

  async sendAppointmentReminder(
    patientPhone: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string
  ): Promise<NotificationResponse> {
    return this.sendNotification('sms', patientPhone, 'appointment_reminder', {
      patientName,
      appointmentDate,
      appointmentTime,
    });
  }

  async sendPaymentReceipt(
    patientEmail: string,
    patientName: string,
    amount: number,
    invoiceNumber: string
  ): Promise<NotificationResponse> {
    return this.sendNotification('email', patientEmail, 'payment_receipt', {
      patientName,
      amount,
      invoiceNumber,
    });
  }

  async sendInventoryAlert(
    managerEmail: string,
    itemName: string,
    currentStock: number,
    minimumStock: number
  ): Promise<NotificationResponse> {
    return this.sendNotification('email', managerEmail, 'inventory_alert', {
      itemName,
      currentStock,
      minimumStock,
    });
  }

  async sendQualityControlAlert(
    supervisorEmail: string,
    testName: string,
    issue: string,
    severity: 'warning' | 'critical'
  ): Promise<NotificationResponse> {
    return this.sendNotification('email', supervisorEmail, 'qc_alert', {
      testName,
      issue,
      severity,
    });
  }
}

export const notificationService = new NotificationService();