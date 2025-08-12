import { useCallback } from 'react';
import { useTracking } from '@/providers/TrackingProvider';
import { errorMonitor } from '@/services/error-monitoring';

const captureError = (error: Error, context?: any) => errorMonitor.captureException(error, context);
const captureMessage = (message: string, level?: string) => errorMonitor.logError(message);
const addBreadcrumb = (data: any) => console.log('Breadcrumb:', data);
const useUnifiedErrorHandler = () => (error: Error) => errorMonitor.trackError(error);

// Custom hooks for error handling
export const useErrorHandler = () => {
  const { trackEvent } = useTracking();
  const trackError = (error: Error, context?: any) => trackEvent('error_occurred', { error: error.message, ...context });
  const unifiedHandler = useUnifiedErrorHandler();

  const logError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      // Use unified error handler
      unifiedHandler(error);
      
      // Capture with additional context
      captureError(error, {
        extra: context
      });
      
      // Track with analytics
      trackError(error, context);
    },
    [trackError, unifiedHandler]
  );

  const logWarning = useCallback((message: string, context?: Record<string, any>) => {
    captureMessage(message, 'warning');
    addBreadcrumb({
      message,
      category: 'warning',
      level: 'warning',
      data: context
    });
  }, []);

  const logInfo = useCallback((message: string, context?: Record<string, any>) => {
    captureMessage(message, 'info');
    addBreadcrumb({
      message,
      category: 'info',
      level: 'info',
      data: context
    });
  }, []);

  const handleAsyncError = useCallback(
    async <T,>(promise: Promise<T>, fallback?: T): Promise<T | undefined> => {
      try {
        return await promise;
      } catch (error) {
        logError(error as Error, { type: 'async' });
        return fallback;
      }
    },
    [logError]
  );

  const withErrorHandling = useCallback(
    <T extends (...args: any[]) => any>(
      fn: T,
      context?: Record<string, any>
    ): ((...args: Parameters<T>) => ReturnType<T>) => {
      return (...args: Parameters<T>): ReturnType<T> => {
        try {
          const result = fn(...args);
          if (result instanceof Promise) {
            return result.catch((error) => {
              logError(error, { ...context, args });
              throw error;
            }) as ReturnType<T>;
          }
          return result;
        } catch (error) {
          logError(error as Error, { ...context, args });
          throw error;
        }
      };
    },
    [logError]
  );

  return {
    logError,
    logWarning,
    logInfo,
    handleAsyncError,
    withErrorHandling,
  };
};