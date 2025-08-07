import * as admin from 'firebase-admin';
import { logger } from 'firebase-functions/v2';
import { ScheduledEvent } from 'firebase-functions/v2/scheduler';
import { sendNotification } from '../utils/notifications';
import { Sample, Notification } from '../types';

const db = admin.firestore();

/**
 * Monitor samples for expiration and send alerts
 * Runs every 6 hours to check sample stability
 */
export async function sampleExpirationMonitor(event: ScheduledEvent) {
  logger.info('Starting sample expiration monitoring');

  try {
    // Get all active tenants
    const tenantsSnapshot = await db.collection('tenants')
      .where('isActive', '==', true)
      .get();

    const monitoringPromises = tenantsSnapshot.docs.map(tenantDoc => 
      monitorTenantSamples(tenantDoc.id)
    );

    await Promise.all(monitoringPromises);

    logger.info('Sample expiration monitoring completed');

  } catch (error) {
    logger.error('Error in sample expiration monitor:', error);
    
    // Create system alert
    await db.collection('labflow_system_notifications').add({
      type: 'system_error',
      severity: 'medium',
      message: 'Sample expiration monitor failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Monitor samples for a specific tenant
 */
async function monitorTenantSamples(tenantId: string): Promise<void> {
  logger.info(`Monitoring samples for tenant ${tenantId}`);

  try {
    // Get all samples that are not completed or rejected
    const samplesSnapshot = await db.collection(`labflow_${tenantId}_samples`)
      .where('status', 'in', ['collected', 'in_transit', 'received', 'processing'])
      .get();

    const now = new Date();
    const warningThreshold = 2; // Hours before expiration to send warning
    const criticalThreshold = 0.5; // Hours before expiration for critical alert

    for (const sampleDoc of samplesSnapshot.docs) {
      const sample = sampleDoc.data() as Sample;
      
      // Skip if no expiration time set
      if (!sample.stabilityHours || !sample.collectionDateTime) {
        continue;
      }

      // Calculate expiration time
      const collectionTime = sample.collectionDateTime.toDate();
      const expirationTime = new Date(collectionTime);
      expirationTime.setHours(expirationTime.getHours() + sample.stabilityHours);

      const hoursUntilExpiration = (expirationTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Skip if already expired
      if (hoursUntilExpiration < 0) {
        await handleExpiredSample(sample, sampleDoc.id, tenantId);
        continue;
      }

      // Check if notification is needed
      let notificationType: 'warning' | 'critical' | null = null;
      
      if (hoursUntilExpiration <= criticalThreshold && !sample.criticalExpirationNotificationSent) {
        notificationType = 'critical';
      } else if (hoursUntilExpiration <= warningThreshold && !sample.expirationNotificationSent) {
        notificationType = 'warning';
      }

      if (notificationType) {
        await sendExpirationNotification(sample, sampleDoc.id, tenantId, hoursUntilExpiration, notificationType);
      }
    }

  } catch (error) {
    logger.error(`Error monitoring samples for tenant ${tenantId}:`, error);
  }
}

/**
 * Handle expired sample
 */
async function handleExpiredSample(sample: Sample, sampleId: string, tenantId: string): Promise<void> {
  // Update sample status to rejected
  await db.doc(`labflow_${tenantId}_samples/${sampleId}`).update({
    status: 'rejected',
    rejectionReason: 'Sample expired',
    rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Get patient and order information
  const [patientDoc, orderDoc] = await Promise.all([
    db.doc(`labflow_${tenantId}_patients/${sample.patientId}`).get(),
    db.doc(`labflow_${tenantId}_orders/${sample.orderId}`).get()
  ]);

  const patient = patientDoc.data();
  const order = orderDoc.data();

  // Create notification for lab supervisor
  const notification: Notification = {
    id: `${sampleId}_expired`,
    type: 'sample_expiration',
    priority: 'high',
    tenantId,
    title: 'Sample Expired',
    message: `Sample ${sample.barcode} for patient ${patient?.firstName} ${patient?.lastName} has expired and been rejected. Recollection required.`,
    recipientId: order?.assignedTo || 'lab_supervisor',
    recipientType: 'lab_tech',
    data: {
      sampleId,
      patientId: sample.patientId,
      orderId: sample.orderId,
      barcode: sample.barcode,
      collectionTime: sample.collectionDateTime,
      expirationTime: new Date()
    },
    requiresAcknowledgment: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    attempts: 0
  };

  await db.collection(`labflow_${tenantId}_notifications`).doc(notification.id).set(notification);
  await sendNotification(notification);

  // Create audit log
  await db.collection(`labflow_${tenantId}_audit_logs`).add({
    action: 'sample_expired',
    entityType: 'sample',
    entityId: sampleId,
    tenantId,
    details: {
      barcode: sample.barcode,
      patientId: sample.patientId,
      orderId: sample.orderId,
      collectionTime: sample.collectionDateTime,
      stabilityHours: sample.stabilityHours
    },
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Send expiration notification
 */
async function sendExpirationNotification(
  sample: Sample,
  sampleId: string,
  tenantId: string,
  hoursUntilExpiration: number,
  type: 'warning' | 'critical'
): Promise<void> {
  
  // Get patient information
  const patientDoc = await db.doc(`labflow_${tenantId}_patients/${sample.patientId}`).get();
  const patient = patientDoc.data();

  const priority = type === 'critical' ? 'urgent' : 'high';
  const title = type === 'critical' ? 'CRITICAL: Sample About to Expire' : 'Sample Expiration Warning';
  
  const notification: Notification = {
    id: `${sampleId}_expiration_${type}`,
    type: 'sample_expiration',
    priority,
    tenantId,
    title,
    message: `Sample ${sample.barcode} for patient ${patient?.firstName} ${patient?.lastName} ` +
             `will expire in ${hoursUntilExpiration.toFixed(1)} hours. ` +
             `Process immediately or recollect sample.`,
    recipientId: 'lab_supervisor', // In production, get from order or assignment
    recipientType: 'lab_tech',
    data: {
      sampleId,
      patientId: sample.patientId,
      orderId: sample.orderId,
      barcode: sample.barcode,
      hoursUntilExpiration,
      expirationTime: new Date(sample.collectionDateTime.toDate().getTime() + sample.stabilityHours! * 60 * 60 * 1000)
    },
    requiresAcknowledgment: type === 'critical',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    status: 'pending',
    attempts: 0
  };

  await db.collection(`labflow_${tenantId}_notifications`).doc(notification.id).set(notification);
  await sendNotification(notification);

  // Update sample to mark notification sent
  const updateData: any = {
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  };
  
  if (type === 'warning') {
    updateData.expirationNotificationSent = true;
    updateData.expirationNotificationAt = admin.firestore.FieldValue.serverTimestamp();
  } else {
    updateData.criticalExpirationNotificationSent = true;
    updateData.criticalExpirationNotificationAt = admin.firestore.FieldValue.serverTimestamp();
  }
  
  await db.doc(`labflow_${tenantId}_samples/${sampleId}`).update(updateData);

  logger.info(`${type} expiration notification sent for sample ${sample.barcode}`);
}