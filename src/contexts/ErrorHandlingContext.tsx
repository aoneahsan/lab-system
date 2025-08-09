import { useCallback } from 'react';
import { captureError } from 'unified-error-handling';
import { useTracking } from '@/providers/TrackingProvider';
import { toast } from '@/stores/toast.store';

export const useErrorHandler = () => {
  const { trackError } = useTracking();

  const logError = useCallback(
    (error: Error, context?: any) => {
      // Log to console in development
      if (import.meta.env.DEV) {
        console.error('Error:', error, context);
      }

      // Capture with unified-error-handling
      captureError(error, {
        tags: {
          source: 'useErrorHandler',
          environment: import.meta.env.MODE
        },
        extra: {
          context,
          timestamp: new Date().toISOString(),
          url: window.location.href
        }
      });

      // Track with analytics
      trackError(error, context);

      // Show user-friendly error message
      if (!error.message.includes('Network')) {
        toast.error('An error occurred', error.message);
      }
    },
    [trackError]
  );

  const logWarning = useCallback((message: string, context?: any) => {
    if (import.meta.env.DEV) {
      console.warn('Warning:', message, context);
    }
  }, []);

  const logInfo = useCallback((message: string, context?: any) => {
    if (import.meta.env.DEV) {
      console.info('Info:', message, context);
    }
  }, []);

  return {
    logError,
    logWarning,
    logInfo
  };
};