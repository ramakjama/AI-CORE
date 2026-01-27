/**
 * SORIANO MEDIADORES - tRPC API Route Handler
 * Next.js App Router API endpoint for tRPC
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/trpc/routers';
import { createContext } from '@/server/trpc/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createContext(),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
