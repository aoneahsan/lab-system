import * as admin from 'firebase-admin';
import { emailService } from './emailService';
import { smsService } from './smsService';

export const notificationService = {
  async sendCriticalResultAlert(resultId: string, result: any) {
    console.log(`Sending critical result alert for ${resultId}`);
    // Implementation handled in criticalResultsMonitor
  },

  async sendSampleStatusUpdate(sampleId: string, oldStatus: string, newStatus: string) {
    console.log(`Sample ${sampleId} status changed from ${oldStatus} to ${newStatus}`);
    
    // Get sample details
    const sample = await admin.firestore()
      .collection('labflow_samples')
      .doc(sampleId)
      .get();
    
    if (!sample.exists) return;
    
    const sampleData = sample.data();
    
    // Notify relevant parties based on status change
    if (newStatus === 'completed') {
      // Notify physician and patient
      await this.createNotification({
        type: 'sample_completed',
        title: 'Sample Processing Complete',
        body: `Sample ${sampleData?.sampleNumber} has been processed and results are available.`,
        userId: sampleData?.physicianId,
        data: { sampleId, status: newStatus }
      });
    }
  },

  async sendPushNotification(token: string, message: { title: string; body: string }, data?: any) {
    try {
      const response = await admin.messaging().send({
        token,
        notification: message,
        data: data ? this.stringifyData(data) : undefined,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            clickAction: 'FLUTTER_NOTIFICATION_CLICK'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1
            }
          }
        }
      });
      
      console.log('Push notification sent:', response);
      return { success: true, messageId: response };
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  },

  async sendSms(phoneNumber: string, message: string) {
    return smsService.send(phoneNumber, message);
  },

  async sendEmail(to: string, subject: string, html: string) {
    return emailService.send(to, subject, html);
  },

  async escalateCriticalResult(resultId: string, result: any) {
    console.log(`Escalating critical result ${resultId}`);
    
    // Get escalation contacts
    const escalationContacts = await admin.firestore()
      .collection('labflow_settings')
      .doc('escalation_contacts')
      .get();
    
    if (!escalationContacts.exists) {
      console.error('No escalation contacts configured');
      return;
    }
    
    const contacts = escalationContacts.data()?.contacts || [];
    
    for (const contact of contacts) {
      if (contact.phoneNumber) {
        await this.sendSms(contact.phoneNumber, 
          `ESCALATION: Unacknowledged critical result for ${result.patientName}. Result ID: ${resultId}. Please review immediately.`
        );
      }
      
      if (contact.email) {
        await this.sendEmail(
          contact.email,
          'ESCALATION: Unacknowledged Critical Result',
          `
          <h2>Escalation Alert</h2>
          <p>An unacknowledged critical result requires immediate attention.</p>
          <p><strong>Result ID:</strong> ${resultId}</p>
          <p><strong>Patient:</strong> ${result.patientName}</p>
          <p><strong>Test:</strong> ${result.testName}</p>
          <p><strong>Value:</strong> ${result.value} ${result.unit}</p>
          <p>Please log in to the system immediately to review and acknowledge this result.</p>
          `
        );
      }
    }
  },

  async createNotification(notification: {
    type: string;
    title: string;
    body: string;
    userId?: string;
    data?: any;
  }) {
    await admin.firestore().collection('labflow_notifications').add({
      ...notification,
      status: 'unread',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  },

  stringifyData(data: any): { [key: string]: string } {
    const stringified: { [key: string]: string } = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        stringified[key] = typeof data[key] === 'string' ? data[key] : JSON.stringify(data[key]);
      }
    }
    return stringified;
  }
};