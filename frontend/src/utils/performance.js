/**
 * Performance monitoring utilities
 */

/**
 * Performance monitor for tracking component render times
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  /**
   * Start timing a component
   */
  startTiming(componentName) {
    if (!performance?.mark) return;

    const startMark = `${componentName}-start`;
    performance.mark(startMark);

    return {
      end: () => this.endTiming(componentName, startMark),
    };
  }

  /**
   * End timing for a component
   */
  endTiming(componentName, startMark) {
    if (!performance?.mark || !performance?.measure) return;

    const endMark = `${componentName}-end`;
    const measureName = `${componentName}-duration`;

    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    if (measure) {
      this.recordMetric(componentName, measure.duration);
    }

    // Cleanup
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
  }

  /**
   * Record a performance metric
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        total: 0,
        average: 0,
        min: Infinity,
        max: 0,
        values: [],
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.total += value;
    metric.average = metric.total / metric.count;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.values.push(value);

    // Keep only last 100 values
    if (metric.values.length > 100) {
      metric.values.shift();
    }

    // Notify observers
    this.observers.forEach(observer => observer(name, metric));
  }

  /**
   * Get metrics for a component
   */
  getMetrics(componentName) {
    return this.metrics.get(componentName);
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    return Object.fromEntries(this.metrics);
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics
   */
  clear() {
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for component performance monitoring
 */
export function usePerformanceMonitor(componentName) {
  const renderCount = useRef(0);
  const startTime = useRef(null);

  // Track render count
  renderCount.current++;

  useEffect(() => {
    startTime.current = performance.now();

    return () => {
      if (startTime.current) {
        const duration = performance.now() - startTime.current;
        performanceMonitor.recordMetric(`${componentName}-render`, duration);
      }
    };
  });

  return {
    renderCount: renderCount.current,
    startTiming: () => performanceMonitor.startTiming(componentName),
    getMetrics: () => performanceMonitor.getMetrics(componentName),
  };
}

/**
 * Bundle size analyzer
 */
export const BundleAnalyzer = {
  /**
   * Log bundle size information
   */
  logBundleInfo() {
    if (typeof window !== 'undefined' && window.performance) {
      const navEntries = performance.getEntriesByType('navigation');
      const resourceEntries = performance.getEntriesByType('resource');

      console.group('Bundle Analysis');

      if (navEntries.length > 0) {
        const nav = navEntries[0];
        console.log('Page Load Time:', Math.round(nav.loadEventEnd - nav.fetchStart), 'ms');
        console.log('DOM Content Loaded:', Math.round(nav.domContentLoadedEventEnd - nav.fetchStart), 'ms');
      }

      // JavaScript bundles
      const jsResources = resourceEntries.filter(entry =>
        entry.name.includes('.js') && !entry.name.includes('node_modules')
      );

      console.log('JavaScript Resources:');
      jsResources.forEach(resource => {
        console.log(`  ${resource.name.split('/').pop()}: ${Math.round(resource.duration)}ms`);
      });

      // CSS bundles
      const cssResources = resourceEntries.filter(entry => entry.name.includes('.css'));
      console.log('CSS Resources:');
      cssResources.forEach(resource => {
        console.log(`  ${resource.name.split('/').pop()}: ${Math.round(resource.duration)}ms`);
      });

      console.groupEnd();
    }
  },

  /**
   * Get memory usage information
   */
  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(performance.memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576), // MB
      };
    }
    return null;
  },
};

/**
 * Long task detector
 */
export class LongTaskDetector {
  constructor(threshold = 50) {
    this.threshold = threshold;
    this.longTasks = [];
    this.observers = [];
    this.init();
  }

  init() {
    if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordLongTask(entry);
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  recordLongTask(entry) {
    const task = {
      duration: entry.duration,
      startTime: entry.startTime,
      name: entry.name,
      attribution: entry.attribution,
    };

    this.longTasks.push(task);

    // Keep only last 50 long tasks
    if (this.longTasks.length > 50) {
      this.longTasks.shift();
    }

    // Notify observers
    this.observers.forEach(observer => observer(task));

    console.warn(`Long task detected: ${Math.round(entry.duration)}ms`, entry);
  }

  getLongTasks() {
    return this.longTasks;
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
}

// Global long task detector
export const longTaskDetector = new LongTaskDetector();
