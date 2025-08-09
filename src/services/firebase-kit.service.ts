import { Capacitor } from '@capacitor/core';
// TODO: Fix build issue with capacitor-firebase-kit
// import { FirebaseKit } from 'capacitor-firebase-kit';
const FirebaseKit = {
  analytics: { 
    setCollectionEnabled: async (_params: any) => {}, 
    logEvent: async (_params: any) => {},
    setUserId: async (_params: any) => {},
    setUserProperty: async (_params: any) => {},
    setCurrentScreen: async (_params: any) => {}
  },
  crashlytics: { 
    setCrashlyticsCollectionEnabled: async (_params: any) => {}, 
    log: async (_params: any) => {}, 
    recordException: async (_params: any) => {},
    setCustomKey: async (_params: any) => {},
    setUserId: async (_params: any) => {},
    crash: async () => {}
  },
  performance: { 
    setPerformanceCollectionEnabled: async (_params: any) => {}, 
    startTrace: async (_params: any) => {}, 
    stopTrace: async (_params: any) => {},
    incrementMetric: async (_params: any) => {}
  },
  appCheck: { 
    initialize: async (_params: any) => {} 
  },
  remoteConfig: {
    fetchAndActivate: async () => ({ isFetchedRemote: true }),
    getString: async (_params: any) => ({ value: '' }),
    getBoolean: async (_params: any) => ({ value: false }),
    getNumber: async (_params: any) => ({ value: 0 })
  },
  dynamicLinks: {
    addListener: (_event: string, _callback: any) => ({ remove: () => {} })
  }
};
// TODO: Implement authentication functions when needed
// import { 
//   getAuth, 
//   signInWithEmailAndPassword as webSignIn,
//   createUserWithEmailAndPassword as webCreateUser,
//   signOut as webSignOut,
//   sendPasswordResetEmail as webSendPasswordReset,
//   onAuthStateChanged as webOnAuthStateChanged,
//   User as FirebaseUser
// } from 'firebase/auth';
// import { auth } from '@/lib/firebase';

// Initialize Firebase Kit for mobile platforms
export const initializeFirebaseKit = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Initialize Analytics
      await FirebaseKit.analytics.setCollectionEnabled({ enabled: true });
      
      // Initialize Crashlytics
      await FirebaseKit.crashlytics.setCrashlyticsCollectionEnabled({ enabled: true });
      
      // Initialize Performance Monitoring
      await FirebaseKit.performance.setPerformanceCollectionEnabled({ enabled: true });
      
      // Initialize App Check if needed
      if (import.meta.env.VITE_FIREBASE_APP_CHECK_PROVIDER) {
        await FirebaseKit.appCheck.initialize({
          provider: import.meta.env.VITE_FIREBASE_APP_CHECK_PROVIDER as any,
          isTokenAutoRefreshEnabled: true
        });
      }
      
      console.log('📱 Firebase Kit initialized for native platform');
    } catch (error) {
      console.error('Failed to initialize Firebase Kit:', error);
    }
  }
};

// Unified Analytics Service
export const analytics = {
  logEvent: async (eventName: string, params?: Record<string, any>) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.analytics.logEvent({ name: eventName, params });
    } else {
      // Web implementation using Firebase Analytics
      const { analytics } = await import('@/lib/firebase');
      if (analytics) {
        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, eventName, params);
      }
    }
  },
  
  setUserId: async (userId: string | null) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.analytics.setUserId({ userId });
    } else {
      const { analytics } = await import('@/lib/firebase');
      if (analytics) {
        const { setUserId } = await import('firebase/analytics');
        setUserId(analytics, userId);
      }
    }
  },
  
  setUserProperty: async (name: string, value: string | null) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.analytics.setUserProperty({ name, value });
    } else {
      const { analytics } = await import('@/lib/firebase');
      if (analytics) {
        const { setUserProperties } = await import('firebase/analytics');
        setUserProperties(analytics, { [name]: value });
      }
    }
  },
  
  setCurrentScreen: async (screenName: string, screenClass?: string) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.analytics.setCurrentScreen({ 
        screenName, 
        screenClassOverride: screenClass 
      });
    } else {
      // Web: log as page_view event
      await analytics.logEvent('page_view', {
        page_title: screenName,
        page_location: window.location.href,
        page_path: window.location.pathname
      });
    }
  }
};

// Unified Crashlytics Service
export const crashlytics = {
  log: async (message: string) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.crashlytics.log({ message });
    } else {
      // Web: Log to console in development
      if (import.meta.env.DEV) {
        console.log('[Crashlytics]', message);
      }
    }
  },
  
  setCustomKey: async (key: string, value: string | number | boolean) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.crashlytics.setCustomKey({ key, value });
    }
  },
  
  setUserId: async (userId: string) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.crashlytics.setUserId({ userId });
    }
  },
  
  recordException: async (error: Error) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.crashlytics.recordException({
        message: error.message,
        code: 0,
        domain: error.name
      });
    } else {
      // Web: Report to error tracking service
      console.error('[Crashlytics]', error);
    }
  },
  
  crash: async () => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.crashlytics.crash();
    }
  }
};

// Unified Performance Service
export const performance = {
  startTrace: async (traceName: string) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.performance.startTrace({ traceName });
      return traceName;
    } else {
      // Web: Use Performance API
      if (typeof window !== 'undefined' && window.performance) {
        window.performance.mark(`${traceName}_start`);
      }
      return traceName;
    }
  },
  
  stopTrace: async (traceName: string) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.performance.stopTrace({ traceName });
    } else {
      // Web: Use Performance API
      if (typeof window !== 'undefined' && window.performance) {
        window.performance.mark(`${traceName}_end`);
        window.performance.measure(
          traceName,
          `${traceName}_start`,
          `${traceName}_end`
        );
      }
    }
  },
  
  incrementMetric: async (traceName: string, metricName: string, value: number) => {
    if (Capacitor.isNativePlatform()) {
      await FirebaseKit.performance.incrementMetric({ 
        traceName, 
        metricName, 
        incrementBy: value 
      });
    }
  }
};

// Unified Remote Config Service
export const remoteConfig = {
  fetchAndActivate: async () => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseKit.remoteConfig.fetchAndActivate();
      return result.isFetchedRemote;
    } else {
      // Web: Use Firebase Remote Config
      const { remoteConfig } = await import('@/lib/firebase');
      const { fetchAndActivate } = await import('firebase/remote-config');
      return await fetchAndActivate(remoteConfig);
    }
  },
  
  getString: async (key: string): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseKit.remoteConfig.getString({ key });
      return result.value;
    } else {
      const { remoteConfig } = await import('@/lib/firebase');
      const { getString } = await import('firebase/remote-config');
      return getString(remoteConfig, key);
    }
  },
  
  getBoolean: async (key: string): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseKit.remoteConfig.getBoolean({ key });
      return result.value;
    } else {
      const { remoteConfig } = await import('@/lib/firebase');
      const { getBoolean } = await import('firebase/remote-config');
      return getBoolean(remoteConfig, key);
    }
  },
  
  getNumber: async (key: string): Promise<number> => {
    if (Capacitor.isNativePlatform()) {
      const result = await FirebaseKit.remoteConfig.getNumber({ key });
      return result.value;
    } else {
      const { remoteConfig } = await import('@/lib/firebase');
      const { getNumber } = await import('firebase/remote-config');
      return getNumber(remoteConfig, key);
    }
  }
};

// Export unified Firebase services
export const firebaseKit = {
  initialize: initializeFirebaseKit,
  analytics,
  crashlytics,
  performance,
  remoteConfig
};