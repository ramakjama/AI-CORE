import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Dashboard } from './entities/dashboard.entity';
import { Widget } from './entities/widget.entity';
import { Report } from './entities/report.entity';
import { BiDashboardController } from './controllers/bi-dashboard.controller';
import { MetricsController } from './controllers/metrics.controller';
import { ReportsController } from './controllers/reports.controller';
import { QueryBuilderController } from './controllers/query-builder.controller';
import { ChartsController } from './controllers/charts.controller';
import { DashboardTemplatesController } from './controllers/dashboard-templates.controller';
import { BiDashboardService } from './services/bi-dashboard.service';
import { DataQueryService } from './services/data-query.service';
import { KafkaService } from './services/kafka.service';
import { MetricsService } from './services/metrics.service';
import { RealTimeMetricsService } from './services/real-time-metrics.service';
import { DashboardTemplatesService } from './services/dashboard-templates.service';
import { ReportService } from './services/report.service';
import { QueryBuilderService } from './services/query-builder.service';
import { ChartService } from './services/chart.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    TypeOrmModule.forFeature([Dashboard, Widget, Report]),
  ],
  controllers: [
    BiDashboardController,
    MetricsController,
    ReportsController,
    QueryBuilderController,
    ChartsController,
    DashboardTemplatesController,
  ],
  providers: [
    BiDashboardService,
    DataQueryService,
    KafkaService,
    MetricsService,
    RealTimeMetricsService,
    DashboardTemplatesService,
    ReportService,
    QueryBuilderService,
    ChartService,
  ],
  exports: [
    BiDashboardService,
    DataQueryService,
    MetricsService,
    RealTimeMetricsService,
    ReportService,
    QueryBuilderService,
    ChartService,
  ],
})
export class BiPlatformModule {}
