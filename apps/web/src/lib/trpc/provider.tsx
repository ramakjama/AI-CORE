'use client';

/**
 * SORIANO MEDIADORES - tRPC Provider
 * Wraps the app with tRPC and React Query providers
 */

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { trpc, createTRPCClient } from './client';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default stale time of 30 seconds
            staleTime: 30 * 1000,
            // Retry failed requests up to 3 times
            retry: 3,
            // Refetch on window focus
            refetchOnWindowFocus: true,
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  const [trpcClient] = useState(() => createTRPCClient());

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
