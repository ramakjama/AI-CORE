import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ModuleGeneratorService } from '../services/module-generator.service';
import { ModuleEditorService } from '../services/module-editor.service';
import { ModuleDeleterService } from '../services/module-deleter.service';

@ApiTags('module-manager')
@Controller('module-manager')
@ApiBearerAuth()
export class ModuleManagerController {
  private readonly logger = new Logger(ModuleManagerController.name);

  constructor(
    private readonly generatorService: ModuleGeneratorService,
    private readonly editorService: ModuleEditorService,
    private readonly deleterService: ModuleDeleterService,
  ) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate new module' })
  @ApiResponse({ status: 201, description: 'Module generated successfully' })
  async generateModule(@Body() dto: any) {
    this.logger.log(`🏗️  Request to generate module: ${dto.moduleName}`);
    return this.generatorService.generateModule(dto);
  }

  @Put(':moduleId/edit')
  @ApiOperation({ summary: 'Edit existing module' })
  @ApiResponse({ status: 200, description: 'Module edited successfully' })
  async editModule(@Param('moduleId') moduleId: string, @Body() dto: any) {
    this.logger.log(`✏️  Request to edit module: ${moduleId}`);
    return this.editorService.editModule({ moduleId, ...dto });
  }

  @Delete(':moduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete module' })
  @ApiResponse({ status: 204, description: 'Module deleted successfully' })
  async deleteModule(
    @Param('moduleId') moduleId: string,
    @Query('backup') backup?: boolean,
    @Query('force') force?: boolean,
  ) {
    this.logger.log(`🗑️  Request to delete module: ${moduleId}`);
    return this.deleterService.deleteModule(moduleId, { backup, force });
  }

  @Get('modules')
  @ApiOperation({ summary: 'List all modules' })
  @ApiResponse({ status: 200, description: 'List of modules' })
  async listModules() {
    // Implementar listado de módulos
    return { modules: [] };
  }

  @Get('modules/:moduleId')
  @ApiOperation({ summary: 'Get module details' })
  @ApiResponse({ status: 200, description: 'Module details' })
  async getModule(@Param('moduleId') moduleId: string) {
    // Implementar obtención de detalles
    return { moduleId };
  }

  @Post('modules/:moduleId/activate')
  @ApiOperation({ summary: 'Activate module' })
  @ApiResponse({ status: 200, description: 'Module activated' })
  async activateModule(@Param('moduleId') moduleId: string) {
    // Implementar activación
    return { success: true, moduleId, status: 'active' };
  }

  @Post('modules/:moduleId/deactivate')
  @ApiOperation({ summary: 'Deactivate module' })
  @ApiResponse({ status: 200, description: 'Module deactivated' })
  async deactivateModule(@Param('moduleId') moduleId: string) {
    // Implementar desactivación
    return { success: true, moduleId, status: 'inactive' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async health() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'ait-module-manager',
    };
  }
}
