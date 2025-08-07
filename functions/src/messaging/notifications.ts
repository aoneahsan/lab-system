import * as functions from 'firebase-functions';
import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

const PROJECT_PREFIX = 'labflow_';

// Send appointment reminders
export const sendAppointmentReminders = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    // Get appointments for tomorrow
    const appointments = await db
      .collection(`${PROJECT_PREFIX}appointments`)
      .where('date', '>=', tomorrow)
      .where('date', '<', dayAfter)
      .where('reminderSent', '==', false)
      .get();

    const batch = db.batch();
    const notifications = [];

    for (const doc of appointments.docs) {
      const appointment = doc.data();
      const patient = await db
        .collection(`${PROJECT_PREFIX}patients`)
        .doc(appointment.patientId)
        .get();

      if (patient.exists) {
        const patientData = patient.data()!;
        
        // Queue notification
        notifications.push({
          templateId: 'appointmentReminder',
          to: {
            email: patientData.email,
            phone: patientData.phone,
          },
          variables: {
            patientName: patientData.name,
            date: appointment.date.toDate().toLocaleDateString(),
            time: appointment.time,
          },
          patientId: appointment.patientId,
        });

        // Mark reminder as sent
        batch.update(doc.ref, { reminderSent: true });
      }
    }

    await batch.commit();

    // Send notifications
    for (const notification of notifications) {
      await sendNotification(notification);
    }

    console.log(`Sent ${notifications.length} appointment reminders`);
  });

// Send critical result alerts
export const sendCriticalResultAlert = functions.firestore
  .document(`${PROJECT_PREFIX}results/{resultId}`)
  .onCreate(async (snap, context) => {
    const result = snap.data();
    
    if (result.isCritical) {
      const patient = await db
        .collection(`${PROJECT_PREFIX}patients`)
        .doc(result.patientId)
        .get();

      const test = await db
        .collection(`${PROJECT_PREFIX}tests`)
        .doc(result.testId)
        .get();

      if (patient.exists && test.exists) {
        const patientData = patient.data()!;
        const testData = test.data()!;

        // Send to patient
        await sendNotification({
          templateId: 'criticalResult',
          to: {
            email: patientData.email,
            phone: patientData.phone,
          },
          variables: {
            patientName: patientData.name,
            testName: testData.name,
            value: result.value,
            unit: result.unit,
            referenceRange: `${result.referenceRange.min}-${result.referenceRange.max}`,
          },
          patientId: result.patientId,
        });

        // Also notify ordering physician
        if (result.orderingPhysicianId) {
          const physician = await db
            .collection(`${PROJECT_PREFIX}users`)
            .doc(result.orderingPhysicianId)
            .get();

          if (physician.exists) {
            await sendNotification({
              templateId: 'criticalResult',
              to: {
                email: physician.data()!.email,
                phone: physician.data()!.phone,
              },
              variables: {
                patientName: patientData.name,
                testName: testData.name,
                value: result.value,
                unit: result.unit,
                referenceRange: `${result.referenceRange.min}-${result.referenceRange.max}`,
              },
              userId: result.orderingPhysicianId,
            });
          }
        }
      }
    }
  });

// Send push notification
export const sendPushNotification = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { userId, title, body, data: notificationData } = data;

  // Get user's FCM tokens
  const user = await db.collection(`${PROJECT_PREFIX}users`).doc(userId).get();
  const fcmTokens = user.data()?.fcmTokens || [];

  if (fcmTokens.length === 0) {
    return { success: false, error: 'No FCM tokens found' };
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: notificationData || {},
    tokens: fcmTokens,
  };

  try {
    const response = await admin.messaging().sendMulticast(message);
    return { success: true, successCount: response.successCount };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
});

// Helper function to send notification
async function sendNotification(notification: any) {
  // Get user preferences
  let preferences = null;
  if (notification.patientId) {
    const patient = await db
      .collection(`${PROJECT_PREFIX}patients`)
      .doc(notification.patientId)
      .get();
    preferences = patient.data()?.notificationPreferences;
  } else if (notification.userId) {
    const user = await db
      .collection(`${PROJECT_PREFIX}users`)
      .doc(notification.userId)
      .get();
    preferences = user.data()?.notificationPreferences;
  }

  // Send via appropriate channels
  const tasks = [];
  
  if (notification.to.email) {
    tasks.push(
      functions.httpsCallable('sendEmail')({
        ...notification,
        preferences,
      })
    );
  }

  if (notification.to.phone) {
    tasks.push(
      functions.httpsCallable('sendSMS')({
        ...notification,
        preferences,
      })
    );
  }

  await Promise.all(tasks);
}