/**
 * @fileoverview Permission-related type definitions for AI-IAM module
 * @module @ai-core/ai-iam/types/permission
 */

/**
 * Permission action types
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage',
  ADMIN = 'admin',
  /** Wildcard - all actions */
  ALL = '*',
}

/**
 * Represents a permission in the system
 */
export interface Permission {
  /** Unique identifier for the permission */
  id: string;
  /** Unique name of the permission (e.g., 'users:read') */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of what this permission allows */
  description: string;
  /** Resource this permission applies to (e.g., 'users', 'documents') */
  resource: string;
  /** Action this permission allows */
  action: PermissionAction | string;
  /** Whether this is a system permission (cannot be deleted) */
  isSystem: boolean;
  /** Whether this permission is active */
  isActive: boolean;
  /** Tenant ID for multi-tenant support (null for global permissions) */
  tenantId: string | null;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new permission
 */
export interface CreatePermissionDTO {
  /** Unique name of the permission */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the permission */
  description: string;
  /** Resource this permission applies to */
  resource: string;
  /** Action this permission allows */
  action: PermissionAction | string;
  /** Tenant ID (null for global) */
  tenantId?: string | null;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating an existing permission
 */
export interface UpdatePermissionDTO {
  /** Updated display name */
  displayName?: string;
  /** Updated description */
  description?: string;
  /** Updated active status */
  isActive?: boolean;
  /** Updated metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Permission check request
 */
export interface PermissionCheckRequest {
  /** User ID to check permissions for */
  userId: string;
  /** Resource to check access to */
  resource: string;
  /** Action being performed */
  action: PermissionAction | string;
  /** Optional specific resource ID */
  resourceId?: string;
  /** Optional additional context */
  context?: Record<string, unknown>;
}

/**
 * Permission check result
 */
export interface PermissionCheckResult {
  /** Whether access is allowed */
  allowed: boolean;
  /** Reason for the decision */
  reason: string;
  /** Permissions that granted access (if allowed) */
  grantingPermissions?: string[];
  /** Required permissions that were missing (if denied) */
  missingPermissions?: string[];
  /** The check request that was evaluated */
  request: PermissionCheckRequest;
  /** Timestamp of the check */
  checkedAt: Date;
}

/**
 * Permission grant request
 */
export interface PermissionGrantDTO {
  /** Permission ID to grant */
  permissionId: string;
  /** Role ID to grant the permission to */
  roleId: string;
}

/**
 * Permission revoke request
 */
export interface PermissionRevokeDTO {
  /** Permission ID to revoke */
  permissionId: string;
  /** Role ID to revoke the permission from */
  roleId: string;
}

/**
 * Creates a permission name from resource and action
 * @param resource - The resource name
 * @param action - The action
 * @returns Formatted permission name
 */
export function createPermissionName(
  resource: string,
  action: PermissionAction | string
): string {
  return `${resource}:${action}`;
}

/**
 * Parses a permission name into resource and action
 * @param permissionName - The permission name to parse
 * @returns Object with resource and action
 */
export function parsePermissionName(permissionName: string): {
  resource: string;
  action: string;
} {
  const parts = permissionName.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid permission name format: ${permissionName}`);
  }
  return {
    resource: parts[0]!,
    action: parts[1]!,
  };
}

/**
 * Checks if a permission matches a pattern (supports wildcards)
 * @param permission - The permission to check
 * @param pattern - The pattern to match against
 * @returns Whether the permission matches the pattern
 */
export function matchesPermissionPattern(
  permission: string,
  pattern: string
): boolean {
  const { resource: permResource, action: permAction } =
    parsePermissionName(permission);
  const { resource: patResource, action: patAction } =
    parsePermissionName(pattern);

  const resourceMatches =
    patResource === '*' ||
    permResource === patResource ||
    patResource.endsWith('*') && permResource.startsWith(patResource.slice(0, -1));

  const actionMatches =
    patAction === '*' ||
    permAction === patAction;

  return resourceMatches && actionMatches;
}
