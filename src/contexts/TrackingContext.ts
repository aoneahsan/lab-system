import { UnifiedTracking } from 'unified-tracking';

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