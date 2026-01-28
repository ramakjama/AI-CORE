/**
 * BudgetController
 *
 * API REST para gestión de presupuestos
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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BudgetService } from '../budget/budget.service';
import {
  CreateBudgetDto,
  UpdateBudgetDto,
  TrackExpenseDto,
  FilterBudgetsDto,
  GenerateBudgetReportDto,
} from '../dto/budget.dto';

@ApiTags('Budget Management')
@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Post()
  @ApiOperation({ summary: 'Create budget' })
  @ApiResponse({ status: 201, description: 'Budget created successfully' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateBudgetDto) {
    return this.budgetService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all budgets' })
  @ApiResponse({ status: 200, description: 'Budgets retrieved successfully' })
  async findAll(@Query() filters?: FilterBudgetsDto) {
    return this.budgetService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get budget by ID' })
  @ApiResponse({ status: 200, description: 'Budget retrieved successfully' })
  async findOne(@Param('id') id: string) {
    return this.budgetService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update budget' })
  @ApiResponse({ status: 200, description: 'Budget updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateBudgetDto) {
    return this.budgetService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete budget' })
  @ApiResponse({ status: 200, description: 'Budget deleted successfully' })
  async delete(@Param('id') id: string) {
    await this.budgetService.delete(id);
    return { message: 'Budget deleted successfully' };
  }

  @Post('expenses')
  @ApiOperation({ summary: 'Track expense against budget' })
  @ApiResponse({ status: 201, description: 'Expense tracked successfully' })
  @HttpCode(HttpStatus.CREATED)
  async trackExpense(@Body() dto: TrackExpenseDto) {
    return this.budgetService.trackExpense(dto);
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Get budget status' })
  @ApiResponse({ status: 200, description: 'Budget status retrieved' })
  async getStatus(@Param('id') id: string) {
    return this.budgetService.getStatus(id);
  }

  @Get(':id/utilization')
  @ApiOperation({ summary: 'Get budget utilization' })
  @ApiResponse({ status: 200, description: 'Budget utilization retrieved' })
  async getUtilization(@Param('id') id: string) {
    return this.budgetService.getUtilization(id);
  }

  @Get(':id/forecast')
  @ApiOperation({ summary: 'Forecast budget utilization' })
  @ApiResponse({ status: 200, description: 'Budget forecast generated' })
  async forecastBudget(@Param('id') id: string) {
    return this.budgetService.forecastBudget(id);
  }

  @Post('reports')
  @ApiOperation({ summary: 'Generate budget report' })
  @ApiResponse({ status: 200, description: 'Budget report generated' })
  async generateReport(@Body() dto: GenerateBudgetReportDto) {
    return this.budgetService.generateReport(
      dto.startDate,
      dto.endDate,
      dto.categories
    );
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare budget periods' })
  @ApiResponse({ status: 200, description: 'Budget comparison completed' })
  @ApiQuery({ name: 'currentStart', required: true })
  @ApiQuery({ name: 'currentEnd', required: true })
  @ApiQuery({ name: 'previousStart', required: true })
  @ApiQuery({ name: 'previousEnd', required: true })
  async comparePeriods(
    @Query('currentStart') currentStart: string,
    @Query('currentEnd') currentEnd: string,
    @Query('previousStart') previousStart: string,
    @Query('previousEnd') previousEnd: string
  ) {
    return this.budgetService.comparePeriods(
      new Date(currentStart),
      new Date(currentEnd),
      new Date(previousStart),
      new Date(previousEnd)
    );
  }
}
