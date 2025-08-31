import { firestore } from '@/config/firebase.config';
import { logger } from '@/services/logger.service';

interface VerificationResult {
  isReady: boolean;
  issues: string[];
  warnings: string[];
}

export const verifyLabCreationReadiness = async (): Promise<VerificationResult> => {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 1. Check Firebase configuration
    if (!import.meta.env.VITE_FIREBASE_API_KEY) {
      issues.push('Firebase API key is missing');
    }
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
      issues.push('Firebase project ID is missing');
    }
    if (!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) {
      issues.push('Firebase auth domain is missing');
    }
    
    // 2. Check Firestore instance
    if (!firestore) {
      issues.push('Firestore is not initialized');
    } else {
      // Try to verify Firestore is accessible
      try {
        // This will throw if Firestore is not properly configured
        const settings = (firestore as any)._settings;
        if (!settings?.projectId) {
          issues.push('Firestore project ID is not configured');
        }
      } catch (error) {
        warnings.push('Could not verify Firestore settings');
      }
    }
    
    // 3. Check authentication
    const authState = localStorage.getItem('auth-storage');
    if (!authState) {
      warnings.push('User may not be authenticated');
    } else {
      try {
        const auth = JSON.parse(authState);
        if (!auth?.state?.currentUser?.id) {
          warnings.push('User ID not found in auth state');
        }
      } catch (error) {
        warnings.push('Could not parse auth state');
      }
    }
    
    // 4. Check for common issues
    if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
      warnings.push('Realtime Database URL is configured but not needed (using Firestore)');
    }
    
    // Log results
    if (issues.length > 0) {
      logger.error('Laboratory creation readiness check failed:', issues);
    }
    if (warnings.length > 0) {
      logger.warn('Laboratory creation warnings:', warnings);
    }
    
    return {
      isReady: issues.length === 0,
      issues,
      warnings
    };
  } catch (error) {
    logger.error('Error during readiness check:', error);
    issues.push('Unexpected error during verification');
    return {
      isReady: false,
      issues,
      warnings
    };
  }
};

// Export for browser console in development
if (import.meta.env.DEV) {
  (window as any).verifyLabCreationReadiness = verifyLabCreationReadiness;
}