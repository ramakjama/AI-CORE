import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountantService } from '../services/accountant.service';
import { CreateAccountingEntryDto } from '../dto/create-accounting-entry.dto';
import { UpdateAccountingEntryDto } from '../dto/update-accounting-entry.dto';
import { AccountingEntryFilterDto } from '../dto/accounting-entry-filter.dto';

@ApiTags('Accountant')
@ApiBearerAuth()
@Controller('accountant')
export class AccountantController {
  constructor(private readonly accountantService: AccountantService) {}

  @Post('entries')
  @ApiOperation({ summary: 'Create a new accounting entry' })
  @ApiResponse({ status: 201, description: 'Entry created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createEntry(@Body() createDto: CreateAccountingEntryDto) {
    return this.accountantService.createEntry(createDto);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Get all accounting entries with filters' })
  @ApiResponse({ status: 200, description: 'Entries retrieved successfully' })
  async getEntries(@Query() filterDto: AccountingEntryFilterDto) {
    return this.accountantService.getEntries(filterDto);
  }

  @Get('entries/:id')
  @ApiOperation({ summary: 'Get accounting entry by ID' })
  @ApiResponse({ status: 200, description: 'Entry found' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async getEntryById(@Param('id') id: string) {
    return this.accountantService.getEntryById(id);
  }

  @Put('entries/:id')
  @ApiOperation({ summary: 'Update an accounting entry' })
  @ApiResponse({ status: 200, description: 'Entry updated successfully' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async updateEntry(
    @Param('id') id: string,
    @Body() updateDto: UpdateAccountingEntryDto,
  ) {
    return this.accountantService.updateEntry(id, updateDto);
  }

  @Delete('entries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an accounting entry' })
  @ApiResponse({ status: 204, description: 'Entry deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entry not found' })
  async deleteEntry(@Param('id') id: string) {
    return this.accountantService.deleteEntry(id);
  }

  @Post('entries/:id/approve')
  @ApiOperation({ summary: 'Approve an accounting entry' })
  @ApiResponse({ status: 200, description: 'Entry approved successfully' })
  async approveEntry(@Param('id') id: string) {
    return this.accountantService.approveEntry(id);
  }

  @Post('entries/:id/reject')
  @ApiOperation({ summary: 'Reject an accounting entry' })
  @ApiResponse({ status: 200, description: 'Entry rejected successfully' })
  async rejectEntry(@Param('id') id: string, @Body('reason') reason: string) {
    return this.accountantService.rejectEntry(id, reason);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Generate balance sheet' })
  @ApiResponse({ status: 200, description: 'Balance sheet generated' })
  async getBalanceSheet(@Query('date') date?: string) {
    return this.accountantService.generateBalanceSheet(date);
  }

  @Get('profit-loss')
  @ApiOperation({ summary: 'Generate profit and loss statement' })
  @ApiResponse({ status: 200, description: 'P&L statement generated' })
  async getProfitLoss(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.accountantService.generateProfitLoss(startDate, endDate);
  }

  @Get('trial-balance')
  @ApiOperation({ summary: 'Generate trial balance' })
  @ApiResponse({ status: 200, description: 'Trial balance generated' })
  async getTrialBalance(@Query('date') date?: string) {
    return this.accountantService.generateTrialBalance(date);
  }

  @Post('close-period')
  @ApiOperation({ summary: 'Close fiscal period' })
  @ApiResponse({ status: 200, description: 'Period closed successfully' })
  async closePeriod(@Body('periodId') periodId: string) {
    return this.accountantService.closeFiscalPeriod(periodId);
  }
}
