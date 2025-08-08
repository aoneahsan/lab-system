import { captureException, captureMessage, setContext } from '@sentry/react';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  context?: Record<string, any>;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private log(level: LogLevel, message: string, data?: any, context?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      context
    };

    // Store in memory
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // Console output in development
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(level);
      console.log(
        `%c[${level.toUpperCase()}] ${message}`,
        style,
        data || ''
      );
    }

    // Send to monitoring service
    if (level === 'error') {
      this.sendToMonitoring(entry);
    }
  }

  debug(message: string, data?: any, context?: Record<string, any>) {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: any, context?: Record<string, any>) {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: any, context?: Record<string, any>) {
    this.log('warn', message, data, context);
  }

  error(message: string, error?: Error | any, context?: Record<string, any>) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    this.log('error', message, errorData, context);

    // Capture exception in Sentry
    if (error instanceof Error) {
      captureException(error, {
        contexts: {
          custom: context || {}
        }
      });
    }
  }

  private sendToMonitoring(entry: LogEntry) {
    // Set context for error tracking
    if (entry.context) {
      Object.entries(entry.context).forEach(([key, value]) => {
        setContext(key, value);
      });
    }

    // Send to Sentry
    if (!entry.data?.stack) {
      captureMessage(entry.message, 'error');
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;'
    };
    return styles[level];
  }

  private getCurrentUserId(): string | undefined {
    try {
      const authState = localStorage.getItem('auth-storage');
      if (authState) {
        const { state } = JSON.parse(authState);
        return state?.currentUser?.uid;
      }
    } catch {}
    return undefined;
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session-id', sessionId);
    }
    return sessionId;
  }

  getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new Logger();