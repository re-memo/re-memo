import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/usePerformance';

/**
 * Virtual list component for rendering large lists efficiently
 */
export function VirtualList({ 
  items, 
  renderItem, 
  itemHeight = 100, 
  containerHeight = 400,
  overscan = 5,
  className = '',
  loading = false,
  LoadingComponent = null
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + overscan, items.length);
    const adjustedStart = Math.max(0, start - overscan);

    return {
      start: adjustedStart,
      end,
      visibleItems: items.slice(adjustedStart, end)
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items]);

  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };

  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  if (loading && LoadingComponent) {
    return <LoadingComponent />;
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleRange.visibleItems.map((item, index) => (
            <div key={item.id || visibleRange.start + index} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy loaded item component
 */
export function LazyItem({ children, threshold = 0.1, rootMargin = '50px' }) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, inView] = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      setIsVisible(true);
    }
  }, [inView]);

  return (
    <div ref={ref}>
      {isVisible ? children : <div className="h-full bg-muted animate-pulse" />}
    </div>
  );
}

/**
 * Infinite scroll hook
 */
export function useInfiniteScroll(loadMore, hasMore = true, threshold = 1.0) {
  const [isFetching, setIsFetching] = useState(false);
  const [ref, inView] = useIntersectionObserver({ threshold });

  useEffect(() => {
    if (inView && hasMore && !isFetching) {
      setIsFetching(true);
      loadMore().finally(() => setIsFetching(false));
    }
  }, [inView, hasMore, isFetching, loadMore]);

  return [ref, isFetching];
}
