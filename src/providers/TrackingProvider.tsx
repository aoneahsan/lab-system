import React, { useEffect } from 'react';
import { UnifiedTracking } from 'unified-tracking';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

// Initialize tracking with configuration
const tracking = new UnifiedTracking({
  appName: 'LabFlow',
  appVersion: '1.0.0',
  environment: import.meta.env.MODE,
  providers: {
    firebase: {
      enabled: true,
      config: {
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      },
    },
    custom: {
      enabled: true,
      endpoint: '/api/analytics',
    },
  },
  privacy: {
    anonymizeIp: true,
    respectDoNotTrack: true,
    cookieConsent: true,
  },
  performance: {
    enabled: true,
    sampleRate: 1.0,
  },
});

// Export tracking instance for use in other components
export const trackingInstance = tracking;

interface TrackingProviderProps {
  children: React.ReactNode;
}

export const TrackingProvider: React.FC<TrackingProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Track page views
  useEffect(() => {
    tracking.trackPageView({
      path: location.pathname,
      title: document.title,
      referrer: document.referrer,
    });
  }, [location]);

  // Set user context when authenticated
  useEffect(() => {
    if (user) {
      tracking.setUser({
        id: user.uid,
        email: user.email || undefined,
        tenantId: user.tenantId,
        role: user.role,
        properties: {
          department: user.department,
          tenantName: user.tenantName,
        },
      });
    } else {
      tracking.clearUser();
    }
  }, [user]);

  // Track app lifecycle events
  useEffect(() => {
    // Track app start
    tracking.trackEvent('app_started', {
      timestamp: new Date().toISOString(),
      platform: 'web',
    });

    // Track app visibility changes
    const handleVisibilityChange = () => {
      tracking.trackEvent('app_visibility_changed', {
        visible: !document.hidden,
        timestamp: new Date().toISOString(),
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Track app close
    const handleBeforeUnload = () => {
      tracking.trackEvent('app_closed', {
        timestamp: new Date().toISOString(),
        sessionDuration: tracking.getSessionDuration(),
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

// Custom hooks for tracking
export const useTracking = () => {
  const trackEvent = (eventName: string, properties?: Record<string, any>) => {
    tracking.trackEvent(eventName, properties);
  };

  const trackError = (error: Error, context?: Record<string, any>) => {
    tracking.trackError(error, context);
  };

  const trackTiming = (category: string, variable: string, value: number, label?: string) => {
    tracking.trackTiming(category, variable, value, label);
  };

  const trackMetric = (name: string, value: number, unit?: string, tags?: Record<string, string>) => {
    tracking.trackMetric(name, value, unit, tags);
  };

  const startTransaction = (name: string, operation: string) => {
    return tracking.startTransaction(name, operation);
  };

  return {
    trackEvent,
    trackError,
    trackTiming,
    trackMetric,
    startTransaction,
  };
};