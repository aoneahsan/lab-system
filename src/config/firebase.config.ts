import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAnalytics } from 'firebase/analytics';
import { getPerformance } from 'firebase/performance';
import { getRemoteConfig } from 'firebase/remote-config';
import { getMessaging } from 'firebase/messaging';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const db = firestore; // Alias for firestore
export const storage = getStorage(app);
export const functions = getFunctions(app);
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const performance = typeof window !== 'undefined' ? getPerformance(app) : null;
export const remoteConfig = getRemoteConfig(app);
export const messaging =
  typeof window !== 'undefined' && 'Notification' in window ? getMessaging(app) : null;
export const database = getDatabase(app);

// Connect to Firebase Emulators if enabled
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  // Auth emulator
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });

  // Firestore emulator
  connectFirestoreEmulator(firestore, 'localhost', 8080);

  // Storage emulator
  connectStorageEmulator(storage, 'localhost', 9199);

  // Functions emulator
  connectFunctionsEmulator(functions, 'localhost', 5001);

  // Database emulator
  connectDatabaseEmulator(database, 'localhost', 9000);

  console.log('🔧 Firebase Emulators connected');
}

export default app;
