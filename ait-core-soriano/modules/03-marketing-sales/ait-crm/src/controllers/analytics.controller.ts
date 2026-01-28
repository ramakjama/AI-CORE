import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CRMAnalyticsService } from '../services/crm-analytics.service';
import { FilterLeadDto, FilterOpportunityDto } from '../dto/lead.dto';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: CRMAnalyticsService) {}

  // Lead Analytics
  @Get('leads/statistics')
  @ApiOperation({ summary: 'Get lead statistics' })
  async getLeadStatistics(@Query() filters?: FilterLeadDto) {
    return await this.analyticsService.getLeadStatistics(filters);
  }

  @Get('leads/conversion-funnel')
  @ApiOperation({ summary: 'Get conversion funnel' })
  async getConversionFunnel(@Query('period') period?: 'day' | 'week' | 'month') {
    return await this.analyticsService.getConversionFunnel(period);
  }

  @Get('leads/source-performance')
  @ApiOperation({ summary: 'Get lead source performance' })
  async getLeadSourcePerformance() {
    return await this.analyticsService.getLeadSourcePerformance();
  }

  // Sales Analytics
  @Get('sales/statistics')
  @ApiOperation({ summary: 'Get sales statistics' })
  async getSalesStatistics(@Query() filters?: FilterOpportunityDto) {
    return await this.analyticsService.getSalesStatistics(filters);
  }

  @Get('sales/revenue-forecast')
  @ApiOperation({ summary: 'Get revenue forecast' })
  async getRevenueForecast(@Query('months') months?: number) {
    return await this.analyticsService.getRevenueForecast(months);
  }

  @Get('sales/win-loss-analysis')
  @ApiOperation({ summary: 'Get win/loss analysis' })
  async getWinLossAnalysis(@Query('period') period?: string) {
    return await this.analyticsService.getWinLossAnalysis(period);
  }

  @Get('sales/average-deal-size')
  @ApiOperation({ summary: 'Get average deal size' })
  async getAverageDealSize(@Query() filters?: FilterOpportunityDto) {
    const size = await this.analyticsService.getAverageDealSize(filters);
    return { averageDealSize: size };
  }

  @Get('sales/average-sales-cycle')
  @ApiOperation({ summary: 'Get average sales cycle' })
  async getAverageSalesCycle(@Query() filters?: FilterOpportunityDto) {
    const cycle = await this.analyticsService.getAverageSalesCycle(filters);
    return { averageSalesCycleDays: cycle };
  }

  // Agent Performance
  @Get('agents/:agentId/performance')
  @ApiOperation({ summary: 'Get agent performance' })
  async getAgentPerformance(@Param('agentId') agentId: string, @Query('period') period?: string) {
    return await this.analyticsService.getAgentPerformance(agentId, period);
  }

  @Get('agents/top-performers')
  @ApiOperation({ summary: 'Get top performers' })
  async getTopPerformers(@Query('period') period?: string, @Query('limit') limit?: number) {
    return await this.analyticsService.getTopPerformers(period, limit);
  }

  @Get('agents/:agentId/activity-report')
  @ApiOperation({ summary: 'Get activity report' })
  async getActivityReport(@Param('agentId') agentId: string, @Query('period') period?: string) {
    return await this.analyticsService.getActivityReport(agentId, period);
  }

  // Campaign Analytics
  @Get('campaigns/:campaignId/roi')
  @ApiOperation({ summary: 'Get campaign ROI' })
  async getCampaignROI(@Param('campaignId') campaignId: string) {
    const roi = await this.analyticsService.getCampaignROI(campaignId);
    return { roi };
  }

  @Get('campaigns/email-engagement')
  @ApiOperation({ summary: 'Get email engagement' })
  async getEmailEngagement(@Query('period') period?: string) {
    return await this.analyticsService.getEmailEngagement(period);
  }
}
