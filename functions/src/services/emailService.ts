import * as sgMail from '@sendgrid/mail';
import config from '../config';

// Initialize SendGrid with API key from config
const SENDGRID_API_KEY = config.sendgrid.apiKey;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, skipping email send');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const msg = {
      to,
      from: config.sendgrid.fromEmail,
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

export const emailService = {
  send: sendEmail
};