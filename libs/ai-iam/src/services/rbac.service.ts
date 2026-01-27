// ============================================================================
// AI-IAM RBAC Service - Role-Based Access Control
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import {
  Role,
  Permission,
  RolePermission,
  RoleHierarchy,
  EffectivePermission,
  PermissionAction,
  PermissionCondition,
  CreateRoleDTO,
  CreatePermissionDTO,
  ServiceResult,
  PaginatedResult,
  AuditEventType,
  User
} from '../types';

/**
 * RBAC Service
 * Handles role-based access control with hierarchical roles and fine-grained permissions
 */
export class RBACService {
  // In-memory stores (replace with database in production)
  private roles: Map<string, Role> = new Map();
  private permissions: Map<string, Permission> = new Map();
  private rolePermissions: Map<string, RolePermission> = new Map();
  private userRoles: Map<string, Set<string>> = new Map(); // userId -> Set<roleId>
  private roleHierarchy: Map<string, RoleHierarchy[]> = new Map(); // roleId -> parents

  constructor() {
    // Initialize with default system roles and permissions
    this.initializeDefaults();
  }

  /**
   * Initialize default system roles and permissions
   */
  private initializeDefaults(): void {
    // Create default permissions
    const defaultPermissions: CreatePermissionDTO[] = [
      { code: 'users:read', name: 'View Users', resource: 'users', action: PermissionAction.READ },
      { code: 'users:create', name: 'Create Users', resource: 'users', action: PermissionAction.CREATE },
      { code: 'users:update', name: 'Update Users', resource: 'users', action: PermissionAction.UPDATE },
      { code: 'users:delete', name: 'Delete Users', resource: 'users', action: PermissionAction.DELETE },
      { code: 'users:manage', name: 'Manage Users', resource: 'users', action: PermissionAction.MANAGE },
      { code: 'roles:read', name: 'View Roles', resource: 'roles', action: PermissionAction.READ },
      { code: 'roles:create', name: 'Create Roles', resource: 'roles', action: PermissionAction.CREATE },
      { code: 'roles:update', name: 'Update Roles', resource: 'roles', action: PermissionAction.UPDATE },
      { code: 'roles:delete', name: 'Delete Roles', resource: 'roles', action: PermissionAction.DELETE },
      { code: 'roles:manage', name: 'Manage Roles', resource: 'roles', action: PermissionAction.MANAGE },
      { code: 'settings:read', name: 'View Settings', resource: 'settings', action: PermissionAction.READ },
      { code: 'settings:update', name: 'Update Settings', resource: 'settings', action: PermissionAction.UPDATE },
      { code: 'audit:read', name: 'View Audit Logs', resource: 'audit', action: PermissionAction.READ },
      { code: 'system:admin', name: 'System Administration', resource: 'system', action: PermissionAction.ALL }
    ];

    for (const perm of defaultPermissions) {
      this.createPermissionInternal(perm, true);
    }

    // Create default roles
    const viewerPermissions = ['users:read', 'settings:read'];
    const userPermissions = [...viewerPermissions, 'users:update'];
    const adminPermissions = [
      ...userPermissions,
      'users:create', 'users:delete', 'users:manage',
      'roles:read', 'roles:create', 'roles:update', 'roles:delete', 'roles:manage',
      'settings:update', 'audit:read'
    ];
    const superAdminPermissions = [...adminPermissions, 'system:admin'];

    // Create system roles with hierarchy
    this.createRoleInternal({
      name: 'Viewer',
      code: 'viewer',
      description: 'Read-only access',
      permissionIds: this.getPermissionIdsByCodes(viewerPermissions)
    }, true);

    this.createRoleInternal({
      name: 'User',
      code: 'user',
      description: 'Standard user access',
      permissionIds: this.getPermissionIdsByCodes(userPermissions),
      parentRoleId: this.getRoleByCode('viewer')?.id
    }, true);

    this.createRoleInternal({
      name: 'Administrator',
      code: 'admin',
      description: 'Administrative access',
      permissionIds: this.getPermissionIdsByCodes(adminPermissions),
      parentRoleId: this.getRoleByCode('user')?.id
    }, true);

    this.createRoleInternal({
      name: 'Super Administrator',
      code: 'superadmin',
      description: 'Full system access',
      permissionIds: this.getPermissionIdsByCodes(superAdminPermissions),
      parentRoleId: this.getRoleByCode('admin')?.id
    }, true);
  }

  // ============================================================================
  // ROLE MANAGEMENT
  // ============================================================================

  /**
   * Create a new role
   */
  async createRole(
    name: string,
    permissions: string[],
    parentRoleId?: string
  ): Promise<ServiceResult<Role>> {
    // Validate parent role if provided
    if (parentRoleId && !this.roles.has(parentRoleId)) {
      return {
        success: false,
        error: {
          code: 'PARENT_ROLE_NOT_FOUND',
          message: 'Parent role not found'
        }
      };
    }

    // Check for duplicate name
    const existingRole = Array.from(this.roles.values()).find(
      r => r.name.toLowerCase() === name.toLowerCase()
    );
    if (existingRole) {
      return {
        success: false,
        error: {
          code: 'ROLE_EXISTS',
          message: 'A role with this name already exists'
        }
      };
    }

    // Get permission IDs
    const permissionIds = this.getPermissionIdsByCodes(permissions);

    const role = this.createRoleInternal({
      name,
      code: this.generateRoleCode(name),
      permissionIds,
      parentRoleId
    }, false);

    return {
      success: true,
      data: role
    };
  }

  /**
   * Internal role creation
   */
  private createRoleInternal(dto: CreateRoleDTO, isSystem: boolean): Role {
    const roleId = uuidv4();
    const rolePermissions = this.getPermissionsByIds(dto.permissionIds);

    const role: Role = {
      id: roleId,
      name: dto.name,
      code: dto.code,
      description: dto.description,
      permissions: rolePermissions,
      parentRoleId: dto.parentRoleId,
      isSystem,
      isActive: true,
      organizationId: dto.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.roles.set(role.id, role);

    // Store role-permission mappings
    for (const permId of dto.permissionIds) {
      const rpId = uuidv4();
      this.rolePermissions.set(rpId, {
        id: rpId,
        roleId: role.id,
        permissionId: permId,
        grantedAt: new Date(),
        grantedBy: 'system'
      });
    }

    // Build role hierarchy
    if (dto.parentRoleId) {
      this.buildRoleHierarchy(role.id, dto.parentRoleId);
    }

    return role;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string): Promise<ServiceResult<void>> {
    const role = this.roles.get(roleId);
    if (!role) {
      return {
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      };
    }

    let userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) {
      userRoleSet = new Set();
      this.userRoles.set(userId, userRoleSet);
    }

    if (userRoleSet.has(roleId)) {
      return {
        success: false,
        error: {
          code: 'ROLE_ALREADY_ASSIGNED',
          message: 'User already has this role'
        }
      };
    }

    userRoleSet.add(roleId);

    this.logAuditEvent(userId, AuditEventType.ROLE_ASSIGNED, {
      roleId,
      roleName: role.name
    });

    return { success: true };
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<ServiceResult<void>> {
    const role = this.roles.get(roleId);
    if (!role) {
      return {
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      };
    }

    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet || !userRoleSet.has(roleId)) {
      return {
        success: false,
        error: {
          code: 'ROLE_NOT_ASSIGNED',
          message: 'User does not have this role'
        }
      };
    }

    userRoleSet.delete(roleId);

    this.logAuditEvent(userId, AuditEventType.ROLE_REMOVED, {
      roleId,
      roleName: role.name
    });

    return { success: true };
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<ServiceResult<Role[]>> {
    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet) {
      return {
        success: true,
        data: []
      };
    }

    const roles: Role[] = [];
    for (const roleId of userRoleSet) {
      const role = this.roles.get(roleId);
      if (role) {
        roles.push(role);
      }
    }

    return {
      success: true,
      data: roles
    };
  }

  /**
   * Get role permissions (direct only)
   */
  async getRolePermissions(roleId: string): Promise<ServiceResult<Permission[]>> {
    const role = this.roles.get(roleId);
    if (!role) {
      return {
        success: false,
        error: {
          code: 'ROLE_NOT_FOUND',
          message: 'Role not found'
        }
      };
    }

    return {
      success: true,
      data: role.permissions
    };
  }

  // ============================================================================
  // PERMISSION CHECKING
  // ============================================================================

  /**
   * Check if user has a specific permission
   */
  async checkPermission(
    userId: string,
    permission: string,
    resource?: string
  ): Promise<ServiceResult<boolean>> {
    const effectivePerms = await this.getEffectivePermissions(userId);
    if (!effectivePerms.success || !effectivePerms.data) {
      return { success: true, data: false };
    }

    // Check for exact match or wildcard
    const hasPermission = effectivePerms.data.some(perm => {
      // Check exact permission code match
      if (perm.code === permission) return true;

      // Check for wildcard permissions (e.g., users:* or *:read)
      if (perm.action === PermissionAction.ALL) {
        if (resource && perm.resource === resource) return true;
        if (perm.resource === '*') return true;
      }

      // Check resource:action format
      const [permResource, permAction] = permission.split(':');
      if (perm.resource === permResource) {
        if (perm.action === permAction) return true;
        if (perm.action === PermissionAction.MANAGE) return true;
        if (perm.action === PermissionAction.ALL) return true;
      }

      return false;
    });

    return {
      success: true,
      data: hasPermission
    };
  }

  /**
   * Get effective permissions for a user (including inherited)
   */
  async getEffectivePermissions(userId: string): Promise<ServiceResult<EffectivePermission[]>> {
    const userRoleSet = this.userRoles.get(userId);
    if (!userRoleSet || userRoleSet.size === 0) {
      return {
        success: true,
        data: []
      };
    }

    const effectivePermissions: Map<string, EffectivePermission> = new Map();

    for (const roleId of userRoleSet) {
      // Get permissions for this role and all parent roles
      const rolePermissions = this.getRolePermissionsWithInheritance(roleId);

      for (const [permCode, permData] of rolePermissions) {
        // If permission already exists, keep it (first one wins)
        if (!effectivePermissions.has(permCode)) {
          effectivePermissions.set(permCode, permData);
        }
      }
    }

    return {
      success: true,
      data: Array.from(effectivePermissions.values())
    };
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(
    userId: string,
    permissions: string[]
  ): Promise<ServiceResult<Map<string, boolean>>> {
    const results = new Map<string, boolean>();
    const effectivePerms = await this.getEffectivePermissions(userId);

    if (!effectivePerms.success || !effectivePerms.data) {
      for (const perm of permissions) {
        results.set(perm, false);
      }
      return { success: true, data: results };
    }

    const permCodes = new Set(effectivePerms.data.map(p => p.code));

    for (const permission of permissions) {
      results.set(permission, permCodes.has(permission));
    }

    return { success: true, data: results };
  }

  // ============================================================================
  // PERMISSION MANAGEMENT
  // ============================================================================

  /**
   * Create a new permission
   */
  async createPermission(
    code: string,
    description?: string
  ): Promise<ServiceResult<Permission>> {
    // Check for duplicate code
    const existing = Array.from(this.permissions.values()).find(
      p => p.code.toLowerCase() === code.toLowerCase()
    );
    if (existing) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_EXISTS',
          message: 'A permission with this code already exists'
        }
      };
    }

    const [resource, action] = code.split(':');
    const permission = this.createPermissionInternal({
      code,
      name: code,
      description,
      resource: resource || code,
      action: this.parseAction(action)
    }, false);

    return {
      success: true,
      data: permission
    };
  }

  /**
   * Internal permission creation
   */
  private createPermissionInternal(dto: CreatePermissionDTO, isSystem: boolean): Permission {
    const permission: Permission = {
      id: uuidv4(),
      code: dto.code,
      name: dto.name,
      description: dto.description,
      resource: dto.resource,
      action: dto.action,
      conditions: dto.conditions,
      isSystem,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.permissions.set(permission.id, permission);
    return permission;
  }

  /**
   * Delete a permission
   */
  async deletePermission(permissionId: string): Promise<ServiceResult<void>> {
    const permission = this.permissions.get(permissionId);
    if (!permission) {
      return {
        success: false,
        error: {
          code: 'PERMISSION_NOT_FOUND',
          message: 'Permission not found'
        }
      };
    }

    if (permission.isSystem) {
      return {
        success: false,
        error: {
          code: 'CANNOT_DELETE_SYSTEM_PERMISSION',
          message: 'Cannot delete system permissions'
        }
      };
    }

    // Remove from all roles
    for (const role of this.roles.values()) {
      role.permissions = role.permissions.filter(p => p.id !== permissionId);
    }

    // Remove role-permission mappings
    for (const [rpId, rp] of this.rolePermissions.entries()) {
      if (rp.permissionId === permissionId) {
        this.rolePermissions.delete(rpId);
      }
    }

    this.permissions.delete(permissionId);

    return { success: true };
  }

  // ============================================================================
  // HIERARCHY MANAGEMENT
  // ============================================================================

  /**
   * Build role hierarchy
   */
  private buildRoleHierarchy(roleId: string, parentRoleId: string, depth: number = 1): void {
    let hierarchyList = this.roleHierarchy.get(roleId);
    if (!hierarchyList) {
      hierarchyList = [];
      this.roleHierarchy.set(roleId, hierarchyList);
    }

    hierarchyList.push({
      roleId,
      parentRoleId,
      depth
    });

    // Recursively add grandparents
    const parentRole = this.roles.get(parentRoleId);
    if (parentRole?.parentRoleId) {
      this.buildRoleHierarchy(roleId, parentRole.parentRoleId, depth + 1);
    }
  }

  /**
   * Get role permissions including inherited
   */
  private getRolePermissionsWithInheritance(roleId: string): Map<string, EffectivePermission> {
    const permissions = new Map<string, EffectivePermission>();

    // Get direct permissions
    const role = this.roles.get(roleId);
    if (role) {
      for (const perm of role.permissions) {
        const effectivePerm: EffectivePermission = {
          ...perm,
          directlyAssigned: true
        };
        permissions.set(perm.code, effectivePerm);
      }
    }

    // Get inherited permissions
    const hierarchy = this.roleHierarchy.get(roleId) || [];
    for (const h of hierarchy) {
      const parentRole = this.roles.get(h.parentRoleId);
      if (parentRole) {
        for (const perm of parentRole.permissions) {
          if (!permissions.has(perm.code)) {
            const effectivePerm: EffectivePermission = {
              ...perm,
              inheritedFrom: parentRole.name,
              directlyAssigned: false
            };
            permissions.set(perm.code, effectivePerm);
          }
        }
      }
    }

    return permissions;
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get all roles
   */
  async getAllRoles(
    page: number = 1,
    limit: number = 20
  ): Promise<ServiceResult<PaginatedResult<Role>>> {
    const allRoles = Array.from(this.roles.values());
    const total = allRoles.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const items = allRoles.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(
    page: number = 1,
    limit: number = 50
  ): Promise<ServiceResult<PaginatedResult<Permission>>> {
    const allPermissions = Array.from(this.permissions.values());
    const total = allPermissions.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    const items = allPermissions.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1
      }
    };
  }

  /**
   * Get role by ID
   */
  getRoleById(roleId: string): Role | undefined {
    return this.roles.get(roleId);
  }

  /**
   * Get role by code
   */
  getRoleByCode(code: string): Role | undefined {
    return Array.from(this.roles.values()).find(
      r => r.code.toLowerCase() === code.toLowerCase()
    );
  }

  /**
   * Get permission by code
   */
  getPermissionByCode(code: string): Permission | undefined {
    return Array.from(this.permissions.values()).find(
      p => p.code.toLowerCase() === code.toLowerCase()
    );
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Get permission IDs by codes
   */
  private getPermissionIdsByCodes(codes: string[]): string[] {
    const ids: string[] = [];
    for (const code of codes) {
      const permission = this.getPermissionByCode(code);
      if (permission) {
        ids.push(permission.id);
      }
    }
    return ids;
  }

  /**
   * Get permissions by IDs
   */
  private getPermissionsByIds(ids: string[]): Permission[] {
    return ids
      .map(id => this.permissions.get(id))
      .filter((p): p is Permission => p !== undefined);
  }

  /**
   * Generate role code from name
   */
  private generateRoleCode(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  /**
   * Parse action string to enum
   */
  private parseAction(action: string): PermissionAction {
    const actionMap: Record<string, PermissionAction> = {
      'create': PermissionAction.CREATE,
      'read': PermissionAction.READ,
      'update': PermissionAction.UPDATE,
      'delete': PermissionAction.DELETE,
      'execute': PermissionAction.EXECUTE,
      'manage': PermissionAction.MANAGE,
      '*': PermissionAction.ALL
    };

    return actionMap[action?.toLowerCase()] || PermissionAction.READ;
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    userId: string,
    type: AuditEventType,
    details: Record<string, unknown>
  ): void {
    console.log(`[RBAC AUDIT] ${type} - User: ${userId}`, details);
  }

  // ============================================================================
  // USER INTEGRATION METHODS
  // ============================================================================

  /**
   * Populate user with roles and permissions
   */
  populateUserRolesAndPermissions(user: User): User {
    const userRoleSet = this.userRoles.get(user.id);
    if (!userRoleSet) {
      user.roles = [];
      user.permissions = [];
      return user;
    }

    const roles: Role[] = [];
    const permissionsMap = new Map<string, Permission>();

    for (const roleId of userRoleSet) {
      const role = this.roles.get(roleId);
      if (role) {
        roles.push(role);

        // Collect permissions with inheritance
        const rolePerms = this.getRolePermissionsWithInheritance(roleId);
        for (const [code, perm] of rolePerms) {
          if (!permissionsMap.has(code)) {
            permissionsMap.set(code, perm);
          }
        }
      }
    }

    user.roles = roles.map(r => r.code);
    user.permissions = Array.from(permissionsMap.values()).map(p => p.code);

    return user;
  }

  /**
   * Set user roles (replace all)
   */
  setUserRoles(userId: string, roleIds: string[]): void {
    this.userRoles.set(userId, new Set(roleIds));
  }
}

// Export singleton instance
export const rbacService = new RBACService();
