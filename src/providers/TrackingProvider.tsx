import React, { useEffect } from 'react';
// TODO: Fix unified-tracking package build issue
// import { UnifiedTracking } from 'unified-tracking';
// import { useTrackEvent } from 'unified-tracking/react';
const UnifiedTracking = {
  initialize: async (config?: any) => {},
  trackEvent: async (eventName: string, properties?: any) => {},
  trackPageView: async (pageName?: string, properties?: any) => {},
  setUser: async (userId: string, traits?: any) => {},
  clearUser: async () => {},
  trackMetric: async (metricName: string, value: number, unit?: string, tags?: any) => {},
  track: async (eventName: string, properties?: any) => {},
  identify: async (userId: string, traits?: any) => {},
  logError: async (error: Error, context?: any) => {},
  setConsent: async (consent: any) => {}
};
const useTrackEvent = () => ({ trackEvent: async (eventName: string, properties?: any) => {} });
import { useAuthStore } from '@/stores/auth.store';
import { useLocation } from 'react-router-dom';
import { firebaseKit } from '@/services/firebase-kit.service';

// Initialize unified tracking on app start
let initialized = false;

// Export tracking instance for direct usage
export const trackingInstance = UnifiedTracking;

const initializeTracking = async () => {
  if (initialized) return;
  
  await UnifiedTracking.initialize({
    analytics: {
      providers: import.meta.env.VITE_GA_MEASUREMENT_ID ? ['google-analytics'] : [],
      googleAnalytics: {
        measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID
      }
    },
    errorTracking: {
      providers: import.meta.env.VITE_SENTRY_DSN ? ['sentry'] : [],
      sentry: {
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE
      }
    }
  });
  
  initialized = true;
};

interface TrackingProviderProps {
  children: React.ReactNode;
}

export const TrackingProvider: React.FC<TrackingProviderProps> = ({ children }) => {
  const { currentUser } = useAuthStore();
  const location = useLocation();

  // Initialize tracking on mount
  useEffect(() => {
    initializeTracking();
  }, []);

  // Track page views
  useEffect(() => {
    const trackPageView = async () => {
      if (!initialized) await initializeTracking();
      
      await UnifiedTracking.track('page_view', {
        path: location.pathname,
        title: document.title,
        referrer: document.referrer,
      });
      
      // Also track in Firebase Analytics
      await firebaseKit.analytics.setCurrentScreen(document.title, location.pathname);
    };
    
    trackPageView();
  }, [location]);

  // Set user context when authenticated
  useEffect(() => {
    const updateUser = async () => {
      if (!initialized) await initializeTracking();
      
      if (currentUser) {
        await UnifiedTracking.identify(currentUser.id, {
          email: currentUser.email || undefined,
          name: currentUser.displayName,
          role: currentUser.role,
          tenantId: currentUser.tenantId,
          department: currentUser.department
        });
        
        // Also set user in Firebase Analytics
        await firebaseKit.analytics.setUserId(currentUser.id);
        await firebaseKit.analytics.setUserProperty('role', currentUser.role);
        await firebaseKit.analytics.setUserProperty('tenant_id', currentUser.tenantId);
      }
    };
    
    updateUser();
  }, [currentUser]);

  // Track app lifecycle events
  useEffect(() => {
    const trackAppStart = async () => {
      if (!initialized) await initializeTracking();
      
      await UnifiedTracking.track('app_started', {
        timestamp: new Date().toISOString(),
        platform: 'web',
      });
    };
    
    trackAppStart();

    // Track app visibility changes
    const handleVisibilityChange = async () => {
      await UnifiedTracking.track('app_visibility_changed', {
        visible: !document.hidden,
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track app close
    const handleBeforeUnload = async () => {
      await UnifiedTracking.track('app_closed', {
        timestamp: new Date().toISOString(),
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <>{children}</>;
};

// Re-export the hook from unified-tracking for convenience
// export { useTrackEvent } from 'unified-tracking/react';
export { useTrackEvent };

// Custom hooks for tracking
export const useTracking = () => {
  const trackEvent = async (eventName: string, properties?: Record<string, any>) => {
    if (!initialized) await initializeTracking();
    await UnifiedTracking.track(eventName, properties);
  };

  const trackError = async (error: Error, context?: Record<string, any>) => {
    if (!initialized) await initializeTracking();
    await UnifiedTracking.logError(error, context);
  };

  const identify = async (userId: string, traits?: Record<string, any>) => {
    if (!initialized) await initializeTracking();
    await UnifiedTracking.identify(userId, traits);
  };

  const setConsent = async (consent: {
    analytics?: boolean;
    errorTracking?: boolean;
    marketing?: boolean;
    personalization?: boolean;
  }) => {
    if (!initialized) await initializeTracking();
    await UnifiedTracking.setConsent(consent);
  };

  return {
    trackEvent,
    trackError,
    identify,
    setConsent,
  };
};