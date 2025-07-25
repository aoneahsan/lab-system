import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAtp0fvAkoxdELUderlMYU7YAV8h_P92Sc",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "labsystem-a1.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "labsystem-a1",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "labsystem-a1.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "151500597190",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:151500597190:web:daf5ea2ae98b10709f5cf2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function seedDemoTenant() {
  try {
    console.log('🚀 Starting demo tenant setup...');

    // 1. Create demo tenant
    const tenantId = 'demo';
    const tenantData = {
      id: tenantId,
      name: 'Demo Laboratory',
      code: 'DEMO',
      type: 'clinical_lab',
      address: {
        street: '123 Lab Street',
        city: 'Demo City',
        state: 'DS',
        zipCode: '12345',
        country: 'USA'
      },
      contact: {
        phone: '+1 (555) 123-4567',
        email: 'admin@demolab.com',
        website: 'https://demolab.com'
      },
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        language: 'en'
      },
      features: {
        emrIntegration: true,
        barcodeScanning: true,
        biometricAuth: true,
        mobileApp: true,
        patientPortal: true
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'tenants', tenantId), tenantData);
    console.log('✅ Demo tenant created');

    // 2. Create admin user
    const adminEmail = 'admin@demolab.com';
    const adminPassword = 'demo1234';
    
    let adminUser;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      adminUser = userCredential.user;
      
      await updateProfile(adminUser, {
        displayName: 'Demo Admin'
      });
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('Admin user already exists');
        // Continue with existing user
        adminUser = { uid: 'existing-admin-id' }; // This is a placeholder
      } else {
        throw error;
      }
    }

    // 3. Create user document
    const userData = {
      id: adminUser.uid,
      email: adminEmail,
      displayName: 'Demo Admin',
      firstName: 'Demo',
      lastName: 'Admin',
      phoneNumber: '+1 (555) 123-4567',
      role: 'super_admin',
      tenantId: tenantId,
      isActive: true,
      isEmailVerified: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'users', adminUser.uid), userData);
    console.log('✅ Admin user document created');

    // 4. Create tenant_users entry
    const tenantUserId = `${adminUser.uid}_${tenantId}`;
    const tenantUserData = {
      userId: adminUser.uid,
      tenantId: tenantId,
      role: 'lab_admin',
      permissions: ['all'],
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(doc(db, 'tenant_users', tenantUserId), tenantUserData);
    console.log('✅ Tenant user link created');

    // 5. Create some sample data
    console.log('📊 Creating sample data...');

    // Sample patient
    const patientId = 'sample-patient-1';
    await setDoc(doc(db, `labflow_${tenantId}_patients`, patientId), {
      id: patientId,
      mrn: 'MRN-0001',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      email: 'john.doe@example.com',
      phoneNumber: '+1 (555) 987-6543',
      address: {
        street: '456 Patient Ave',
        city: 'Demo City',
        state: 'DS',
        zipCode: '12345'
      },
      insurance: {
        provider: 'Demo Insurance',
        policyNumber: 'POL-123456',
        groupNumber: 'GRP-789'
      },
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Sample patient created');

    // Sample test
    const testId = 'sample-test-1';
    await setDoc(doc(db, `labflow_${tenantId}_tests`, testId), {
      id: testId,
      code: 'CBC',
      name: 'Complete Blood Count',
      category: 'Hematology',
      description: 'A complete blood count test',
      loincCode: '58410-2',
      specimen: {
        type: 'Blood',
        volume: '3 mL',
        container: 'EDTA tube'
      },
      turnaroundTime: {
        routine: 24,
        stat: 2
      },
      price: 50.00,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('✅ Sample test created');

    console.log('\n🎉 Demo tenant setup complete!');
    console.log('\n📋 Login credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Tenant Code:', tenantData.code);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up demo tenant:', error);
    process.exit(1);
  }
}

// Run the seed script
seedDemoTenant();