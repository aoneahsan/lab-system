/**
 * React hook for observing component performance
 */

import { useEffect, useRef } from 'react';
import { performanceMonitor } from '@/utils/performance-monitoring';

export function usePerformanceObserver(componentName: string) {
  const renderCount = useRef(0);
  const mountTime = useRef<number>(0);

  useEffect(() => {
    // Track component mount
    mountTime.current = performance.now();
    renderCount.current++;

    performanceMonitor.trackInteraction('component_mount', componentName);

    return () => {
      // Track component unmount and lifetime
      const lifetime = performance.now() - mountTime.current;
      performanceMonitor.recordMetric(`${componentName}_lifetime`, lifetime);
      performanceMonitor.recordMetric(`${componentName}_renders`, renderCount.current);
    };
  }, [componentName]);

  useEffect(() => {
    // Track renders after mount
    if (renderCount.current > 0) {
      renderCount.current++;
      performanceMonitor.trackComponentRender(componentName, performance.now() - mountTime.current);
    }
  });
}
