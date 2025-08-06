// Script to check dashboard data issues
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, query, where, limit } from 'firebase/firestore';
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

async function checkDashboardData() {
  try {
    // Sign in as the test user
    console.log('Signing in...');
    const userCredential = await signInWithEmailAndPassword(auth, 'test@example.com', 'password123');
    const user = userCredential.user;
    console.log('Signed in as:', user.email);
    
    // Get the ID token to see custom claims
    const idTokenResult = await user.getIdTokenResult();
    const tenantId = idTokenResult.claims.tenantId;
    console.log('User tenant ID:', tenantId);
    
    // Check if tenant document exists
    console.log('\nChecking tenant document...');
    const tenantDoc = await getDoc(doc(db, 'tenants', tenantId || 'demo'));
    if (tenantDoc.exists()) {
      console.log('Tenant document found:', tenantDoc.data());
    } else {
      console.log('❌ Tenant document NOT FOUND');
    }
    
    // Check for test data in various collections
    const collections = ['patients', 'test_orders', 'test_results', 'payments'];
    const prefix = `labflow_${tenantId || 'demo'}_`;
    
    console.log('\nChecking collections...');
    for (const collName of collections) {
      const fullCollName = prefix + collName;
      try {
        const q = query(collection(db, fullCollName), limit(1));
        const snapshot = await getDocs(q);
        console.log(`${fullCollName}: ${snapshot.size > 0 ? '✓ Has data' : '✗ Empty'}`);
      } catch (error) {
        console.log(`${fullCollName}: ✗ Error - ${error.message}`);
      }
    }
    
    // Try to get test orders directly
    console.log('\nChecking test orders with tenantId filter...');
    try {
      const ordersCollection = prefix + 'test_orders';
      const q = query(
        collection(db, ordersCollection),
        where('tenantId', '==', tenantId || 'demo'),
        limit(5)
      );
      const snapshot = await getDocs(q);
      console.log(`Found ${snapshot.size} test orders`);
      snapshot.forEach(doc => {
        console.log('Order:', doc.id, doc.data().status);
      });
    } catch (error) {
      console.log('Error fetching test orders:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkDashboardData();