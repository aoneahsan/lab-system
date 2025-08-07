import { useEffect, useRef, useCallback } from 'react';
import { PerformanceMonitor } from '@/utils/performance';

interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
  domLoad?: number; // DOM Content Loaded
  windowLoad?: number; // Window Load
}

interface UsePerformanceMonitorOptions {
  onMetrics?: (metrics: PerformanceMetrics) => void;
  reportToAnalytics?: boolean;
  sampleRate?: number; // 0-1, percentage of users to monitor
}

export function usePerformanceMonitor(options: UsePerformanceMonitorOptions = {}) {
  const {
    onMetrics,
    reportToAnalytics = true,
    sampleRate = 0.1, // Monitor 10% of users by default
  } = options;
  
  const monitorRef = useRef<PerformanceMonitor>();
  const metricsRef = useRef<PerformanceMetrics>({});

  // Check if this session should be monitored
  const shouldMonitor = useRef(() => {
    return Math.random() < sampleRate;
  })();

  useEffect(() => {
    if (!shouldMonitor) return;

    monitorRef.current = new PerformanceMonitor();
    const monitor = monitorRef.current;

    // Measure navigation timing
    const measureNavigationTiming = () => {
      const navigation = monitor.getMetrics();
      if (navigation) {
        metricsRef.current.ttfb = navigation.responseStart - navigation.fetchStart;
        metricsRef.current.domLoad = navigation.domContentLoadedEventEnd - navigation.fetchStart;
        metricsRef.current.windowLoad = navigation.loadEventEnd - navigation.fetchStart;
      }
    };

    // Observe Core Web Vitals
    monitor.reportVitals((metric) => {
      switch (metric.name) {
        case 'FCP':
          metricsRef.current.fcp = metric.value;
          break;
        case 'LCP':
          metricsRef.current.lcp = metric.value;
          break;
        case 'FID':
          metricsRef.current.fid = metric.value;
          break;
        case 'CLS':
          metricsRef.current.cls = metric.value;
          break;
      }

      // Call callback with updated metrics
      onMetrics?.(metricsRef.current);

      // Report to analytics
      if (reportToAnalytics) {
        reportMetric(metric.name, metric.value);
      }
    });

    // Measure after load
    if (document.readyState === 'complete') {
      measureNavigationTiming();
    } else {
      window.addEventListener('load', measureNavigationTiming);
    }

    // Report metrics on page unload
    const reportFinalMetrics = () => {
      if (reportToAnalytics) {
        Object.entries(metricsRef.current).forEach(([name, value]) => {
          if (value !== undefined) {
            reportMetric(name, value);
          }
        });
      }
    };

    window.addEventListener('pagehide', reportFinalMetrics);
    window.addEventListener('beforeunload', reportFinalMetrics);

    return () => {
      window.removeEventListener('load', measureNavigationTiming);
      window.removeEventListener('pagehide', reportFinalMetrics);
      window.removeEventListener('beforeunload', reportFinalMetrics);
    };
  }, [onMetrics, reportToAnalytics, shouldMonitor]);

  // Mark custom timing
  const mark = useCallback((name: string) => {
    if (!shouldMonitor || !monitorRef.current) return;
    monitorRef.current.mark(name);
  }, [shouldMonitor]);

  // Measure custom timing
  const measure = useCallback((name: string, startMark: string) => {
    if (!shouldMonitor || !monitorRef.current) return 0;
    return monitorRef.current.measure(name, startMark);
  }, [shouldMonitor]);

  return {
    mark,
    measure,
    metrics: metricsRef.current,
  };
}

// Report metric to analytics service
function reportMetric(name: string, value: number) {
  // Send to analytics service
  if ('sendBeacon' in navigator) {
    const data = JSON.stringify({
      metric: name,
      value: Math.round(value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });
    
    navigator.sendBeacon('/api/analytics/performance', data);
  }
  
  // Also log to console in development
  if (import.meta.env.DEV) {
    console.log(`Performance metric - ${name}: ${value.toFixed(2)}ms`);
  }
}

// Hook for measuring component render performance
export function useRenderPerformance(componentName: string) {
  const renderCount = useRef(0);
  const renderStartRef = useRef<number>();
  
  useEffect(() => {
    renderCount.current++;
    renderStartRef.current = performance.now();
    
    // Measure after render
    const measureRender = () => {
      if (renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current;
        
        if (import.meta.env.DEV && renderTime > 16) { // Longer than one frame
          console.warn(
            `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms (render #${renderCount.current})`
          );
        }
        
        // Report slow renders in production
        if (!import.meta.env.DEV && renderTime > 100) {
          reportMetric(`slow_render_${componentName}`, renderTime);
        }
      }
    };
    
    // Use requestIdleCallback to measure after browser is idle
    if ('requestIdleCallback' in window) {
      requestIdleCallback(measureRender);
    } else {
      setTimeout(measureRender, 0);
    }
  });
}