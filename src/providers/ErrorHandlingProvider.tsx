import React, { useCallback, useEffect } from 'react';
import { ErrorBoundary, UnifiedErrorHandler, ErrorLogger } from 'unified-error-handling';
import { useTracking } from './TrackingProvider';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

// Initialize error handler with configuration
const errorHandler = new UnifiedErrorHandler({
  appName: 'LabFlow',
  environment: import.meta.env.MODE,
  logging: {
    console: import.meta.env.DEV,
    remote: true,
    endpoint: '/api/errors',
  },
  userFeedback: {
    enabled: true,
    automatic: false,
  },
  recovery: {
    automatic: true,
    maxRetries: 3,
  },
});

// Initialize error logger
const errorLogger = new ErrorLogger({
  handlers: [
    {
      type: 'console',
      enabled: import.meta.env.DEV,
    },
    {
      type: 'remote',
      enabled: true,
      endpoint: '/api/logs',
      batchSize: 10,
      flushInterval: 5000,
    },
  ],
});

// Export for use in other components
export const errorHandlerInstance = errorHandler;
export const errorLoggerInstance = errorLogger;

interface ErrorHandlingProviderProps {
  children: React.ReactNode;
}

// Fallback component for error boundary
const ErrorFallback: React.FC<{
  error: Error;
  resetError: () => void;
}> = ({ error, resetError }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="mt-2 text-gray-600">
            {import.meta.env.DEV ? error.message : 'An unexpected error occurred. Please try again.'}
          </p>
          <div className="mt-6 space-x-4">
            <button
              onClick={resetError}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ErrorHandlingProvider: React.FC<ErrorHandlingProviderProps> = ({ children }) => {
  const { trackError } = useTracking();

  // Global error handler
  const handleError = useCallback(
    (error: Error, errorInfo?: any) => {
      // Log error
      errorLogger.error(error, {
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });

      // Track error
      trackError(error, {
        errorInfo,
        component: errorInfo?.componentStack,
      });

      // Show user-friendly error message
      if (!error.message.includes('Network')) {
        toast.error('An error occurred. Our team has been notified.');
      }
    },
    [trackError]
  );

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
      error.stack = event.reason?.stack;
      handleError(error, { type: 'unhandledRejection' });
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  // Handle global errors
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      handleError(event.error || new Error(event.message), {
        type: 'globalError',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    };

    window.addEventListener('error', handleGlobalError);

    return () => {
      window.removeEventListener('error', handleGlobalError);
    };
  }, [handleError]);

  return (
    <ErrorBoundary
      fallback={ErrorFallback}
      onError={handleError}
      resetKeys={[]}
      resetOnPropsChange={false}
    >
      {children}
    </ErrorBoundary>
  );
};

// Custom hooks for error handling
export const useErrorHandler = () => {
  const { trackError } = useTracking();

  const logError = useCallback(
    (error: Error, context?: Record<string, any>) => {
      errorLogger.error(error, context);
      trackError(error, context);
    },
    [trackError]
  );

  const logWarning = useCallback((message: string, context?: Record<string, any>) => {
    errorLogger.warn(message, context);
  }, []);

  const logInfo = useCallback((message: string, context?: Record<string, any>) => {
    errorLogger.info(message, context);
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