/**
 * Performance Monitoring Provider
 * Provides performance monitoring context and utilities
 */

import { createContext, useEffect, ReactNode } from 'react';
import { performanceMonitor } from '@/utils/performance-monitoring';

interface PerformanceContextValue {
  trackInteraction: (action: string, category: string, value?: number) => void;
  measureAsync: <T>(name: string, operation: () => Promise<T>) => Promise<T>;
}

const PerformanceContext = createContext<PerformanceContextValue | null>(null);

export { PerformanceContext };

export function PerformanceProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Report Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
        onCLS((metric) => performanceMonitor.recordMetric('CLS', metric.value));
        onFID((metric) => performanceMonitor.recordMetric('FID', metric.value));
        onFCP((metric) => performanceMonitor.recordMetric('FCP', metric.value));
        onLCP((metric) => performanceMonitor.recordMetric('LCP', metric.value));
        onTTFB((metric) => performanceMonitor.recordMetric('TTFB', metric.value));
      });
    }

    // Track route changes
    const handleRouteChange = () => {
      performanceMonitor.trackInteraction('route_change', {
        category: 'navigation',
      });
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const value: PerformanceContextValue = {
    trackInteraction: performanceMonitor.trackInteraction.bind(performanceMonitor),
    measureAsync: async <T,>(name: string, operation: () => Promise<T>) => {
      return performanceMonitor.trackApiCall(name, operation);
    },
  };

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>;
}

