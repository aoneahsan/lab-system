import { useCallback } from 'react';
import { useTracking } from '@/providers/TrackingProvider';
import { useAuth } from './useAuth';

interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

export const useAnalytics = () => {
  const { trackEvent } = useTracking();
  const { currentUser } = useAuth();

  // Track user actions
  const trackUserAction = useCallback(
    (action: string, properties?: Record<string, any>) => {
      trackEvent(`user_${action}`, {
        userId: user?.uid,
        tenantId: user?.tenantId,
        role: user?.role,
        timestamp: new Date().toISOString(),
        ...properties,
      });
    },
    [trackEvent, user]
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    (feature: string, action: string, details?: Record<string, any>) => {
      trackEvent('feature_usage', {
        feature,
        action,
        userId: user?.uid,
        tenantId: user?.tenantId,
        ...details,
      });
    },
    [trackEvent, user]
  );

  // Track search queries
  const trackSearch = useCallback(
    (searchType: string, query: string, resultsCount: number) => {
      trackEvent('search_performed', {
        searchType,
        query: query.substring(0, 50), // Limit query length for privacy
        resultsCount,
        hasResults: resultsCount > 0,
        userId: user?.uid,
        tenantId: user?.tenantId,
      });
    },
    [trackEvent, user]
  );

  // Track form submissions
  const trackFormSubmission = useCallback(
    (formName: string, success: boolean, errorMessage?: string) => {
      trackEvent('form_submission', {
        formName,
        success,
        errorMessage,
        userId: user?.uid,
        tenantId: user?.tenantId,
      });
    },
    [trackEvent, user]
  );

  // Track API performance
  const trackApiCall = useCallback(
    (endpoint: string, method: string, duration: number, status: number) => {
      trackTiming('api', endpoint, duration, method);
      trackMetric('api_response_time', duration, 'ms', {
        endpoint,
        method,
        status: status.toString(),
        tenantId: user?.tenantId || 'unknown',
      });
    },
    [trackTiming, trackMetric, user]
  );

  // Track lab-specific metrics
  const trackLabMetrics = useCallback(
    (metricType: string, value: number, details?: Record<string, any>) => {
      trackMetric(`lab_${metricType}`, value, undefined, {
        tenantId: user?.tenantId || 'unknown',
        ...details,
      });
    },
    [trackMetric, user]
  );

  // Track test processing
  const trackTestProcessing = useCallback(
    (testId: string, action: string, duration?: number) => {
      trackEvent('test_processing', {
        testId,
        action,
        duration,
        userId: user?.uid,
        tenantId: user?.tenantId,
      });
    },
    [trackEvent, user]
  );

  // Track report generation
  const trackReportGeneration = useCallback(
    (reportType: string, format: string, duration: number, success: boolean) => {
      trackEvent('report_generated', {
        reportType,
        format,
        duration,
        success,
        userId: user?.uid,
        tenantId: user?.tenantId,
      });
      trackTiming('report_generation', reportType, duration, format);
    },
    [trackEvent, trackTiming, user]
  );

  // Track QC events
  const trackQCEvent = useCallback(
    (eventType: string, testId: string, passed: boolean, details?: Record<string, any>) => {
      trackEvent('qc_event', {
        eventType,
        testId,
        passed,
        userId: user?.uid,
        tenantId: user?.tenantId,
        ...details,
      });
    },
    [trackEvent, user]
  );

  // Track inventory events
  const trackInventoryEvent = useCallback(
    (eventType: string, itemId: string, quantity: number, details?: Record<string, any>) => {
      trackEvent('inventory_event', {
        eventType,
        itemId,
        quantity,
        userId: user?.uid,
        tenantId: user?.tenantId,
        ...details,
      });
    },
    [trackEvent, user]
  );

  return {
    trackUserAction,
    trackFeatureUsage,
    trackSearch,
    trackFormSubmission,
    trackApiCall,
    trackLabMetrics,
    trackTestProcessing,
    trackReportGeneration,
    trackQCEvent,
    trackInventoryEvent,
  };
};