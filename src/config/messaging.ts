// Messaging Configuration for SMS and Email

export interface MessagingConfig {
  sms: {
    provider: 'twilio' | 'aws-sns' | 'vonage';
    enabled: boolean;
    defaultCountryCode: string;
  };
  email: {
    provider: 'sendgrid' | 'aws-ses' | 'mailgun';
    enabled: boolean;
    fromAddress: string;
    fromName: string;
    replyTo?: string;
  };
  templates: {
    [key: string]: MessageTemplate;
  };
}

export interface MessageTemplate {
  id: string;
  name: string;
  subject?: string; // For emails
  content: string;
  variables: string[];
  type: 'sms' | 'email' | 'both';
}

export const messagingConfig: MessagingConfig = {
  sms: {
    provider: (import.meta.env.VITE_SMS_PROVIDER || 'twilio') as any,
    enabled: import.meta.env.VITE_SMS_ENABLED === 'true',
    defaultCountryCode: import.meta.env.VITE_SMS_DEFAULT_COUNTRY || '+1',
  },
  email: {
    provider: (import.meta.env.VITE_EMAIL_PROVIDER || 'sendgrid') as any,
    enabled: import.meta.env.VITE_EMAIL_ENABLED === 'true',
    fromAddress: import.meta.env.VITE_EMAIL_FROM || 'noreply@labflow.com',
    fromName: import.meta.env.VITE_EMAIL_FROM_NAME || 'LabFlow',
    replyTo: import.meta.env.VITE_EMAIL_REPLY_TO,
  },
  templates: {
    appointmentReminder: {
      id: 'appointment-reminder',
      name: 'Appointment Reminder',
      subject: 'Appointment Reminder - {{date}} at {{time}}',
      content: 'Hi {{patientName}}, this is a reminder for your appointment on {{date}} at {{time}}. Please arrive 15 minutes early. Reply CONFIRM to confirm or CANCEL to cancel.',
      variables: ['patientName', 'date', 'time'],
      type: 'both',
    },
    resultReady: {
      id: 'result-ready',
      name: 'Test Results Ready',
      subject: 'Your Test Results are Ready',
      content: 'Hi {{patientName}}, your test results for {{testName}} are now available. Please log in to your patient portal to view them or contact your healthcare provider.',
      variables: ['patientName', 'testName'],
      type: 'both',
    },
    criticalResult: {
      id: 'critical-result',
      name: 'Critical Result Alert',
      subject: 'URGENT: Critical Test Result',
      content: 'CRITICAL RESULT for patient {{patientName}} - {{testName}}: {{value}} {{unit}}. Reference range: {{referenceRange}}. Please take immediate action.',
      variables: ['patientName', 'testName', 'value', 'unit', 'referenceRange'],
      type: 'both',
    },
    paymentReceived: {
      id: 'payment-received',
      name: 'Payment Confirmation',
      subject: 'Payment Received - Thank You',
      content: 'Hi {{patientName}}, we have received your payment of {{amount}} for invoice {{invoiceNumber}}. Thank you!',
      variables: ['patientName', 'amount', 'invoiceNumber'],
      type: 'email',
    },
    passwordReset: {
      id: 'password-reset',
      name: 'Password Reset',
      subject: 'Reset Your Password',
      content: 'Hi {{userName}}, click the link below to reset your password. This link expires in 1 hour. {{resetLink}}',
      variables: ['userName', 'resetLink'],
      type: 'email',
    },
    welcomePatient: {
      id: 'welcome-patient',
      name: 'Welcome New Patient',
      subject: 'Welcome to LabFlow',
      content: 'Welcome {{patientName}}! Your account has been created. Download our mobile app to access your results on the go.',
      variables: ['patientName'],
      type: 'both',
    },
  },
};

// Notification preferences
export interface NotificationPreferences {
  email: {
    appointmentReminders: boolean;
    testResults: boolean;
    billing: boolean;
    marketing: boolean;
  };
  sms: {
    appointmentReminders: boolean;
    testResults: boolean;
    criticalAlerts: boolean;
  };
  push: {
    enabled: boolean;
    testResults: boolean;
    appointments: boolean;
  };
}

export const defaultNotificationPreferences: NotificationPreferences = {
  email: {
    appointmentReminders: true,
    testResults: true,
    billing: true,
    marketing: false,
  },
  sms: {
    appointmentReminders: true,
    testResults: false,
    criticalAlerts: true,
  },
  push: {
    enabled: true,
    testResults: true,
    appointments: true,
  },
};