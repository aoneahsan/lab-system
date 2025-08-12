/**
 * Error monitoring service
 */

export const errorMonitor = {
  trackError: async (error: Error, context?: any) => {
    console.error('Error tracked:', error, context);
    // TODO: Implement actual error tracking with Sentry or similar service
  },
  
  captureException: async (error: Error, context?: any) => {
    console.error('Exception captured:', error, context);
  },
  
  logError: async (message: string, error?: Error) => {
    console.error(message, error);
  }
};

export default errorMonitor;