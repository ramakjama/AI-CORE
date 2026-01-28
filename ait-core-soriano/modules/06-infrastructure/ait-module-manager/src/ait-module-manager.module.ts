import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

// Controllers
import { ModuleManagerController } from './controllers/module-manager.controller';

// Services
import { ModuleGeneratorService } from './services/module-generator.service';
import { ModuleEditorService } from './services/module-editor.service';
import { ModuleDeleterService } from './services/module-deleter.service';

/**
 * AIT-MODULE-MANAGER Module
 *
 * Meta-módulo para gestión dinámica de módulos AIT
 *
 * Capacidades:
 * - Generar nuevos módulos desde templates
 * - Editar módulos existentes (endpoints, servicios, DTOs)
 * - Eliminar módulos con backup opcional
 * - Activar/desactivar módulos
 * - Gestionar templates
 * - Hot reload de módulos
 *
 * Sistema TODO EN UNO con templates incluidos
 */
@Module({
  imports: [
    ConfigModule,
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ModuleManagerController],
  providers: [
    ModuleGeneratorService,
    ModuleEditorService,
    ModuleDeleterService,
  ],
  exports: [
    ModuleGeneratorService,
    ModuleEditorService,
    ModuleDeleterService,
  ],
})
export class AitModuleManagerModule {}
