import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

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
export const monitorCriticalResults = functions.firestore
  .document('labflow_results/{resultId}')
  .onWrite(criticalResultsMonitor);

// Export sample expiration monitoring (runs every 6 hours)
export const checkSampleExpiration = functions.pubsub
  .schedule('every 6 hours')
  .onRun(sampleExpirationMonitor);

// Export quality control monitoring
export const monitorQualityControl = functions.firestore
  .document('labflow_qc_results/{qcResultId}')
  .onCreate(qualityControlMonitor);

// Export result validation workflow
export const validateResults = functions.firestore
  .document('labflow_results/{resultId}')
  .onCreate(resultValidationWorkflow);

// Export inventory monitoring (runs daily at 8 AM)
export const checkInventoryLevels = functions.pubsub
  .schedule('0 8 * * *')
  .timeZone('America/New_York')
  .onRun(inventoryAlerts);

// Export appointment reminders (runs daily at 9 AM)
export const sendAppointmentReminders = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('America/New_York')
  .onRun(appointmentReminders);

// Export insurance eligibility checker (callable function)
export const verifyInsurance = functions.https.onCall(checkInsuranceEligibility);

// Export billing automation
export const processBilling = functions.firestore
  .document('labflow_results/{resultId}')
  .onWrite(billingAutomation);

// Keep existing functions for backward compatibility
export const createOrder = functions.https.onCall(async (data, context) => {
  console.log('Creating order');
  return { success: true, orderId: 'test-order' };
});

export const processResults = functions.https.onCall(async (data, context) => {
  console.log('Processing results');
  return { success: true, message: 'Results processed' };
});

export const dailyBackup = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Running daily backup');
    return null;
  });

// Health check endpoint
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'LabFlow Cloud Functions'
  });
});