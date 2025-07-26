/**
 * Performance Monitoring Setup for LabFlow
 * Tracks web vitals, custom metrics, and user interactions
 */

import { getPerformance, PerformanceTrace } from 'firebase/performance';
import { performance } from '@/config/firebase';

// Web Vitals thresholds
const WEB_VITALS_THRESHOLDS = {
  FCP: { good: 1800, needs_improvement: 3000 }, // First Contentful Paint
  LCP: { good: 2500, needs_improvement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needs_improvement: 300 },   // First Input Delay
  CLS: { good: 0.1, needs_improvement: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, needs_improvement: 1800 }, // Time to First Byte
};

class PerformanceMonitor {
  private traces: Map<string, PerformanceTrace> = new Map();
  private metrics: Map<string, number> = new Map();

  constructor() {
    this.initializeWebVitals();
    this.setupCustomMetrics();
  }

  /**
   * Initialize web vitals monitoring
   */
  private initializeWebVitals() {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.recordMetric('FCP', entry.startTime);
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });

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
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
            this.recordMetric('CLS', clsValue);
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }

  /**
   * Setup custom application metrics
   */
  private setupCustomMetrics() {
    // Track initial load time
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        this.recordMetric('pageLoadTime', loadTime);
      });
    }
  }

  /**
   * Start a custom trace
   */
  startTrace(name: string, attributes?: Record<string, any>): void {
    try {
      const trace = getPerformance().trace(name);
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          trace.putAttribute(key, String(value));
        });
      }
      
      trace.start();
      this.traces.set(name, trace);
    } catch (error) {
      console.warn(`Failed to start trace ${name}:`, error);
    }
  }

  /**
   * Stop a custom trace
   */
  stopTrace(name: string, metrics?: Record<string, number>): void {
    const trace = this.traces.get(name);
    if (!trace) {
      console.warn(`Trace ${name} not found`);
      return;
    }

    try {
      if (metrics) {
        Object.entries(metrics).forEach(([key, value]) => {
          trace.putMetric(key, value);
        });
      }
      
      trace.stop();
      this.traces.delete(name);
    } catch (error) {
      console.warn(`Failed to stop trace ${name}:`, error);
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(name: string, value: number): void {
    this.metrics.set(name, value);
    
    // Log to console in development
    if (import.meta.env.DEV) {
      const threshold = WEB_VITALS_THRESHOLDS[name];
      if (threshold) {
        const rating = value <= threshold.good ? '🟢' : 
                      value <= threshold.needs_improvement ? '🟡' : '🔴';
        console.log(`${rating} ${name}: ${value.toFixed(2)}ms`);
      } else {
        console.log(`📊 ${name}: ${value}`);
      }
    }
  }

  /**
   * Track API call performance
   */
  async trackApiCall<T>(
    endpoint: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const traceName = `api_${endpoint.replace(/\//g, '_')}`;
    this.startTrace(traceName, { endpoint });
    
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.stopTrace(traceName, {
        duration: Math.round(duration),
        success: 1,
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.stopTrace(traceName, {
        duration: Math.round(duration),
        error: 1,
      });
      
      throw error;
    }
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName: string, renderTime: number): void {
    this.recordMetric(`component_${componentName}_render`, renderTime);
    
    // Log slow renders
    if (renderTime > 16) { // More than one frame (60fps)
      console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
    }
  }

  /**
   * Track user interactions
   */
  trackInteraction(action: string, category: string, value?: number): void {
    const traceName = `interaction_${category}_${action}`;
    
    try {
      const trace = getPerformance().trace(traceName);
      trace.putAttribute('action', action);
      trace.putAttribute('category', category);
      
      if (value !== undefined) {
        trace.putMetric('value', value);
      }
      
      trace.start();
      trace.stop();
    } catch (error) {
      console.warn(`Failed to track interaction:`, error);
    }
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

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React component performance tracking hook
export function usePerformanceTracking(componentName: string) {
  if (import.meta.env.DEV) {
    const renderStart = performance.now();
    
    // Track after render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - renderStart;
      performanceMonitor.trackComponentRender(componentName, renderTime);
    });
  }
}

// HOC for performance tracking
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return (props: P) => {
    usePerformanceTracking(componentName);
    return React.createElement(Component, props);
  };
}

// Utility to measure async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  performanceMonitor.startTrace(name);
  
  try {
    const result = await operation();
    performanceMonitor.stopTrace(name, { success: 1 });
    return result;
  } catch (error) {
    performanceMonitor.stopTrace(name, { error: 1 });
    throw error;
  }
}

// Export types
export type { PerformanceMonitor };