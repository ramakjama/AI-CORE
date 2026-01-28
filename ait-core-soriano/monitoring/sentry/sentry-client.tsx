/**
 * Sentry Integration for React/Next.js Applications
 *
 * This module provides Sentry configuration for client-side error tracking
 */

import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

interface SentryClientConfig {
  dsn: string;
  environment: string;
  release?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
}

/**
 * Initialize Sentry for React/Next.js applications
 */
export function initSentryClient(config: SentryClientConfig): void {
  Sentry.init({
    dsn: config.dsn || process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: config.environment || process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    release: config.release || process.env.NEXT_PUBLIC_APP_VERSION,

    // Performance monitoring
    integrations: [
      new BrowserTracing({
        tracePropagationTargets: [
          'localhost',
          /^https:\/\/.*\.ait-core\.soriano\.com/,
        ],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate || 0.1, // 10% of transactions

    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate || 0.1, // 10% of sessions
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate || 1.0, // 100% of sessions with errors

    // Error filtering
    beforeSend: (event, hint) => {
      // Don't send errors in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Sentry Error:', hint.originalException || hint.syntheticException);
        return null;
      }

      // Filter out specific errors
      const error = hint.originalException as Error;
      if (error && error.message) {
        // Ignore network errors
        if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
          return null;
        }

        // Ignore cancelled requests
        if (error.message.includes('AbortError') || error.message.includes('cancelled')) {
          return null;
        }
      }

      return event;
    },

    // Ignore specific errors
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      /Loading chunk [\d]+ failed/,
      /^cancelled$/,
    ],

    // Sample rate for error events
    sampleRate: 1.0, // 100% of errors
  });
}

/**
 * Error Boundary component for React
 */
export const SentryErrorBoundary = Sentry.ErrorBoundary;

/**
 * Hook to track route changes in Next.js
 */
export function useSentryRouteTracing(): void {
  const router = useRouter();

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      Sentry.setContext('route', {
        path: url,
        query: router.query,
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
}

/**
 * Capture exception with additional context
 */
export function captureClientException(
  error: Error,
  context?: {
    user?: { id: string; email?: string; username?: string };
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): string {
  Sentry.withScope((scope) => {
    if (context?.user) {
      scope.setUser(context.user);
    }

    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    Sentry.captureException(error);
  });

  return Sentry.lastEventId();
}

/**
 * Capture user feedback
 */
export function captureFeedback(
  message: string,
  metadata?: {
    name?: string;
    email?: string;
    [key: string]: any;
  }
): void {
  const eventId = Sentry.lastEventId();

  if (eventId) {
    Sentry.captureFeedback({
      message,
      name: metadata?.name,
      email: metadata?.email,
      associatedEventId: eventId,
    });
  }
}

/**
 * Show user feedback dialog
 */
export function showReportDialog(): void {
  const eventId = Sentry.lastEventId();

  if (eventId) {
    Sentry.showReportDialog({
      eventId,
      title: 'It looks like we\'re having issues.',
      subtitle: 'Our team has been notified.',
      subtitle2: 'If you\'d like to help, tell us what happened below.',
      labelName: 'Name',
      labelEmail: 'Email',
      labelComments: 'What happened?',
      labelSubmit: 'Submit',
      errorGeneric: 'An unknown error occurred while submitting your report. Please try again.',
      successMessage: 'Your feedback has been sent. Thank you!',
    });
  }
}

/**
 * Set user context
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  [key: string]: any;
}): void {
  Sentry.setUser(user);
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Higher-order component to wrap components with Sentry error boundary
 */
export function withSentryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactElement | ((props: { error: Error; componentStack: string; resetError: () => void }) => React.ReactElement)
): React.ComponentType<P> {
  return (props: P) => (
    <Sentry.ErrorBoundary
      fallback={fallback}
      showDialog
      beforeCapture={(scope) => {
        scope.setTag('component', Component.displayName || Component.name);
      }}
    >
      <Component {...props} />
    </Sentry.ErrorBoundary>
  );
}

export default {
  init: initSentryClient,
  ErrorBoundary: SentryErrorBoundary,
  useRouteTracing: useSentryRouteTracing,
  captureException: captureClientException,
  captureFeedback,
  showReportDialog,
  setUser: setSentryUser,
  clearUser: clearSentryUser,
  addBreadcrumb: addSentryBreadcrumb,
  withErrorBoundary: withSentryErrorBoundary,
};
