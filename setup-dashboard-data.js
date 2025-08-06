// Script to setup initial dashboard data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

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
const auth = getAuth(app);
const db = getFirestore(app);

async function setupDashboardData() {
  try {
    // Sign in as the test user
    console.log('Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    const user = userCredential.user;
    console.log('Signed in as:', user.email);
    
    // Get the ID token to see custom claims
    const idTokenResult = await user.getIdTokenResult();
    const tenantId = idTokenResult.claims.tenantId || 'demo';
    console.log('User tenant ID:', tenantId);
    
    // Create tenant document
    console.log('\nCreating tenant document...');
    await setDoc(doc(db, 'tenants', tenantId), {
      id: tenantId,
      name: 'Demo Laboratory',
      code: 'DEMO-LAB',
      isActive: true,
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        features: {
          homeCollection: true,
          customerPortal: true,
          emrIntegration: true,
          inventoryManagement: true,
          qualityControl: true,
          workflowAutomation: true,
          advancedReporting: true
        }
      },
      subscription: {
        plan: 'enterprise',
        status: 'active',
        startDate: Timestamp.now(),
        endDate: Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // 1 year from now
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✓ Tenant document created');
    
    const prefix = `labflow_${tenantId}_`;
    
    // Create sample patients
    console.log('\nCreating sample patients...');
    const patientIds = [];
    for (let i = 1; i <= 3; i++) {
      const docRef = await addDoc(collection(db, prefix + 'patients'), {
        tenantId: tenantId,
        patientId: `PAT-${String(i).padStart(4, '0')}`,
        firstName: `Test${i}`,
        lastName: 'Patient',
        email: `patient${i}@example.com`,
        phone: `555-${String(1000 + i).padStart(4, '0')}`,
        dateOfBirth: Timestamp.fromDate(new Date(1990, 0, i)),
        gender: i % 2 === 0 ? 'female' : 'male',
        status: 'active',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      patientIds.push(docRef.id);
      console.log(`✓ Created patient ${i}`);
    }
    
    // Create sample test orders
    console.log('\nCreating sample test orders...');
    const orderIds = [];
    const statuses = ['pending', 'in_progress', 'resulted'];
    for (let i = 0; i < 5; i++) {
      const docRef = await addDoc(collection(db, prefix + 'test_orders'), {
        tenantId: tenantId,
        orderId: `ORD-${String(i + 1).padStart(4, '0')}`,
        patientId: patientIds[i % patientIds.length],
        patientName: `Test${(i % patientIds.length) + 1} Patient`,
        status: statuses[i % statuses.length],
        priority: i === 0 ? 'urgent' : 'routine',
        tests: [
          {
            testId: `TEST-${i + 1}`,
            testCode: `TST${i + 1}`,
            testName: ['Complete Blood Count', 'Basic Metabolic Panel', 'Lipid Profile', 'Liver Function Test', 'Thyroid Panel'][i % 5],
            status: statuses[i % statuses.length]
          }
        ],
        orderDate: Timestamp.now(),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      orderIds.push(docRef.id);
      console.log(`✓ Created test order ${i + 1}`);
    }
    
    // Create sample test results (including critical ones)
    console.log('\nCreating sample test results...');
    const criticalTests = [
      { testName: 'Glucose', value: 450, unit: 'mg/dL', normalRange: '70-100', flag: 'critical_high' },
      { testName: 'Potassium', value: 2.5, unit: 'mEq/L', normalRange: '3.5-5.0', flag: 'critical_low' }
    ];
    
    for (let i = 0; i < criticalTests.length; i++) {
      await addDoc(collection(db, prefix + 'test_results'), {
        tenantId: tenantId,
        orderId: orderIds[i],
        patientId: patientIds[i % patientIds.length],
        ...criticalTests[i],
        status: 'final',
        flagType: 'critical',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        reportedBy: user.uid
      });
      console.log(`✓ Created critical result ${i + 1}`);
    }
    
    // Create sample payments
    console.log('\nCreating sample payments...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await addDoc(collection(db, prefix + 'payments'), {
      tenantId: tenantId,
      paymentId: `PAY-${String(1).padStart(4, '0')}`,
      orderId: orderIds[0],
      patientId: patientIds[0],
      amount: 250.00,
      status: 'completed',
      paymentMethod: 'credit_card',
      paymentDate: Timestamp.fromDate(today),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    console.log('✓ Created payment record');
    
    console.log('\n✅ Dashboard data setup complete!');
    console.log('You can now refresh the dashboard at https://labsystem-a1.web.app/dashboard');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

setupDashboardData();