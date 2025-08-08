// Advanced performance optimization utilities

import { lazy, ComponentType } from 'react';

// Route-based code splitting helper
export const lazyLoadRoute = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) => lazy(importFunc);

// Batch DOM updates
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Intersection Observer for lazy loading
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) => {
  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  });
};

// Request Idle Callback wrapper
export const whenIdle = (callback: () => void, timeout = 2000) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback, { timeout });
  } else {
    setTimeout(callback, 16);
  }
};

// Memory-efficient data chunking
export const processInChunks = async <T, R>(
  data: T[],
  chunkSize: number,
  processor: (chunk: T[]) => R | Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    const result = await processor(chunk);
    results.push(result);
    
    // Yield to main thread
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  return results;
};

// Cache with TTL
export class TTLCache<K, V> {
  private cache = new Map<K, { value: V; expiry: number }>();
  
  constructor(private ttl: number = 60000) {} // Default 1 minute
  
  set(key: K, value: V, customTTL?: number) {
    const expiry = Date.now() + (customTTL || this.ttl);
    this.cache.set(key, { value, expiry });
  }
  
  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  clear() {
    this.cache.clear();
  }
  
  // Clean expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

// Optimized deep equality check
export const areEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => areEqual(a[key], b[key]));
  }
  
  return false;
};

// Web Worker pool for heavy computations
export class WorkerPool {
  private workers: Worker[] = [];
  private queue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  
  constructor(
    private workerScript: string,
    private poolSize: number = navigator.hardwareConcurrency || 4
  ) {
    this.initWorkers();
  }
  
  private initWorkers() {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = new Worker(this.workerScript);
      worker.onmessage = this.handleWorkerMessage.bind(this, i);
      this.workers.push(worker);
    }
  }
  
  private handleWorkerMessage(workerIndex: number, event: MessageEvent) {
    const { resolve } = this.queue.shift() || {};
    if (resolve) {
      resolve(event.data);
    }
    
    // Process next task if available
    if (this.queue.length > 0) {
      const nextTask = this.queue[0];
      this.workers[workerIndex].postMessage(nextTask.data);
    }
  }
  
  async process(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const availableWorker = this.workers.find((_, index) => 
        !this.queue.some(task => task.data._workerIndex === index)
      );
      
      if (availableWorker) {
        const workerIndex = this.workers.indexOf(availableWorker);
        availableWorker.postMessage({ ...data, _workerIndex: workerIndex });
        this.queue.push({ data, resolve, reject });
      } else {
        // Queue the task
        this.queue.push({ data, resolve, reject });
      }
    });
  }
  
  terminate() {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.queue = [];
  }
}