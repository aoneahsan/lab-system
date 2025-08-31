import React, { useCallback, useEffect } from 'react';
import { ErrorBoundary } from 'unified-error-handling/react';
import { initialize, useAdapter as setAdapter, captureError, setUser } from 'unified-error-handling';
import { toast } from '@/stores/toast.store';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth.store';
import { trackingInstance } from './TrackingProvider';

// Initialize unified error handling
let initialized = false;

const initializeErrorHandling = () => {
  if (initialized) return;
  
  initialize({
    maxBreadcrumbs: 100,
    enableGlobalHandlers: true,
    enableConsoleCapture: import.meta.env.DEV
  });

  // Set up adapter based on environment
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    setAdapter('sentry', {
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      tracesSampleRate: 0.1
    });
  } else {
    setAdapter('console');
  }
  
  initialized = true;
};

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
  const { currentUser } = useAuthStore();

  // Initialize error handling on mount
  useEffect(() => {
    initializeErrorHandling();
  }, []);

  // Set user context when authenticated
  useEffect(() => {
    if (currentUser) {
      setUser({
        id: currentUser.id,
        email: currentUser.email,
        username: currentUser.displayName || currentUser.email
      });
    }
  }, [currentUser]);

  // Global error handler
  const handleError = useCallback(
    (error: Error, errorInfo?: any) => {
      // Capture error with unified-error-handling
      captureError(error, {
        tags: {
          component: errorInfo?.componentStack ? 'react-component' : 'global',
          environment: import.meta.env.MODE
        },
        extra: {
          errorInfo,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }
      });

      // Track error with analytics
      trackingInstance.logError(error, {
        errorInfo,
        component: errorInfo?.componentStack,
      });

      // Show user-friendly error message
      if (!error.message.includes('Network')) {
        toast.error('An error occurred', 'Our team has been notified.');
      }
    },
    []
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

// useErrorHandler hook has been moved to @/contexts/ErrorHandlingContext