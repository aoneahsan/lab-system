import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentWritten, onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize Firebase Admin
admin.initializeApp();

// Import function modules
import { criticalResultsMonitor } from './workflows/criticalResultsMonitor';
import { sampleExpirationMonitor } from './workflows/sampleExpirationMonitor';
import { qualityControlMonitor } from './workflows/qualityControlMonitor';
import { resultValidationWorkflow } from './workflows/resultValidationWorkflow';
import { inventoryAlerts } from './workflows/inventoryAlerts';
import { appointmentReminders } from './workflows/appointmentReminders';
import { checkInsuranceEligibility } from './workflows/insuranceEligibilityChecker';
import { billingAutomation } from './workflows/billingAutomation';

// Export critical results monitoring
export const monitorCriticalResults = onDocumentWritten('labflow_{tenantId}_results/{resultId}', criticalResultsMonitor);

// Export sample expiration monitoring (runs every 6 hours)
export const checkSampleExpiration = onSchedule('every 6 hours', sampleExpirationMonitor);

// Export quality control monitoring
export const monitorQualityControl = onDocumentCreated('labflow_{tenantId}_qc_results/{qcResultId}', qualityControlMonitor);

// Export result validation workflow
export const validateResults = onDocumentCreated('labflow_{tenantId}_results/{resultId}', resultValidationWorkflow);

// Export inventory monitoring (runs daily at 8 AM)
export const checkInventoryLevels = onSchedule('0 8 * * *', inventoryAlerts);

// Export appointment reminders (runs daily at 9 AM)
export const sendAppointmentReminders = onSchedule('0 9 * * *', appointmentReminders);

// Export insurance eligibility checker (callable function)
export const verifyInsurance = onCall(checkInsuranceEligibility);

// Export billing automation
export const processBilling = onDocumentWritten('labflow_{tenantId}_results/{resultId}', billingAutomation);

// Keep existing functions for backward compatibility
export const createOrder = onCall(async (request) => {
  console.log('Creating order');
  return { success: true, orderId: 'test-order' };
});

export const processResults = onCall(async (request) => {
  console.log('Processing results');
  return { success: true, message: 'Results processed' };
});

export const dailyBackup = onSchedule('every 24 hours', async (event) => {
  console.log('Running daily backup');
  return null;
});