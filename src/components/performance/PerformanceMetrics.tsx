/**
 * Performance Metrics Display Component
 * Shows real-time performance metrics in development
 */

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/utils/performance-monitoring';
import { cn } from '@/lib/utils';

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;

    const interval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!import.meta.env.DEV) return null;

  const webVitals = ['FCP', 'LCP', 'FID', 'CLS', 'TTFB'];
  const vitals = Object.entries(metrics)
    .filter(([key]) => webVitals.includes(key))
    .sort(([a], [b]) => webVitals.indexOf(a) - webVitals.indexOf(b));

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-mono"
      >
        Perf
      </button>

      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm font-mono text-xs">
          <h3 className="text-sm font-semibold mb-2">Performance Metrics</h3>
          
          {vitals.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs opacity-75 mb-1">Web Vitals</h4>
              {vitals.map(([key, value]) => (
                <div key={key} className="flex justify-between mb-1">
                  <span>{key}:</span>
                  <span className={cn(
                    'ml-2',
                    getVitalColor(key, value)
                  )}>
                    {key === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-xs opacity-75 mb-1">Custom Metrics</h4>
            {Object.entries(metrics)
              .filter(([key]) => !webVitals.includes(key))
              .slice(0, 10)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between mb-1">
                  <span className="truncate mr-2">{key}:</span>
                  <span>{typeof value === 'number' ? Math.round(value) : value}</span>
                </div>
              ))}
          </div>

          <button
            onClick={() => performanceMonitor.clearMetrics()}
            className="mt-2 text-xs opacity-75 hover:opacity-100"
          >
            Clear Metrics
          </button>
        </div>
      )}
    </>
  );
}

function getVitalColor(metric: string, value: number): string {
  const thresholds: Record<string, { good: number; poor: number }> = {
    FCP: { good: 1800, poor: 3000 },
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
  };

  const threshold = thresholds[metric];
  if (!threshold) return '';

  if (value <= threshold.good) return 'text-green-400';
  if (value <= threshold.poor) return 'text-yellow-400';
  return 'text-red-400';
}