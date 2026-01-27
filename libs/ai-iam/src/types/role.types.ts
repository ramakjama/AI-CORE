/**
 * @fileoverview Role-related type definitions for AI-IAM module
 * @module @ai-core/ai-iam/types/role
 */

/**
 * Represents a role in the RBAC system
 */
export interface Role {
  /** Unique identifier for the role */
  id: string;
  /** Unique name of the role */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the role's purpose */
  description: string;
  /** Array of permission IDs granted to this role */
  permissionIds: string[];
  /** Whether this is a system role (cannot be deleted) */
  isSystem: boolean;
  /** Whether this role is active */
  isActive: boolean;
  /** Parent role ID for role hierarchy */
  parentRoleId?: string;
  /** Priority/weight of the role (higher = more important) */
  priority: number;
  /** Tenant ID for multi-tenant support */
  tenantId: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Creation timestamp */
  createdAt: Date;
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * DTO for creating a new role
 */
export interface CreateRoleDTO {
  /** Unique name of the role */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Description of the role's purpose */
  description: string;
  /** Array of permission IDs to grant */
  permissionIds?: string[];
  /** Parent role ID for hierarchy */
  parentRoleId?: string;
  /** Priority/weight of the role */
  priority?: number;
  /** Tenant ID */
  tenantId: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * DTO for updating an existing role
 */
export interface UpdateRoleDTO {
  /** Updated display name */
  displayName?: string;
  /** Updated description */
  description?: string;
  /** Updated permission IDs */
  permissionIds?: string[];
  /** Updated parent role ID */
  parentRoleId?: string | null;
  /** Updated priority */
  priority?: number;
  /** Updated active status */
  isActive?: boolean;
  /** Updated metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Role with resolved permissions (for authorization checks)
 */
export interface RoleWithPermissions extends Role {
  /** Resolved permission objects */
  permissions: Permission[];
  /** Inherited permissions from parent roles */
  inheritedPermissions: Permission[];
  /** All effective permissions (direct + inherited) */
  effectivePermissions: Permission[];
}

/**
 * Role assignment to a user
 */
export interface RoleAssignment {
  /** Unique identifier */
  id: string;
  /** User ID */
  userId: string;
  /** Role ID */
  roleId: string;
  /** When the assignment was created */
  assignedAt: Date;
  /** Who assigned the role */
  assignedBy: string;
  /** Optional expiration date */
  expiresAt?: Date;
  /** Whether the assignment is active */
  isActive: boolean;
  /** Tenant ID */
  tenantId: string;
}

/**
 * DTO for assigning a role to a user
 */
export interface AssignRoleDTO {
  /** User ID to assign the role to */
  userId: string;
  /** Role ID to assign */
  roleId: string;
  /** Optional expiration date */
  expiresAt?: Date;
}

/**
 * DTO for revoking a role from a user
 */
export interface RevokeRoleDTO {
  /** User ID to revoke the role from */
  userId: string;
  /** Role ID to revoke */
  roleId: string;
}

// Import Permission type for RoleWithPermissions
import { Permission } from './permission.types';
