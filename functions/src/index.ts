import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';

// Initialize Firebase Admin
admin.initializeApp();

// Export minimal working functions
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