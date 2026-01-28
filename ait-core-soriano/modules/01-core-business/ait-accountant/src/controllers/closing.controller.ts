/**
 * ClosingController
 * Controlador para cierre contable de periodos
 */

import { Controller, Get, Post, Param, Query, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClosingService } from '../services/closing.service';

@ApiTags('Accounting - Period Closing')
@Controller('api/v1/accounting/close-period')
@ApiBearerAuth()
export class ClosingController {
  private readonly logger = new Logger(ClosingController.name);

  constructor(private readonly closingService: ClosingService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar periodo contable',
    description: 'Ejecuta cierre contable mensual/anual',
  })
  @ApiResponse({ status: 200, description: 'Cierre completado' })
  async closePeriod(
    @Query('fiscalYear') fiscalYear: string,
    @Query('period') period: string,
  ) {
    const closing = await this.closingService.closePeriod(fiscalYear, period);

    return {
      success: true,
      data: closing,
      message: `Periodo ${fiscalYear}-${period} cerrado exitosamente`,
    };
  }

  @Get('closed-periods')
  @ApiOperation({ summary: 'Listar periodos cerrados' })
  @ApiQuery({ name: 'fiscalYear', required: false })
  @ApiResponse({ status: 200, description: 'Lista de periodos cerrados' })
  async listClosedPeriods(@Query('fiscalYear') fiscalYear?: string) {
    const closedPeriods = await this.closingService.listClosedPeriods(fiscalYear);

    return {
      success: true,
      data: closedPeriods,
    };
  }

  @Post('reopen/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reabrir periodo cerrado (requiere admin)' })
  @ApiResponse({ status: 200, description: 'Periodo reabierto' })
  async reopenPeriod(@Param('id') id: string) {
    const closing = await this.closingService.reopenPeriod(id);

    return {
      success: true,
      data: closing,
      message: 'Periodo reabierto exitosamente',
    };
  }
}
