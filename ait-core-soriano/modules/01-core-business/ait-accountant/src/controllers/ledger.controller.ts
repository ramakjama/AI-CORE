/**
 * LedgerController
 * Controlador para consulta de libro mayor y balances
 */

import {
  Controller,
  Get,
  Query,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LedgerService } from '../services/ledger.service';

@ApiTags('Accounting - Ledger')
@Controller('api/v1/accounting/ledger')
@ApiBearerAuth()
export class LedgerController {
  private readonly logger = new Logger(LedgerController.name);

  constructor(private readonly ledgerService: LedgerService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener libro mayor',
    description: 'Devuelve el libro mayor general o de una cuenta específica',
  })
  @ApiQuery({ name: 'accountCode', required: false })
  @ApiQuery({ name: 'fiscalYear', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiResponse({ status: 200, description: 'Libro mayor' })
  async getLedger(
    @Query('accountCode') accountCode?: string,
    @Query('fiscalYear') fiscalYear?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    const ledger = await this.ledgerService.getLedger({
      accountCode,
      fiscalYear,
      fromDate,
      toDate,
    });

    return {
      success: true,
      data: ledger,
    };
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Balance de sumas y saldos' })
  @ApiQuery({ name: 'fiscalYear', required: true })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Balance de sumas y saldos' })
  async getTrialBalance(
    @Query('fiscalYear') fiscalYear: string,
    @Query('period') period?: string,
  ) {
    const trialBalance = await this.ledgerService.getTrialBalance(fiscalYear, period);

    return {
      success: true,
      data: trialBalance,
    };
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Balance de situación' })
  @ApiQuery({ name: 'fiscalYear', required: true })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Balance de situación' })
  async getBalanceSheet(
    @Query('fiscalYear') fiscalYear: string,
    @Query('period') period?: string,
  ) {
    const balanceSheet = await this.ledgerService.getBalanceSheet(fiscalYear, period);

    return {
      success: true,
      data: balanceSheet,
    };
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Cuenta de pérdidas y ganancias' })
  @ApiQuery({ name: 'fiscalYear', required: true })
  @ApiQuery({ name: 'period', required: false })
  @ApiResponse({ status: 200, description: 'Cuenta de PyG' })
  async getIncomeStatement(
    @Query('fiscalYear') fiscalYear: string,
    @Query('period') period?: string,
  ) {
    const incomeStatement = await this.ledgerService.getIncomeStatement(fiscalYear, period);

    return {
      success: true,
      data: incomeStatement,
    };
  }
}
