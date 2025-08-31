import { firestore } from '@/config/firebase.config';
import { doc, getDoc } from 'firebase/firestore';
import { logger } from '@/services/logger.service';

export const testFirestoreConnection = async (): Promise<boolean> => {
  try {
    logger.info('Testing Firestore connection...');
    
    // Try to read a simple document (doesn't need to exist)
    const testDocRef = doc(firestore, 'tenants', '__test__');
    const testDoc = await getDoc(testDocRef);
    
    // If we get here, the connection works (doc doesn't need to exist)
    if (!testDoc.exists()) {
      logger.info('Firestore connection successful (test document does not exist, which is expected)');
    } else {
      logger.info('Firestore connection successful (test document exists)');
    }
    
    return true;
  } catch (error: any) {
    logger.error('Firestore connection test failed:', error);
    
    if (error.code === 'unavailable') {
      logger.error('Firestore is unavailable. Check your internet connection.');
    } else if (error.code === 'permission-denied') {
      logger.error('Permission denied. Check Firestore security rules.');
    } else if (error.code === 'failed-precondition') {
      logger.error('Firestore indexes may need to be created.');
    }
    
    return false;
  }
};

// Export for use in browser console during development
if (import.meta.env.DEV) {
  (window as any).testFirestoreConnection = testFirestoreConnection;
}