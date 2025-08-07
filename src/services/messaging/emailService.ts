import { messagingConfig } from '@/config/messaging';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  body: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: EmailAttachment[];
  templateId?: string;
  variables?: Record<string, string>;
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private provider: string;

  constructor() {
    this.provider = messagingConfig.email.provider;
  }

  async sendEmail(message: EmailMessage): Promise<EmailResponse> {
    if (!messagingConfig.email.enabled) {
      return { success: false, error: 'Email service is disabled' };
    }

    try {
      const response = await fetch('/api/messaging/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...message,
          from: messagingConfig.email.fromAddress,
          fromName: messagingConfig.email.fromName,
          replyTo: messagingConfig.email.replyTo,
          provider: this.provider,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      return response.json();
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailResponse[]> {
    const promises = messages.map(msg => this.sendEmail(msg));
    return Promise.all(promises);
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate HTML email from template
  generateHTMLEmail(templateName: string, variables: Record<string, string>): string {
    // Basic HTML template
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${variables.subject || 'LabFlow Notification'}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LabFlow</h1>
            </div>
            <div class="content">
              ${variables.content || ''}
            </div>
            <div class="footer">
              <p>© 2024 LabFlow. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();