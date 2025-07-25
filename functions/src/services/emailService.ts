import * as sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export const emailService = {
  async send(to: string, subject: string, html: string) {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, skipping email send');
      return { success: false, error: 'Email service not configured' };
    }

    try {
      const msg = {
        to,
        from: 'noreply@labflow.com', // Configure your verified sender
        subject,
        html,
      };

      const result = await sgMail.send(msg);
      console.log('Email sent successfully:', result);
      return { success: true, messageId: result[0].headers['x-message-id'] };
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }
};