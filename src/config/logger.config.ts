/**
 * Logger Configuration
 * 
 * Initializes the logger service with appropriate settings for the current environment.
 * This file is imported early in the app lifecycle to ensure logging is configured
 * before any other services start using it.
 */

import { logger, LogLevel } from '@/services/logger.service';

/**
 * Configure logger based on environment and user preferences
 */
export function initializeLogger(): void {
  // Get environment variables
  const environment = import.meta.env.VITE_APP_ENVIRONMENT || 'development';
  const logLevel = import.meta.env.VITE_LOG_LEVEL;
  const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';

  // Set log level based on environment or explicit configuration
  if (debugMode) {
    logger.setLogLevel(LogLevel.DEBUG);
    logger.info('🐛 Debug mode enabled - showing all logs');
  } else if (logLevel) {
    logger.setLogLevelByString(logLevel);
    logger.info(`📊 Log level set to: ${logLevel.toUpperCase()}`);
  } else {
    // Default levels based on environment
    switch (environment) {
      case 'production':
        logger.setLogLevel(LogLevel.ERROR);
        break;
      case 'staging':
        logger.setLogLevel(LogLevel.WARN);
        break;
      case 'development':
      default:
        logger.setLogLevel(LogLevel.WARN); // Only warnings and errors as requested
        break;
    }
  }

  // Configure logger options
  logger.configure({
    enableTimestamps: environment !== 'production',
    enableColors: true,
    enableStackTrace: environment === 'development',
    maxLogHistory: environment === 'production' ? 500 : 1000,
  });

  // Log the initialization
  logger.info(`🚀 Logger initialized for ${environment} environment`);
  logger.info(`📋 Current log level: ${LogLevel[logger.getLogLevel()]}`);

  // Add global debug helpers in development
  if (environment === 'development') {
    (window as any).debugLogs = {
      enable: () => logger.enableDebugMode(),
      disable: () => logger.disableDebugMode(),
      setLevel: (level: string) => logger.setLogLevelByString(level),
      getHistory: () => logger.getHistory(),
      exportLogs: () => logger.exportLogs(),
      clearHistory: () => logger.clearHistory(),
    };
    
    logger.debug('🔧 Debug utilities available on window.debugLogs');
  }
}

// Initialize immediately when this module is imported
initializeLogger();