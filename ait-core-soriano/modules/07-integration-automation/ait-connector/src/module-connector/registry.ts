/**
 * AIT-CONNECTOR - Module Registry
 * Manages module registration, storage, and retrieval
 */

import { Module, ModuleStatus, ModuleEvent, ModuleEventType, Logger } from '../types';
import { EventEmitter } from 'events';

export class ModuleRegistry extends EventEmitter {
  private modules: Map<string, Module> = new Map();
  private modulesByName: Map<string, string[]> = new Map();
  private logger: Logger;

  constructor(logger?: Logger) {
    super();
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Register a new module
   */
  async register(module: Module): Promise<void> {
    try {
      // Validate module data
      this.validateModule(module);

      // Check for conflicts
      if (this.modules.has(module.id)) {
        throw new Error(`Module with ID '${module.id}' is already registered`);
      }

      // Set initial status
      module.status = ModuleStatus.REGISTERED;
      module.loadedAt = new Date();

      // Store module
      this.modules.set(module.id, module);

      // Index by name
      const existingIds = this.modulesByName.get(module.name) || [];
      existingIds.push(module.id);
      this.modulesByName.set(module.name, existingIds);

      this.logger.info(`Module registered: ${module.name} (${module.id})`);

      // Emit event
      this.emitModuleEvent(ModuleEventType.REGISTERED, module.id, module);
    } catch (error) {
      this.logger.error(`Failed to register module: ${error}`);
      throw error;
    }
  }

  /**
   * Unregister a module
   */
  async unregister(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    // Remove from name index
    const nameIds = this.modulesByName.get(module.name) || [];
    const filtered = nameIds.filter(id => id !== moduleId);
    if (filtered.length > 0) {
      this.modulesByName.set(module.name, filtered);
    } else {
      this.modulesByName.delete(module.name);
    }

    // Remove module
    this.modules.delete(moduleId);

    this.logger.info(`Module unregistered: ${module.name} (${moduleId})`);
  }

  /**
   * Get module by ID
   */
  get(moduleId: string): Module | undefined {
    return this.modules.get(moduleId);
  }

  /**
   * Get modules by name
   */
  getByName(name: string): Module[] {
    const ids = this.modulesByName.get(name) || [];
    return ids.map(id => this.modules.get(id)).filter(m => m !== undefined) as Module[];
  }

  /**
   * Get all registered modules
   */
  getAll(): Module[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by status
   */
  getByStatus(status: ModuleStatus): Module[] {
    return this.getAll().filter(m => m.status === status);
  }

  /**
   * Update module status
   */
  updateStatus(moduleId: string, status: ModuleStatus): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    const oldStatus = module.status;
    module.status = status;

    this.logger.info(`Module ${moduleId} status changed: ${oldStatus} -> ${status}`);

    // Emit appropriate event
    let eventType: ModuleEventType;
    switch (status) {
      case ModuleStatus.LOADED:
        eventType = ModuleEventType.LOADED;
        break;
      case ModuleStatus.ACTIVE:
        eventType = ModuleEventType.ACTIVATED;
        break;
      case ModuleStatus.INACTIVE:
        eventType = ModuleEventType.DEACTIVATED;
        break;
      case ModuleStatus.ERROR:
        eventType = ModuleEventType.ERROR;
        break;
      case ModuleStatus.UNLOADED:
        eventType = ModuleEventType.UNLOADED;
        break;
      default:
        return;
    }

    this.emitModuleEvent(eventType, moduleId, { oldStatus, newStatus: status });
  }

  /**
   * Update module configuration
   */
  updateConfig(moduleId: string, config: Partial<Module['config']>): void {
    const module = this.modules.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    module.config = { ...module.config, ...config } as Module['config'];
    this.logger.info(`Module ${moduleId} configuration updated`);
  }

  /**
   * Check if module exists
   */
  has(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  /**
   * Get module count
   */
  count(): number {
    return this.modules.size;
  }

  /**
   * Clear all modules
   */
  clear(): void {
    this.modules.clear();
    this.modulesByName.clear();
    this.logger.info('All modules cleared from registry');
  }

  /**
   * Get registry statistics
   */
  getStats() {
    const statusCounts = new Map<ModuleStatus, number>();

    for (const module of this.modules.values()) {
      const count = statusCounts.get(module.status) || 0;
      statusCounts.set(module.status, count + 1);
    }

    return {
      total: this.modules.size,
      byStatus: Object.fromEntries(statusCounts),
      uniqueNames: this.modulesByName.size
    };
  }

  /**
   * Search modules
   */
  search(query: {
    name?: string;
    status?: ModuleStatus;
    category?: string;
    tag?: string;
  }): Module[] {
    let results = this.getAll();

    if (query.name) {
      results = results.filter(m =>
        m.name.toLowerCase().includes(query.name!.toLowerCase())
      );
    }

    if (query.status) {
      results = results.filter(m => m.status === query.status);
    }

    if (query.category) {
      results = results.filter(m =>
        m.metadata?.category === query.category
      );
    }

    if (query.tag) {
      results = results.filter(m =>
        m.metadata?.tags?.includes(query.tag!)
      );
    }

    return results;
  }

  /**
   * Validate module structure
   */
  private validateModule(module: Module): void {
    if (!module.id) {
      throw new Error('Module ID is required');
    }

    if (!module.name) {
      throw new Error('Module name is required');
    }

    if (!module.version) {
      throw new Error('Module version is required');
    }

    // Validate version format (semver)
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/;
    if (!versionRegex.test(module.version)) {
      throw new Error(`Invalid version format: ${module.version}`);
    }

    // Validate dependencies
    if (module.dependencies) {
      for (const dep of module.dependencies) {
        if (!dep.moduleId || !dep.version) {
          throw new Error('Invalid dependency structure');
        }
      }
    }
  }

  /**
   * Emit module event
   */
  private emitModuleEvent(type: ModuleEventType, moduleId: string, data?: any): void {
    const event: ModuleEvent = {
      type,
      moduleId,
      timestamp: new Date(),
      data
    };

    this.emit('module-event', event);
    this.emit(type, event);
  }

  /**
   * Create default logger
   */
  private createDefaultLogger(): Logger {
    return {
      debug: (message: string, ...meta: any[]) => console.debug(message, ...meta),
      info: (message: string, ...meta: any[]) => console.info(message, ...meta),
      warn: (message: string, ...meta: any[]) => console.warn(message, ...meta),
      error: (message: string, ...meta: any[]) => console.error(message, ...meta)
    };
  }
}

export default ModuleRegistry;
