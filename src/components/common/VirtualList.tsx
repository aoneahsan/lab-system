import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { throttle } from '@/utils/performance';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number | ((index: number) => number);
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export const VirtualList = memo(<T,>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
  onScroll,
  getItemKey = (_, index) => index,
}: VirtualListProps<T>) => {
  const scrollElementRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Calculate item heights
  const getItemOffset = useCallback((index: number): number => {
    if (typeof itemHeight === 'number') {
      return index * itemHeight;
    }
    
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += itemHeight(i);
    }
    return offset;
  }, [itemHeight]);

  const getItemHeight = useCallback((index: number): number => {
    return typeof itemHeight === 'number' ? itemHeight : itemHeight(index);
  }, [itemHeight]);

  // Calculate visible range
  const calculateVisibleRange = useCallback(() => {
    const startIndex = Math.floor(
      scrollTop / (typeof itemHeight === 'number' ? itemHeight : getItemHeight(0))
    );
    const endIndex = Math.ceil(
      (scrollTop + height) / (typeof itemHeight === 'number' ? itemHeight : getItemHeight(0))
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, height, itemHeight, getItemHeight, overscan, items.length]);

  const { start, end } = calculateVisibleRange();

  // Calculate total height
  const totalHeight = typeof itemHeight === 'number'
    ? items.length * itemHeight
    : items.reduce((acc, _, index) => acc + getItemHeight(index), 0);

  // Handle scroll with throttling
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    onScroll?.(newScrollTop);

    // Reset scrolling state after scroll ends
    setTimeout(() => setIsScrolling(false), 150);
  }, [onScroll]);

  // Throttle the scroll handler
  const throttledHandleScroll = useCallback(
    () => throttle(handleScroll, 16), // ~60fps
    [handleScroll]
  );

  // Render visible items
  const visibleItems = [];
  for (let i = start; i <= end; i++) {
    const item = items[i];
    if (!item) continue;

    const key = getItemKey(item, i);
    const offset = getItemOffset(i);
    const height = getItemHeight(i);

    visibleItems.push(
      <div
        key={key}
        style={{
          position: 'absolute',
          top: offset,
          left: 0,
          right: 0,
          height,
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }

  // Scroll to item method
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    // Expose scroll to item method
    (scrollElement as any).scrollToItem = (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      const itemOffset = getItemOffset(index);
      const itemHeight = getItemHeight(index);

      let scrollOffset = itemOffset;
      if (align === 'center') {
        scrollOffset = itemOffset - (height - itemHeight) / 2;
      } else if (align === 'end') {
        scrollOffset = itemOffset - height + itemHeight;
      }

      scrollElement.scrollTop = Math.max(0, Math.min(scrollOffset, totalHeight - height));
    };
  }, [getItemOffset, getItemHeight, height, totalHeight]);

  return (
    <div
      ref={scrollElementRef}
      className={`relative overflow-auto ${className}`}
      style={{ height }}
      onScroll={throttledHandleScroll}
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative',
          pointerEvents: isScrolling ? 'none' : 'auto',
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
});

VirtualList.displayName = 'VirtualList';