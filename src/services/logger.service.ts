/**
 * Comprehensive Logger Service
 * 
 * Provides centralized logging with configurable levels and formatting.
 * Replaces all console usage throughout the application for better control.
 */

export enum LogLevel {
  VERBOSE = 0,
  DEBUG = 1,
  INFO = 2,
  LOG = 3,
  WARN = 4,
  ERROR = 5,
  SILENT = 6
}

export interface LoggerConfig {
  level: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  enableStackTrace: boolean;
  maxLogHistory: number;
  prefix?: string;
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  data?: any[];
  stack?: string;
  context?: string;
}

class LoggerService {
  private config: LoggerConfig;
  private logHistory: LogEntry[] = [];
  private contexts: Map<string, LoggerConfig> = new Map();

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: this.getDefaultLogLevel(),
      enableTimestamps: true,
      enableColors: true,
      enableStackTrace: false,
      maxLogHistory: 1000,
      ...config
    };

    // Initialize based on environment
    this.initializeFromEnvironment();
  }

  /**
   * Get default log level based on environment
   */
  private getDefaultLogLevel(): LogLevel {
    const env = import.meta.env.VITE_APP_ENVIRONMENT || 'development';
    const logLevelConfig = import.meta.env.VITE_LOG_LEVEL;

    if (logLevelConfig) {
      return this.parseLogLevel(logLevelConfig);
    }

    switch (env) {
      case 'production':
        return LogLevel.WARN; // Only warnings and errors in production
      case 'staging':
        return LogLevel.INFO;
      case 'development':
      default:
        return LogLevel.WARN; // User wants only warnings and errors by default
    }
  }

  /**
   * Parse log level string to enum
   */
  private parseLogLevel(level: string): LogLevel {
    const levelMap: Record<string, LogLevel> = {
      'verbose': LogLevel.VERBOSE,
      'debug': LogLevel.DEBUG,
      'info': LogLevel.INFO,
      'log': LogLevel.LOG,
      'warn': LogLevel.WARN,
      'error': LogLevel.ERROR,
      'silent': LogLevel.SILENT
    };

    return levelMap[level.toLowerCase()] ?? LogLevel.WARN;
  }

  /**
   * Initialize logger from environment variables
   */
  private initializeFromEnvironment(): void {
    // Allow runtime log level changes via localStorage
    const storedLevel = localStorage.getItem('logger-level');
    if (storedLevel) {
      this.config.level = this.parseLogLevel(storedLevel);
    }

    // Check for debug mode
    const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true' || 
                     localStorage.getItem('debug-mode') === 'true';
    if (debugMode) {
      this.config.level = LogLevel.DEBUG;
    }
  }

  /**
   * Set log level at runtime
   */
  setLogLevel(level: LogLevel): void {
    this.config.level = level;
    localStorage.setItem('logger-level', LogLevel[level].toLowerCase());
  }

  /**
   * Set log level by string
   */
  setLogLevelByString(level: string): void {
    this.setLogLevel(this.parseLogLevel(level));
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Create a context-specific logger
   */
  createContext(context: string, config?: Partial<LoggerConfig>): LoggerService {
    const contextLogger = new LoggerService({ ...this.config, ...config, prefix: context });
    this.contexts.set(context, contextLogger.config);
    return contextLogger;
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: string): string {
    let formatted = '';

    // Add timestamp
    if (this.config.enableTimestamps) {
      const timestamp = new Date().toISOString();
      formatted += `[${timestamp}] `;
    }

    // Add log level
    const levelStr = LogLevel[level].padEnd(7);
    formatted += `[${levelStr}] `;

    // Add context/prefix
    if (context || this.config.prefix) {
      const ctx = context || this.config.prefix;
      formatted += `[${ctx}] `;
    }

    // Add message
    formatted += message;

    return formatted;
  }

  /**
   * Get color for log level (for browser console)
   */
  private getLogColor(level: LogLevel): string {
    if (!this.config.enableColors) return '';

    const colors: Record<LogLevel, string> = {
      [LogLevel.VERBOSE]: 'color: #6b7280',
      [LogLevel.DEBUG]: 'color: #3b82f6',
      [LogLevel.INFO]: 'color: #10b981',
      [LogLevel.LOG]: 'color: #000000',
      [LogLevel.WARN]: 'color: #f59e0b',
      [LogLevel.ERROR]: 'color: #ef4444',
      [LogLevel.SILENT]: ''
    };

    return colors[level] || '';
  }

  /**
   * Store log entry in history
   */
  private storeLogEntry(level: LogLevel, message: string, data?: any[], context?: string): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
      context: context || this.config.prefix
    };

    // Add stack trace for errors
    if (level === LogLevel.ERROR && this.config.enableStackTrace) {
      entry.stack = new Error().stack;
    }

    this.logHistory.unshift(entry);

    // Trim history if it exceeds max size
    if (this.logHistory.length > this.config.maxLogHistory) {
      this.logHistory = this.logHistory.slice(0, this.config.maxLogHistory);
    }
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, ...data: any[]): void {
    if (!this.shouldLog(level)) return;

    const context = this.config.prefix;
    const formattedMessage = this.formatMessage(level, message, context);
    
    // Store in history
    this.storeLogEntry(level, message, data, context);

    // Output to console
    const color = this.getLogColor(level);
    
    switch (level) {
      case LogLevel.VERBOSE:
      case LogLevel.DEBUG:
        if (color) {
          console.debug(`%c${formattedMessage}`, color, ...data);
        } else {
          console.debug(formattedMessage, ...data);
        }
        break;
      case LogLevel.INFO:
        if (color) {
          console.info(`%c${formattedMessage}`, color, ...data);
        } else {
          console.info(formattedMessage, ...data);
        }
        break;
      case LogLevel.LOG:
        if (color) {
          console.log(`%c${formattedMessage}`, color, ...data);
        } else {
          console.log(formattedMessage, ...data);
        }
        break;
      case LogLevel.WARN:
        if (color) {
          console.warn(`%c${formattedMessage}`, color, ...data);
        } else {
          console.warn(formattedMessage, ...data);
        }
        break;
      case LogLevel.ERROR:
        if (color) {
          console.error(`%c${formattedMessage}`, color, ...data);
        } else {
          console.error(formattedMessage, ...data);
        }
        break;
    }
  }

  /**
   * Verbose logging (most detailed)
   */
  verbose(message: string, ...data: any[]): void {
    this.log(LogLevel.VERBOSE, message, ...data);
  }

  /**
   * Debug logging
   */
  debug(message: string, ...data: any[]): void {
    this.log(LogLevel.DEBUG, message, ...data);
  }

  /**
   * Info logging
   */
  info(message: string, ...data: any[]): void {
    this.log(LogLevel.INFO, message, ...data);
  }

  /**
   * General logging
   */
  log(message: string, ...data: any[]): void {
    this.log(LogLevel.LOG, message, ...data);
  }

  /**
   * Warning logging
   */
  warn(message: string, ...data: any[]): void {
    this.log(LogLevel.WARN, message, ...data);
  }

  /**
   * Error logging
   */
  error(message: string, ...data: any[]): void {
    this.log(LogLevel.ERROR, message, ...data);
  }

  /**
   * Group logging (for related logs)
   */
  group(label: string): void {
    if (this.shouldLog(LogLevel.LOG)) {
      console.group(label);
    }
  }

  /**
   * Collapsed group logging
   */
  groupCollapsed(label: string): void {
    if (this.shouldLog(LogLevel.LOG)) {
      console.groupCollapsed(label);
    }
  }

  /**
   * End group
   */
  groupEnd(): void {
    if (this.shouldLog(LogLevel.LOG)) {
      console.groupEnd();
    }
  }

  /**
   * Table logging for objects
   */
  table(data: any): void {
    if (this.shouldLog(LogLevel.LOG)) {
      console.table(data);
    }
  }

  /**
   * Time logging
   */
  time(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.time(label);
    }
  }

  /**
   * End time logging
   */
  timeEnd(label: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeEnd(label);
    }
  }

  /**
   * Performance timing
   */
  timeLog(label: string, ...data: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.timeLog(label, ...data);
    }
  }

  /**
   * Get log history
   */
  getHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  /**
   * Get logs filtered by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logHistory.filter(entry => entry.level === level);
  }

  /**
   * Get logs filtered by context
   */
  getLogsByContext(context: string): LogEntry[] {
    return this.logHistory.filter(entry => entry.context === context);
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.setLogLevel(LogLevel.DEBUG);
    localStorage.setItem('debug-mode', 'true');
    this.warn('Debug mode enabled - showing all logs');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.setLogLevel(LogLevel.WARN);
    localStorage.removeItem('debug-mode');
    this.warn('Debug mode disabled - showing only warnings and errors');
  }

  /**
   * Toggle debug mode
   */
  toggleDebugMode(): void {
    if (this.config.level <= LogLevel.DEBUG) {
      this.disableDebugMode();
    } else {
      this.enableDebugMode();
    }
  }
}

// Create and export singleton instance
export const logger = new LoggerService();

// Create context-specific loggers for different modules
export const authLogger = logger.createContext('AUTH');
export const firebaseLogger = logger.createContext('FIREBASE');
export const apiLogger = logger.createContext('API');
export const uiLogger = logger.createContext('UI');
export const performanceLogger = logger.createContext('PERFORMANCE');
export const offlineLogger = logger.createContext('OFFLINE');
export const syncLogger = logger.createContext('SYNC');
export const billingLogger = logger.createContext('BILLING');
export const inventoryLogger = logger.createContext('INVENTORY');
export const qcLogger = logger.createContext('QC');
export const reportLogger = logger.createContext('REPORTS');
export const validationLogger = logger.createContext('VALIDATION');
export const onboardingLogger = logger.createContext('ONBOARDING');

// Export LogLevel enum for external use
export { LogLevel };
export default logger;

// Add global debug helpers (only in development)
if (import.meta.env.DEV) {
  (window as any).logger = logger;
  (window as any).enableDebugLogs = () => logger.enableDebugMode();
  (window as any).disableDebugLogs = () => logger.disableDebugMode();
  (window as any).setLogLevel = (level: string) => logger.setLogLevelByString(level);
  (window as any).getLogHistory = () => logger.getHistory();
  (window as any).exportLogs = () => logger.exportLogs();
}