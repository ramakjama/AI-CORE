/**
 * SORIANO MEDIADORES - AI-CORE ERP
 * tRPC Server Setup
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';

// ============================================
// CONTEXT TYPE
// ============================================

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SUPERVISOR' | 'AGENT' | 'ASSISTANT' | 'VIEWER' | 'EXTERNAL';
  tenantId: string;
  permissions: string[];
}

interface Session {
  user: User | null;
  token: string | null;
  expiresAt: Date | null;
}

export interface Context {
  session: Session | null;
  user: User | null;
  tenantId: string;
  req?: Request;
}

// ============================================
// CREATE CONTEXT
// ============================================

export async function createContext(opts?: CreateNextContextOptions): Promise<Context> {
  // Get session from cookies/headers
  const session = await getSessionFromRequest(opts?.req);

  return {
    session,
    user: session?.user ?? null,
    tenantId: session?.user?.tenantId ?? 'default',
    req: opts?.req,
  };
}

async function getSessionFromRequest(req?: Request): Promise<Session | null> {
  // TODO: Implement real session validation
  // For now, return dev session if DEV_DISABLE_AUTH is true
  if (process.env.DEV_DISABLE_AUTH === 'true') {
    return {
      user: {
        id: 'dev-user-001',
        email: 'admin@soriano.es',
        firstName: 'Admin',
        lastName: 'Soriano',
        role: 'SUPER_ADMIN',
        tenantId: 'soriano-mediadores',
        permissions: ['*'],
      },
      token: 'dev-token',
      expiresAt: new Date(Date.now() + 86400000),
    };
  }

  // Try to get token from Authorization header
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // TODO: Validate JWT and get user
      return null;
    }
  }

  return null;
}

// ============================================
// TRPC INITIALIZATION
// ============================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Check if user is authenticated
 */
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
  }
  return next({
    ctx: {
      session: ctx.session,
      user: ctx.session.user,
      tenantId: ctx.session.user.tenantId,
    },
  });
});

/**
 * Check if user has required role
 */
const hasRole = (allowedRoles: User['role'][]) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
    }
    if (!allowedRoles.includes(ctx.session.user.role)) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No tiene permisos para esta acción' });
    }
    return next({
      ctx: {
        session: ctx.session,
        user: ctx.session.user,
        tenantId: ctx.session.user.tenantId,
      },
    });
  });

/**
 * Check if user has required permission
 */
const hasPermission = (permission: string) =>
  t.middleware(({ ctx, next }) => {
    if (!ctx.session?.user) {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No autenticado' });
    }
    const hasAccess =
      ctx.session.user.permissions.includes('*') ||
      ctx.session.user.permissions.includes(permission);
    if (!hasAccess) {
      throw new TRPCError({ code: 'FORBIDDEN', message: `Permiso requerido: ${permission}` });
    }
    return next({
      ctx: {
        session: ctx.session,
        user: ctx.session.user,
        tenantId: ctx.session.user.tenantId,
      },
    });
  });

/**
 * Logging middleware
 */
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);

  return result;
});

// ============================================
// EXPORTS
// ============================================

export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);
export const protectedProcedure = t.procedure.use(loggerMiddleware).use(isAuthed);
export const adminProcedure = t.procedure.use(loggerMiddleware).use(hasRole(['SUPER_ADMIN', 'ADMIN']));
export const managerProcedure = t.procedure.use(loggerMiddleware).use(hasRole(['SUPER_ADMIN', 'ADMIN', 'MANAGER']));

// Export middleware factories
export const withPermission = (permission: string) =>
  t.procedure.use(loggerMiddleware).use(hasPermission(permission));

export const mergeRouters = t.mergeRouters;
export const createCallerFactory = t.createCallerFactory;
