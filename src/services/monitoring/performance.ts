import { logger } from './logger';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  initialize() {
    if (!window.performance || !window.PerformanceObserver) {
      logger.warn('Performance API not available');
      return;
    }

    // Monitor navigation timing
    this.measureNavigationTiming();

    // Monitor resource timing
    this.observeResources();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor FCP and LCP
    this.observePaintTiming();

    // Monitor layout shifts
    this.observeLayoutShifts();
  }

  private measureNavigationTiming() {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.recordMetric('page_load_time', navigation.loadEventEnd - navigation.fetchStart, 'ms');
          this.recordMetric('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart, 'ms');
          this.recordMetric('time_to_first_byte', navigation.responseStart - navigation.fetchStart, 'ms');
        }
      }, 0);
    });
  }

  private observeResources() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        
        if (resource.initiatorType === 'fetch' || resource.initiatorType === 'xmlhttprequest') {
          this.recordMetric('api_request_duration', resource.duration, 'ms', {
            url: resource.name,
            method: resource.initiatorType
          });
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.set('resource', observer);
  }

  private observeLongTasks() {
    if ('PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', entry.duration, 'ms', {
            startTime: entry.startTime.toString()
          });
          
          logger.warn('Long task detected', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.set('longtask', observer);
    }
  }

  private observePaintTiming() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('first_contentful_paint', entry.startTime, 'ms');
        } else if (entry.name === 'largest-contentful-paint') {
          this.recordMetric('largest_contentful_paint', entry.startTime, 'ms');
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
    this.observers.set('paint', observer);
  }

  private observeLayoutShifts() {
    let cumulativeLayoutShift = 0;
    
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cumulativeLayoutShift += (entry as any).value;
        }
      }
      
      this.recordMetric('cumulative_layout_shift', cumulativeLayoutShift, 'score');
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    this.observers.set('layout-shift', observer);
  }

  measureOperation<T>(name: string, operation: () => T): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result.then((value) => {
          this.recordMetric(`operation_${name}`, performance.now() - startTime, 'ms');
          return value;
        }).catch((error) => {
          this.recordMetric(`operation_${name}_error`, performance.now() - startTime, 'ms');
          throw error;
        }) as any;
      }
      
      this.recordMetric(`operation_${name}`, performance.now() - startTime, 'ms');
      return result;
    } catch (error) {
      this.recordMetric(`operation_${name}_error`, performance.now() - startTime, 'ms');
      throw error;
    }
  }

  private recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      tags
    };

    this.metrics.push(metric);
    
    // Log significant metrics
    if (this.isSignificantMetric(name, value)) {
      logger.info(`Performance metric: ${name}`, {
        value,
        unit,
        tags
      });
    }

    // Send to monitoring service
    this.sendToMonitoring(metric);
  }

  private isSignificantMetric(name: string, value: number): boolean {
    const thresholds: Record<string, number> = {
      page_load_time: 3000,
      api_request_duration: 1000,
      long_task: 50,
      first_contentful_paint: 2000,
      largest_contentful_paint: 2500,
      cumulative_layout_shift: 0.1
    };

    return thresholds[name] ? value > thresholds[name] : false;
  }

  private sendToMonitoring(metric: PerformanceMetric) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', 'performance_metric', {
        metric_name: metric.name,
        value: metric.value,
        metric_unit: metric.unit,
        ...metric.tags
      });
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();