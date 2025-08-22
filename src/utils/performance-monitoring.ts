/**
 * Performance Monitoring Setup for LabFlow
 * Tracks web vitals, custom metrics, and user interactions
 */

import { type PerformanceTrace, trace } from 'firebase/performance';
import { performance } from '@/config/firebase.config';
import { logger } from '@/services/logger.service';

// Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needs_improvement: 300 }, // First Input Delay
  CLS: { good: 0.1, needs_improvement: 0.25 }, // Cumulative Layout Shift
  TTFB: { good: 800, needs_improvement: 1800 }, // Time to First Byte
} as const;

class PerformanceMonitor {
  private traces: Map<string, PerformanceTrace> = new Map();
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.setupWebVitals();
    this.setupCustomMetrics();
  }

  /**
   * Setup Web Vitals monitoring
   */
  private setupWebVitals() {
    if (typeof window === 'undefined' || !performance) return;

    // Use web-vitals library if available, or basic measurements
    try {
      // First Contentful Paint
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEventTiming;
          if (fidEntry.processingStart) {
            this.recordMetric('FID', fidEntry.processingStart - fidEntry.startTime);
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as any;
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value || 0;
            this.recordMetric('CLS', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      logger.warn('Failed to setup web vitals monitoring:', error);
    }
  }

  /**
   * Setup custom application metrics
   */
  private setupCustomMetrics() {
    // Track initial load time
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const nav = window.performance?.getEntriesByType(
          'navigation'
        )[0] as PerformanceNavigationTiming;
        if (nav) {
          const loadTime = nav.loadEventEnd - nav.fetchStart;
          this.recordMetric('pageLoadTime', loadTime);
        }
      });
    }
  }

  /**
   * Start a custom trace
   */
  startTrace(name: string, attributes?: Record<string, any>): void {
    try {
      if (!performance) return;

      const customTrace = trace(performance, name);

      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          customTrace.putAttribute(key, String(value));
        });
      }

      customTrace.start();
      this.traces.set(name, customTrace);
    } catch (error) {
      logger.warn(`Failed to start trace ${name}:`, error);
    }
  }

  /**
   * Stop a custom trace
   */
  stopTrace(name: string, metrics?: Record<string, number>): void {
    const customTrace = this.traces.get(name);
    if (!customTrace) {
      // Don't log warning for common traces that might not exist
      if (!['app_initialization', 'route_change'].includes(name)) {
        logger.warn(`Trace ${name} not found`);
      }
      return;
    }

    try {
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          customTrace.putMetric(key, value);
        });
      }

      customTrace.stop();
      this.traces.delete(name);
    } catch (error) {
      logger.warn(`Failed to stop trace ${name}:`, error);
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);

    // Log to console in development
    if (import.meta.env.DEV) {
      const threshold = WEB_VITALS_THRESHOLDS[name as keyof typeof WEB_VITALS_THRESHOLDS];
      if (threshold) {
        const rating =
          value <= threshold.good ? '🟢' : value <= threshold.needs_improvement ? '🟡' : '🔴';
        logger.log(`${rating} ${name}: ${value.toFixed(2)}ms`);
      } else {
        logger.log(`📊 ${name}: ${value}`);
      }
    }
  }

  /**
   * Track a user interaction
   */
  trackInteraction(name: string, metadata?: Record<string, any>): void {
    const startTime = window.performance?.now() || 0;

    return (() => {
      const endTime = window.performance?.now() || 0;
      const duration = endTime - startTime;

      this.startTrace(`interaction_${name}`, metadata);
      this.stopTrace(`interaction_${name}`, { duration });
    }) as any;
  }

  /**
   * Track API call performance
   */
  async trackApiCall<T>(name: string, apiCall: () => Promise<T>): Promise<T> {
    const startTime = window.performance?.now() || 0;
    this.startTrace(`api_${name}`);

    try {
      const result = await apiCall();
      const endTime = window.performance?.now() || 0;
      const duration = endTime - startTime;

      this.stopTrace(`api_${name}`, {
        duration: Math.round(duration),
        status: 1, // 1 for success
      });

      return result;
    } catch (error) {
      const endTime = window.performance?.now() || 0;
      const duration = endTime - startTime;

      this.stopTrace(`api_${name}`, {
        duration: Math.round(duration),
        status: 0, // 0 for error
      });

      throw error;
    }
  }

  /**
   * Track component render time
   */
  trackComponentRender(componentName: string): () => void {
    const startTime = window.performance?.now() || 0;

    return () => {
      const endTime = window.performance?.now() || 0;
      const renderTime = endTime - startTime;

      this.recordMetric(`component_${componentName}_render`, renderTime);
    };
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for tracking component performance
export function usePerformanceTracking(componentName: string) {
  if (typeof window === 'undefined') return;

  const cleanup = performanceMonitor.trackComponentRender(componentName);

  // Call cleanup when component unmounts
  if (typeof window !== 'undefined') {
    window.requestAnimationFrame(() => {
      cleanup();
    });
  }
}

// Utility to track route changes
export function trackRouteChange(pathname: string) {
  performanceMonitor.startTrace('route_change', {
    path: pathname,
    timestamp: new Date().toISOString(),
  });

  // Stop trace after route is loaded
  setTimeout(() => {
    performanceMonitor.stopTrace('route_change');
  }, 100);
}

// Track specific user actions
export function trackUserAction(action: string, metadata?: Record<string, any>) {
  performanceMonitor.startTrace(`user_action_${action}`, {
    ...metadata,
    timestamp: new Date().toISOString(),
  });

  return () => {
    performanceMonitor.stopTrace(`user_action_${action}`);
  };
}
