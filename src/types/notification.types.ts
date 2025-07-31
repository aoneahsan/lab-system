export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationTemplate = 
  | 'critical_result_email'
  | 'critical_result_sms'
  | 'critical_result_phone'
  | 'test_result_ready'
  | 'appointment_reminder'
  | 'payment_receipt'
  | 'inventory_alert'
  | 'qc_alert'
  | 'order_status_update'
  | 'system_alert'
  | 'password_reset'
  | 'welcome_email'
  | 'report_ready';

export interface NotificationPreference {
  channel: NotificationChannel;
  enabled: boolean;
  categories: NotificationCategory[];
}

export type NotificationCategory = 
  | 'critical_results'
  | 'test_results'
  | 'appointments'
  | 'billing'
  | 'system_alerts'
  | 'marketing';

export interface NotificationLog {
  id: string;
  tenantId: string;
  recipientId: string;
  recipientType: 'patient' | 'staff' | 'provider';
  channel: NotificationChannel;
  template: NotificationTemplate;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  sentAt: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface NotificationConfig {
  tenantId: string;
  channels: {
    email: {
      enabled: boolean;
      provider: 'sendgrid' | 'ses' | 'smtp';
      config: Record<string, any>;
    };
    sms: {
      enabled: boolean;
      provider: 'twilio' | 'sns';
      config: Record<string, any>;
    };
    push: {
      enabled: boolean;
      provider: 'fcm' | 'apns';
      config: Record<string, any>;
    };
  };
  templates: Record<NotificationTemplate, {
    subject?: string;
    body: string;
    variables: string[];
  }>;
}