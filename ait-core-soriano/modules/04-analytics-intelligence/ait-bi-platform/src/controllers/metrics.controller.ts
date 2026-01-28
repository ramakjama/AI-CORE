import { Controller, Get, Query, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics.service';
import { RealTimeMetricsService } from '../services/real-time-metrics.service';
import { Period, MetricFilters } from '../types/metrics.types';

@ApiTags('Metrics')
@Controller('api/v1/bi/metrics')
export class MetricsController {
  constructor(
    private readonly metricsService: MetricsService,
    private readonly realTimeMetricsService: RealTimeMetricsService,
  ) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Get all KPIs for a period' })
  @ApiResponse({ status: 200, description: 'Returns KPI collection' })
  async getKPIs(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('filters') filters?: string,
  ) {
    const period: Period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    const parsedFilters = filters ? JSON.parse(filters) : undefined;

    return this.metricsService.getKPIs(period, parsedFilters);
  }

  @Get('time-series')
  @ApiOperation({ summary: 'Get metric time series' })
  @ApiQuery({ name: 'metric', required: true, type: String })
  @ApiQuery({ name: 'granularity', required: false, enum: ['day', 'week', 'month'] })
  async getTimeSeries(
    @Query('metric') metric: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity: 'day' | 'week' | 'month' = 'day',
  ) {
    const period: Period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    return this.metricsService.getMetricTimeSeries(metric, period, granularity);
  }

  @Post('compare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare metrics between two periods' })
  async compareMetrics(
    @Body()
    body: {
      metric: string;
      period1: Period;
      period2: Period;
      filters?: MetricFilters;
    },
  ) {
    return this.metricsService.compareMetrics(
      body.metric,
      body.period1,
      body.period2,
      body.filters,
    );
  }

  @Get('growth-rate')
  @ApiOperation({ summary: 'Get growth rate for a metric' })
  async getGrowthRate(
    @Query('metric') metric: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const period: Period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    return this.metricsService.getGrowthRate(metric, period);
  }

  @Post('trend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Analyze trend across multiple periods' })
  async getTrend(
    @Body()
    body: {
      metric: string;
      periods: Period[];
      filters?: MetricFilters;
    },
  ) {
    return this.metricsService.getTrend(body.metric, body.periods, body.filters);
  }

  @Get('aggregated')
  @ApiOperation({ summary: 'Get aggregated metric with breakdown' })
  async getAggregated(
    @Query('metric') metric: string,
    @Query('groupBy') groupBy: 'product' | 'region' | 'channel' | 'agent',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const period: Period = {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    return this.metricsService.getAggregatedMetric(metric, period, groupBy);
  }

  @Get('realtime/dashboard')
  @ApiOperation({ summary: 'Get real-time dashboard summary' })
  async getLiveDashboard() {
    return this.realTimeMetricsService.getLiveDashboard();
  }

  @Get('realtime/active')
  @ApiOperation({ summary: 'Get current active users/sessions' })
  async getCurrentActive() {
    return this.realTimeMetricsService.getCurrentActive();
  }

  @Get('realtime/today-revenue')
  @ApiOperation({ summary: 'Get today\'s revenue' })
  async getTodayRevenue() {
    return this.realTimeMetricsService.getTodayRevenue();
  }

  @Get('realtime/today-policies')
  @ApiOperation({ summary: 'Get today\'s policy count' })
  async getTodayPolicies() {
    return this.realTimeMetricsService.getTodayPolicies();
  }

  @Get('realtime/last-24-hours')
  @ApiOperation({ summary: 'Get last 24 hours data' })
  @ApiQuery({ name: 'metric', required: true, type: String })
  @ApiQuery({ name: 'granularity', required: false, enum: ['hour', '15min'] })
  async getLast24Hours(
    @Query('metric') metric: string,
    @Query('granularity') granularity: 'hour' | '15min' = 'hour',
  ) {
    return this.realTimeMetricsService.getLast24Hours(metric, granularity);
  }

  @Get('realtime/alerts')
  @ApiOperation({ summary: 'Get active alerts based on thresholds' })
  async getActiveAlerts() {
    return this.realTimeMetricsService.getActiveAlerts();
  }

  @Get('realtime/top-performers')
  @ApiOperation({ summary: 'Get top performers in real-time' })
  @ApiQuery({ name: 'dimension', required: true, enum: ['agent', 'product', 'region'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopPerformers(
    @Query('dimension') dimension: 'agent' | 'product' | 'region',
    @Query('limit') limit: number = 10,
  ) {
    return this.realTimeMetricsService.getTopPerformers(dimension, limit);
  }

  @Get('realtime/system-health')
  @ApiOperation({ summary: 'Get system health metrics' })
  async getSystemHealth() {
    return this.realTimeMetricsService.getSystemHealth();
  }
}
