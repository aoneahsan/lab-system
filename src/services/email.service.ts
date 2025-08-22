import { logger } from '@/services/logger.service';

/**
 * Email Service for sending emails
 * In production, integrate with SendGrid, AWS SES, or other email providers
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

class EmailService {
  private isProduction = import.meta.env.PROD;
  private defaultFrom = 'noreply@labflow.com';

  async sendEmail(options: EmailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    
    if (this.isProduction) {
      // In production, use actual email provider
      // Example with SendGrid:
      // const msg = {
      //   to: recipients,
      //   from: options.from || this.defaultFrom,
      //   subject: options.subject,
      //   text: options.text,
      //   html: options.html,
      // };
      // await sgMail.send(msg);
      
      logger.log('Email would be sent in production:', options);
    } else {
      // Development mode - log to console
      logger.log('📧 Email Service (Dev Mode)');
      logger.log('To:', recipients.join(', '));
      logger.log('Subject:', options.subject);
      logger.log('From:', options.from || this.defaultFrom);
      if (options.html) {
        logger.log('HTML Content:', options.html.substring(0, 200) + '...');
      }
      if (options.text) {
        logger.log('Text Content:', options.text.substring(0, 200) + '...');
      }
      logger.log('---');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    templateData: Record<string, any>
  ): Promise<void> {
    // Load and render template
    const template = await this.loadTemplate(templateId);
    const html = this.renderTemplate(template, templateData);
    
    await this.sendEmail({
      to,
      subject: templateData.subject || 'LabFlow Notification',
      html,
    });
  }

  async sendBulkEmails(emails: EmailOptions[]): Promise<void> {
    // Send multiple emails
    const promises = emails.map(email => this.sendEmail(email));
    await Promise.all(promises);
  }

  private async loadTemplate(templateId: string): Promise<string> {
    // In production, load from template storage
    // For now, return a basic template
    const templates: Record<string, string> = {
      '2fa-code': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
          <div style="background: #f5f5f5; padding: 15px; text-align: center; font-size: 24px; font-weight: bold;">
            {{code}}
          </div>
          <p>{{footer}}</p>
        </div>
      `,
      'welcome': `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Welcome to LabFlow!</h1>
          <p>Hi {{name}},</p>
          <p>Thank you for joining LabFlow. We're excited to have you on board!</p>
          <p>Best regards,<br>The LabFlow Team</p>
        </div>
      `,
    };
    
    return templates[templateId] || '<p>{{content}}</p>';
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    let rendered = template;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, data[key]);
    });
    
    return rendered;
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const emailService = new EmailService();