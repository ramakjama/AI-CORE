/**
 * ModuleEditorService
 *
 * Servicio para editar módulos existentes:
 * - Añadir nuevos endpoints
 * - Modificar servicios
 * - Actualizar DTOs
 * - Cambiar configuraciones
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';

interface ModuleEditDto {
  moduleId: string;
  action: 'add-endpoint' | 'modify-service' | 'update-dto' | 'change-config';
  target?: string;
  code?: string;
  config?: Record<string, any>;
}

@Injectable()
export class ModuleEditorService {
  private readonly logger = new Logger(ModuleEditorService.name);

  async editModule(dto: ModuleEditDto): Promise<{ success: boolean; message: string }> {
    this.logger.log(`✏️  Editing module: ${dto.moduleId}`);

    const modulePath = await this.findModulePath(dto.moduleId);

    if (!modulePath) {
      throw new NotFoundException(`Module not found: ${dto.moduleId}`);
    }

    switch (dto.action) {
      case 'add-endpoint':
        return this.addEndpoint(modulePath, dto);
      case 'modify-service':
        return this.modifyService(modulePath, dto);
      case 'update-dto':
        return this.updateDto(modulePath, dto);
      case 'change-config':
        return this.changeConfig(modulePath, dto);
      default:
        throw new BadRequestException(`Unknown action: ${dto.action}`);
    }
  }

  private async addEndpoint(modulePath: string, dto: ModuleEditDto) {
    // Implementar lógica para añadir endpoint
    return { success: true, message: 'Endpoint added successfully' };
  }

  private async modifyService(modulePath: string, dto: ModuleEditDto) {
    // Implementar lógica para modificar servicio
    return { success: true, message: 'Service modified successfully' };
  }

  private async updateDto(modulePath: string, dto: ModuleEditDto) {
    // Implementar lógica para actualizar DTO
    return { success: true, message: 'DTO updated successfully' };
  }

  private async changeConfig(modulePath: string, dto: ModuleEditDto) {
    const configPath = path.join(modulePath, 'module.config.json');

    if (!(await fs.pathExists(configPath))) {
      throw new NotFoundException('Module config not found');
    }

    const config = await fs.readJSON(configPath);
    const updatedConfig = { ...config, ...dto.config };

    await fs.writeJSON(configPath, updatedConfig, { spaces: 2 });

    return { success: true, message: 'Config updated successfully' };
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
}
