/**
 * CashFlowController
 *
 * API REST para análisis de flujo de caja
 */

import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CashFlowService } from '../cash-flow/cash-flow.service';

@ApiTags('Cash Flow')
@Controller('cash-flow')
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Get('statement')
  @ApiOperation({ summary: 'Generate cash flow statement' })
  @ApiResponse({ status: 200, description: 'Cash flow statement generated' })
  @ApiQuery({ name: 'startDate', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'endDate', required: true, example: '2026-01-31' })
  async generateStatement(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ) {
    return this.cashFlowService.generateStatement(
      new Date(startDate),
      new Date(endDate)
    );
  }

  @Get('monthly/:year')
  @ApiOperation({ summary: 'Get monthly cash flow for year' })
  @ApiResponse({ status: 200, description: 'Monthly cash flow statements retrieved' })
  async getMonthlyFlow(@Param('year') year: number) {
    return this.cashFlowService.getMonthlyFlow(year);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare cash flows between two periods' })
  @ApiResponse({ status: 200, description: 'Cash flow comparison completed' })
  @ApiQuery({ name: 'period1Start', required: true })
  @ApiQuery({ name: 'period1End', required: true })
  @ApiQuery({ name: 'period2Start', required: true })
  @ApiQuery({ name: 'period2End', required: true })
  async compareFlows(
    @Query('period1Start') period1Start: string,
    @Query('period1End') period1End: string,
    @Query('period2Start') period2Start: string,
    @Query('period2End') period2End: string
  ) {
    return this.cashFlowService.compareFlows(
      {
        startDate: new Date(period1Start),
        endDate: new Date(period1End),
      },
      {
        startDate: new Date(period2Start),
        endDate: new Date(period2End),
      }
    );
  }

  @Get('burn-rate')
  @ApiOperation({ summary: 'Calculate burn rate' })
  @ApiResponse({ status: 200, description: 'Burn rate calculated' })
  @ApiQuery({ name: 'months', required: false, example: 6 })
  async calculateBurnRate(@Query('months') months: number = 6) {
    return this.cashFlowService.calculateBurnRate(months);
  }

  @Get('runway')
  @ApiOperation({ summary: 'Calculate cash runway' })
  @ApiResponse({ status: 200, description: 'Cash runway calculated' })
  async calculateRunway() {
    return this.cashFlowService.calculateRunway();
  }
}
