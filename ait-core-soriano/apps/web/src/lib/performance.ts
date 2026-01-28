/**
 * Performance Monitoring and Optimization Utilities
 */

// Web Vitals tracking
export function reportWebVitals(metric: any) {
  if (process.env.NODE_ENV === 'production') {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(metric);
    }

    // Send to analytics
    const body = JSON.stringify(metric);
    const url = '/api/analytics/vitals';

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body);
    } else {
      fetch(url, { body, method: 'POST', keepalive: true }).catch(console.error);
    }
  }
}

// Performance observer for monitoring
export class PerformanceMonitor {
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Monitor Long Tasks (tasks taking > 50ms)
    this.observeLongTasks();

    // Monitor Layout Shifts
    this.observeLayoutShifts();

    // Monitor Resource Loading
    this.observeResources();

    // Monitor Navigation Timing
    this.observeNavigation();
  }

  private observeLongTasks() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long Task detected:', {
            duration: entry.duration,
            startTime: entry.startTime,
          });

          // Send to analytics
          this.sendMetric('long-task', {
            duration: entry.duration,
            startTime: entry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Long Task API not supported');
    }
  }

  private observeLayoutShifts() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).hadRecentInput) continue;

          console.warn('Layout Shift detected:', {
            value: (entry as any).value,
            startTime: entry.startTime,
          });

          this.sendMetric('layout-shift', {
            value: (entry as any).value,
            startTime: entry.startTime,
          });
        }
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Layout Shift API not supported');
    }
  }

  private observeResources() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;

          if (resource.duration > 1000) {
            console.warn('Slow resource detected:', {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
            });

            this.sendMetric('slow-resource', {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
            });
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Resource Timing API not supported');
    }
  }

  private observeNavigation() {
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navigation = entry as PerformanceNavigationTiming;

          console.log('Navigation timing:', {
            dns: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcp: navigation.connectEnd - navigation.connectStart,
            request: navigation.responseStart - navigation.requestStart,
            response: navigation.responseEnd - navigation.responseStart,
            dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            load: navigation.loadEventEnd - navigation.loadEventStart,
          });
        }
      });

      observer.observe({ entryTypes: ['navigation'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('Navigation Timing API not supported');
    }
  }

  private sendMetric(name: string, data: any) {
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/analytics/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data, timestamp: Date.now() }),
        keepalive: true,
      }).catch(console.error);
    }
  }

  disconnect() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Request Idle Callback wrapper
export function requestIdleCallback(callback: IdleRequestCallback, options?: IdleRequestOptions) {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options);
  } else {
    return setTimeout(() => {
      const start = Date.now();
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1);
  }
}

// Cancel Idle Callback wrapper
export function cancelIdleCallback(id: number) {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usedPercent: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
}

// Network information
export function getNetworkInfo() {
  if ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator) {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };
  }
  return null;
}

// Check if user prefers reduced motion
export function prefersReducedMotion() {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
}

// Check if user is on a slow connection
export function isSlowConnection() {
  const networkInfo = getNetworkInfo();
  if (!networkInfo) return false;

  return (
    networkInfo.effectiveType === 'slow-2g' ||
    networkInfo.effectiveType === '2g' ||
    networkInfo.saveData === true
  );
}

// Image loading strategy based on connection
export function getImageLoadingStrategy() {
  if (isSlowConnection()) {
    return {
      quality: 60,
      format: 'webp',
      eager: false,
    };
  }

  return {
    quality: 85,
    format: 'avif',
    eager: false,
  };
}

// Measure function execution time
export function measurePerformance<T>(
  name: string,
  fn: () => T
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();

  console.log(`${name} took ${(end - start).toFixed(2)}ms`);

  return result;
}

// Async function performance measurement
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();

  console.log(`${name} took ${(end - start).toFixed(2)}ms`);

  return result;
}

// Component render time tracking
export function useRenderTime(componentName: string) {
  if (typeof window !== 'undefined') {
    const startTime = performance.now();

    React.useEffect(() => {
      const endTime = performance.now();
      console.log(`${componentName} rendered in ${(endTime - startTime).toFixed(2)}ms`);
    });
  }
}

// Import React for hooks
import React from 'react';

// Initialize performance monitor
let performanceMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitoring() {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

// Cleanup
export function cleanupPerformanceMonitoring() {
  if (performanceMonitor) {
    performanceMonitor.disconnect();
    performanceMonitor = null;
  }
}
