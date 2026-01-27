import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('sales')
  async getSalesMetrics(@Query('period') period: string) {
    return this.analyticsService.getSalesMetrics(period || 'monthly');
  }

  @Get('agents')
  async getAgentPerformance() {
    return this.analyticsService.getAgentPerformance();
  }

  @Get('customers')
  async getCustomerInsights() {
    return this.analyticsService.getCustomerInsights();
  }

  @Get('predictions')
  async getPredictions() {
    return this.analyticsService.getPredictions();
  }
}
