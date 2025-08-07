import * as functions from 'firebase-functions';
import * as Twilio from 'twilio';

const accountSid = functions.config().twilio.account_sid;
const authToken = functions.config().twilio.auth_token;
const messagingServiceSid = functions.config().twilio.messaging_service_sid;

const client = Twilio(accountSid, authToken);

export const sendSMS = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { to, body } = data;

  try {
    const message = await client.messages.create({
      body,
      to,
      messagingServiceSid,
    });

    return {
      success: true,
      messageId: message.sid,
    };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Handle SMS webhooks
export const handleSMSWebhook = functions.https.onRequest(async (req, res) => {
  const { MessageStatus, MessageSid, To, From, ErrorCode } = req.body;

  console.log('SMS Status:', {
    MessageSid,
    MessageStatus,
    To,
    From,
    ErrorCode,
  });

  // Update message status in database
  // Handle delivery failures
  // Log for analytics

  res.status(200).send('OK');
});