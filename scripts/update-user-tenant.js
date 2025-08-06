import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

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

const updateUserTenant = async (userId) => {
  if (!userId) {
    console.error('Please provide a user ID as an argument');
    console.log('Usage: node update-user-tenant.js <userId>');
    process.exit(1);
  }
  
  console.log(`Updating tenant for user: ${userId}...`);
  
  try {
    // First, check if the user exists
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.error(`User with ID ${userId} not found`);
      process.exit(1);
    }
    
    const userData = userDoc.data();
    console.log('Current user data:', {
      email: userData.email,
      tenantId: userData.tenantId,
      role: userData.role
    });
    
    // Update the user's tenantId to 'demo'
    await updateDoc(doc(db, 'users', userId), {
      tenantId: 'demo',
      updatedAt: new Date()
    });
    
    console.log('✅ User tenant updated to "demo" successfully!');
    
    // Verify the update
    const updatedUserDoc = await getDoc(doc(db, 'users', userId));
    const updatedData = updatedUserDoc.data();
    console.log('Updated user data:', {
      email: updatedData.email,
      tenantId: updatedData.tenantId,
      role: updatedData.role
    });
    
  } catch (error) {
    console.error('❌ Error updating user tenant:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Get user ID from command line argument
const userId = process.argv[2];
updateUserTenant(userId);