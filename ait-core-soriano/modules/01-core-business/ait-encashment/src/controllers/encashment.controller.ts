import { Controller, Get, Post, Param, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EncashmentService } from '../services/encashment.service';

@ApiTags('encashment')
@Controller('encashment')
export class EncashmentController {
  private readonly logger = new Logger(EncashmentController.name);

  constructor(private readonly encashmentService: EncashmentService) {}

  @Get('overdue')
  @ApiOperation({ summary: 'Get overdue invoices' })
  async getOverdueInvoices() {
    return this.encashmentService.getOverdueInvoices();
  }

  @Post('reminder/:invoiceId')
  @ApiOperation({ summary: 'Send payment reminder' })
  async sendReminder(@Param('invoiceId') invoiceId: string) {
    return this.encashmentService.sendReminder(invoiceId);
  }

  @Post('campaign')
  @ApiOperation({ summary: 'Schedule reminder campaign' })
  async scheduleCampaign(@Body() dto: any) {
    return this.encashmentService.scheduleReminderCampaign(dto);
  }

  @Get('customer/:id/behavior')
  @ApiOperation({ summary: 'Analyze payment behavior' })
  async analyzeCustomer(@Param('id') id: string) {
    return this.encashmentService.analyzeCustomerPaymentBehavior(id);
  }

  @Get('health')
  async health() {
    return { status: 'healthy', service: 'ait-encashment' };
  }
}
