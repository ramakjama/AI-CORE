/**
 * AIT-CONNECTOR - Module Loader
 * Handles dynamic module loading, hot reload, and lifecycle management
 */

import { Module, ModuleStatus, Logger } from '../types';
import { ModuleRegistry } from './registry';
import { ModuleValidator } from './validator';
import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';

export interface LoaderConfig {
  modulesPath: string;
  hotReload?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  parallelLoad?: boolean;
  watchIntervalMs?: number;
}

export class ModuleLoader extends EventEmitter {
  private registry: ModuleRegistry;
  private validator: ModuleValidator;
  private logger: Logger;
  private config: LoaderConfig;
  private loadedModules: Map<string, any> = new Map();
  private watchIntervals: Map<string, NodeJS.Timeout> = new Map();
  private isWatching: boolean = false;

  constructor(
    registry: ModuleRegistry,
    validator: ModuleValidator,
    config: LoaderConfig,
    logger?: Logger
  ) {
    super();
    this.registry = registry;
    this.validator = validator;
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      parallelLoad: true,
      watchIntervalMs: 5000,
      ...config
    };
    this.logger = logger || this.createDefaultLogger();
  }

  /**
   * Load a module by ID
   */
  async load(moduleId: string): Promise<void> {
    const module = this.registry.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found in registry`);
    }

    try {
      this.logger.info(`Loading module: ${module.name} (${moduleId})`);
      this.registry.updateStatus(moduleId, ModuleStatus.LOADING);

      // Validate dependencies
      const validation = await this.validator.validate(module);
      if (!validation.valid) {
        throw new Error(
          `Module validation failed: ${validation.errors.map(e => e.message).join(', ')}`
        );
      }

      // Load dependencies first
      if (module.dependencies) {
        await this.loadDependencies(module);
      }

      // Load module implementation
      const moduleInstance = await this.loadModuleImplementation(module);
      this.loadedModules.set(moduleId, moduleInstance);

      // Initialize module
      if (moduleInstance.initialize) {
        await moduleInstance.initialize();
      }

      // Update status
      this.registry.updateStatus(moduleId, ModuleStatus.LOADED);

      // Auto-activate if configured
      if (module.config?.enabled) {
        await this.activate(moduleId);
      }

      this.logger.info(`Module loaded successfully: ${module.name}`);

      // Start watching for hot reload
      if (this.config.hotReload) {
        this.watchModule(moduleId);
      }

      this.emit('module-loaded', { moduleId, module });
    } catch (error) {
      this.logger.error(`Failed to load module ${moduleId}:`, error);
      this.registry.updateStatus(moduleId, ModuleStatus.ERROR);
      throw error;
    }
  }

  /**
   * Load multiple modules
   */
  async loadMany(moduleIds: string[]): Promise<void> {
    if (this.config.parallelLoad) {
      await Promise.all(moduleIds.map(id => this.load(id)));
    } else {
      for (const id of moduleIds) {
        await this.load(id);
      }
    }
  }

  /**
   * Load all registered modules
   */
  async loadAll(): Promise<void> {
    const modules = this.registry.getAll();
    const moduleIds = modules
      .filter(m => m.config?.autoLoad !== false)
      .sort((a, b) => (b.config?.priority || 0) - (a.config?.priority || 0))
      .map(m => m.id);

    await this.loadMany(moduleIds);
  }

  /**
   * Unload a module
   */
  async unload(moduleId: string): Promise<void> {
    const module = this.registry.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    try {
      this.logger.info(`Unloading module: ${module.name} (${moduleId})`);
      this.registry.updateStatus(moduleId, ModuleStatus.UNLOADING);

      // Deactivate if active
      if (module.status === ModuleStatus.ACTIVE) {
        await this.deactivate(moduleId);
      }

      // Stop watching
      this.stopWatchingModule(moduleId);

      // Call cleanup
      const moduleInstance = this.loadedModules.get(moduleId);
      if (moduleInstance?.cleanup) {
        await moduleInstance.cleanup();
      }

      // Remove from loaded modules
      this.loadedModules.delete(moduleId);

      // Update status
      this.registry.updateStatus(moduleId, ModuleStatus.UNLOADED);

      this.logger.info(`Module unloaded: ${module.name}`);
      this.emit('module-unloaded', { moduleId, module });
    } catch (error) {
      this.logger.error(`Failed to unload module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Reload a module (hot reload)
   */
  async reload(moduleId: string): Promise<void> {
    this.logger.info(`Reloading module: ${moduleId}`);

    await this.unload(moduleId);
    await this.load(moduleId);

    this.emit('module-reloaded', { moduleId });
  }

  /**
   * Activate a loaded module
   */
  async activate(moduleId: string): Promise<void> {
    const module = this.registry.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    if (module.status !== ModuleStatus.LOADED && module.status !== ModuleStatus.INACTIVE) {
      throw new Error(`Module must be loaded or inactive to activate. Current status: ${module.status}`);
    }

    try {
      this.logger.info(`Activating module: ${module.name}`);

      const moduleInstance = this.loadedModules.get(moduleId);
      if (moduleInstance?.activate) {
        await moduleInstance.activate();
      }

      this.registry.updateStatus(moduleId, ModuleStatus.ACTIVE);
      this.logger.info(`Module activated: ${module.name}`);
    } catch (error) {
      this.logger.error(`Failed to activate module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Deactivate an active module
   */
  async deactivate(moduleId: string): Promise<void> {
    const module = this.registry.get(moduleId);
    if (!module) {
      throw new Error(`Module '${moduleId}' not found`);
    }

    if (module.status !== ModuleStatus.ACTIVE) {
      throw new Error(`Module is not active. Current status: ${module.status}`);
    }

    try {
      this.logger.info(`Deactivating module: ${module.name}`);

      const moduleInstance = this.loadedModules.get(moduleId);
      if (moduleInstance?.deactivate) {
        await moduleInstance.deactivate();
      }

      this.registry.updateStatus(moduleId, ModuleStatus.INACTIVE);
      this.logger.info(`Module deactivated: ${module.name}`);
    } catch (error) {
      this.logger.error(`Failed to deactivate module ${moduleId}:`, error);
      throw error;
    }
  }

  /**
   * Get loaded module instance
   */
  getInstance(moduleId: string): any {
    return this.loadedModules.get(moduleId);
  }

  /**
   * Load module dependencies
   */
  private async loadDependencies(module: Module): Promise<void> {
    if (!module.dependencies || module.dependencies.length === 0) {
      return;
    }

    this.logger.info(`Loading dependencies for ${module.name}...`);

    for (const dep of module.dependencies) {
      const depModule = this.registry.get(dep.moduleId);

      if (!depModule) {
        if (dep.required) {
          throw new Error(`Required dependency '${dep.moduleId}' not found`);
        }
        this.logger.warn(`Optional dependency '${dep.moduleId}' not found`);
        continue;
      }

      // Load dependency if not already loaded
      if (depModule.status !== ModuleStatus.LOADED && depModule.status !== ModuleStatus.ACTIVE) {
        await this.load(dep.moduleId);
      }
    }
  }

  /**
   * Load module implementation from file system
   */
  private async loadModuleImplementation(module: Module): Promise<any> {
    const modulePath = path.join(this.config.modulesPath, module.id);
    const entryPoint = path.join(modulePath, 'index.js');

    try {
      // Check if module file exists
      await fs.access(entryPoint);

      // Clear require cache for hot reload
      if (require.cache[entryPoint]) {
        delete require.cache[entryPoint];
      }

      // Load module
      const moduleInstance = require(entryPoint);

      return moduleInstance.default || moduleInstance;
    } catch (error) {
      throw new Error(`Failed to load module implementation: ${error}`);
    }
  }

  /**
   * Watch module for changes (hot reload)
   */
  private watchModule(moduleId: string): void {
    if (this.watchIntervals.has(moduleId)) {
      return; // Already watching
    }

    const module = this.registry.get(moduleId);
    if (!module) return;

    const modulePath = path.join(this.config.modulesPath, module.id);
    let lastMtime: Date | null = null;

    const checkForChanges = async () => {
      try {
        const entryPoint = path.join(modulePath, 'index.js');
        const stats = await fs.stat(entryPoint);

        if (lastMtime && stats.mtime > lastMtime) {
          this.logger.info(`Detected changes in module: ${module.name}`);
          await this.reload(moduleId);
        }

        lastMtime = stats.mtime;
      } catch (error) {
        this.logger.error(`Error watching module ${moduleId}:`, error);
      }
    };

    const interval = setInterval(checkForChanges, this.config.watchIntervalMs);
    this.watchIntervals.set(moduleId, interval);

    // Initial check
    checkForChanges();
  }

  /**
   * Stop watching a module
   */
  private stopWatchingModule(moduleId: string): void {
    const interval = this.watchIntervals.get(moduleId);
    if (interval) {
      clearInterval(interval);
      this.watchIntervals.delete(moduleId);
    }
  }

  /**
   * Start watching all modules
   */
  startWatching(): void {
    if (this.isWatching) return;

    this.isWatching = true;
    const loadedModules = Array.from(this.loadedModules.keys());

    for (const moduleId of loadedModules) {
      this.watchModule(moduleId);
    }

    this.logger.info('Started watching modules for changes');
  }

  /**
   * Stop watching all modules
   */
  stopWatching(): void {
    if (!this.isWatching) return;

    this.isWatching = false;

    for (const [moduleId, interval] of this.watchIntervals) {
      clearInterval(interval);
    }

    this.watchIntervals.clear();
    this.logger.info('Stopped watching modules');
  }

  /**
   * Get loader statistics
   */
  getStats() {
    return {
      loadedCount: this.loadedModules.size,
      watchingCount: this.watchIntervals.size,
      isWatching: this.isWatching
    };
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

export default ModuleLoader;
