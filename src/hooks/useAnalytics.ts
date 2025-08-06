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
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
        role: currentUser?.role,
        timestamp: new Date().toISOString(),
        ...properties,
      });
    },
    [trackEvent, currentUser]
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    (feature: string, action: string, details?: Record<string, any>) => {
      trackEvent('feature_usage', {
        feature,
        action,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
        ...details,
      });
    },
    [trackEvent, currentUser]
  );

  // Track search queries
  const trackSearch = useCallback(
    (searchType: string, query: string, resultsCount: number) => {
      trackEvent('search_performed', {
        searchType,
        query: query.substring(0, 50), // Limit query length for privacy
        resultsCount,
        hasResults: resultsCount > 0,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
      });
    },
    [trackEvent, currentUser]
  );

  // Track form submissions
  const trackFormSubmission = useCallback(
    (formName: string, success: boolean, errorMessage?: string) => {
      trackEvent('form_submission', {
        formName,
        success,
        errorMessage,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
      });
    },
    [trackEvent, currentUser]
  );

  // Track API performance
  const trackApiCall = useCallback(
    (endpoint: string, method: string, duration: number, status: number) => {
      trackEvent('api_call', {
        endpoint,
        method,
        duration,
        status,
        tenantId: currentUser?.tenantId || 'unknown',
      });
    },
    [trackEvent, currentUser]
  );

  // Track lab-specific metrics
  const trackLabMetrics = useCallback(
    (metricType: string, value: number, details?: Record<string, any>) => {
      trackEvent(`lab_metric_${metricType}`, {
        value,
        tenantId: currentUser?.tenantId || 'unknown',
        ...details,
      });
    },
    [trackEvent, currentUser]
  );

  // Track test processing
  const trackTestProcessing = useCallback(
    (testId: string, action: string, duration?: number) => {
      trackEvent('test_processing', {
        testId,
        action,
        duration,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
      });
    },
    [trackEvent, currentUser]
  );

  // Track report generation
  const trackReportGeneration = useCallback(
    (reportType: string, format: string, duration: number, success: boolean) => {
      trackEvent('report_generated', {
        reportType,
        format,
        duration,
        success,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
      });
      trackEvent('report_generation_timing', {
        reportType,
        format,
        duration,
      });
    },
    [trackEvent, currentUser]
  );

  // Track QC events
  const trackQCEvent = useCallback(
    (eventType: string, testId: string, passed: boolean, details?: Record<string, any>) => {
      trackEvent('qc_event', {
        eventType,
        testId,
        passed,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
        ...details,
      });
    },
    [trackEvent, currentUser]
  );

  // Track inventory events
  const trackInventoryEvent = useCallback(
    (eventType: string, itemId: string, quantity: number, details?: Record<string, any>) => {
      trackEvent('inventory_event', {
        eventType,
        itemId,
        quantity,
        userId: currentUser?.uid,
        tenantId: currentUser?.tenantId,
        ...details,
      });
    },
    [trackEvent, currentUser]
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