/**
 * ReconciliationController
 * Controlador para conciliación bancaria automática con ML
 */

import { Controller, Get, Post, Body, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReconciliationService } from '../services/reconciliation.service';

@ApiTags('Accounting - Reconciliation')
@Controller('api/v1/accounting/reconcile')
@ApiBearerAuth()
export class ReconciliationController {
  private readonly logger = new Logger(ReconciliationController.name);

  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Iniciar conciliación bancaria automática',
    description: 'Concilia transacciones bancarias con asientos contables usando ML',
  })
  @ApiResponse({ status: 201, description: 'Conciliación iniciada' })
  async startReconciliation(
    @Body() body: { bankAccountId: string; fromDate: string; toDate: string },
  ) {
    const reconciliation = await this.reconciliationService.reconcile(
      body.bankAccountId,
      body.fromDate,
      body.toDate,
    );

    return {
      success: true,
      data: reconciliation,
      message: 'Conciliación completada',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Listar conciliaciones' })
  @ApiQuery({ name: 'bankAccountId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiResponse({ status: 200, description: 'Lista de conciliaciones' })
  async listReconciliations(
    @Query('bankAccountId') bankAccountId?: string,
    @Query('status') status?: string,
  ) {
    const reconciliations = await this.reconciliationService.listReconciliations({
      bankAccountId,
      status,
    });

    return {
      success: true,
      data: reconciliations,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener conciliación por ID' })
  @ApiResponse({ status: 200, description: 'Detalle de conciliación' })
  async getReconciliation(@Param('id') id: string) {
    const reconciliation = await this.reconciliationService.getReconciliation(id);

    return {
      success: true,
      data: reconciliation,
    };
  }
}
