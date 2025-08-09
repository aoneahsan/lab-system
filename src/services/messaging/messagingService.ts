import { messagingConfig, NotificationPreferences } from '@/config/messaging';
import { smsService } from './smsService';
import { emailService } from './emailService';

export interface MessageOptions {
  templateId: string;
  variables: Record<string, string>;
  to: {
    email?: string;
    phone?: string;
  };
  preferences?: NotificationPreferences;
}

export class MessagingService {
  // Send message using template
  async sendTemplatedMessage(options: MessageOptions): Promise<{
    email?: { success: boolean; error?: string };
    sms?: { success: boolean; error?: string };
  }> {
    const template = messagingConfig.templates[options.templateId];
    if (!template) {
      throw new Error(`Template ${options.templateId} not found`);
    }

    const content = this.replaceVariables(template.content, options.variables);
    const results: any = {};

    // Send email if applicable
    if (template.type !== 'sms' && options.to.email) {
      if (this.shouldSendEmail(options.templateId, options.preferences)) {
        const subject = template.subject
          ? this.replaceVariables(template.subject, options.variables)
          : template.name;

        results.email = await emailService.sendEmail({
          to: options.to.email,
          subject,
          body: content,
          html: emailService.generateHTMLEmail(template.name, {
            subject,
            content: content.replace(/\n/g, '<br>'),
          }),
          templateId: template.id,
          variables: options.variables,
        });
      }
    }

    // Send SMS if applicable
    if (template.type !== 'email' && options.to.phone) {
      if (this.shouldSendSMS(options.templateId, options.preferences)) {
        results.sms = await smsService.sendSMS({
          to: options.to.phone,
          body: content,
          templateId: template.id,
          variables: options.variables,
        });
      }
    }

    return results;
  }

  // Replace template variables
  private replaceVariables(template: string, variables: Record<string, string>): string {
    return template.replace(/{{(\w+)}}/g, (match, key) => {
      return variables[key] || match;
    });
  }

  // Check if email should be sent based on preferences
  private shouldSendEmail(templateId: string, preferences?: NotificationPreferences): boolean {
    if (!preferences) return true;

    switch (templateId) {
      case 'appointment-reminder':
        return preferences.email.appointmentReminders;
      case 'result-ready':
      case 'critical-result':
        return preferences.email.testResults;
      case 'payment-received':
        return preferences.email.billing;
      default:
        return true;
    }
  }

  // Check if SMS should be sent based on preferences
  private shouldSendSMS(templateId: string, preferences?: NotificationPreferences): boolean {
    if (!preferences) return true;

    switch (templateId) {
      case 'appointment-reminder':
        return preferences.sms.appointmentReminders;
      case 'result-ready':
        return preferences.sms.testResults;
      case 'critical-result':
        return preferences.sms.criticalAlerts;
      default:
        return false;
    }
  }

  // Send appointment reminder
  async sendAppointmentReminder(
    patient: { name: string; email?: string; phone?: string },
    appointment: { date: string; time: string },
    preferences?: NotificationPreferences
  ) {
    return this.sendTemplatedMessage({
      templateId: 'appointmentReminder',
      variables: {
        patientName: patient.name,
        date: appointment.date,
        time: appointment.time,
      },
      to: {
        email: patient.email,
        phone: patient.phone,
      },
      preferences,
    });
  }

  // Send result notification
  async sendResultNotification(
    patient: { name: string; email?: string; phone?: string },
    testName: string,
    isCritical: boolean = false,
    criticalDetails?: { value: string; unit: string; referenceRange: string },
    preferences?: NotificationPreferences
  ) {
    if (isCritical && criticalDetails) {
      return this.sendTemplatedMessage({
        templateId: 'criticalResult',
        variables: {
          patientName: patient.name,
          testName,
          value: criticalDetails.value,
          unit: criticalDetails.unit,
          referenceRange: criticalDetails.referenceRange,
        },
        to: {
          email: patient.email,
          phone: patient.phone,
        },
        preferences,
      });
    }

    return this.sendTemplatedMessage({
      templateId: 'resultReady',
      variables: {
        patientName: patient.name,
        testName,
      },
      to: {
        email: patient.email,
        phone: patient.phone,
      },
      preferences,
    });
  }
}

export const messagingService = new MessagingService();