// =============================================================================
// @ait-core/database - Barrel Exports
// =============================================================================
// This file exports all Prisma types and utilities for the consolidated schema.
// Import from '@ait-core/database' instead of '@prisma/client' directly.
// =============================================================================

// Re-export everything from Prisma Client
export * from '@prisma/client';
export { PrismaClient, Prisma } from '@prisma/client';

// =============================================================================
// COMMON TYPES WITH RELATIONS
// =============================================================================

import { Prisma } from '@prisma/client';

// User with common relations
export type UserWithAuth = Prisma.UserGetPayload<{
  include: {
    accounts: true;
    sessions: true;
    profile: true;
  };
}>;

export type UserWithPolicies = Prisma.UserGetPayload<{
  include: {
    policies: {
      include: {
        coverageItems: true;
        claims: true;
      };
    };
  };
}>;

export type UserWithGamification = Prisma.UserGetPayload<{
  include: {
    wallets: true;
    badges: {
      include: {
        badge: true;
      };
    };
    pointsHistory: true;
    streak: true;
  };
}>;

export type UserComplete = Prisma.UserGetPayload<{
  include: {
    accounts: true;
    sessions: true;
    profile: true;
    policies: {
      include: {
        coverageItems: true;
        claims: true;
      };
    };
    wallets: true;
    notifications: true;
  };
}>;

// Policy with common relations
export type PolicyWithDetails = Prisma.PolicyGetPayload<{
  include: {
    user: true;
    coverageItems: true;
    endorsements: true;
    claims: true;
    documents: true;
    payments: true;
  };
}>;

export type PolicyWithCoverages = Prisma.PolicyGetPayload<{
  include: {
    coverageItems: true;
  };
}>;

// Claim with common relations
export type ClaimWithDetails = Prisma.ClaimGetPayload<{
  include: {
    user: true;
    policy: {
      include: {
        user: true;
      };
    };
    claimDocuments: true;
    claimTimeline: true;
    adjustments: true;
  };
}>;

// Invoice with common relations
export type InvoiceWithDetails = Prisma.InvoiceGetPayload<{
  include: {
    customer: true;
    items: true;
    payments: true;
  };
}>;

// Customer with common relations
export type CustomerWithDetails = Prisma.CustomerGetPayload<{
  include: {
    addresses: true;
    contacts: true;
    notes: true;
    invoices: {
      include: {
        items: true;
        payments: true;
      };
    };
  };
}>;

// Gamification types
export type UserWithWallets = Prisma.UserGetPayload<{
  include: {
    wallets: true;
    ledgerEntries: {
      orderBy: {
        createdAt: 'desc';
      };
      take: 50;
    };
  };
}>;

export type QuizAttemptWithDetails = Prisma.QuizAttemptGetPayload<{
  include: {
    user: true;
    dailyQuiz: true;
  };
}>;

// AI & Proactivity types
export type ConversationWithMessages = Prisma.ConversationMemoryGetPayload<{
  include: {
    user: true;
    messages: {
      orderBy: {
        createdAt: 'desc';
      };
      take: 100;
    };
  };
}>;

// =============================================================================
// DATABASE CLIENT FACTORY
// =============================================================================

let cachedPrisma: PrismaClient | null = null;

export function getDatabaseClient(): PrismaClient {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });

  // Enable query logging in development
  if (process.env.NODE_ENV === 'development') {
    prisma.$on('query' as never, (e: unknown) => {
      console.log('Query: ' + (e as { query: string }).query);
      console.log('Duration: ' + (e as { duration: number }).duration + 'ms');
    });
  }

  cachedPrisma = prisma;
  return prisma;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Safely disconnect from database
 */
export async function disconnectDatabase() {
  if (cachedPrisma) {
    await cachedPrisma.$disconnect();
    cachedPrisma = null;
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const prisma = getDatabaseClient();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Get database connection info
 */
export function getDatabaseInfo() {
  return {
    url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ':***@'), // Hide password
    provider: 'postgresql',
    version: '15.x',
  };
}

// =============================================================================
// TRANSACTION HELPERS
// =============================================================================

/**
 * Execute multiple operations in a transaction
 */
export async function executeTransaction<T>(
  operations: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getDatabaseClient();
  return prisma.$transaction(async (tx) => {
    return operations(tx as PrismaClient);
  });
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Paginate results
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export async function paginate<T>(
  model: { findMany: (args: unknown) => Promise<T[]>; count: (args?: unknown) => Promise<number> },
  args: Record<string, unknown> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = options.page || 1;
  const pageSize = options.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const [data, total] = await Promise.all([
    model.findMany({
      ...args,
      skip,
      take: pageSize,
    }),
    model.count(args.where ? { where: args.where } : undefined),
  ]);

  return {
    data,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default getDatabaseClient;
