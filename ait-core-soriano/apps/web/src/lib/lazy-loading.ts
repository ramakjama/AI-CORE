/**
 * Lazy Loading Utilities
 * Dynamic imports and code splitting helpers
 */

import dynamic from 'next/dynamic';
import { ComponentType, LazyExoticComponent } from 'react';

// Loading component
export const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

// Error component
export const LoadingError = ({ error }: { error?: Error }) => (
  <div className="flex items-center justify-center min-h-[200px] text-red-500">
    <div>
      <p className="font-semibold">Failed to load component</p>
      {error && <p className="text-sm mt-2">{error.message}</p>}
    </div>
  </div>
);

// Lazy load component with options
interface LazyLoadOptions {
  loading?: ComponentType;
  error?: ComponentType<{ error?: Error }>;
  ssr?: boolean;
  suspense?: boolean;
}

export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const {
    loading = LoadingSpinner,
    error = LoadingError,
    ssr = false,
    suspense = false,
  } = options;

  return dynamic(importFn, {
    loading,
    ssr,
    suspense,
  });
}

// Lazy load with retry logic
export function lazyLoadWithRetry<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions & { retries?: number } = {}
) {
  const { retries = 3, ...lazyOptions } = options;

  const retry = (fn: () => Promise<any>, retriesLeft = retries, interval = 1000): Promise<any> => {
    return fn().catch((error) => {
      if (retriesLeft === 0) {
        throw error;
      }
      console.warn(`Retrying import... (${retries - retriesLeft + 1}/${retries})`);
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(retry(fn, retriesLeft - 1, interval));
        }, interval);
      });
    });
  };

  return lazyLoad(() => retry(importFn), lazyOptions);
}

// Preload component
export function preloadComponent(importFn: () => Promise<any>) {
  importFn().catch((error) => {
    console.error('Failed to preload component:', error);
  });
}

// Route-based lazy loading
export const LazyDashboard = lazyLoadWithRetry(
  () => import('@/components/dashboard/Dashboard')
);

export const LazyPolicies = lazyLoadWithRetry(
  () => import('@/components/policies/PoliciesView')
);

export const LazyClaims = lazyLoadWithRetry(
  () => import('@/components/claims/ClaimsView')
);

export const LazyCustomers = lazyLoadWithRetry(
  () => import('@/components/customers/CustomersView')
);

export const LazyReports = lazyLoadWithRetry(
  () => import('@/components/reports/ReportsView')
);

export const LazySettings = lazyLoadWithRetry(
  () => import('@/components/settings/SettingsView')
);

// Heavy component lazy loading
export const LazyCharts = lazyLoadWithRetry(
  () => import('@/components/charts/ChartsLibrary'),
  { ssr: false }
);

export const LazyPDFViewer = lazyLoadWithRetry(
  () => import('@/components/pdf/PDFViewer'),
  { ssr: false }
);

export const LazyCodeEditor = lazyLoadWithRetry(
  () => import('@/components/editor/CodeEditor'),
  { ssr: false }
);

export const LazyMarkdownEditor = lazyLoadWithRetry(
  () => import('@/components/editor/MarkdownEditor'),
  { ssr: false }
);

// Lazy load with intersection observer (for images, components below fold)
export function useLazyLoadOnView(
  ref: React.RefObject<Element>,
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const [hasLoaded, setHasLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!ref.current || hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoaded) {
            callback();
            setHasLoaded(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
        ...options,
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, hasLoaded, options]);

  return hasLoaded;
}

// Lazy image component
import React from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 85,
}) => {
  const [isLoaded, setIsLoaded] = React.useState(false);

  return (
    <div className={`relative ${className || ''}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        quality={quality}
        loading={priority ? 'eager' : 'lazy'}
        onLoadingComplete={() => setIsLoaded(true)}
        placeholder="blur"
        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
      />
    </div>
  );
};

// Route prefetching
export function prefetchRoute(href: string) {
  if (typeof window !== 'undefined') {
    const router = require('next/router').default;
    router.prefetch(href);
  }
}

// Script lazy loading
export function loadScript(src: string, async = true, defer = true): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = async;
    script.defer = defer;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

// CSS lazy loading
export function loadStylesheet(href: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet: ${href}`));
    document.head.appendChild(link);
  });
}

// Module preloading
export function preloadModule(href: string) {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = href;
    document.head.appendChild(link);
  }
}

// Font preloading
export function preloadFont(href: string, type = 'font/woff2') {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  }
}
