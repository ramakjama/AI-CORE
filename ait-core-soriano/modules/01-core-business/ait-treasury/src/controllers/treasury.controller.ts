import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TreasuryService } from '../services/treasury.service';

@ApiTags('treasury')
@Controller('treasury')
export class TreasuryController {
  private readonly logger = new Logger(TreasuryController.name);

  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('cash-position')
  @ApiOperation({ summary: 'Get cash position' })
  async getCashPosition() {
    return this.treasuryService.getCashPosition();
  }

  @Post('payment-batch')
  @ApiOperation({ summary: 'Create payment batch' })
  async createPaymentBatch(@Body() dto: any) {
    return this.treasuryService.createPaymentBatch(dto.payments);
  }

  @Get('forecast')
  @ApiOperation({ summary: 'Get forecast' })
  async getForecast() {
    return this.treasuryService.getForecast();
  }

  @Get('health')
  async health() {
    return { status: 'healthy', service: 'ait-treasury' };
  }
}
