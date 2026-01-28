/**
 * Permission Management
 */

import { authDb } from '@ait-core/database';
import { createLogger } from '@ait-core/shared/logger';
import { AuthorizationError } from '@ait-core/shared/errors';
import { PERMISSION_SCOPES } from '@ait-core/shared/constants';

const logger = createLogger('@ait-core/auth:permissions');

/**
 * Check if user has permission
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const userPermission = await authDb.userPermission.findFirst({
      where: {
        userId,
        permission: {
          name: permission,
        },
      },
    });

    return userPermission !== null;
  } catch (error) {
    logger.error('Failed to check permission', { userId, permission, error });
    return false;
  }
}

/**
 * Check if user has any of the permissions
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
  try {
    const count = await authDb.userPermission.count({
      where: {
        userId,
        permission: {
          name: { in: permissions },
        },
      },
    });

    return count > 0;
  } catch (error) {
    logger.error('Failed to check any permission', { userId, permissions, error });
    return false;
  }
}

/**
 * Check if user has all permissions
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
  try {
    const count = await authDb.userPermission.count({
      where: {
        userId,
        permission: {
          name: { in: permissions },
        },
      },
    });

    return count === permissions.length;
  } catch (error) {
    logger.error('Failed to check all permissions', { userId, permissions, error });
    return false;
  }
}

/**
 * Get user permissions
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  try {
    const userPermissions = await authDb.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    return userPermissions.map((up) => up.permission.name);
  } catch (error) {
    logger.error('Failed to get user permissions', { userId, error });
    return [];
  }
}

/**
 * Grant permission to user
 */
export async function grantPermission(
  userId: string,
  permissionName: string,
  grantedBy: string
): Promise<void> {
  try {
    // Get or create permission
    let permission = await authDb.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      // Parse permission name (format: resource:action)
      const [resource, action] = permissionName.split(':');

      permission = await authDb.permission.create({
        data: {
          name: permissionName,
          resource,
          action,
        },
      });
    }

    // Grant permission to user
    await authDb.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
      create: {
        userId,
        permissionId: permission.id,
        grantedBy,
      },
      update: {
        grantedBy,
      },
    });

    logger.info('Permission granted', { userId, permissionName, grantedBy });
  } catch (error) {
    logger.error('Failed to grant permission', { userId, permissionName, error });
    throw error;
  }
}

/**
 * Revoke permission from user
 */
export async function revokePermission(userId: string, permissionName: string): Promise<void> {
  try {
    const permission = await authDb.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      return;
    }

    await authDb.userPermission.delete({
      where: {
        userId_permissionId: {
          userId,
          permissionId: permission.id,
        },
      },
    });

    logger.info('Permission revoked', { userId, permissionName });
  } catch (error) {
    logger.error('Failed to revoke permission', { userId, permissionName, error });
  }
}

/**
 * Grant multiple permissions
 */
export async function grantPermissions(
  userId: string,
  permissions: string[],
  grantedBy: string
): Promise<void> {
  await Promise.all(permissions.map((p) => grantPermission(userId, p, grantedBy)));
}

/**
 * Revoke all user permissions
 */
export async function revokeAllPermissions(userId: string): Promise<void> {
  try {
    await authDb.userPermission.deleteMany({
      where: { userId },
    });

    logger.info('All permissions revoked', { userId });
  } catch (error) {
    logger.error('Failed to revoke all permissions', { userId, error });
  }
}

/**
 * Require permission (throws if not authorized)
 */
export async function requirePermission(userId: string, permission: string): Promise<void> {
  const hasAccess = await hasPermission(userId, permission);

  if (!hasAccess) {
    throw new AuthorizationError(`Permission required: ${permission}`);
  }
}

/**
 * Require any permission (throws if not authorized)
 */
export async function requireAnyPermission(userId: string, permissions: string[]): Promise<void> {
  const hasAccess = await hasAnyPermission(userId, permissions);

  if (!hasAccess) {
    throw new AuthorizationError(`One of these permissions required: ${permissions.join(', ')}`);
  }
}

/**
 * Require all permissions (throws if not authorized)
 */
export async function requireAllPermissions(userId: string, permissions: string[]): Promise<void> {
  const hasAccess = await hasAllPermissions(userId, permissions);

  if (!hasAccess) {
    throw new AuthorizationError(`All permissions required: ${permissions.join(', ')}`);
  }
}

/**
 * Check resource access
 */
export async function canAccessResource(
  userId: string,
  resource: string,
  action: 'READ' | 'CREATE' | 'UPDATE' | 'DELETE'
): Promise<boolean> {
  const permission = `${resource.toLowerCase()}:${action.toLowerCase()}`;
  return hasPermission(userId, permission);
}

/**
 * Initialize default permissions
 */
export async function initializeDefaultPermissions(): Promise<void> {
  const permissions = Object.entries(PERMISSION_SCOPES).map(([key, value]) => {
    const [resource, action] = value.split(':');
    return {
      name: value,
      resource,
      action,
    };
  });

  for (const permission of permissions) {
    try {
      await authDb.permission.upsert({
        where: { name: permission.name },
        create: permission,
        update: {},
      });
    } catch (error) {
      logger.error('Failed to create permission', { permission, error });
    }
  }

  logger.info('Default permissions initialized', { count: permissions.length });
}
