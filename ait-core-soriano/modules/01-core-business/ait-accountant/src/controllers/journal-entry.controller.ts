/**
 * JournalEntryController
 *
 * Controlador para gestión de asientos contables (journal entries)
 * Proporciona endpoints REST para crear, listar, actualizar y mayorizar asientos
 */

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
  UseGuards,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JournalEntryService } from '../services/journal-entry.service';
import {
  CreateJournalEntryDto,
  AutoCreateJournalEntryDto,
} from '../dto/create-journal-entry.dto';

@ApiTags('Accounting - Journal Entries')
@Controller('api/v1/accounting/entries')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard, RolesGuard) // TODO: Implementar guards de autenticación
export class JournalEntryController {
  private readonly logger = new Logger(JournalEntryController.name);

  constructor(private readonly journalEntryService: JournalEntryService) {}

  // ============================================
  // CREATE JOURNAL ENTRY (Manual)
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear asiento contable manual',
    description: `
      Crea un asiento contable de forma manual especificando cada línea.
      El usuario debe proporcionar las cuentas, importes de débito y crédito.

      Validaciones:
      - Suma de débitos = Suma de créditos (descuadre = error)
      - Cuentas deben existir en PGC
      - Cumplimiento de reglas ICAC
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Asiento creado exitosamente en estado DRAFT',
  })
  @ApiResponse({
    status: 400,
    description: 'Validación fallida (asiento descuadrado, cuenta inválida, etc.)',
  })
  @ApiResponse({
    status: 500,
    description: 'Error interno del servidor',
  })
  async createEntry(
    @Body(ValidationPipe) createDto: CreateJournalEntryDto,
  ) {
    this.logger.log(
      `Creating manual journal entry: ${createDto.description}`,
    );

    try {
      const entry = await this.journalEntryService.createEntry(createDto);
      return {
        success: true,
        data: entry,
        message: 'Asiento contable creado exitosamente en estado DRAFT',
      };
    } catch (error) {
      this.logger.error(`Error creating journal entry: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // CREATE JOURNAL ENTRY (AI-Assisted)
  // ============================================

  @Post('auto')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear asiento contable con IA',
    description: `
      Crea un asiento contable automáticamente usando IA.
      El usuario solo proporciona descripción y monto, la IA clasifica
      las cuentas correspondientes usando AI-PGC-ENGINE.
    `,
  })
  @ApiResponse({
    status: 201,
    description: 'Asiento creado automáticamente con IA',
  })
  @ApiResponse({
    status: 400,
    description: 'IA no pudo clasificar la transacción (confianza < 0.7)',
  })
  async autoCreateEntry(
    @Body(ValidationPipe) autoDto: AutoCreateJournalEntryDto,
  ) {
    this.logger.log(
      `Creating AI-assisted journal entry: ${autoDto.description}`,
    );

    try {
      const entry = await this.journalEntryService.autoCreateEntry(autoDto);
      return {
        success: true,
        data: entry,
        message: 'Asiento creado automáticamente con IA',
        aiAssisted: true,
      };
    } catch (error) {
      this.logger.error(`Error creating AI-assisted entry: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // GET JOURNAL ENTRY BY ID
  // ============================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener asiento contable por ID',
    description: 'Devuelve el detalle completo de un asiento contable',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del asiento contable',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Asiento encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Asiento no encontrado',
  })
  async getEntry(@Param('id') id: string) {
    this.logger.log(`Getting journal entry: ${id}`);

    try {
      const entry = await this.journalEntryService.getEntry(id);
      return {
        success: true,
        data: entry,
      };
    } catch (error) {
      this.logger.error(`Error getting journal entry: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // LIST JOURNAL ENTRIES (with filters)
  // ============================================

  @Get()
  @ApiOperation({
    summary: 'Listar asientos contables',
    description: 'Devuelve lista de asientos con filtros opcionales',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filtrar por estado',
    enum: ['DRAFT', 'POSTED', 'CANCELLED'],
  })
  @ApiQuery({
    name: 'fiscalYear',
    required: false,
    description: 'Filtrar por año fiscal',
    example: '2026',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Filtrar por periodo',
    example: '01',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de resultados',
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Offset para paginación',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de asientos',
  })
  async listEntries(
    @Query('status') status?: string,
    @Query('fiscalYear') fiscalYear?: string,
    @Query('period') period?: string,
    @Query('accountCode') accountCode?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('limit') limit = 50,
    @Query('offset') offset = 0,
  ) {
    this.logger.log(`Listing journal entries with filters`);

    try {
      const result = await this.journalEntryService.listEntries({
        status,
        fiscalYear,
        period,
        accountCode,
        fromDate,
        toDate,
        limit: Number(limit),
        offset: Number(offset),
      });

      return {
        success: true,
        data: result.entries,
        pagination: {
          total: result.total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: result.total > Number(offset) + Number(limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error listing journal entries: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // POST JOURNAL ENTRY (Mayorizar)
  // ============================================

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mayorizar asiento contable',
    description: `
      Cambia el estado del asiento de DRAFT → POSTED.
      Una vez mayorizado (posted), el asiento se refleja en el libro mayor.
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID del asiento contable',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Asiento mayorizado exitosamente',
  })
  @ApiResponse({
    status: 400,
    description: 'Asiento ya está mayorizado o tiene errores de validación',
  })
  async postEntry(@Param('id') id: string) {
    this.logger.log(`Posting journal entry: ${id}`);

    try {
      const entry = await this.journalEntryService.postEntry(id, 'user-temp');
      return {
        success: true,
        data: entry,
        message: 'Asiento mayorizado exitosamente',
      };
    } catch (error) {
      this.logger.error(`Error posting journal entry: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // UPDATE JOURNAL ENTRY
  // ============================================

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar asiento contable',
    description: 'Actualiza un asiento en estado DRAFT. Asientos POSTED no se pueden modificar.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del asiento contable',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Asiento actualizado',
  })
  @ApiResponse({
    status: 400,
    description: 'Asiento ya está mayorizado (no se puede modificar)',
  })
  async updateEntry(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: CreateJournalEntryDto,
  ) {
    this.logger.log(`Updating journal entry: ${id}`);

    try {
      const entry = await this.journalEntryService.updateEntry(id, updateDto);
      return {
        success: true,
        data: entry,
        message: 'Asiento actualizado exitosamente',
      };
    } catch (error) {
      this.logger.error(`Error updating journal entry: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // DELETE JOURNAL ENTRY
  // ============================================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar asiento contable',
    description: 'Elimina o cancela un asiento contable según su estado.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del asiento contable',
    example: 'uuid-123',
  })
  @ApiResponse({
    status: 200,
    description: 'Asiento eliminado/cancelado',
  })
  async deleteEntry(@Param('id') id: string) {
    this.logger.log(`Deleting journal entry: ${id}`);

    try {
      await this.journalEntryService.deleteEntry(id);
      return {
        success: true,
        message: 'Asiento eliminado exitosamente',
      };
    } catch (error) {
      this.logger.error(`Error deleting journal entry: ${error.message}`);
      throw error;
    }
  }

  // ============================================
  // VALIDATE JOURNAL ENTRY
  // ============================================

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validar asiento contable sin crearlo',
    description: 'Valida un asiento contable sin persistirlo en BD.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado de validación',
  })
  async validateEntry(
    @Body(ValidationPipe) createDto: CreateJournalEntryDto,
  ) {
    this.logger.log(`Validating journal entry: ${createDto.description}`);

    try {
      const validation = await this.journalEntryService.validateEntry(createDto);
      return {
        success: true,
        ...validation,
      };
    } catch (error) {
      this.logger.error(`Error validating journal entry: ${error.message}`);
      throw error;
    }
  }
}
