/**
 * Role-Based Access Control (RBAC)
 */

import { USER_ROLES, PERMISSION_SCOPES } from '@ait-core/shared/constants';
import { grantPermissions, revokeAllPermissions } from './permissions';
import { createLogger } from '@ait-core/shared/logger';

const logger = createLogger('@ait-core/auth:rbac');

/**
 * Role permission mapping
 */
const ROLE_PERMISSIONS: Record<string, string[]> = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSION_SCOPES),

  [USER_ROLES.ADMIN]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.POLICY_CREATE,
    PERMISSION_SCOPES.POLICY_UPDATE,
    PERMISSION_SCOPES.CLAIM_READ,
    PERMISSION_SCOPES.CLAIM_CREATE,
    PERMISSION_SCOPES.CLAIM_UPDATE,
    PERMISSION_SCOPES.CUSTOMER_READ,
    PERMISSION_SCOPES.CUSTOMER_CREATE,
    PERMISSION_SCOPES.CUSTOMER_UPDATE,
    PERMISSION_SCOPES.FINANCE_READ,
    PERMISSION_SCOPES.REPORT_READ,
    PERMISSION_SCOPES.REPORT_CREATE,
    PERMISSION_SCOPES.AUDIT_READ,
  ],

  [USER_ROLES.MANAGER]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.POLICY_CREATE,
    PERMISSION_SCOPES.POLICY_UPDATE,
    PERMISSION_SCOPES.CLAIM_READ,
    PERMISSION_SCOPES.CLAIM_CREATE,
    PERMISSION_SCOPES.CLAIM_UPDATE,
    PERMISSION_SCOPES.CLAIM_APPROVE,
    PERMISSION_SCOPES.CUSTOMER_READ,
    PERMISSION_SCOPES.CUSTOMER_CREATE,
    PERMISSION_SCOPES.CUSTOMER_UPDATE,
    PERMISSION_SCOPES.FINANCE_READ,
    PERMISSION_SCOPES.REPORT_READ,
  ],

  [USER_ROLES.AGENT]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.POLICY_CREATE,
    PERMISSION_SCOPES.CLAIM_READ,
    PERMISSION_SCOPES.CLAIM_CREATE,
    PERMISSION_SCOPES.CUSTOMER_READ,
    PERMISSION_SCOPES.CUSTOMER_CREATE,
    PERMISSION_SCOPES.CUSTOMER_UPDATE,
    PERMISSION_SCOPES.REPORT_READ,
  ],

  [USER_ROLES.UNDERWRITER]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.POLICY_CREATE,
    PERMISSION_SCOPES.POLICY_UPDATE,
    PERMISSION_SCOPES.CUSTOMER_READ,
  ],

  [USER_ROLES.CLAIMS_ADJUSTER]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.CLAIM_READ,
    PERMISSION_SCOPES.CLAIM_UPDATE,
    PERMISSION_SCOPES.CLAIM_APPROVE,
    PERMISSION_SCOPES.CUSTOMER_READ,
  ],

  [USER_ROLES.ACCOUNTANT]: [
    PERMISSION_SCOPES.FINANCE_READ,
    PERMISSION_SCOPES.FINANCE_MANAGE,
    PERMISSION_SCOPES.REPORT_READ,
    PERMISSION_SCOPES.REPORT_CREATE,
  ],

  [USER_ROLES.AUDITOR]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.CLAIM_READ,
    PERMISSION_SCOPES.CUSTOMER_READ,
    PERMISSION_SCOPES.FINANCE_READ,
    PERMISSION_SCOPES.REPORT_READ,
    PERMISSION_SCOPES.AUDIT_READ,
  ],

  [USER_ROLES.CUSTOMER]: [
    PERMISSION_SCOPES.POLICY_READ,
    PERMISSION_SCOPES.CLAIM_READ,
    PERMISSION_SCOPES.CLAIM_CREATE,
  ],
};

/**
 * Get permissions for role
 */
export function getRolePermissions(role: string): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role has permission
 */
export function roleHasPermission(role: string, permission: string): boolean {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Assign role to user (grants all role permissions)
 */
export async function assignRole(userId: string, role: string, assignedBy: string): Promise<void> {
  try {
    const permissions = getRolePermissions(role);

    if (permissions.length === 0) {
      logger.warn('No permissions found for role', { role });
      return;
    }

    await grantPermissions(userId, permissions, assignedBy);

    logger.info('Role assigned', { userId, role, permissionsCount: permissions.length });
  } catch (error) {
    logger.error('Failed to assign role', { userId, role, error });
    throw error;
  }
}

/**
 * Remove role from user (revokes all permissions)
 */
export async function removeRole(userId: string): Promise<void> {
  try {
    await revokeAllPermissions(userId);
    logger.info('Role removed', { userId });
  } catch (error) {
    logger.error('Failed to remove role', { userId, error });
    throw error;
  }
}

/**
 * Change user role (revokes old permissions, grants new ones)
 */
export async function changeRole(
  userId: string,
  newRole: string,
  changedBy: string
): Promise<void> {
  try {
    await removeRole(userId);
    await assignRole(userId, newRole, changedBy);

    logger.info('Role changed', { userId, newRole });
  } catch (error) {
    logger.error('Failed to change role', { userId, newRole, error });
    throw error;
  }
}

/**
 * Get all available roles
 */
export function getAllRoles(): string[] {
  return Object.values(USER_ROLES);
}

/**
 * Check if role is valid
 */
export function isValidRole(role: string): boolean {
  return getAllRoles().includes(role);
}

/**
 * Get role hierarchy (for role comparison)
 */
export function getRoleHierarchy(): Record<string, number> {
  return {
    [USER_ROLES.SUPER_ADMIN]: 100,
    [USER_ROLES.ADMIN]: 90,
    [USER_ROLES.MANAGER]: 70,
    [USER_ROLES.UNDERWRITER]: 60,
    [USER_ROLES.CLAIMS_ADJUSTER]: 60,
    [USER_ROLES.ACCOUNTANT]: 50,
    [USER_ROLES.AGENT]: 40,
    [USER_ROLES.AUDITOR]: 30,
    [USER_ROLES.CUSTOMER]: 10,
  };
}

/**
 * Check if role1 is higher than role2
 */
export function isHigherRole(role1: string, role2: string): boolean {
  const hierarchy = getRoleHierarchy();
  return (hierarchy[role1] || 0) > (hierarchy[role2] || 0);
}

/**
 * Check if role can manage another role
 */
export function canManageRole(managerRole: string, targetRole: string): boolean {
  return isHigherRole(managerRole, targetRole);
}
