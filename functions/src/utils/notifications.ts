import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { Notification, NotificationResult, NotificationChannel } from '../types';

const db = admin.firestore();

/**
 * Send notification through multiple channels based on priority and recipient preferences
 */
export async function sendNotification(notification: Notification): Promise<NotificationResult> {
  const channels: NotificationChannel[] = [];
  let success = false;

  try {
    // Get recipient preferences
    const userDoc = await db.doc(`labflow_${notification.tenantId}_users/${notification.recipientId}`).get();
    
    if (!userDoc.exists) {
      throw new Error(`Recipient ${notification.recipientId} not found`);
    }

    const user = userDoc.data();
    const preferences = user?.notificationPreferences || {
      email: true,
      sms: notification.priority === 'urgent',
      push: true,
      inApp: true
    };

    // For urgent notifications, use all available channels
    if (notification.priority === 'urgent') {
      preferences.email = true;
      preferences.sms = true;
      preferences.push = true;
    }

    // Send in-app notification (always)
    try {
      await sendInAppNotification(notification);
      channels.push({ type: 'in_app', status: 'sent', sentAt: new Date() });
      success = true;
    } catch (error) {
      logger.error('Failed to send in-app notification:', error);
      channels.push({ 
        type: 'in_app', 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }

    // Send push notification
    if (preferences.push && user?.fcmToken) {
      try {
        await sendPushNotification(notification, user.fcmToken);
        channels.push({ type: 'push', status: 'sent', sentAt: new Date() });
        success = true;
      } catch (error) {
        logger.error('Failed to send push notification:', error);
        channels.push({ 
          type: 'push', 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Send email notification
    if (preferences.email && user?.email) {
      try {
        await sendEmailNotification(notification, user.email);
        channels.push({ type: 'email', status: 'sent', sentAt: new Date() });
        success = true;
      } catch (error) {
        logger.error('Failed to send email notification:', error);
        channels.push({ 
          type: 'email', 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Send SMS for urgent notifications
    if (preferences.sms && user?.phoneNumber && notification.priority === 'urgent') {
      try {
        await sendSMSNotification(notification, user.phoneNumber);
        channels.push({ type: 'sms', status: 'sent', sentAt: new Date() });
        success = true;
      } catch (error) {
        logger.error('Failed to send SMS notification:', error);
        channels.push({ 
          type: 'sms', 
          status: 'failed', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    // Update notification status
    await db.doc(`labflow_${notification.tenantId}_notifications/${notification.id}`).update({
      status: success ? 'sent' : 'failed',
      attempts: admin.firestore.FieldValue.increment(1),
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp(),
      channels
    });

    return { success, channels };

  } catch (error) {
    logger.error('Error sending notification:', error);
    return {
      success: false,
      channels,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(notification: Notification): Promise<void> {
  // In-app notifications are stored in the notifications collection
  // The client app will subscribe to real-time updates
  logger.info(`Sending in-app notification ${notification.id}`);
  
  // Already saved in the main function, just log here
  return Promise.resolve();
}

/**
 * Send push notification via Firebase Cloud Messaging
 */
async function sendPushNotification(notification: Notification, fcmToken: string): Promise<void> {
  const message = {
    notification: {
      title: notification.title,
      body: notification.message
    },
    data: {
      notificationId: notification.id,
      type: notification.type,
      priority: notification.priority,
      ...notification.data
    },
    token: fcmToken,
    android: {
      priority: notification.priority === 'urgent' ? 'high' : 'normal' as any,
      notification: {
        sound: notification.priority === 'urgent' ? 'critical' : 'default',
        channelId: `labflow_${notification.priority}`
      }
    },
    apns: {
      payload: {
        aps: {
          sound: notification.priority === 'urgent' ? 'critical' : 'default',
          badge: 1,
          contentAvailable: true
        }
      }
    }
  };

  await admin.messaging().send(message);
  logger.info(`Push notification sent to ${fcmToken.substring(0, 10)}...`);
}

/**
 * Send email notification
 */
async function sendEmailNotification(notification: Notification, email: string): Promise<void> {
  // In production, integrate with SendGrid, AWS SES, or other email service
  // For now, we'll store the email job in a collection for processing
  
  await db.collection(`labflow_${notification.tenantId}_email_queue`).add({
    to: email,
    subject: notification.title,
    body: notification.message,
    priority: notification.priority,
    template: getEmailTemplate(notification.type),
    data: notification.data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending'
  });

  logger.info(`Email queued for ${email}`);
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(notification: Notification, phoneNumber: string): Promise<void> {
  // In production, integrate with Twilio, AWS SNS, or other SMS service
  // For now, we'll store the SMS job in a collection for processing
  
  const shortMessage = `${notification.title}: ${notification.message}`.substring(0, 160);
  
  await db.collection(`labflow_${notification.tenantId}_sms_queue`).add({
    to: phoneNumber,
    message: shortMessage,
    priority: notification.priority,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending'
  });

  logger.info(`SMS queued for ${phoneNumber}`);
}

/**
 * Get email template based on notification type
 */
function getEmailTemplate(type: string): string {
  const templates: Record<string, string> = {
    critical_result: 'critical_result_notification',
    sample_expiration: 'sample_expiration_warning',
    qc_failure: 'qc_failure_alert',
    appointment_reminder: 'appointment_reminder',
    system_alert: 'system_alert'
  };

  return templates[type] || 'default_notification';
}