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

    performanceMonitor.trackInteraction('component_mount', { component: componentName });

    return () => {
      // Track component unmount and lifetime
      const currentRenderCount = renderCount.current;
      const lifetime = performance.now() - mountTime.current;
      performanceMonitor.recordMetric(`${componentName}_lifetime`, lifetime);
      performanceMonitor.recordMetric(`${componentName}_renders`, currentRenderCount);
    };
  }, [componentName]);

  useEffect(() => {
    // Track renders after mount
    if (renderCount.current > 0) {
      renderCount.current++;
      const cleanup = performanceMonitor.trackComponentRender(componentName);
      cleanup();
    }
  });
}
