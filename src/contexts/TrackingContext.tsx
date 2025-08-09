import { useCallback } from 'react';
// TODO: Fix unified-tracking package build issue
// import { UnifiedTracking } from 'unified-tracking';
const UnifiedTracking = {
  trackEvent: async (_eventName: string, _properties?: any) => {},
  trackPageView: async (_pageName?: string, _properties?: any) => {},
  setUser: async (_userId: string, _traits?: any) => {},
  clearUser: async () => {},
  trackMetric: async (_metricName: string, _value: number, _unit?: string, _tags?: any) => {},
  track: async (_eventName: string, _properties?: any) => {},
  identify: async (_userId: string, _traits?: any) => {},
  logError: async (_error: Error, _context?: any) => {},
  setConsent: async (_consent: any) => {}
};

export const trackingInstance = UnifiedTracking;

export const useTracking = () => {
  const trackEvent = useCallback(async (eventName: string, properties?: any) => {
    await UnifiedTracking.track(eventName, properties);
  }, []);

  const trackError = useCallback(async (error: Error, context?: any) => {
    await UnifiedTracking.logError(error, context);
  }, []);

  const trackMetric = useCallback(async (metricName: string, value: number, unit?: string) => {
    await UnifiedTracking.trackMetric(metricName, value, unit);
  }, []);

  const setUserConsent = useCallback(async (consent: {
    analytics?: boolean;
    marketing?: boolean;
    functional?: boolean;
  }) => {
    await UnifiedTracking.setConsent(consent);
  }, []);

  return {
    trackEvent,
    trackError,
    trackMetric,
    setUserConsent
  };
};