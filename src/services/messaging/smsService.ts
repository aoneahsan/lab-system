import { messagingConfig } from '@/config/messaging';

export interface SMSMessage {
  to: string;
  body: string;
  templateId?: string;
  variables?: Record<string, string>;
}

export interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SMSService {
  private provider: string;

  constructor() {
    this.provider = messagingConfig.sms.provider;
  }

  async sendSMS(message: SMSMessage): Promise<SMSResponse> {
    if (!messagingConfig.sms.enabled) {
      return { success: false, error: 'SMS service is disabled' };
    }

    try {
      const response = await fetch('/api/messaging/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...message,
          provider: this.provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS');
      }

      return response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send SMS',
      };
    }
  }

  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    const promises = messages.map(msg => this.sendSMS(msg));
    return Promise.all(promises);
  }

  formatPhoneNumber(phone: string): string {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Add country code if not present
    if (cleaned.length === 10) {
      return `${messagingConfig.sms.defaultCountryCode}${cleaned}`;
    }
    
    // Assume it already has country code
    return `+${cleaned}`;
  }

  validatePhoneNumber(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }
}

export const smsService = new SMSService();