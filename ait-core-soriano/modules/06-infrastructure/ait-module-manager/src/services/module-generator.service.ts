/**
 * ModuleGeneratorService
 *
 * Servicio para generar nuevos módulos AIT dinámicamente
 * usando templates de Handlebars
 */

import {
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { glob } from 'glob';

interface GenerateModuleDto {
  moduleName: string;
  category: string;
  description: string;
  entityName: string;
  port: number;
  features?: string[];
  dependencies?: string[];
}

interface GenerationResult {
  success: boolean;
  modulePath: string;
  filesCreated: string[];
  errors?: string[];
  warnings?: string[];
}

@Injectable()
export class ModuleGeneratorService {
  private readonly logger = new Logger(ModuleGeneratorService.name);
  private readonly templatesDir = path.join(process.cwd(), 'templates', 'module');
  private readonly modulesBaseDir = path.join(process.cwd(), 'modules');

  /**
   * Generar nuevo módulo completo
   */
  async generateModule(dto: GenerateModuleDto): Promise<GenerationResult> {
    this.logger.log(`🏗️  Generating module: ${dto.moduleName}`);

    try {
      // Validar nombre
      this.validateModuleName(dto.moduleName);

      // Preparar variables para templates
      const vars = this.prepareTemplateVars(dto);

      // Determinar ruta destino
      const targetPath = this.getModulePath(dto.category, dto.moduleName);

      // Verificar si ya existe
      if (await fs.pathExists(targetPath)) {
        throw new BadRequestException(`Module already exists: ${targetPath}`);
      }

      // Copiar y procesar templates
      const filesCreated = await this.processTemplates(this.templatesDir, targetPath, vars);

      // Registrar en MODULE_REGISTRY.json
      await this.registerModule(vars);

      this.logger.log(`✅ Module generated successfully: ${dto.moduleName}`);
      this.logger.log(`📂 Location: ${targetPath}`);
      this.logger.log(`📄 Files created: ${filesCreated.length}`);

      return {
        success: true,
        modulePath: targetPath,
        filesCreated,
      };
    } catch (error) {
      this.logger.error(`❌ Error generating module: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Failed to generate module: ${error.message}`);
    }
  }

  /**
   * Validar nombre de módulo
   */
  private validateModuleName(moduleName: string): void {
    if (!moduleName.startsWith('ait-')) {
      throw new BadRequestException('Module name must start with "ait-"');
    }

    if (!/^[a-z0-9-]+$/.test(moduleName)) {
      throw new BadRequestException('Module name must be lowercase with hyphens only');
    }

    if (moduleName.length < 5 || moduleName.length > 50) {
      throw new BadRequestException('Module name must be between 5 and 50 characters');
    }
  }

  /**
   * Preparar variables para templates
   */
  private prepareTemplateVars(dto: GenerateModuleDto): Record<string, any> {
    const moduleNameClean = dto.moduleName.replace(/^ait-/, '');

    return {
      MODULE_NAME: dto.moduleName,
      MODULE_NAME_KEBAB: this.toKebabCase(dto.moduleName),
      MODULE_NAME_PASCAL: this.toPascalCase(moduleNameClean),
      MODULE_NAME_CAMEL: this.toCamelCase(moduleNameClean),
      MODULE_NAME_UPPER: this.toUpperSnakeCase(dto.moduleName),
      MODULE_ID: this.toKebabCase(dto.moduleName),
      MODULE_DESCRIPTION: dto.description,
      MODULE_TAG: moduleNameClean,
      MODULE_ROUTE: this.toKebabCase(moduleNameClean),

      ENTITY_NAME: dto.entityName,
      ENTITY_NAME_PASCAL: this.toPascalCase(dto.entityName),
      ENTITY_NAME_CAMEL: this.toCamelCase(dto.entityName),
      ENTITY_NAME_KEBAB: this.toKebabCase(dto.entityName),
      ENTITY_NAME_PLURAL: dto.entityName + 's',

      CATEGORY: dto.category,
      PORT: dto.port,
      DATABASE_NAME: `${this.toKebabCase(moduleNameClean)}_db`,

      REQUIRED_DEPS: (dto.dependencies || []).map(d => `"${d}"`).join(', '),
      CAPABILITIES: (dto.features || ['crud']).map(f => `"${f}"`).join(', '),

      FIELD_1_NAME: 'name',
      FIELD_1_DESCRIPTION: 'Name',
      FIELD_1_EXAMPLE: 'Example name',
      FIELD_2_NAME: 'description',
      FIELD_2_DESCRIPTION: 'Description',
      FIELD_2_EXAMPLE: 'Example description',
    };
  }

  /**
   * Procesar templates recursivamente
   */
  private async processTemplates(
    srcDir: string,
    destDir: string,
    vars: Record<string, any>,
  ): Promise<string[]> {
    const filesCreated: string[] = [];

    if (!(await fs.pathExists(srcDir))) {
      throw new Error(`Template directory not found: ${srcDir}`);
    }

    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      let destPath = path.join(destDir, entry.name);

      // Reemplazar variables en nombres de archivos/carpetas
      destPath = this.replaceVariablesInPath(destPath, vars);

      if (entry.isDirectory()) {
        await fs.ensureDir(destPath);
        const subFiles = await this.processTemplates(srcPath, destPath, vars);
        filesCreated.push(...subFiles);
      } else if (entry.name.endsWith('.template')) {
        // Procesar template
        destPath = destPath.replace('.template', '');
        await this.processTemplateFile(srcPath, destPath, vars);
        filesCreated.push(destPath);
      } else {
        // Copiar archivo sin procesar
        await fs.copy(srcPath, destPath);
        filesCreated.push(destPath);
      }
    }

    return filesCreated;
  }

  /**
   * Procesar archivo template individual
   */
  private async processTemplateFile(
    srcPath: string,
    destPath: string,
    vars: Record<string, any>,
  ): Promise<void> {
    const content = await fs.readFile(srcPath, 'utf8');
    const template = Handlebars.compile(content);
    const output = template(vars);

    await fs.ensureDir(path.dirname(destPath));
    await fs.writeFile(destPath, output, 'utf8');
  }

  /**
   * Reemplazar variables en rutas
   */
  private replaceVariablesInPath(filePath: string, vars: Record<string, any>): string {
    let result = filePath;

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Registrar módulo en MODULE_REGISTRY.json
   */
  private async registerModule(vars: Record<string, any>): Promise<void> {
    const registryPath = path.join(process.cwd(), 'MODULE_REGISTRY.json');

    let registry: any = { registry: { modules: [] } };

    if (await fs.pathExists(registryPath)) {
      registry = await fs.readJSON(registryPath);
    }

    const newModule = {
      moduleId: vars.MODULE_ID,
      moduleName: vars.MODULE_NAME.toUpperCase(),
      category: vars.CATEGORY,
      version: '1.0.0',
      enabled: false,
      priority: 'medium',
      status: 'pending',
      health: 'unknown',
      dependencies: [],
      consumers: [],
      lastHealthCheck: null,
      endpoints: {
        api: `http://localhost:${vars.PORT}/api/v1/${vars.MODULE_ID}`,
        health: `http://localhost:${vars.PORT}/health`,
        swagger: `http://localhost:${vars.PORT}/api-docs`,
      },
    };

    registry.registry.modules.push(newModule);
    registry.totalModules = registry.registry.modules.length;

    await fs.writeJSON(registryPath, registry, { spaces: 2 });
  }

  /**
   * Obtener ruta de módulo
   */
  private getModulePath(category: string, moduleName: string): string {
    return path.join(this.modulesBaseDir, category, moduleName);
  }

  // Utility: conversión de nombres
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/\s+/g, '-')
      .toLowerCase();
  }

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_\s](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }

  private toCamelCase(str: string): string {
    const pascal = this.toPascalCase(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  private toUpperSnakeCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-\s]/g, '_')
      .toUpperCase();
  }
}
