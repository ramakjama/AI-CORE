import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  private readonly logger = new Logger(BillingController.name);

  constructor(private readonly billingService: BillingService) {}

  @Post('invoices')
  @ApiOperation({ summary: 'Create invoice' })
  async createInvoice(@Body() dto: any) {
    return this.billingService.createInvoice(dto);
  }

  @Get('invoices')
  @ApiOperation({ summary: 'List invoices' })
  async listInvoices() {
    return this.billingService.listInvoices({});
  }

  @Post('invoices/:id/send')
  @ApiOperation({ summary: 'Send invoice' })
  async sendInvoice(@Param('id') id: string) {
    return this.billingService.sendInvoice(id);
  }

  @Post('invoices/:id/payment')
  @ApiOperation({ summary: 'Record payment' })
  async recordPayment(@Param('id') id: string, @Body() dto: any) {
    return this.billingService.recordPayment(id, dto.amount);
  }

  @Get('health')
  async health() {
    return { status: 'healthy', service: 'ait-billing' };
  }
}
