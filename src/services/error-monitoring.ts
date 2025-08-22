import { logger } from '@/services/logger.service';

/**
 * Error monitoring service
 */

export const errorMonitor = {
  trackError: async (error: Error, context?: any) => {
    logger.error('Error tracked:', error, context);
    // TODO: Implement actual error tracking with Sentry or similar service
  },
  
  captureException: async (error: Error, context?: any) => {
    logger.error('Exception captured:', error, context);
  },
  
  logError: async (message: string, error?: Error) => {
    logger.error(message, error);
  }
};

export default errorMonitor;