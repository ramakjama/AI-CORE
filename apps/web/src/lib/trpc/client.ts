/**
 * SORIANO MEDIADORES - tRPC Client
 * Client-side tRPC setup with React Query integration
 */

import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, loggerLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '@/server/trpc/routers';

// Create the tRPC React hooks
export const trpc = createTRPCReact<AppRouter>();

// Get the base URL for API calls
function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  // SSR should use localhost
  return `http://localhost:${process.env.PORT ?? 2000}`;
}

// Create tRPC client
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      // Log in development
      loggerLink({
        enabled: (opts) =>
          process.env.NODE_ENV === 'development' ||
          (opts.direction === 'down' && opts.result instanceof Error),
      }),
      // Batch HTTP requests
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: superjson,
        // Add auth headers
        headers() {
          return {
            // Add authorization header if token exists
            ...(typeof window !== 'undefined' && localStorage.getItem('token')
              ? { authorization: `Bearer ${localStorage.getItem('token')}` }
              : {}),
          };
        },
      }),
    ],
  });
}

// Export types
export type { AppRouter };
