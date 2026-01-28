import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JournalService } from '../services/journal.service';
import { CreateJournalEntryDto } from '../dto/create-journal-entry.dto';
import { JournalFilterDto } from '../dto/journal-filter.dto';

@ApiTags('Journal')
@ApiBearerAuth()
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Post('entries')
  @ApiOperation({ summary: 'Create journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created' })
  async createJournalEntry(@Body() createDto: CreateJournalEntryDto) {
    return this.journalService.createJournalEntry(createDto);
  }

  @Get('entries')
  @ApiOperation({ summary: 'Get all journal entries' })
  @ApiResponse({ status: 200, description: 'Journal entries retrieved' })
  async getJournalEntries(@Query() filterDto: JournalFilterDto) {
    return this.journalService.getJournalEntries(filterDto);
  }

  @Get('entries/:id')
  @ApiOperation({ summary: 'Get journal entry by ID' })
  @ApiResponse({ status: 200, description: 'Journal entry found' })
  async getJournalEntryById(@Param('id') id: string) {
    return this.journalService.getJournalEntryById(id);
  }

  @Post('entries/batch')
  @ApiOperation({ summary: 'Create multiple journal entries' })
  @ApiResponse({ status: 201, description: 'Batch entries created' })
  async createBatchEntries(@Body() entries: CreateJournalEntryDto[]) {
    return this.journalService.createBatchEntries(entries);
  }

  @Get('general-ledger')
  @ApiOperation({ summary: 'Get general ledger report' })
  @ApiResponse({ status: 200, description: 'General ledger retrieved' })
  async getGeneralLedger(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.journalService.getGeneralLedger(startDate, endDate);
  }

  @Get('account-ledger/:accountId')
  @ApiOperation({ summary: 'Get account-specific ledger' })
  @ApiResponse({ status: 200, description: 'Account ledger retrieved' })
  async getAccountLedger(
    @Param('accountId') accountId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.journalService.getAccountLedger(accountId, startDate, endDate);
  }
}
