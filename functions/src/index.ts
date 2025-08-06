import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onObjectFinalized } from 'firebase-functions/v2/storage';
import { onCall } from 'firebase-functions/v2/https';

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

// Initialize Admin SDK
admin.initializeApp();

// Re-export all callable functions from their modules
export * from './auth';
export * from './billing';
export * from './integration';
export * from './notifications';
export * from './reports';
export * from './results';
export * from './ai-ml/analyzeTestTrends';
export * from './ai-ml/assessPatientRisk';
export * from './ai-ml/interpretTestResults';
export * from './ai-ml/predictQCResults';
export * from './predictive-analytics/detectLabAnomalies';
export * from './predictive-analytics/predictResourceNeeds';
export * from './predictive-analytics/predictTestVolumes';

// Automated Workflows using Firebase Functions v2

// Monitor critical results and send notifications
export const monitorCriticalResults = onSchedule({
  schedule: 'every 5 minutes',
  memory: '512MiB',
  timeoutSeconds: 300,
}, criticalResultsMonitor);

// Check for expiring samples
export const checkSampleExpiration = onSchedule({
  schedule: 'every day 06:00',
  memory: '512MiB',
  timeoutSeconds: 300,
}, sampleExpirationChecker);

// Send appointment reminders
export const sendAppointmentReminders = onSchedule({
  schedule: 'every hour',
  memory: '512MiB',
  timeoutSeconds: 300,
}, appointmentReminders);

// Generate daily reports
export const generateDailyReports = onSchedule({
  schedule: 'every day 22:00',
  memory: '1GiB',
  timeoutSeconds: 540,
}, reportGenerator);

// Monitor inventory levels
export const monitorInventory = onSchedule({
  schedule: 'every 2 hours',
  memory: '512MiB',
  timeoutSeconds: 300,
}, inventoryAlerts);

// Monitor quality control
export const monitorQualityControl = onSchedule({
  schedule: 'every 30 minutes',
  memory: '512MiB',
  timeoutSeconds: 300,
}, qualityControlMonitor);

// Check insurance eligibility
export const checkInsuranceEligibility = onSchedule({
  schedule: 'every 6 hours',
  memory: '512MiB',
  timeoutSeconds: 300,
}, insuranceEligibilityChecker);

// Process billing automation
export const processBillingAutomation = onSchedule({
  schedule: 'every day 02:00',
  memory: '1GiB',
  timeoutSeconds: 540,
}, billingAutomation);

// Firestore Triggers

// Sync result changes
export const onResultCreated = onDocumentCreated('labflow_results/{resultId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const result = snapshot.data();
  console.log('New result created:', snapshot.id);

  // Trigger any necessary sync operations
  await dataSync.syncResult(result, snapshot.id);
});

// Monitor order status changes
export const onOrderUpdated = onDocumentUpdated('labflow_orders/{orderId}', async (event) => {
  const { before, after } = event.data;
  if (!before || !after) return;

  const beforeData = before.data();
  const afterData = after.data();

  if (beforeData.status !== afterData.status) {
    console.log('Order status changed:', after.id, beforeData.status, '->', afterData.status);
    // Trigger notifications or other workflows
  }
});

// Handle sample barcode generation
export const onSampleCreated = onDocumentCreated('labflow_samples/{sampleId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const sample = snapshot.data();
  console.log('New sample created:', snapshot.id);

  // Generate barcode if needed
  if (!sample.barcode) {
    await snapshot.ref.update({
      barcode: `S${Date.now()}${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

// Storage Triggers

// Process uploaded documents
export const processUploadedFile = onObjectFinalized({ region: 'us-central1' }, async (event) => {
  const filePath = event.data.name;
  const contentType = event.data.contentType;

  console.log('File uploaded:', filePath, contentType);

  // Process different file types (e.g., lab reports, images)
  if (contentType?.startsWith('image/')) {
    // Process images (e.g., generate thumbnails)
    console.log('Processing image:', filePath);
  } else if (contentType === 'application/pdf') {
    // Process PDFs (e.g., extract text for searching)
    console.log('Processing PDF:', filePath);
  }
});

// Utility function for syncing all tenants (can be called manually)
export const syncAllTenants = onCall({
  memory: '1GiB',
  timeoutSeconds: 540,
}, async (request) => {
  if (!request.auth || request.auth.token.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized');
  }

  console.log('Starting full sync for all tenants...');
  // Implement full sync logic
  return { success: true, message: 'Sync initiated' };
});