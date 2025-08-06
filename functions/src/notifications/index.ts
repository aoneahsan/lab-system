import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail } from '../services/emailService';
import { sendSMS } from '../services/smsService';

const db = admin.firestore();

export const sendCriticalResultNotification = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resultId, patientId, clinicianId, values } = request.data;

  try {
    // Get clinician details
    const clinicianDoc = await db.collection('labflow_users').doc(clinicianId).get();
    const clinician = clinicianDoc.data();

    if (!clinician) {
      throw new functions.https.HttpsError('not-found', 'Clinician not found');
    }

    // Get patient details
    const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
    const patient = patientDoc.data();

    // Create notification record
    const notificationRef = await db.collection('labflow_notifications').add({
      type: 'critical_result',
      recipientId: clinicianId,
      patientId,
      resultId,
      priority: 'high',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });

    // Send email notification
    if (clinician.email) {
      await sendEmail({
        to: clinician.email,
        subject: `CRITICAL LAB RESULT - ${patient?.displayName || 'Patient'}`,
        template: 'critical-result',
        data: {
          clinicianName: clinician.displayName,
          patientName: patient?.displayName,
          patientMRN: patient?.mrn,
          values,
          resultId,
        },
      });
    }

    // Send SMS if enabled
    if (clinician.phone && clinician.smsNotifications) {
      await sendSMS({
        to: clinician.phone,
        message: `CRITICAL RESULT: ${patient?.displayName} (MRN: ${patient?.mrn}). Please check your email for details.`,
      });
    }

    // Update notification status
    await notificationRef.update({
      status: 'sent',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, notificationId: notificationRef.id };
  } catch (error) {
    console.error('Error sending critical result notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

export const sendAppointmentReminder = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { appointmentId, patientId, reminderType } = request.data;

  try {
    const appointmentDoc = await db.collection('labflow_appointments').doc(appointmentId).get();
    const appointment = appointmentDoc.data();

    if (!appointment) {
      throw new functions.https.HttpsError('not-found', 'Appointment not found');
    }

    const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
    const patient = patientDoc.data();

    if (!patient) {
      throw new functions.https.HttpsError('not-found', 'Patient not found');
    }

    // Send reminder based on patient preferences
    if (patient.email && patient.emailReminders) {
      await sendEmail({
        to: patient.email,
        subject: 'Appointment Reminder - LabFlow',
        template: 'appointment-reminder',
        data: {
          patientName: patient.displayName,
          appointmentDate: appointment.scheduledDate,
          appointmentTime: appointment.scheduledTime,
          location: appointment.location,
          tests: appointment.tests,
          preparationInstructions: appointment.preparationInstructions,
        },
      });
    }

    if (patient.phone && patient.smsReminders) {
      await sendSMS({
        to: patient.phone,
        message: `Reminder: Lab appointment on ${appointment.scheduledDate} at ${appointment.scheduledTime}. Location: ${appointment.location}`,
      });
    }

    // Log reminder sent
    await db.collection('labflow_appointment_reminders').add({
      appointmentId,
      patientId,
      reminderType,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentBy: request.auth.uid,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send reminder');
  }
});

export const notifyResultReady = functions.firestore
  .document('labflow_results/{resultId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if result status changed to completed
    if (before.status !== 'completed' && after.status === 'completed') {
      const { patientId, testName } = after;

      // Get patient details
      const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
      const patient = patientDoc.data();

      if (patient && patient.resultNotifications) {
        // Create in-app notification
        await db.collection('labflow_notifications').add({
          type: 'result_ready',
          recipientId: patientId,
          title: 'Test Results Available',
          message: `Your ${testName} results are now available.`,
          resultId: context.params.resultId,
          status: 'unread',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Send email if enabled
        if (patient.email && patient.emailNotifications) {
          await sendEmail({
            to: patient.email,
            subject: 'Your Lab Results Are Ready',
            template: 'result-ready',
            data: {
              patientName: patient.displayName,
              testName,
              resultId: context.params.resultId,
            },
          });
        }
      }
    }
  });