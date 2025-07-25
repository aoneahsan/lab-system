import * as twilio from 'twilio';

// Initialize Twilio
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

export const smsService = {
  async send(to: string, body: string) {
    if (!twilioClient || !TWILIO_PHONE_NUMBER) {
      console.warn('Twilio not configured, skipping SMS send');
      return { success: false, error: 'SMS service not configured' };
    }

    try {
      const message = await twilioClient.messages.create({
        body,
        to,
        from: TWILIO_PHONE_NUMBER
      });

      console.log('SMS sent successfully:', message.sid);
      return { success: true, messageId: message.sid };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }
};