import { PrismaClient } from '@prisma/client';

export function createClient(url: string): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url },
    },
  });
}