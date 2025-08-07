import * as admin from 'firebase-admin';
import { DocumentSnapshot } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions/v2';
import { sendNotification } from '../utils/notifications';
import { QCResult, Notification } from '../types';

const db = admin.firestore();

/**
 * Monitor quality control results for failures and violations
 * Triggers notifications when QC rules are violated
 */
export async function qualityControlMonitor(event: any) {
  const snapshot = event.data as DocumentSnapshot;
  
  // Skip if document was deleted
  if (!snapshot || !snapshot.exists) {
    return;
  }

  const qcResult = snapshot.data() as QCResult;
  const qcResultId = snapshot.id;
  
  // Extract tenant ID from the path
  const pathParts = snapshot.ref.path.split('/');
  const collectionName = pathParts[0];
  const tenantId = collectionName.split('_')[1];
  
  logger.info(`Monitoring QC result ${qcResultId} for tenant ${tenantId}`);

  try {
    // Only process if QC was rejected
    if (qcResult.accepted) {
      logger.info(`QC result ${qcResultId} passed, no action needed`);
      return;
    }

    // Check if notification already sent
    if (qcResult.notificationSent) {
      return;
    }

    // Analyze violations and determine severity
    const severity = analyzeQCSeverity(qcResult.violations || []);
    
    // Get test information
    const testDoc = await db.doc(`labflow_${tenantId}_tests/${qcResult.testId}`).get();
    const test = testDoc.data();

    // Create notification based on severity
    const notification: Notification = {
      id: `${qcResultId}_qc_failure`,
      type: 'qc_failure',
      priority: severity === 'critical' ? 'urgent' : 'high',
      tenantId,
      title: severity === 'critical' ? 'CRITICAL QC FAILURE' : 'QC Failure Alert',
      message: formatQCFailureMessage(qcResult, test?.name || qcResult.testName),
      recipientId: 'lab_supervisor', // In production, get from configuration
      recipientType: 'lab_tech',
      data: {
        qcResultId,
        testId: qcResult.testId,
        testName: qcResult.testName,
        controlLevel: qcResult.controlLevel,
        value: qcResult.value,
        mean: qcResult.mean,
        sd: qcResult.sd,
        violations: qcResult.violations,
        instrumentId: qcResult.instrumentId
      },
      requiresAcknowledgment: severity === 'critical',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      attempts: 0
    };

    // Save notification
    await db.collection(`labflow_${tenantId}_notifications`).doc(notification.id).set(notification);
    
    // Send notification
    await sendNotification(notification);

    // Update QC result to mark notification sent
    await snapshot.ref.update({
      notificationSent: true,
      notificationSentAt: admin.firestore.FieldValue.serverTimestamp(),
      severity
    });

    // Check if immediate action is required
    if (severity === 'critical') {
      await handleCriticalQCFailure(qcResult, tenantId);
    }

    // Create audit log
    await db.collection(`labflow_${tenantId}_audit_logs`).add({
      action: 'qc_failure_notification',
      entityType: 'qc_result',
      entityId: qcResultId,
      tenantId,
      severity,
      details: {
        testId: qcResult.testId,
        testName: qcResult.testName,
        controlLevel: qcResult.controlLevel,
        value: qcResult.value,
        violations: qcResult.violations,
        instrumentId: qcResult.instrumentId
      },
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`QC failure notification sent for result ${qcResultId}`);

  } catch (error) {
    logger.error(`Error processing QC result ${qcResultId}:`, error);
    
    // Create system notification
    await db.collection('labflow_system_notifications').add({
      type: 'system_error',
      severity: 'high',
      message: `Failed to process QC failure for result ${qcResultId} in tenant ${tenantId}`,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Analyze QC violations to determine severity
 */
function analyzeQCSeverity(violations: string[]): 'warning' | 'high' | 'critical' {
  // Critical violations that require immediate action
  const criticalRules = ['1-3s', 'R-4s', '4-1s', '10x'];
  
  // High severity violations
  const highSeverityRules = ['2-2s', '1-2s'];
  
  // Check for critical violations
  const hasCriticalViolation = violations.some(v => 
    criticalRules.some(rule => v.includes(rule))
  );
  
  if (hasCriticalViolation) {
    return 'critical';
  }
  
  // Check for high severity violations
  const hasHighSeverityViolation = violations.some(v => 
    highSeverityRules.some(rule => v.includes(rule))
  );
  
  if (hasHighSeverityViolation) {
    return 'high';
  }
  
  return 'warning';
}

/**
 * Format QC failure message with details
 */
function formatQCFailureMessage(qcResult: QCResult, testName: string): string {
  const lines = [
    `QC failure detected for ${testName}`,
    `Control Level: ${qcResult.controlLevel}`,
    `Value: ${qcResult.value} (Mean: ${qcResult.mean}, SD: ${qcResult.sd})`,
    `Z-Score: ${qcResult.zScore?.toFixed(2) || 'N/A'}`
  ];
  
  if (qcResult.violations && qcResult.violations.length > 0) {
    lines.push(`Violations: ${qcResult.violations.join(', ')}`);
  }
  
  if (qcResult.instrumentId) {
    lines.push(`Instrument: ${qcResult.instrumentId}`);
  }
  
  return lines.join('\n');
}

/**
 * Handle critical QC failures that require immediate action
 */
async function handleCriticalQCFailure(qcResult: QCResult, tenantId: string): Promise<void> {
  logger.warn(`Handling critical QC failure for test ${qcResult.testName}`);
  
  // Check recent patient results that might be affected
  const recentResults = await db.collection(`labflow_${tenantId}_results`)
    .where('testId', '==', qcResult.testId)
    .where('validatedAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
    .where('status', 'in', ['validated', 'released'])
    .get();
  
  if (recentResults.size > 0) {
    // Create a critical alert about potentially affected results
    const notification: Notification = {
      id: `${qcResult.id}_affected_results`,
      type: 'system_alert',
      priority: 'urgent',
      tenantId,
      title: 'CRITICAL: Patient Results May Be Affected',
      message: `Critical QC failure for ${qcResult.testName} detected. ` +
               `${recentResults.size} patient results from the last 24 hours may be affected. ` +
               `Immediate review required.`,
      recipientId: 'lab_director', // In production, get from configuration
      recipientType: 'admin',
      data: {
        qcResultId: qcResult.id,
        testId: qcResult.testId,
        affectedResultCount: recentResults.size,
        resultIds: recentResults.docs.map(doc => doc.id)
      },
      requiresAcknowledgment: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending',
      attempts: 0
    };
    
    await db.collection(`labflow_${tenantId}_notifications`).doc(notification.id).set(notification);
    await sendNotification(notification);
  }
  
  // Flag the test/instrument for immediate maintenance
  if (qcResult.instrumentId) {
    await db.doc(`labflow_${tenantId}_instruments/${qcResult.instrumentId}`).update({
      requiresMaintenance: true,
      maintenanceReason: 'Critical QC failure',
      maintenanceRequestedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}