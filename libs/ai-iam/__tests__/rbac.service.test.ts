/**
 * RBAC Service Tests
 * Tests for the RBACService class - role-based access control
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => `mock-uuid-${Math.random().toString(36).substr(2, 9)}`),
}));

import { RBACService } from '../src/services/rbac.service';
import { PermissionAction } from '../src/types';

describe('RBACService', () => {
  let rbacService: RBACService;

  beforeEach(() => {
    rbacService = new RBACService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should create an RBACService instance', () => {
      expect(rbacService).toBeDefined();
      expect(rbacService).toBeInstanceOf(RBACService);
    });

    it('should initialize with default system roles', async () => {
      const result = await rbacService.getAllRoles();

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBeGreaterThan(0);

      const roleCodes = result.data?.items.map(r => r.code) || [];
      expect(roleCodes).toContain('viewer');
      expect(roleCodes).toContain('user');
      expect(roleCodes).toContain('admin');
      expect(roleCodes).toContain('superadmin');
    });

    it('should initialize with default permissions', async () => {
      const result = await rbacService.getAllPermissions();

      expect(result.success).toBe(true);
      expect(result.data?.items.length).toBeGreaterThan(0);

      const permCodes = result.data?.items.map(p => p.code) || [];
      expect(permCodes).toContain('users:read');
      expect(permCodes).toContain('users:create');
      expect(permCodes).toContain('roles:manage');
    });
  });

  // ==========================================================================
  // Role Management Tests
  // ==========================================================================

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const result = await rbacService.createRole(
        'Custom Manager',
        ['users:read', 'users:update']
      );

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe('Custom Manager');
      expect(result.data?.permissions.length).toBe(2);
    });

    it('should create role with parent role', async () => {
      const viewerRole = rbacService.getRoleByCode('viewer');

      const result = await rbacService.createRole(
        'Extended Viewer',
        ['settings:update'],
        viewerRole?.id
      );

      expect(result.success).toBe(true);
      expect(result.data?.parentRoleId).toBe(viewerRole?.id);
    });

    it('should reject duplicate role name', async () => {
      await rbacService.createRole('Duplicate Role', []);

      const result = await rbacService.createRole('Duplicate Role', []);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ROLE_EXISTS');
    });

    it('should reject non-existent parent role', async () => {
      const result = await rbacService.createRole(
        'Orphan Role',
        [],
        'non-existent-parent-id'
      );

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PARENT_ROLE_NOT_FOUND');
    });

    it('should generate role code from name', async () => {
      const result = await rbacService.createRole(
        'Special Role Name!',
        []
      );

      expect(result.success).toBe(true);
      expect(result.data?.code).toBe('special_role_name');
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID', () => {
      const viewerRole = rbacService.getRoleByCode('viewer');
      expect(viewerRole).toBeDefined();

      const retrieved = rbacService.getRoleById(viewerRole!.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.code).toBe('viewer');
    });

    it('should return undefined for non-existent ID', () => {
      const result = rbacService.getRoleById('non-existent');
      expect(result).toBeUndefined();
    });
  });

  describe('getRoleByCode', () => {
    it('should return role by code', () => {
      const role = rbacService.getRoleByCode('admin');

      expect(role).toBeDefined();
      expect(role?.name).toBe('Administrator');
    });

    it('should be case-insensitive', () => {
      const role = rbacService.getRoleByCode('ADMIN');

      expect(role).toBeDefined();
      expect(role?.code).toBe('admin');
    });

    it('should return undefined for non-existent code', () => {
      const result = rbacService.getRoleByCode('non-existent');
      expect(result).toBeUndefined();
    });
  });

  // ==========================================================================
  // Role Assignment Tests
  // ==========================================================================

  describe('assignRole', () => {
    const userId = 'test-user-123';

    it('should assign role to user successfully', async () => {
      const role = rbacService.getRoleByCode('user');

      const result = await rbacService.assignRole(userId, role!.id);

      expect(result.success).toBe(true);
    });

    it('should reject assigning same role twice', async () => {
      const role = rbacService.getRoleByCode('user');

      await rbacService.assignRole(userId, role!.id);
      const result = await rbacService.assignRole(userId, role!.id);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ROLE_ALREADY_ASSIGNED');
    });

    it('should reject non-existent role', async () => {
      const result = await rbacService.assignRole(userId, 'non-existent-role');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ROLE_NOT_FOUND');
    });

    it('should allow multiple roles per user', async () => {
      const viewerRole = rbacService.getRoleByCode('viewer');
      const userRole = rbacService.getRoleByCode('user');

      await rbacService.assignRole(userId, viewerRole!.id);
      const result = await rbacService.assignRole(userId, userRole!.id);

      expect(result.success).toBe(true);

      const userRoles = await rbacService.getUserRoles(userId);
      expect(userRoles.data?.length).toBe(2);
    });
  });

  describe('removeRole', () => {
    const userId = 'test-user-remove';

    beforeEach(async () => {
      const role = rbacService.getRoleByCode('user');
      await rbacService.assignRole(userId, role!.id);
    });

    it('should remove role from user successfully', async () => {
      const role = rbacService.getRoleByCode('user');

      const result = await rbacService.removeRole(userId, role!.id);

      expect(result.success).toBe(true);

      const userRoles = await rbacService.getUserRoles(userId);
      expect(userRoles.data?.length).toBe(0);
    });

    it('should reject removing unassigned role', async () => {
      const adminRole = rbacService.getRoleByCode('admin');

      const result = await rbacService.removeRole(userId, adminRole!.id);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ROLE_NOT_ASSIGNED');
    });

    it('should reject non-existent role', async () => {
      const result = await rbacService.removeRole(userId, 'non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ROLE_NOT_FOUND');
    });
  });

  describe('getUserRoles', () => {
    const userId = 'test-user-roles';

    it('should return empty array for user with no roles', async () => {
      const result = await rbacService.getUserRoles('user-no-roles');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should return all assigned roles', async () => {
      const viewerRole = rbacService.getRoleByCode('viewer');
      const userRole = rbacService.getRoleByCode('user');

      await rbacService.assignRole(userId, viewerRole!.id);
      await rbacService.assignRole(userId, userRole!.id);

      const result = await rbacService.getUserRoles(userId);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });
  });

  // ==========================================================================
  // Permission Checking Tests
  // ==========================================================================

  describe('checkPermission', () => {
    const userId = 'test-user-perm';

    beforeEach(async () => {
      const userRole = rbacService.getRoleByCode('user');
      await rbacService.assignRole(userId, userRole!.id);
    });

    it('should return true for assigned permission', async () => {
      const result = await rbacService.checkPermission(userId, 'users:read');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for unassigned permission', async () => {
      const result = await rbacService.checkPermission(userId, 'system:admin');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });

    it('should check inherited permissions', async () => {
      // User role inherits from viewer which has users:read
      const result = await rbacService.checkPermission(userId, 'settings:read');

      expect(result.success).toBe(true);
      expect(result.data).toBe(true);
    });

    it('should return false for user with no roles', async () => {
      const result = await rbacService.checkPermission('no-roles-user', 'users:read');

      expect(result.success).toBe(true);
      expect(result.data).toBe(false);
    });
  });

  describe('checkPermissions', () => {
    const userId = 'test-user-multi';

    beforeEach(async () => {
      const adminRole = rbacService.getRoleByCode('admin');
      await rbacService.assignRole(userId, adminRole!.id);
    });

    it('should check multiple permissions at once', async () => {
      const result = await rbacService.checkPermissions(userId, [
        'users:read',
        'users:create',
        'system:admin', // Not assigned to admin
      ]);

      expect(result.success).toBe(true);
      expect(result.data?.get('users:read')).toBe(true);
      expect(result.data?.get('users:create')).toBe(true);
      expect(result.data?.get('system:admin')).toBe(false);
    });
  });

  describe('getEffectivePermissions', () => {
    const userId = 'test-user-effective';

    it('should return all effective permissions including inherited', async () => {
      const userRole = rbacService.getRoleByCode('user');
      await rbacService.assignRole(userId, userRole!.id);

      const result = await rbacService.getEffectivePermissions(userId);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);

      // Should include viewer permissions (inherited)
      const codes = result.data?.map(p => p.code) || [];
      expect(codes).toContain('settings:read');
    });

    it('should mark directly assigned permissions', async () => {
      const viewerRole = rbacService.getRoleByCode('viewer');
      await rbacService.assignRole(userId, viewerRole!.id);

      const result = await rbacService.getEffectivePermissions(userId);

      expect(result.success).toBe(true);

      const directPerm = result.data?.find(p => p.code === 'users:read');
      expect(directPerm?.directlyAssigned).toBe(true);
    });

    it('should return empty array for user with no roles', async () => {
      const result = await rbacService.getEffectivePermissions('no-roles');

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  // ==========================================================================
  // Permission Management Tests
  // ==========================================================================

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const result = await rbacService.createPermission(
        'custom:action',
        'A custom permission'
      );

      expect(result.success).toBe(true);
      expect(result.data?.code).toBe('custom:action');
    });

    it('should reject duplicate permission code', async () => {
      await rbacService.createPermission('duplicate:perm');

      const result = await rbacService.createPermission('duplicate:perm');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_EXISTS');
    });

    it('should parse resource and action from code', async () => {
      const result = await rbacService.createPermission('reports:generate');

      expect(result.success).toBe(true);
      expect(result.data?.resource).toBe('reports');
    });
  });

  describe('deletePermission', () => {
    it('should delete a custom permission', async () => {
      const createResult = await rbacService.createPermission('deletable:perm');
      expect(createResult.success).toBe(true);

      const deleteResult = await rbacService.deletePermission(createResult.data!.id);

      expect(deleteResult.success).toBe(true);
    });

    it('should reject deleting system permissions', async () => {
      const perm = rbacService.getPermissionByCode('users:read');

      const result = await rbacService.deletePermission(perm!.id);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CANNOT_DELETE_SYSTEM_PERMISSION');
    });

    it('should reject deleting non-existent permission', async () => {
      const result = await rbacService.deletePermission('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_NOT_FOUND');
    });
  });

  describe('getRolePermissions', () => {
    it('should return direct permissions for a role', async () => {
      const role = rbacService.getRoleByCode('viewer');

      const result = await rbacService.getRolePermissions(role!.id);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('should reject non-existent role', async () => {
      const result = await rbacService.getRolePermissions('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ROLE_NOT_FOUND');
    });
  });

  // ==========================================================================
  // Query Methods Tests
  // ==========================================================================

  describe('getAllRoles', () => {
    it('should return paginated roles', async () => {
      const result = await rbacService.getAllRoles(1, 10);

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
      expect(result.data?.total).toBeGreaterThan(0);
      expect(result.data?.page).toBe(1);
      expect(result.data?.limit).toBe(10);
    });

    it('should handle pagination correctly', async () => {
      const page1 = await rbacService.getAllRoles(1, 2);
      const page2 = await rbacService.getAllRoles(2, 2);

      expect(page1.data?.items).not.toEqual(page2.data?.items);
      expect(page1.data?.hasNext).toBe(true);
      expect(page2.data?.hasPrevious).toBe(true);
    });
  });

  describe('getAllPermissions', () => {
    it('should return paginated permissions', async () => {
      const result = await rbacService.getAllPermissions(1, 50);

      expect(result.success).toBe(true);
      expect(result.data?.items).toBeDefined();
      expect(result.data?.total).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // User Integration Tests
  // ==========================================================================

  describe('populateUserRolesAndPermissions', () => {
    const userId = 'test-user-populate';

    it('should populate user with roles and permissions', async () => {
      const adminRole = rbacService.getRoleByCode('admin');
      await rbacService.assignRole(userId, adminRole!.id);

      const user = {
        id: userId,
        email: 'test@example.com',
        roles: [] as any[],
        permissions: [] as any[],
      };

      const populated = rbacService.populateUserRolesAndPermissions(user as any);

      expect(populated.roles.length).toBeGreaterThan(0);
      expect(populated.permissions.length).toBeGreaterThan(0);
    });

    it('should return empty arrays for user with no roles', () => {
      const user = {
        id: 'no-roles-user',
        email: 'test@example.com',
        roles: [] as any[],
        permissions: [] as any[],
      };

      const populated = rbacService.populateUserRolesAndPermissions(user as any);

      expect(populated.roles).toEqual([]);
      expect(populated.permissions).toEqual([]);
    });
  });

  describe('setUserRoles', () => {
    it('should replace all user roles', async () => {
      const userId = 'test-user-set';
      const viewerRole = rbacService.getRoleByCode('viewer');
      const userRole = rbacService.getRoleByCode('user');

      // Assign initial role
      await rbacService.assignRole(userId, viewerRole!.id);

      // Replace with different role
      rbacService.setUserRoles(userId, [userRole!.id]);

      const result = await rbacService.getUserRoles(userId);

      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].code).toBe('user');
    });
  });

  // ==========================================================================
  // Hierarchy Tests
  // ==========================================================================

  describe('role hierarchy', () => {
    it('should inherit permissions from parent roles', async () => {
      // Admin inherits from user, which inherits from viewer
      const userId = 'test-user-hierarchy';
      const adminRole = rbacService.getRoleByCode('admin');
      await rbacService.assignRole(userId, adminRole!.id);

      const effectivePerms = await rbacService.getEffectivePermissions(userId);
      const codes = effectivePerms.data?.map(p => p.code) || [];

      // Should have viewer permissions
      expect(codes).toContain('settings:read');

      // Should have user permissions
      expect(codes).toContain('users:update');

      // Should have admin permissions
      expect(codes).toContain('roles:manage');
    });

    it('should track inheritance source', async () => {
      const userId = 'test-user-source';
      const adminRole = rbacService.getRoleByCode('admin');
      await rbacService.assignRole(userId, adminRole!.id);

      const effectivePerms = await rbacService.getEffectivePermissions(userId);

      // Find an inherited permission
      const inheritedPerm = effectivePerms.data?.find(p =>
        p.inheritedFrom && !p.directlyAssigned
      );

      // There should be some inherited permissions
      expect(inheritedPerm).toBeDefined();
    });
  });

  // ==========================================================================
  // Edge Cases Tests
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle permission code case-insensitively', () => {
      const perm1 = rbacService.getPermissionByCode('users:read');
      const perm2 = rbacService.getPermissionByCode('USERS:READ');

      expect(perm1?.id).toBe(perm2?.id);
    });

    it('should handle empty permissions array in role creation', async () => {
      const result = await rbacService.createRole('Empty Role', []);

      expect(result.success).toBe(true);
      expect(result.data?.permissions).toEqual([]);
    });

    it('should handle non-existent permission codes gracefully', async () => {
      const result = await rbacService.createRole(
        'Role With Bad Perms',
        ['non:existent', 'users:read']
      );

      expect(result.success).toBe(true);
      // Should only have the valid permission
      expect(result.data?.permissions.length).toBe(1);
    });
  });
});
