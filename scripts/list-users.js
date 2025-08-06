import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

// Firebase config from .env.production
const firebaseConfig = {
  apiKey: "AIzaSyBPQpNhG7BrNGD7fd29tG3VQSa5qBNUuG0",
  authDomain: "labsystem-a1.firebaseapp.com",
  projectId: "labsystem-a1",
  storageBucket: "labsystem-a1.firebasestorage.app",
  messagingSenderId: "451270476612",
  appId: "1:451270476612:web:c3b8bc2f7bb82cbe45aba6",
  measurementId: "G-CLWPVKC56X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const listUsers = async () => {
  console.log('Fetching all users...\n');
  
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('No users found in the database');
      process.exit(0);
    }
    
    console.log(`Found ${usersSnapshot.size} users:\n`);
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      console.log(`User ID: ${doc.id}`);
      console.log(`  Email: ${userData.email}`);
      console.log(`  Name: ${userData.firstName} ${userData.lastName}`);
      console.log(`  Role: ${userData.role}`);
      console.log(`  Tenant ID: ${userData.tenantId || 'Not set'}`);
      console.log(`  Active: ${userData.isActive}`);
      console.log(`  Created: ${userData.createdAt?.toDate?.() || userData.createdAt || 'Unknown'}`);
      console.log('---');
    });
    
    console.log('\nTo update a user\'s tenant, run:');
    console.log('node scripts/update-user-tenant.js <userId>\n');
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the listing
listUsers();