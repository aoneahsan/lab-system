import { lazy, ComponentType, LazyExoticComponent } from 'react';

/**
 * Enhanced lazy loading with retry logic
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
): LazyExoticComponent<T> {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await importFn();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(callback: () => void, options?: IdleRequestOptions): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers that don't support requestIdleCallback
  const timeout = options?.timeout || 1;
  return (window as any).setTimeout(callback, timeout) as unknown as number;
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    (window as any).clearTimeout(id);
  }
}

/**
 * Intersection Observer factory for lazy loading
 */
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
): IntersectionObserver | null {
  if ('IntersectionObserver' in window) {
    return new IntersectionObserver(callback, {
      root: null,
      rootMargin: '50px',
      threshold: 0.01,
      ...options,
    });
  }
  return null;
}

/**
 * Preload critical resources
 */
export function preloadResource(href: string, as: string): void {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = as;
  link.href = href;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

/**
 * Prefetch route for faster navigation
 */
export function prefetchRoute(path: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Memory-efficient memoization
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const cacheKeys: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    cacheKeys.push(key);

    // Implement LRU cache eviction
    if (cacheKeys.length > maxCacheSize) {
      const oldestKey = cacheKeys.shift()!;
      cache.delete(oldestKey);
    }

    return result;
  }) as T;
}

/**
 * Web Worker manager for heavy computations
 */
export class WorkerManager {
  private workers: Map<string, Worker> = new Map();

  createWorker(name: string, scriptUrl: string): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker(scriptUrl);
    this.workers.set(name, worker);
    return worker;
  }

  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  terminateAll(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers.clear();
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`No mark found with name: ${startMark}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    
    if ('performance' in window && 'measure' in window.performance) {
      try {
        performance.measure(name, startMark);
      } catch (_e) {
        // Ignore if mark doesn't exist
      }
    }

    return duration;
  }

  getMetrics(): PerformanceNavigationTiming | null {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return navigation || null;
  }

  reportVitals(callback: (metric: any) => void): void {
    // Report Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        callback({ name: 'LCP', value: lastEntry.startTime });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          callback({ name: 'FID', value: entry.processingStart - entry.startTime });
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      let clsEntries: any[] = [];
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as any) {
          if (!entry.hadRecentInput) {
            const firstSessionEntry = clsEntries[0];
            const lastSessionEntry = clsEntries[clsEntries.length - 1];

            if (entry.startTime - lastSessionEntry.startTime < 1000 &&
                entry.startTime - firstSessionEntry.startTime < 5000) {
              clsValue += entry.value;
              clsEntries.push(entry);
            } else {
              clsValue = entry.value;
              clsEntries = [entry];
            }
          }
        }
        callback({ name: 'CLS', value: clsValue });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }
}