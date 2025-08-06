// Script to fix dashboard issues
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAtp0fvAkoxdELUderlMYU7YAV8h_P92Sc",
  authDomain: "labsystem-a1.firebaseapp.com",
  projectId: "labsystem-a1",
  storageBucket: "labsystem-a1.firebasestorage.app",
  messagingSenderId: "151500597190",
  appId: "1:151500597190:web:b6282092c38b60d70034c7",
  measurementId: "G-5194NB598S"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixDashboard() {
  try {
    // Create demo tenant that the app expects
    console.log('Creating demo tenant...');
    await setDoc(doc(db, 'tenants', 'demo'), {
      id: 'demo',
      code: 'DEMO',
      name: 'Demo Laboratory - Public Access',
      type: 'demo',
      isActive: true,
      address: {
        street: '123 Demo Street',
        city: 'Demo City',
        state: 'DC',
        zipCode: '12345',
        country: 'USA',
      },
      contact: {
        email: 'demo@labflow.com',
        phone: '(555) 123-4567',
        fax: '(555) 123-4568',
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        resultFormat: 'standard',
        criticalValueNotification: true,
        features: {
          homeCollection: true,
          customerPortal: true,
          emrIntegration: true,
          inventoryManagement: true,
          qualityControl: true,
          workflowAutomation: true,
          advancedReporting: true,
          billing: true,
          inventory: true,
          mobileApps: true,
        }
      },
      subscription: {
        plan: 'demo',
        status: 'active',
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date('2025-12-31')),
        validUntil: Timestamp.fromDate(new Date('2025-12-31')),
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log('✅ Demo tenant created successfully');
    console.log('');
    console.log('Dashboard should now work properly!');
    console.log('You can access it at: https://labsystem-a1.web.app/dashboard');
    console.log('');
    console.log('To register a new user, use tenant code: DEMO');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

fixDashboard();