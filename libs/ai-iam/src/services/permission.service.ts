/**
 * @fileoverview Permission service for AI-IAM module
 * @module @ai-core/ai-iam/services/permission
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Permission,
  PermissionAction,
  CreatePermissionDTO,
  UpdatePermissionDTO,
  PermissionCheckRequest,
  PermissionCheckResult,
  PermissionGrantDTO,
  PermissionRevokeDTO,
  createPermissionName,
  matchesPermissionPattern,
  Role,
} from '../types';

/**
 * Storage interface for PermissionService
 */
export interface PermissionStorage {
  /** Create a new permission */
  create(permission: Permission): Promise<Permission>;
  /** Find permission by ID */
  findById(id: string): Promise<Permission | null>;
  /** Find permission by name */
  findByName(name: string, tenantId: string | null): Promise<Permission | null>;
  /** Update permission */
  update(id: string, updates: Partial<Permission>): Promise<Permission>;
  /** Delete permission */
  delete(id: string): Promise<void>;
  /** List permissions */
  list(options: PermissionListOptions): Promise<PermissionListResult>;
  /** Find permissions by resource */
  findByResource(resource: string, tenantId: string | null): Promise<Permission[]>;
  /** Get user permissions (resolved from roles) */
  getUserPermissions(userId: string): Promise<Permission[]>;
  /** Get user permission names (for caching) */
  getUserPermissionNames(userId: string): Promise<string[]>;
  /** Get role by ID */
  getRoleById(roleId: string): Promise<Role | null>;
  /** Update role permissions */
  updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void>;
}

/**
 * Permission list options
 */
export interface PermissionListOptions {
  /** Filter by tenant ID */
  tenantId?: string | null;
  /** Include global permissions */
  includeGlobal?: boolean;
  /** Filter by resource */
  resource?: string;
  /** Filter by action */
  action?: PermissionAction | string;
  /** Include inactive permissions */
  includeInactive?: boolean;
  /** Search query */
  search?: string;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: keyof Permission;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Permission list result
 */
export interface PermissionListResult {
  /** List of permissions */
  permissions: Permission[];
  /** Total count */
  total: number;
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total pages */
  totalPages: number;
}

/**
 * In-memory storage implementation for testing/development
 */
export class InMemoryPermissionStorage implements PermissionStorage {
  private permissions: Map<string, Permission> = new Map();
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, string[]> = new Map();

  async create(permission: Permission): Promise<Permission> {
    this.permissions.set(permission.id, permission);
    return permission;
  }

  async findById(id: string): Promise<Permission | null> {
    return this.permissions.get(id) ?? null;
  }

  async findByName(name: string, tenantId: string | null): Promise<Permission | null> {
    for (const permission of this.permissions.values()) {
      if (
        permission.name.toLowerCase() === name.toLowerCase() &&
        (permission.tenantId === tenantId || permission.tenantId === null)
      ) {
        return permission;
      }
    }
    return null;
  }

  async update(id: string, updates: Partial<Permission>): Promise<Permission> {
    const permission = this.permissions.get(id);
    if (!permission) {
      throw new Error('Permission not found');
    }
    const updated = { ...permission, ...updates, updatedAt: new Date() };
    this.permissions.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.permissions.delete(id);
  }

  async list(options: PermissionListOptions): Promise<PermissionListResult> {
    let permissions = Array.from(this.permissions.values());

    // Apply filters
    if (options.tenantId !== undefined) {
      if (options.includeGlobal) {
        permissions = permissions.filter(
          (p) => p.tenantId === options.tenantId || p.tenantId === null
        );
      } else {
        permissions = permissions.filter((p) => p.tenantId === options.tenantId);
      }
    }

    if (options.resource) {
      permissions = permissions.filter((p) => p.resource === options.resource);
    }

    if (options.action) {
      permissions = permissions.filter((p) => p.action === options.action);
    }

    if (!options.includeInactive) {
      permissions = permissions.filter((p) => p.isActive);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      permissions = permissions.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.displayName.toLowerCase().includes(search) ||
          p.description.toLowerCase().includes(search)
      );
    }

    // Sort
    const sortBy = options.sortBy ?? 'name';
    const sortOrder = options.sortOrder ?? 'asc';
    permissions.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = permissions.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    permissions = permissions.slice(start, end);

    return {
      permissions,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findByResource(resource: string, tenantId: string | null): Promise<Permission[]> {
    return Array.from(this.permissions.values()).filter(
      (p) =>
        p.resource === resource &&
        (p.tenantId === tenantId || p.tenantId === null) &&
        p.isActive
    );
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const roleIds = this.userRoles.get(userId) ?? [];
    const permissionIds = new Set<string>();

    for (const roleId of roleIds) {
      const role = this.roles.get(roleId);
      if (role && role.isActive) {
        role.permissionIds.forEach((id) => permissionIds.add(id));
      }
    }

    const permissions: Permission[] = [];
    for (const id of permissionIds) {
      const permission = this.permissions.get(id);
      if (permission && permission.isActive) {
        permissions.push(permission);
      }
    }

    return permissions;
  }

  async getUserPermissionNames(userId: string): Promise<string[]> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.map((p) => p.name);
  }

  async getRoleById(roleId: string): Promise<Role | null> {
    return this.roles.get(roleId) ?? null;
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    this.roles.set(roleId, { ...role, permissionIds, updatedAt: new Date() });
  }

  // Helper methods for testing
  setRole(role: Role): void {
    this.roles.set(role.id, role);
  }

  setUserRoles(userId: string, roleIds: string[]): void {
    this.userRoles.set(userId, roleIds);
  }

  clear(): void {
    this.permissions.clear();
    this.roles.clear();
    this.userRoles.clear();
  }

  getAll(): Permission[] {
    return Array.from(this.permissions.values());
  }
}

/**
 * Permission service error
 */
export class PermissionServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'PermissionServiceError';
  }
}

/**
 * Permission service for checking and granting permissions
 */
export class PermissionService {
  private readonly storage: PermissionStorage;
  private readonly permissionCache: Map<string, { permissions: string[]; expiresAt: number }>;
  private readonly cacheTtl: number;

  /**
   * Creates a new PermissionService instance
   * @param storage - Storage implementation
   * @param options - Service options
   */
  constructor(
    storage: PermissionStorage,
    options: { cacheTtl?: number } = {}
  ) {
    this.storage = storage;
    this.permissionCache = new Map();
    this.cacheTtl = options.cacheTtl ?? 60000; // 1 minute default
  }

  /**
   * Creates a new permission
   * @param dto - Permission creation data
   * @returns Created permission
   */
  async create(dto: CreatePermissionDTO): Promise<Permission> {
    const name = dto.name.toLowerCase();

    // Check name uniqueness
    const existing = await this.storage.findByName(name, dto.tenantId ?? null);
    if (existing) {
      throw new PermissionServiceError('Permission name already exists', 'NAME_EXISTS');
    }

    const now = new Date();
    const permission: Permission = {
      id: uuidv4(),
      code: dto.code || `${dto.resource.toLowerCase()}_${dto.action.toLowerCase()}`,
      name,
      displayName: dto.displayName,
      description: dto.description,
      resource: dto.resource.toLowerCase(),
      action: dto.action,
      isSystem: false,
      isActive: true,
      tenantId: dto.tenantId || undefined,
      metadata: dto.metadata,
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.create(permission);
  }

  /**
   * Creates standard CRUD permissions for a resource
   * @param resource - Resource name
   * @param tenantId - Tenant ID (null for global)
   * @returns Created permissions
   */
  async createCrudPermissions(
    resource: string,
    tenantId: string | null = null
  ): Promise<Permission[]> {
    const actions: PermissionAction[] = [
      PermissionAction.CREATE,
      PermissionAction.READ,
      PermissionAction.UPDATE,
      PermissionAction.DELETE,
    ];

    const permissions: Permission[] = [];

    for (const action of actions) {
      const name = createPermissionName(resource, action);
      const displayName = `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`;

      const permission = await this.create({
        code: `${resource.toLowerCase()}_${action.toLowerCase()}`,
        name,
        displayName,
        description: `Permission to ${action} ${resource}`,
        resource,
        action,
        tenantId: tenantId || undefined,
      });

      permissions.push(permission);
    }

    return permissions;
  }

  /**
   * Gets a permission by ID
   * @param id - Permission ID
   * @returns Permission or null
   */
  async getById(id: string): Promise<Permission | null> {
    return this.storage.findById(id);
  }

  /**
   * Gets a permission by name
   * @param name - Permission name
   * @param tenantId - Tenant ID
   * @returns Permission or null
   */
  async getByName(name: string, tenantId: string | null = null): Promise<Permission | null> {
    return this.storage.findByName(name, tenantId);
  }

  /**
   * Updates a permission
   * @param id - Permission ID
   * @param dto - Update data
   * @returns Updated permission
   */
  async update(id: string, dto: UpdatePermissionDTO): Promise<Permission> {
    const permission = await this.storage.findById(id);
    if (!permission) {
      throw new PermissionServiceError('Permission not found', 'PERMISSION_NOT_FOUND');
    }

    if (permission.isSystem) {
      throw new PermissionServiceError('Cannot update system permission', 'SYSTEM_PERMISSION');
    }

    const updates: Partial<Permission> = {};

    if (dto.displayName !== undefined) {
      updates.displayName = dto.displayName;
    }
    if (dto.description !== undefined) {
      updates.description = dto.description;
    }
    if (dto.isActive !== undefined) {
      updates.isActive = dto.isActive;
    }
    if (dto.metadata !== undefined) {
      updates.metadata = { ...permission.metadata, ...dto.metadata };
    }

    // Invalidate cache for all users
    this.permissionCache.clear();

    return this.storage.update(id, updates);
  }

  /**
   * Deletes a permission
   * @param id - Permission ID
   */
  async delete(id: string): Promise<void> {
    const permission = await this.storage.findById(id);
    if (!permission) {
      throw new PermissionServiceError('Permission not found', 'PERMISSION_NOT_FOUND');
    }

    if (permission.isSystem) {
      throw new PermissionServiceError('Cannot delete system permission', 'SYSTEM_PERMISSION');
    }

    await this.storage.delete(id);

    // Invalidate cache
    this.permissionCache.clear();
  }

  /**
   * Lists permissions with pagination
   * @param options - List options
   * @returns List result
   */
  async list(options: PermissionListOptions = {}): Promise<PermissionListResult> {
    return this.storage.list(options);
  }

  /**
   * Checks if a user has a specific permission
   * @param request - Permission check request
   * @returns Permission check result
   */
  async check(request: PermissionCheckRequest): Promise<PermissionCheckResult> {
    const permissionName = createPermissionName(request.resource, request.action);
    const checkedAt = new Date();

    // Get user permissions (with caching)
    const userPermissions = await this.getUserPermissionsCached(request.userId);

    // Check for direct match or wildcard match
    const grantingPermissions: string[] = [];
    let allowed = false;

    for (const perm of userPermissions) {
      if (matchesPermissionPattern(permissionName, perm)) {
        grantingPermissions.push(perm);
        allowed = true;
      }
    }

    // Also check for admin/manage permissions on the resource
    const adminPatterns = [
      createPermissionName(request.resource, PermissionAction.ADMIN),
      createPermissionName(request.resource, PermissionAction.MANAGE),
      createPermissionName(request.resource, PermissionAction.ALL),
      createPermissionName('*', PermissionAction.ADMIN),
      createPermissionName('*', PermissionAction.ALL),
    ];

    for (const pattern of adminPatterns) {
      if (userPermissions.includes(pattern)) {
        grantingPermissions.push(pattern);
        allowed = true;
      }
    }

    return {
      allowed,
      reason: allowed
        ? 'Permission granted'
        : `Missing permission: ${permissionName}`,
      grantingPermissions: allowed ? [...new Set(grantingPermissions)] : undefined,
      missingPermissions: allowed ? undefined : [permissionName],
      request,
      checkedAt,
    };
  }

  /**
   * Checks multiple permissions at once
   * @param userId - User ID
   * @param checks - Array of resource/action pairs
   * @returns Map of permission names to check results
   */
  async checkMultiple(
    userId: string,
    checks: Array<{ resource: string; action: PermissionAction | string }>
  ): Promise<Map<string, PermissionCheckResult>> {
    const results = new Map<string, PermissionCheckResult>();

    for (const check of checks) {
      const permissionName = createPermissionName(check.resource, check.action);
      const result = await this.check({
        userId,
        permission: permissionName,
        resource: check.resource,
        action: check.action,
      });
      results.set(permissionName, result);
    }

    return results;
  }

  /**
   * Checks if user has ALL specified permissions
   * @param userId - User ID
   * @param permissions - Array of permission names
   * @returns True if user has all permissions
   */
  async hasAll(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissionsCached(userId);

    for (const required of permissions) {
      let found = false;
      for (const perm of userPermissions) {
        if (matchesPermissionPattern(required, perm)) {
          found = true;
          break;
        }
      }
      if (!found) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks if user has ANY of the specified permissions
   * @param userId - User ID
   * @param permissions - Array of permission names
   * @returns True if user has any permission
   */
  async hasAny(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissionsCached(userId);

    for (const required of permissions) {
      for (const perm of userPermissions) {
        if (matchesPermissionPattern(required, perm)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Grants a permission to a role
   * @param dto - Grant data
   */
  async grant(dto: PermissionGrantDTO): Promise<void> {
    // Verify permission exists
    const permission = await this.storage.findById(dto.permissionId);
    if (!permission) {
      throw new PermissionServiceError('Permission not found', 'PERMISSION_NOT_FOUND');
    }

    // Verify role exists
    const role = await this.storage.getRoleById(dto.roleId);
    if (!role) {
      throw new PermissionServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    // Add permission to role if not already present
    if (!role.permissionIds.includes(dto.permissionId)) {
      const newPermissionIds = [...role.permissionIds, dto.permissionId];
      await this.storage.updateRolePermissions(dto.roleId, newPermissionIds);
    }

    // Invalidate cache
    this.permissionCache.clear();
  }

  /**
   * Revokes a permission from a role
   * @param dto - Revoke data
   */
  async revoke(dto: PermissionRevokeDTO): Promise<void> {
    // Verify role exists
    const role = await this.storage.getRoleById(dto.roleId);
    if (!role) {
      throw new PermissionServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    // Remove permission from role
    const newPermissionIds = role.permissionIds.filter((id) => id !== dto.permissionId);
    await this.storage.updateRolePermissions(dto.roleId, newPermissionIds);

    // Invalidate cache
    this.permissionCache.clear();
  }

  /**
   * Gets all permissions for a user
   * @param userId - User ID
   * @returns List of permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    return this.storage.getUserPermissions(userId);
  }

  /**
   * Gets user permission names with caching
   */
  private async getUserPermissionsCached(userId: string): Promise<string[]> {
    const cached = this.permissionCache.get(userId);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.permissions;
    }

    const permissions = await this.storage.getUserPermissionNames(userId);
    this.permissionCache.set(userId, {
      permissions,
      expiresAt: now + this.cacheTtl,
    });

    return permissions;
  }

  /**
   * Clears the permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Clears cache for a specific user
   * @param userId - User ID
   */
  clearUserCache(userId: string): void {
    this.permissionCache.delete(userId);
  }
}

/**
 * Creates a new PermissionService instance
 * @param storage - Storage implementation
 * @param options - Service options
 * @returns PermissionService instance
 */
export function createPermissionService(
  storage: PermissionStorage,
  options: { cacheTtl?: number } = {}
): PermissionService {
  return new PermissionService(storage, options);
}
