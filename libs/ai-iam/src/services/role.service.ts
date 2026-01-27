/**
 * @fileoverview Role service for AI-IAM module
 * @module @ai-core/ai-iam/services/role
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Role,
  RoleWithPermissions,
  RoleAssignment,
  CreateRoleDTO,
  UpdateRoleDTO,
  AssignRoleDTO,
  RevokeRoleDTO,
  Permission,
} from '../types';

/**
 * Storage interface for RoleService
 */
export interface RoleStorage {
  /** Create a new role */
  create(role: Role): Promise<Role>;
  /** Find role by ID */
  findById(id: string): Promise<Role | null>;
  /** Find role by name */
  findByName(name: string, tenantId: string): Promise<Role | null>;
  /** Update role */
  update(id: string, updates: Partial<Role>): Promise<Role>;
  /** Delete role */
  delete(id: string): Promise<void>;
  /** List roles */
  list(options: RoleListOptions): Promise<RoleListResult>;
  /** Get permissions for role */
  getPermissions(roleId: string): Promise<Permission[]>;
  /** Get parent roles (for hierarchy) */
  getParentRoles(roleId: string): Promise<Role[]>;
  /** Create role assignment */
  createAssignment(assignment: RoleAssignment): Promise<RoleAssignment>;
  /** Find assignment */
  findAssignment(userId: string, roleId: string): Promise<RoleAssignment | null>;
  /** Update assignment */
  updateAssignment(id: string, updates: Partial<RoleAssignment>): Promise<RoleAssignment>;
  /** Delete assignment */
  deleteAssignment(id: string): Promise<void>;
  /** List user assignments */
  listUserAssignments(userId: string): Promise<RoleAssignment[]>;
  /** List role assignments */
  listRoleAssignments(roleId: string): Promise<RoleAssignment[]>;
}

/**
 * Role list options
 */
export interface RoleListOptions {
  /** Filter by tenant ID */
  tenantId?: string;
  /** Include inactive roles */
  includeInactive?: boolean;
  /** Search query */
  search?: string;
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: keyof Role;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Role list result
 */
export interface RoleListResult {
  /** List of roles */
  roles: Role[];
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
export class InMemoryRoleStorage implements RoleStorage {
  private roles: Map<string, Role> = new Map();
  private assignments: Map<string, RoleAssignment> = new Map();
  private permissions: Map<string, Permission[]> = new Map();

  async create(role: Role): Promise<Role> {
    this.roles.set(role.id, role);
    return role;
  }

  async findById(id: string): Promise<Role | null> {
    return this.roles.get(id) ?? null;
  }

  async findByName(name: string, tenantId: string): Promise<Role | null> {
    for (const role of this.roles.values()) {
      if (role.name.toLowerCase() === name.toLowerCase() && role.tenantId === tenantId) {
        return role;
      }
    }
    return null;
  }

  async update(id: string, updates: Partial<Role>): Promise<Role> {
    const role = this.roles.get(id);
    if (!role) {
      throw new Error('Role not found');
    }
    const updated = { ...role, ...updates, updatedAt: new Date() };
    this.roles.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.roles.delete(id);
    // Also delete assignments
    for (const [assignmentId, assignment] of this.assignments.entries()) {
      if (assignment.roleId === id) {
        this.assignments.delete(assignmentId);
      }
    }
  }

  async list(options: RoleListOptions): Promise<RoleListResult> {
    let roles = Array.from(this.roles.values());

    // Apply filters
    if (options.tenantId) {
      roles = roles.filter((r) => r.tenantId === options.tenantId);
    }

    if (!options.includeInactive) {
      roles = roles.filter((r) => r.isActive);
    }

    if (options.search) {
      const search = options.search.toLowerCase();
      roles = roles.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.displayName.toLowerCase().includes(search) ||
          r.description.toLowerCase().includes(search)
      );
    }

    // Sort
    const sortBy = options.sortBy ?? 'priority';
    const sortOrder = options.sortOrder ?? 'desc';
    roles.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = roles.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const totalPages = Math.ceil(total / limit);

    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    roles = roles.slice(start, end);

    return {
      roles,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getPermissions(roleId: string): Promise<Permission[]> {
    return this.permissions.get(roleId) ?? [];
  }

  async getParentRoles(roleId: string): Promise<Role[]> {
    const parents: Role[] = [];
    const role = this.roles.get(roleId);

    if (role?.parentRoleId) {
      const parent = this.roles.get(role.parentRoleId);
      if (parent) {
        parents.push(parent);
        // Recursively get parents
        const grandParents = await this.getParentRoles(parent.id);
        parents.push(...grandParents);
      }
    }

    return parents;
  }

  async createAssignment(assignment: RoleAssignment): Promise<RoleAssignment> {
    this.assignments.set(assignment.id, assignment);
    return assignment;
  }

  async findAssignment(userId: string, roleId: string): Promise<RoleAssignment | null> {
    for (const assignment of this.assignments.values()) {
      if (assignment.userId === userId && assignment.roleId === roleId) {
        return assignment;
      }
    }
    return null;
  }

  async updateAssignment(id: string, updates: Partial<RoleAssignment>): Promise<RoleAssignment> {
    const assignment = this.assignments.get(id);
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    const updated = { ...assignment, ...updates };
    this.assignments.set(id, updated);
    return updated;
  }

  async deleteAssignment(id: string): Promise<void> {
    this.assignments.delete(id);
  }

  async listUserAssignments(userId: string): Promise<RoleAssignment[]> {
    return Array.from(this.assignments.values()).filter(
      (a) => a.userId === userId && a.isActive
    );
  }

  async listRoleAssignments(roleId: string): Promise<RoleAssignment[]> {
    return Array.from(this.assignments.values()).filter(
      (a) => a.roleId === roleId && a.isActive
    );
  }

  // Helper methods for testing
  setPermissions(roleId: string, permissions: Permission[]): void {
    this.permissions.set(roleId, permissions);
  }

  clear(): void {
    this.roles.clear();
    this.assignments.clear();
    this.permissions.clear();
  }

  getAll(): Role[] {
    return Array.from(this.roles.values());
  }
}

/**
 * Role service error
 */
export class RoleServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'RoleServiceError';
  }
}

/**
 * Role service for CRUD and assignment operations
 */
export class RoleService {
  private readonly storage: RoleStorage;

  /**
   * Creates a new RoleService instance
   * @param storage - Storage implementation
   */
  constructor(storage: RoleStorage) {
    this.storage = storage;
  }

  /**
   * Creates a new role
   * @param dto - Role creation data
   * @returns Created role
   */
  async create(dto: CreateRoleDTO): Promise<Role> {
    // Check name uniqueness
    const existing = await this.storage.findByName(dto.name, dto.tenantId);
    if (existing) {
      throw new RoleServiceError('Role name already exists', 'NAME_EXISTS');
    }

    // Validate parent role if specified
    if (dto.parentRoleId) {
      const parent = await this.storage.findById(dto.parentRoleId);
      if (!parent) {
        throw new RoleServiceError('Parent role not found', 'PARENT_NOT_FOUND');
      }
      if (parent.tenantId !== dto.tenantId) {
        throw new RoleServiceError('Parent role belongs to different tenant', 'INVALID_PARENT');
      }
    }

    const now = new Date();
    const role: Role = {
      id: uuidv4(),
      name: dto.name.toLowerCase(),
      code: dto.code || dto.name.toLowerCase().replace(/\s+/g, '_'),
      displayName: dto.displayName,
      description: dto.description,
      permissions: [],
      permissionIds: dto.permissionIds ?? [],
      isSystem: false,
      isActive: true,
      parentRoleId: dto.parentRoleId,
      priority: dto.priority ?? 0,
      tenantId: dto.tenantId,
      metadata: dto.metadata,
      createdAt: now,
      updatedAt: now,
    };

    return this.storage.create(role);
  }

  /**
   * Gets a role by ID
   * @param id - Role ID
   * @returns Role or null
   */
  async getById(id: string): Promise<Role | null> {
    return this.storage.findById(id);
  }

  /**
   * Gets a role by name
   * @param name - Role name
   * @param tenantId - Tenant ID
   * @returns Role or null
   */
  async getByName(name: string, tenantId: string): Promise<Role | null> {
    return this.storage.findByName(name, tenantId);
  }

  /**
   * Gets a role with all permissions resolved
   * @param id - Role ID
   * @returns Role with permissions or null
   */
  async getWithPermissions(id: string): Promise<RoleWithPermissions | null> {
    const role = await this.storage.findById(id);
    if (!role) {
      return null;
    }

    // Get direct permissions
    const permissions = await this.storage.getPermissions(id);

    // Get inherited permissions from parent roles
    const parentRoles = await this.storage.getParentRoles(id);
    const inheritedPermissions: Permission[] = [];

    for (const parent of parentRoles) {
      const parentPerms = await this.storage.getPermissions(parent.id);
      inheritedPermissions.push(...parentPerms);
    }

    // Combine and deduplicate
    const allPermissions = [...permissions, ...inheritedPermissions];
    const uniquePermissions = Array.from(
      new Map(allPermissions.map((p) => [p.id, p])).values()
    );

    return {
      ...role,
      permissions,
      inheritedPermissions,
      effectivePermissions: uniquePermissions,
    };
  }

  /**
   * Updates a role
   * @param id - Role ID
   * @param dto - Update data
   * @returns Updated role
   */
  async update(id: string, dto: UpdateRoleDTO): Promise<Role> {
    const role = await this.storage.findById(id);
    if (!role) {
      throw new RoleServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    if (role.isSystem) {
      throw new RoleServiceError('Cannot update system role', 'SYSTEM_ROLE');
    }

    // Validate parent role if changed
    if (dto.parentRoleId !== undefined && dto.parentRoleId !== null) {
      if (dto.parentRoleId === id) {
        throw new RoleServiceError('Role cannot be its own parent', 'CIRCULAR_REFERENCE');
      }

      const parent = await this.storage.findById(dto.parentRoleId);
      if (!parent) {
        throw new RoleServiceError('Parent role not found', 'PARENT_NOT_FOUND');
      }

      // Check for circular reference
      const ancestors = await this.storage.getParentRoles(dto.parentRoleId);
      if (ancestors.some((a) => a.id === id)) {
        throw new RoleServiceError('Circular parent reference detected', 'CIRCULAR_REFERENCE');
      }
    }

    const updates: Partial<Role> = {};

    if (dto.displayName !== undefined) {
      updates.displayName = dto.displayName;
    }
    if (dto.description !== undefined) {
      updates.description = dto.description;
    }
    if (dto.permissionIds !== undefined) {
      updates.permissionIds = dto.permissionIds;
    }
    if (dto.parentRoleId !== undefined) {
      updates.parentRoleId = dto.parentRoleId === null ? undefined : dto.parentRoleId;
    }
    if (dto.priority !== undefined) {
      updates.priority = dto.priority;
    }
    if (dto.isActive !== undefined) {
      updates.isActive = dto.isActive;
    }
    if (dto.metadata !== undefined) {
      updates.metadata = { ...role.metadata, ...dto.metadata };
    }

    return this.storage.update(id, updates);
  }

  /**
   * Deletes a role
   * @param id - Role ID
   */
  async delete(id: string): Promise<void> {
    const role = await this.storage.findById(id);
    if (!role) {
      throw new RoleServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    if (role.isSystem) {
      throw new RoleServiceError('Cannot delete system role', 'SYSTEM_ROLE');
    }

    // Check if role is parent of other roles
    const children = (await this.storage.list({ tenantId: role.tenantId })).roles.filter(
      (r) => r.parentRoleId === id
    );

    if (children.length > 0) {
      throw new RoleServiceError(
        'Cannot delete role that has child roles',
        'HAS_CHILDREN',
        { childCount: children.length }
      );
    }

    await this.storage.delete(id);
  }

  /**
   * Lists roles with pagination
   * @param options - List options
   * @returns List result
   */
  async list(options: RoleListOptions = {}): Promise<RoleListResult> {
    return this.storage.list(options);
  }

  /**
   * Assigns a role to a user
   * @param dto - Assignment data
   * @param assignedBy - User ID who is assigning
   * @returns Role assignment
   */
  async assignRole(dto: AssignRoleDTO, assignedBy: string): Promise<RoleAssignment> {
    // Check if role exists
    const role = await this.storage.findById(dto.roleId);
    if (!role) {
      throw new RoleServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    if (!role.isActive) {
      throw new RoleServiceError('Cannot assign inactive role', 'ROLE_INACTIVE');
    }

    // Check for existing assignment
    const existing = await this.storage.findAssignment(dto.userId, dto.roleId);
    if (existing) {
      if (existing.isActive) {
        throw new RoleServiceError('User already has this role', 'ALREADY_ASSIGNED');
      }
      // Reactivate existing assignment
      return this.storage.updateAssignment(existing.id, {
        isActive: true,
        assignedAt: new Date(),
        assignedBy,
        expiresAt: dto.expiresAt,
      });
    }

    const assignment: RoleAssignment = {
      id: uuidv4(),
      userId: dto.userId,
      roleId: dto.roleId,
      assignedAt: new Date(),
      assignedBy,
      expiresAt: dto.expiresAt,
      isActive: true,
      tenantId: role.tenantId,
    };

    return this.storage.createAssignment(assignment);
  }

  /**
   * Revokes a role from a user
   * @param dto - Revocation data
   */
  async revokeRole(dto: RevokeRoleDTO): Promise<void> {
    const assignment = await this.storage.findAssignment(dto.userId, dto.roleId);
    if (!assignment) {
      throw new RoleServiceError('Role assignment not found', 'ASSIGNMENT_NOT_FOUND');
    }

    if (!assignment.isActive) {
      throw new RoleServiceError('Role is not currently assigned', 'NOT_ASSIGNED');
    }

    await this.storage.updateAssignment(assignment.id, { isActive: false });
  }

  /**
   * Gets all roles assigned to a user
   * @param userId - User ID
   * @returns List of roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const assignments = await this.storage.listUserAssignments(userId);
    const now = new Date();

    // Filter out expired assignments
    const activeAssignments = assignments.filter(
      (a) => !a.expiresAt || a.expiresAt > now
    );

    const roles: Role[] = [];
    for (const assignment of activeAssignments) {
      const role = await this.storage.findById(assignment.roleId);
      if (role && role.isActive) {
        roles.push(role);
      }
    }

    return roles;
  }

  /**
   * Gets all users assigned to a role
   * @param roleId - Role ID
   * @returns List of user IDs
   */
  async getRoleUsers(roleId: string): Promise<string[]> {
    const assignments = await this.storage.listRoleAssignments(roleId);
    const now = new Date();

    return assignments
      .filter((a) => !a.expiresAt || a.expiresAt > now)
      .map((a) => a.userId);
  }

  /**
   * Checks if a user has a specific role
   * @param userId - User ID
   * @param roleId - Role ID
   * @returns True if user has the role
   */
  async hasRole(userId: string, roleId: string): Promise<boolean> {
    const assignment = await this.storage.findAssignment(userId, roleId);
    if (!assignment || !assignment.isActive) {
      return false;
    }

    if (assignment.expiresAt && assignment.expiresAt <= new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Adds permissions to a role
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to add
   */
  async addPermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.storage.findById(roleId);
    if (!role) {
      throw new RoleServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    const newPermissionIds = [...new Set([...role.permissionIds, ...permissionIds])];
    return this.storage.update(roleId, { permissionIds: newPermissionIds });
  }

  /**
   * Removes permissions from a role
   * @param roleId - Role ID
   * @param permissionIds - Permission IDs to remove
   */
  async removePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.storage.findById(roleId);
    if (!role) {
      throw new RoleServiceError('Role not found', 'ROLE_NOT_FOUND');
    }

    const newPermissionIds = role.permissionIds.filter((id) => !permissionIds.includes(id));
    return this.storage.update(roleId, { permissionIds: newPermissionIds });
  }
}

/**
 * Creates a new RoleService instance
 * @param storage - Storage implementation
 * @returns RoleService instance
 */
export function createRoleService(storage: RoleStorage): RoleService {
  return new RoleService(storage);
}
