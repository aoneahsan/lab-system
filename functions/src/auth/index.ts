import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { emailService } from '../services/emailService';

const db = admin.firestore();

export const createUserAccount = functions.https.onCall(async (data, context) => {
  // Verify admin role
  if (!context.auth || context.auth.token.role !== 'ADMIN') {
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

    return { uid: userRecord.uid, email: userRecord.email };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create user');
  }
});

export const updateUserRole = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'ADMIN') {
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

export const deactivateUser = functions.https.onCall(async (data, context) => {
  if (!context.auth || context.auth.token.role !== 'ADMIN') {
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

export const sendSuperAdminCredentials = functions.https.onCall(async (data, context) => {
  const { email, password, firstName, lastName } = data;

  try {
    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { background-color: #f9fafb; padding: 30px; margin-top: 20px; }
            .credentials { background-color: white; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
            .important { color: #dc2626; font-weight: bold; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>LabFlow Super Admin Account Created</h1>
            </div>
            <div class="content">
              <p>Hello ${firstName} ${lastName},</p>
              
              <p>Your super admin account has been successfully created. Below are your login credentials:</p>
              
              <div class="credentials">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> ${password}</p>
                <p><strong>Role:</strong> Super Admin</p>
              </div>
              
              <p class="important">⚠️ Important Security Notice:</p>
              <ul>
                <li>Please save these credentials securely</li>
                <li>We recommend changing your password after first login</li>
                <li>Do not share these credentials with anyone</li>
              </ul>
              
              <p>You can now access the admin panel at: <strong>/admin</strong></p>
              
              <p>If you didn't request this account, please ignore this email and contact support immediately.</p>
            </div>
            <div class="footer">
              <p>This is an automated message from LabFlow</p>
              <p>© ${new Date().getFullYear()} LabFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email
    await emailService.send(
      email,
      'Your LabFlow Super Admin Credentials',
      emailHtml
    );

    return { success: true, message: 'Credentials sent successfully' };
  } catch (error) {
    console.error('Error sending super admin credentials:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send credentials email');
  }
});