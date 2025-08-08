import { useRef, useEffect, useCallback } from 'react';

// Hook for dynamic height items
export function useDynamicItemHeight<T>(
  items: T[],
  estimatedHeight: number = 50
) {
  const heightsMap = useRef<Map<number, number>>(new Map());
  const observer = useRef<ResizeObserver>();

  useEffect(() => {
    observer.current = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        const index = parseInt(entry.target.getAttribute('data-index') || '0');
        heightsMap.current.set(index, entry.contentRect.height);
      });
    });

    return () => {
      observer.current?.disconnect();
    };
  }, []);

  const getItemHeight = useCallback((index: number) => {
    return heightsMap.current.get(index) || estimatedHeight;
  }, [estimatedHeight]);

  const measureItem = useCallback((element: HTMLElement | null, index: number) => {
    if (element && observer.current) {
      element.setAttribute('data-index', index.toString());
      observer.current.observe(element);
    }
  }, []);

  return { getItemHeight, measureItem };
}