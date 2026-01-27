import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard)
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('dashboard')
  async getDashboard() {
    return this.financeService.getDashboard();
  }

  @Get('invoices')
  async getInvoices(@Query() filters: any) {
    return this.financeService.getInvoices(filters);
  }

  @Get('commissions')
  async getCommissions(@Query() filters: any) {
    return this.financeService.getCommissions(filters);
  }

  @Get('cashflow')
  async getCashFlow(@Query('period') period: string) {
    return this.financeService.getCashFlow(period || 'monthly');
  }
}
