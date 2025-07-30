#!/usr/bin/env node

/**
 * Script to create a super admin account
 * Usage: node scripts/create-super-admin.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Note: You need to have GOOGLE_APPLICATION_CREDENTIALS environment variable set
// or pass the service account key directly
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const firestore = admin.firestore();

async function createSuperAdmin() {
  const email = 'aoneahsan@gmail.com';
  const password = 'Ahsan6553665201!';
  const firstName = 'Super';
  const lastName = 'Admin';

  try {
    // Create auth user
    let userRecord;
    try {
      // Check if user already exists
      userRecord = await auth.getUserByEmail(email);
      console.log('User already exists with UID:', userRecord.uid);
    } catch (error) {
      // User doesn't exist, create new one
      userRecord = await auth.createUser({
        email,
        password,
        emailVerified: true,
        displayName: `${firstName} ${lastName}`,
      });
      console.log('Created new user with UID:', userRecord.uid);
    }

    // Create/Update user document in Firestore
    const userData = {
      id: userRecord.uid,
      email,
      firstName,
      lastName,
      role: 'super_admin',
      isActive: true,
      emailVerified: true,
      phoneNumber: '',
      profileImageUrl: '',
      bio: 'System Super Administrator',
      specializations: [],
      licenseNumber: '',
      preferredLanguage: 'en',
      notificationPreferences: {
        email: true,
        sms: false,
        push: true,
        criticalAlerts: true,
        resultUpdates: true,
        appointmentReminders: true,
      },
      theme: 'system',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await firestore.collection('users').doc(userRecord.uid).set(userData, { merge: true });
    console.log('User document created/updated in Firestore');

    console.log('\n✅ Super admin account created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: super_admin');
    console.log('\nYou can now login and access the admin panel at /admin');

  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
createSuperAdmin();