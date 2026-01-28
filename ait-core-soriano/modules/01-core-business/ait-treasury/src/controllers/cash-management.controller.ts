/**
 * CashManagementController
 *
 * API REST para gestión de caja y liquidez
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UploadedFile,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { CashManagementService } from '../cash/cash-management.service';
import {
  RecordInflowDto,
  RecordOutflowDto,
  FilterMovementsDto,
  ReconcileAccountDto,
} from '../dto/cash.dto';

@ApiTags('Cash Management')
@Controller('cash')
export class CashManagementController {
  constructor(private readonly cashService: CashManagementService) {}

  @Get('position')
  @ApiOperation({ summary: 'Get current cash position' })
  @ApiResponse({ status: 200, description: 'Current cash position retrieved' })
  async getCurrentPosition() {
    return this.cashService.getCurrentPosition();
  }

  @Get('position/date/:date')
  @ApiOperation({ summary: 'Get cash position for specific date' })
  @ApiResponse({ status: 200, description: 'Historical cash position retrieved' })
  async getPositionByDate(@Param('date') date: string) {
    return this.cashService.getPositionByDate(new Date(date));
  }

  @Get('position/account/:accountId')
  @ApiOperation({ summary: 'Get cash position for specific account' })
  @ApiResponse({ status: 200, description: 'Account cash position retrieved' })
  async getPositionByAccount(@Param('accountId') accountId: string) {
    return this.cashService.getPositionByAccount(accountId);
  }

  @Post('inflow')
  @ApiOperation({ summary: 'Record cash inflow' })
  @ApiResponse({ status: 201, description: 'Inflow recorded successfully' })
  @HttpCode(HttpStatus.CREATED)
  async recordInflow(@Body() dto: RecordInflowDto) {
    return this.cashService.recordInflow(dto);
  }

  @Post('outflow')
  @ApiOperation({ summary: 'Record cash outflow' })
  @ApiResponse({ status: 201, description: 'Outflow recorded successfully' })
  @HttpCode(HttpStatus.CREATED)
  async recordOutflow(@Body() dto: RecordOutflowDto) {
    return this.cashService.recordOutflow(dto);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Get cash movements with filters' })
  @ApiResponse({ status: 200, description: 'Cash movements retrieved' })
  async getMovements(@Query() filters: FilterMovementsDto) {
    return this.cashService.getMovements(filters);
  }

  @Post('reconcile')
  @ApiOperation({ summary: 'Reconcile account' })
  @ApiResponse({ status: 200, description: 'Reconciliation completed' })
  async reconcile(@Body() dto: ReconcileAccountDto) {
    return this.cashService.reconcile(dto.accountId, dto.date);
  }

  @Post('import-statement')
  @ApiOperation({ summary: 'Import bank statement' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Statement imported successfully' })
  @UseInterceptors(FileInterceptor('file'))
  async importStatement(@UploadedFile() file: Express.Multer.File) {
    return this.cashService.importBankStatement(file);
  }

  @Get('alerts/low-balance')
  @ApiOperation({ summary: 'Check for low balance alerts' })
  @ApiResponse({ status: 200, description: 'Low balance alerts retrieved' })
  async checkLowBalance() {
    return this.cashService.checkLowBalance();
  }

  @Get('alerts/overdraft')
  @ApiOperation({ summary: 'Check for overdraft alerts' })
  @ApiResponse({ status: 200, description: 'Overdraft alerts retrieved' })
  async checkOverdraft() {
    return this.cashService.checkOverdraft();
  }

  @Get('forecast/shortage')
  @ApiOperation({ summary: 'Forecast cash shortage' })
  @ApiResponse({ status: 200, description: 'Cash shortage forecast retrieved' })
  async forecastShortage(@Query('days') days: number = 30) {
    return this.cashService.forecastCashShortage(days);
  }
}
