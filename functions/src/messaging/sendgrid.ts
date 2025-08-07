import * as functions from 'firebase-functions';
import * as sgMail from '@sendgrid/mail';
import { db } from '../config/firebase';

const PROJECT_PREFIX = 'labflow_';

sgMail.setApiKey(functions.config().sendgrid.api_key);

export const sendEmail = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { to, subject, body, html, from, fromName, templateId, variables } = data;

  try {
    const msg: any = {
      to,
      from: {
        email: from || functions.config().sendgrid.from_email,
        name: fromName || 'LabFlow',
      },
      subject,
    };

    if (templateId && functions.config().sendgrid.templates?.[templateId]) {
      msg.templateId = functions.config().sendgrid.templates[templateId];
      msg.dynamicTemplateData = variables;
    } else {
      msg.text = body;
      msg.html = html || body.replace(/\n/g, '<br>');
    }

    const result = await sgMail.send(msg);

    // Log email send
    await db.collection(`${PROJECT_PREFIX}email_logs`).add({
      to,
      subject,
      templateId,
      sentBy: context.auth.uid,
      sentAt: new Date(),
      messageId: result[0].headers['x-message-id'],
      status: 'sent',
    });

    return {
      success: true,
      messageId: result[0].headers['x-message-id'],
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
});

// Process SendGrid webhooks
export const handleEmailWebhook = functions.https.onRequest(async (req, res) => {
  const events = req.body;

  for (const event of events) {
    const { event: eventType, sg_message_id, email, timestamp } = event;

    // Update email status
    const emailDocs = await db
      .collection(`${PROJECT_PREFIX}email_logs`)
      .where('messageId', '==', sg_message_id)
      .limit(1)
      .get();

    if (!emailDocs.empty) {
      await emailDocs.docs[0].ref.update({
        status: eventType,
        [`${eventType}At`]: new Date(timestamp * 1000),
      });
    }
  }

  res.status(200).send('OK');
});