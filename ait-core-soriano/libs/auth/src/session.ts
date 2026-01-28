/**
 * Session Management
 */

import { randomUUID } from 'crypto';
import { authDb } from '@ait-core/database';
import { createLogger } from '@ait-core/shared/logger';
import { AuthenticationError } from '@ait-core/shared/errors';
import type { Session, SessionData } from './types';

const logger = createLogger('@ait-core/auth:session');

const SESSION_DURATION = parseInt(process.env.SESSION_DURATION || '604800000', 10); // 7 days

/**
 * Create session
 */
export async function createSession(
  userId: string,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<Session> {
  try {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION);

    const session = await authDb.session.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    logger.info('Session created', { userId, sessionId: session.id });

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      createdAt: session.createdAt,
    };
  } catch (error) {
    logger.error('Failed to create session', { userId, error });
    throw new AuthenticationError('Failed to create session');
  }
}

/**
 * Get session by token
 */
export async function getSession(token: string): Promise<Session | null> {
  try {
    const session = await authDb.session.findUnique({
      where: { token },
    });

    if (!session) {
      return null;
    }

    // Check if expired
    if (session.expiresAt < new Date()) {
      await deleteSession(token);
      return null;
    }

    return {
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      createdAt: session.createdAt,
    };
  } catch (error) {
    logger.error('Failed to get session', { error });
    return null;
  }
}

/**
 * Get all user sessions
 */
export async function getUserSessions(userId: string): Promise<Session[]> {
  try {
    const sessions = await authDb.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress || undefined,
      userAgent: session.userAgent || undefined,
      createdAt: session.createdAt,
    }));
  } catch (error) {
    logger.error('Failed to get user sessions', { userId, error });
    return [];
  }
}

/**
 * Delete session
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await authDb.session.delete({
      where: { token },
    });

    logger.info('Session deleted', { token });
  } catch (error) {
    logger.error('Failed to delete session', { token, error });
  }
}

/**
 * Delete all user sessions
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  try {
    await authDb.session.deleteMany({
      where: { userId },
    });

    logger.info('All user sessions deleted', { userId });
  } catch (error) {
    logger.error('Failed to delete user sessions', { userId, error });
  }
}

/**
 * Delete expired sessions (cleanup)
 */
export async function deleteExpiredSessions(): Promise<number> {
  try {
    const result = await authDb.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    logger.info('Expired sessions deleted', { count: result.count });
    return result.count;
  } catch (error) {
    logger.error('Failed to delete expired sessions', { error });
    return 0;
  }
}

/**
 * Refresh session (extend expiration)
 */
export async function refreshSession(token: string): Promise<Session | null> {
  try {
    const session = await getSession(token);

    if (!session) {
      return null;
    }

    const newExpiresAt = new Date(Date.now() + SESSION_DURATION);

    const updated = await authDb.session.update({
      where: { token },
      data: { expiresAt: newExpiresAt },
    });

    logger.info('Session refreshed', { sessionId: updated.id });

    return {
      id: updated.id,
      userId: updated.userId,
      token: updated.token,
      expiresAt: updated.expiresAt,
      ipAddress: updated.ipAddress || undefined,
      userAgent: updated.userAgent || undefined,
      createdAt: updated.createdAt,
    };
  } catch (error) {
    logger.error('Failed to refresh session', { token, error });
    return null;
  }
}

/**
 * Validate session
 */
export async function validateSession(token: string): Promise<SessionData | null> {
  try {
    const session = await getSession(token);

    if (!session) {
      return null;
    }

    // Get user data
    const user = await authDb.user.findUnique({
      where: { id: session.userId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      await deleteSession(token);
      return null;
    }

    const permissions = user.permissions.map((up) => up.permission.name);

    return {
      session,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        permissions,
      },
    };
  } catch (error) {
    logger.error('Failed to validate session', { error });
    return null;
  }
}
