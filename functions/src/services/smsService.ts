import twilio from 'twilio';
import config from '../config';

// Initialize Twilio
const TWILIO_ACCOUNT_SID = config.twilio.accountSid;
const TWILIO_AUTH_TOKEN = config.twilio.authToken;
const TWILIO_PHONE_NUMBER = config.twilio.fromNumber;

const twilioClient = TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN 
  ? twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
  : null;

export async function sendSMS(to: string, body: string) {
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

export const smsService = {
  send: sendSMS
};