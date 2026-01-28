import { prisma } from '@/lib/prisma';

export class ModuleRegistry {
  private modules: Map<string, any> = new Map();

  /**
   * Discover and register all available modules
   */
  async discoverModules(): Promise<void> {
    console.log('🔍 Discovering modules...');

    const dbModules = await prisma.module.findMany();

    for (const module of dbModules) {
      this.modules.set(module.slug, module);
      console.log(`✅ Registered module: ${module.name}`);
    }

    console.log(`📦 Total modules registered: ${this.modules.size}`);
  }

  /**
   * Register a new module
   */
  async registerModule(moduleData: {
    name: string;
    slug: string;
    type: string;
    category?: string;
    isVital?: boolean;
    isEnabled?: boolean;
    version?: string;
    description?: string;
    apiEndpoint?: string;
    webhookUrl?: string;
    dependencies?: string[];
    config?: any;
  }): Promise<any> {
    const module = await prisma.module.upsert({
      where: { slug: moduleData.slug },
      update: {
        name: moduleData.name,
        type: moduleData.type as any,
        category: moduleData.category,
        isVital: moduleData.isVital ?? false,
        isEnabled: moduleData.isEnabled ?? true,
        version: moduleData.version || '1.0.0',
        description: moduleData.description,
        apiEndpoint: moduleData.apiEndpoint,
        webhookUrl: moduleData.webhookUrl,
        dependencies: moduleData.dependencies || [],
        config: moduleData.config || {},
      },
      create: {
        name: moduleData.name,
        slug: moduleData.slug,
        type: moduleData.type as any,
        category: moduleData.category,
        isVital: moduleData.isVital ?? false,
        isEnabled: moduleData.isEnabled ?? true,
        version: moduleData.version || '1.0.0',
        description: moduleData.description,
        apiEndpoint: moduleData.apiEndpoint,
        webhookUrl: moduleData.webhookUrl,
        dependencies: moduleData.dependencies || [],
        config: moduleData.config || {},
      },
    });

    this.modules.set(module.slug, module);
    console.log(`✅ Module registered: ${module.name}`);

    return module;
  }

  /**
   * Get a module by slug
   */
  async getModule(slug: string): Promise<any | null> {
    if (this.modules.has(slug)) {
      return this.modules.get(slug);
    }

    const module = await prisma.module.findUnique({
      where: { slug },
    });

    if (module) {
      this.modules.set(slug, module);
    }

    return module;
  }

  /**
   * Get all modules
   */
  getAllModules(): any[] {
    return Array.from(this.modules.values());
  }

  /**
   * Get modules by type
   */
  getModulesByType(type: string): any[] {
    return this.getAllModules().filter((m) => m.type === type);
  }

  /**
   * Get vital modules
   */
  getVitalModules(): any[] {
    return this.getAllModules().filter((m) => m.isVital);
  }

  /**
   * Check if a module is enabled
   */
  isModuleEnabled(slug: string): boolean {
    const module = this.modules.get(slug);
    return module?.isEnabled ?? false;
  }

  /**
   * Enable/disable a module
   */
  async setModuleEnabled(slug: string, enabled: boolean): Promise<void> {
    await prisma.module.update({
      where: { slug },
      data: { isEnabled: enabled },
    });

    const module = this.modules.get(slug);
    if (module) {
      module.isEnabled = enabled;
    }
  }

  /**
   * Update module health status
   */
  async updateModuleHealth(slug: string, status: string): Promise<void> {
    await prisma.module.update({
      where: { slug },
      data: {
        healthStatus: status,
        lastHealthCheck: new Date(),
      },
    });

    const module = this.modules.get(slug);
    if (module) {
      module.healthStatus = status;
      module.lastHealthCheck = new Date();
    }
  }

  /**
   * Get module dependencies
   */
  async getModuleDependencies(slug: string): Promise<any[]> {
    const module = await this.getModule(slug);
    if (!module || !module.dependencies || module.dependencies.length === 0) {
      return [];
    }

    const dependencies = [];
    for (const depSlug of module.dependencies) {
      const dep = await this.getModule(depSlug);
      if (dep) {
        dependencies.push(dep);
      }
    }

    return dependencies;
  }

  /**
   * Check if all dependencies are satisfied
   */
  async checkDependencies(slug: string): Promise<boolean> {
    const dependencies = await this.getModuleDependencies(slug);

    for (const dep of dependencies) {
      if (!dep.isEnabled) {
        console.warn(`⚠️ Dependency ${dep.name} is not enabled for ${slug}`);
        return false;
      }
    }

    return true;
  }
}
