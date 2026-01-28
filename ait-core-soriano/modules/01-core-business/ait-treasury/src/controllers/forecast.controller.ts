/**
 * ForecastController
 *
 * API REST para forecasting de tesorería
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CashForecastService } from '../forecasting/cash-forecast.service';
import { ForecastMethod } from '../interfaces/forecast.interface';

@ApiTags('Forecast')
@Controller('forecast')
export class ForecastController {
  constructor(private readonly forecastService: CashForecastService) {}

  @Get()
  @ApiOperation({ summary: 'Generate cash forecast' })
  @ApiResponse({ status: 200, description: 'Cash forecast generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  @ApiQuery({ name: 'method', required: false, enum: ['SIMPLE', 'WEIGHTED', 'REGRESSION', 'ML'] })
  async forecast(
    @Query('months') months: number = 12,
    @Query('method') method: ForecastMethod = 'WEIGHTED'
  ) {
    return this.forecastService.forecast(months, method);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get forecast by category' })
  @ApiResponse({ status: 200, description: 'Category forecasts generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async forecastByCategory(@Query('months') months: number = 12) {
    return this.forecastService.forecastByCategory(months);
  }

  @Get('premiums')
  @ApiOperation({ summary: 'Project premium income' })
  @ApiResponse({ status: 200, description: 'Premium projections generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async projectPremiums(@Query('months') months: number = 12) {
    return this.forecastService.projectPremiums(months);
  }

  @Get('renewals')
  @ApiOperation({ summary: 'Project renewal income' })
  @ApiResponse({ status: 200, description: 'Renewal projections generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async projectRenewals(@Query('months') months: number = 12) {
    return this.forecastService.projectRenewals(months);
  }

  @Get('commissions')
  @ApiOperation({ summary: 'Project commission income' })
  @ApiResponse({ status: 200, description: 'Commission projections generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async projectCommissions(@Query('months') months: number = 12) {
    return this.forecastService.projectCommissions(months);
  }

  @Get('claims')
  @ApiOperation({ summary: 'Project claim payments' })
  @ApiResponse({ status: 200, description: 'Claim projections generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async projectClaims(@Query('months') months: number = 12) {
    return this.forecastService.projectClaims(months);
  }

  @Get('operating-expenses')
  @ApiOperation({ summary: 'Project operating expenses' })
  @ApiResponse({ status: 200, description: 'Operating expense projections generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async projectOperatingExpenses(@Query('months') months: number = 12) {
    return this.forecastService.projectOperatingExpenses(months);
  }

  @Get('salaries')
  @ApiOperation({ summary: 'Project salary payments' })
  @ApiResponse({ status: 200, description: 'Salary projections generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async projectSalaries(@Query('months') months: number = 12) {
    return this.forecastService.projectSalaries(months);
  }

  @Get('scenarios/best-case')
  @ApiOperation({ summary: 'Get best-case scenario forecast' })
  @ApiResponse({ status: 200, description: 'Best-case forecast generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async bestCaseScenario(@Query('months') months: number = 12) {
    return this.forecastService.bestCaseScenario(months);
  }

  @Get('scenarios/worst-case')
  @ApiOperation({ summary: 'Get worst-case scenario forecast' })
  @ApiResponse({ status: 200, description: 'Worst-case forecast generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async worstCaseScenario(@Query('months') months: number = 12) {
    return this.forecastService.worstCaseScenario(months);
  }

  @Get('scenarios/most-likely')
  @ApiOperation({ summary: 'Get most-likely scenario forecast' })
  @ApiResponse({ status: 200, description: 'Most-likely forecast generated' })
  @ApiQuery({ name: 'months', required: false, example: 12 })
  async mostLikelyScenario(@Query('months') months: number = 12) {
    return this.forecastService.mostLikelyScenario(months);
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare forecast vs actual' })
  @ApiResponse({ status: 200, description: 'Variance analysis completed' })
  async compareToForecast(
    @Body() data: { actual: any; forecastId: string }
  ) {
    // TODO: Load forecast by ID
    const forecast = await this.forecastService.forecast(12, 'WEIGHTED');
    return this.forecastService.compareToForecast(data.actual, forecast);
  }
}
