import * as Sentry from '@sentry/react';
import { logger } from './logger';
import { performanceMonitor } from './performance';
import { analytics } from './analytics';

export { logger, performanceMonitor, analytics };

export function initializeMonitoring() {
  // Initialize Sentry
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  }

  // Initialize performance monitoring
  performanceMonitor.initialize();

  // Initialize analytics
  analytics.initialize();

  // Log initialization
  logger.info('Monitoring services initialized', {
    sentry: !!import.meta.env.VITE_SENTRY_DSN,
    analytics: !!import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
    environment: import.meta.env.MODE
  });
}

export function setUser(user: { id: string; email?: string; name?: string }) {
  // Set user in Sentry
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name
  });

  // Identify user in analytics
  analytics.identify(user.id, {
    email: user.email,
    name: user.name
  });

  logger.info('User context set', { userId: user.id });
}

export function clearUser() {
  Sentry.setUser(null);
  analytics.identify('');
  logger.info('User context cleared');
}

export function captureError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, error, context);
  Sentry.captureException(error, {
    contexts: {
      custom: context || {}
    }
  });
}