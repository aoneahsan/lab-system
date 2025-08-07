import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { sendNotification } from '../utils/notifications';
import { CriticalRange, Result, Notification } from '../types';

const db = admin.firestore();

/**
 * Monitor for critical lab results that require immediate attention
 * Triggers notifications to physicians and creates escalation if not acknowledged
 */
export async function criticalResultsMonitor(event: any) {
  const snapshot = event.data as DocumentSnapshot;
  
  // Skip if document was deleted
  if (!snapshot || !snapshot.exists) {
    return;
  }

  const result = snapshot.data() as Result;
  const resultId = snapshot.id;
  
  // Extract tenant ID from the path
  const pathParts = snapshot.ref.path.split('/');
  const collectionName = pathParts[0];
  const tenantId = collectionName.split('_')[1]; // Extract from labflow_{tenantId}_results
  
  logger.info(`Checking result ${resultId} for critical values in tenant ${tenantId}`);

  try {
    // Only process if result is validated and not already notified
    if (result.status !== 'validated' || result.criticalNotificationSent) {
      return;
    }

    // Check if result has critical values
    const criticalValue = await checkCriticalValue(result, tenantId);
    
    if (!criticalValue.isCritical) {
      return;
    }

    logger.warn(`Critical value detected for result ${resultId}: ${criticalValue.message}`);

    // Get patient information
    const patientDoc = await db.doc(`labflow_${tenantId}_patients/${result.patientId}`).get();
    if (!patientDoc.exists) {
      logger.error(`Patient ${result.patientId} not found`);
      return;
    }
    const patient = patientDoc.data();

    // Get ordering physician information
    const orderDoc = await db.doc(`labflow_${tenantId}_orders/${result.orderId}`).get();
    if (!orderDoc.exists) {
      logger.error(`Order ${result.orderId} not found`);
      return;
    }
    const order = orderDoc.data();

    // Create critical notification
    const notification: Notification = {
      id: `${resultId}_critical`,
      type: 'critical_result',
      priority: 'urgent',
      tenantId,
      title: 'CRITICAL LAB RESULT',
      message: `Patient: ${patient?.firstName} ${patient?.lastName} (MRN: ${patient?.mrn})\n` +
               `Test: ${result.testName}\n` +
               `Result: ${result.value} ${result.unit}\n` +
               `${criticalValue.message}`,
      recipientId: order?.orderingPhysicianId || order?.createdBy,
      recipientType: 'physician',
      data: {
        resultId,
        patientId: result.patientId,
        orderId: result.orderId,
        testId: result.testId,
        value: result.value,
        unit: result.unit,
        criticalLow: criticalValue.criticalLow,
        criticalHigh: criticalValue.criticalHigh
      },
      requiresAcknowledgment: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      attempts: 0
    };

    // Save notification to database
    await db.collection(`labflow_${tenantId}_notifications`).doc(notification.id).set(notification);

    // Send immediate notification via multiple channels
    const notificationResult = await sendNotification(notification);

    // Update result to mark critical notification sent
    await snapshot.ref.update({
      criticalNotificationSent: true,
      criticalNotificationAt: admin.firestore.FieldValue.serverTimestamp(),
      isCritical: true,
      criticalMessage: criticalValue.message
    });

    // Create audit log entry
    await db.collection(`labflow_${tenantId}_audit_logs`).add({
      action: 'critical_result_notification',
      entityType: 'result',
      entityId: resultId,
      tenantId,
      details: {
        patientId: result.patientId,
        testName: result.testName,
        value: result.value,
        unit: result.unit,
        recipientId: notification.recipientId,
        notificationChannels: notificationResult.channels
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Schedule escalation if not acknowledged within 15 minutes
    await scheduleEscalation(notification, tenantId);

    logger.info(`Critical notification sent for result ${resultId}`);

  } catch (error) {
    logger.error(`Error processing critical result ${resultId}:`, error);
    
    // Create error notification for system admin
    await db.collection(`labflow_system_notifications`).add({
      type: 'system_error',
      severity: 'high',
      message: `Failed to process critical result ${resultId} in tenant ${tenantId}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Check if the result value is critical based on test-specific ranges
 */
async function checkCriticalValue(result: Result, tenantId: string): Promise<{
  isCritical: boolean;
  message: string;
  criticalLow?: number;
  criticalHigh?: number;
}> {
  // Get test configuration with critical ranges
  const testDoc = await db.doc(`labflow_${tenantId}_tests/${result.testId}`).get();
  
  if (!testDoc.exists) {
    logger.warn(`Test ${result.testId} not found, cannot check critical values`);
    return { isCritical: false, message: '' };
  }

  const test = testDoc.data();
  const criticalRanges = test?.criticalRanges as CriticalRange;
  
  if (!criticalRanges || result.value === undefined || result.value === null) {
    return { isCritical: false, message: '' };
  }

  const numericValue = parseFloat(result.value.toString());
  if (isNaN(numericValue)) {
    // Handle non-numeric results (like "Positive", "Reactive", etc.)
    const criticalValues = test?.criticalValues as string[];
    if (criticalValues && criticalValues.includes(result.value.toString())) {
      return {
        isCritical: true,
        message: `Critical value detected: ${result.value}`
      };
    }
    return { isCritical: false, message: '' };
  }

  // Check against critical low
  if (criticalRanges.low !== undefined && numericValue <= criticalRanges.low) {
    return {
      isCritical: true,
      message: `CRITICALLY LOW: ${result.value} ${result.unit} (Critical Low: ${criticalRanges.low})`,
      criticalLow: criticalRanges.low,
      criticalHigh: criticalRanges.high
    };
  }

  // Check against critical high
  if (criticalRanges.high !== undefined && numericValue >= criticalRanges.high) {
    return {
      isCritical: true,
      message: `CRITICALLY HIGH: ${result.value} ${result.unit} (Critical High: ${criticalRanges.high})`,
      criticalLow: criticalRanges.low,
      criticalHigh: criticalRanges.high
    };
  }

  return { isCritical: false, message: '' };
}

/**
 * Schedule escalation if critical result is not acknowledged
 */
async function scheduleEscalation(notification: Notification, tenantId: string) {
  // Create a scheduled task for escalation (in production, use Cloud Tasks)
  const escalationTime = new Date();
  escalationTime.setMinutes(escalationTime.getMinutes() + 15);

  await db.collection(`labflow_${tenantId}_scheduled_tasks`).add({
    type: 'critical_result_escalation',
    notificationId: notification.id,
    scheduledFor: escalationTime,
    status: 'pending',
    data: notification,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });
}