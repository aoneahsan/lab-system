import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Import function modules
import { criticalResultsMonitor } from './workflows/criticalResultsMonitor';
import { sampleExpirationChecker } from './workflows/sampleExpirationChecker';
import { appointmentReminders } from './workflows/appointmentReminders';
import { reportGenerator } from './workflows/reportGenerator';
import { inventoryAlerts } from './workflows/inventoryAlerts';
import { qualityControlMonitor } from './workflows/qualityControlMonitor';
import { insuranceEligibilityChecker } from './workflows/insuranceEligibilityChecker';
import { billingAutomation } from './workflows/billingAutomation';
import { dataSync } from './sync/dataSync';
import { notificationService } from './services/notificationService';
import { emailService } from './services/emailService';
import { smsService } from './services/smsService';
import { pdfGeneratorService } from './services/pdfGeneratorService';

// Initialize Admin SDK
admin.initializeApp();

// Automated Workflows

// Monitor critical results and send notifications
export const monitorCriticalResults = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .pubsub.schedule('every 5 minutes')
  .onRun(criticalResultsMonitor);

// Check for expiring samples
export const checkSampleExpiration = functions
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .pubsub.schedule('every day 06:00')
  .onRun(sampleExpirationChecker);

// Send appointment reminders
export const sendAppointmentReminders = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .pubsub.schedule('every hour')
  .onRun(appointmentReminders);

// Generate scheduled reports
export const generateScheduledReports = functions
  .runWith({ memory: '1GB', timeoutSeconds: 540 })
  .pubsub.schedule('0 1 * * *') // Daily at 1 AM
  .onRun(reportGenerator);

// Monitor inventory levels
export const monitorInventory = functions
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .pubsub.schedule('every 6 hours')
  .onRun(inventoryAlerts);

// Quality control monitoring
export const monitorQualityControl = functions
  .runWith({ memory: '512MB', timeoutSeconds: 240 })
  .pubsub.schedule('every 30 minutes')
  .onRun(qualityControlMonitor);

// Verify insurance eligibility
export const verifyInsuranceEligibility = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .pubsub.schedule('every day 05:00')
  .onRun(insuranceEligibilityChecker);

// Automated billing tasks
export const processBillingAutomation = functions
  .runWith({ memory: '512MB', timeoutSeconds: 300 })
  .pubsub.schedule('every day 02:00')
  .onRun(billingAutomation);

// Real-time Triggers

// New result created - check if critical
export const onResultCreated = functions.firestore
  .document('labflow_results/{resultId}')
  .onCreate(async (snap, context) => {
    const result = snap.data();
    const resultId = context.params.resultId;
    
    // Check if result has critical values
    if (result.isCritical) {
      await notificationService.sendCriticalResultAlert(resultId, result);
    }
  });

// Sample status updated
export const onSampleStatusUpdated = functions.firestore
  .document('labflow_samples/{sampleId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.status !== after.status) {
      // Notify relevant parties about status change
      await notificationService.sendSampleStatusUpdate(context.params.sampleId, before.status, after.status);
    }
  });

// Order created - check inventory
export const onOrderCreated = functions.firestore
  .document('labflow_orders/{orderId}')
  .onCreate(async (snap, context) => {
    const order = snap.data();
    
    // Update inventory levels
    for (const item of order.items) {
      await admin.firestore()
        .collection('labflow_inventory')
        .doc(item.productId)
        .update({
          quantity: admin.firestore.FieldValue.increment(-item.quantity),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
  });

// HTTP Functions

// Sync data endpoint
export const syncData = functions
  .runWith({ memory: '1GB', timeoutSeconds: 540 })
  .https.onRequest(dataSync);

// Generate PDF report on demand
export const generatePdfReport = functions
  .runWith({ memory: '1GB', timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    return await pdfGeneratorService.generateReport(data);
  });

// Send notification on demand
export const sendNotification = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const { type, recipient, message, data: notificationData } = data;
    
    switch (type) {
      case 'email':
        return await emailService.send(recipient, message.subject, message.body);
      case 'sms':
        return await smsService.send(recipient, message.body);
      case 'push':
        return await notificationService.sendPushNotification(recipient, message, notificationData);
      default:
        throw new functions.https.HttpsError('invalid-argument', 'Invalid notification type');
    }
  });

// Storage trigger for document processing
export const processUploadedDocument = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    
    if (!filePath) return;
    
    // Process different document types
    if (filePath.startsWith('labflow/reports/')) {
      // Process reports
      console.log('Processing report:', filePath);
    } else if (filePath.startsWith('labflow/results/')) {
      // Process result attachments
      console.log('Processing result attachment:', filePath);
    }
  });

// Cleanup old data
export const cleanupOldData = functions
  .runWith({ memory: '512MB', timeoutSeconds: 540 })
  .pubsub.schedule('every sunday 03:00')
  .onRun(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Clean up old notifications
    const oldNotifications = await admin.firestore()
      .collection('labflow_notifications')
      .where('createdAt', '<', thirtyDaysAgo)
      .where('status', '==', 'read')
      .get();
    
    const batch = admin.firestore().batch();
    oldNotifications.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    
    console.log(`Cleaned up ${oldNotifications.size} old notifications`);
  });