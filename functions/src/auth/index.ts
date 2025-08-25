import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { emailService } from '../services/emailService';

const db = admin.firestore();

export const createUserAccount = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  // Verify admin role
  if (!context.auth || (context.auth.token as any).role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { email, password, displayName, role, tenantId } = data;

  try {
    // Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    // Set custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role,
      tenantId,
    });

    // Create user document
    await db.collection('labflow_users').doc(userRecord.uid).set({
      email,
      displayName,
      role,
      tenantId,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    });

    return { success: true, userId: userRecord.uid };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user');
  }
});

export const updateUserRole = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth || (context.auth.token as any).role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { userId, newRole } = data;

  try {
    // Update custom claims
    await admin.auth().setCustomUserClaims(userId, {
      ...context.auth.token,
      role: newRole,
    });

    // Update user document
    await db.collection('labflow_users').doc(userId).update({
      role: newRole,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid,
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update user role');
  }
});

export const deactivateUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth || (context.auth.token as any).role !== 'ADMIN') {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { userId } = data;

  try {
    // Disable user in Firebase Auth
    await admin.auth().updateUser(userId, {
      disabled: true,
    });

    // Update user document
    await db.collection('labflow_users').doc(userId).update({
      active: false,
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deactivatedBy: context.auth.uid,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deactivating user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to deactivate user');
  }
});

export const sendSuperAdminCredentials = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  const { email, password, firstName, lastName } = data;

  try {
    // Send email with credentials
    await emailService.sendEmail({
      to: email,
      subject: 'Your LabFlow Super Admin Credentials',
      html: `
        <h2>Welcome to LabFlow, ${firstName} ${lastName}!</h2>
        <p>Your super admin account has been created. Here are your login credentials:</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Login URL:</strong> https://labflow.app/login</p>
        <p>Please change your password after your first login.</p>
        <p>Thank you for choosing LabFlow!</p>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending credentials:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send credentials');
  }
});