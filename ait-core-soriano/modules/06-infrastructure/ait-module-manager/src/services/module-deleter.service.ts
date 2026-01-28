/**
 * ModuleDeleterService
 *
 * Servicio para eliminar módulos de forma segura
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

@Injectable()
export class ModuleDeleterService {
  private readonly logger = new Logger(ModuleDeleterService.name);

  async deleteModule(
    moduleId: string,
    options: { backup?: boolean; force?: boolean } = {},
  ): Promise<{ success: boolean; message: string; backupPath?: string }> {
    this.logger.warn(`🗑️  Deleting module: ${moduleId}`);

    const modulePath = await this.findModulePath(moduleId);

    if (!modulePath) {
      throw new NotFoundException(`Module not found: ${moduleId}`);
    }

    // Verificar si es módulo core (no se puede eliminar)
    if (await this.isCoreModule(moduleId)) {
      if (!options.force) {
        throw new BadRequestException('Cannot delete core module without force flag');
      }
      this.logger.warn(`⚠️  Force deleting core module: ${moduleId}`);
    }

    let backupPath: string | undefined;

    // Backup si se solicita
    if (options.backup) {
      backupPath = await this.backupModule(modulePath);
      this.logger.log(`📦 Backup created: ${backupPath}`);
    }

    // Eliminar módulo
    await fs.remove(modulePath);

    // Actualizar registry
    await this.removeFromRegistry(moduleId);

    this.logger.log(`✅ Module deleted: ${moduleId}`);

    return {
      success: true,
      message: `Module ${moduleId} deleted successfully`,
      backupPath,
    };
  }

  private async findModulePath(moduleId: string): Promise<string | null> {
    const modulesDir = path.join(process.cwd(), 'modules');
    const categories = await fs.readdir(modulesDir);

    for (const category of categories) {
      const categoryPath = path.join(modulesDir, category);
      if (!(await fs.stat(categoryPath)).isDirectory()) continue;

      const modulePath = path.join(categoryPath, moduleId);
      if (await fs.pathExists(modulePath)) {
        return modulePath;
      }
    }

    return null;
  }

  private async isCoreModule(moduleId: string): Promise<boolean> {
    const coreModules = [
      'ait-pgc-engine',
      'ait-accountant',
      'ait-authenticator',
      'ait-module-manager',
    ];
    return coreModules.includes(moduleId);
  }

  private async backupModule(modulePath: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const moduleName = path.basename(modulePath);
    const backupPath = path.join(process.cwd(), '_backups', `${moduleName}-${timestamp}`);

    await fs.ensureDir(path.dirname(backupPath));
    await fs.copy(modulePath, backupPath);

    return backupPath;
  }

  private async removeFromRegistry(moduleId: string): Promise<void> {
    const registryPath = path.join(process.cwd(), 'MODULE_REGISTRY.json');

    if (!(await fs.pathExists(registryPath))) return;

    const registry = await fs.readJSON(registryPath);

    registry.registry.modules = registry.registry.modules.filter(
      (m: any) => m.moduleId !== moduleId,
    );
    registry.totalModules = registry.registry.modules.length;

    await fs.writeJSON(registryPath, registry, { spaces: 2 });
  }
}
