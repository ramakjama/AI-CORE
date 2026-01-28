import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DataAnalystService } from '../services/data-analyst.service';
import { StatisticalAnalysisService } from '../services/statistical-analysis.service';
import { DataProcessingService } from '../services/data-processing.service';
import { TimeSeriesAnalysisService } from '../services/time-series-analysis.service';
import { AnalysisType } from '../entities/analysis-report.entity';

@Controller('data-analyst')
export class DataAnalystController {
  constructor(
    private readonly dataAnalystService: DataAnalystService,
    private readonly statisticalService: StatisticalAnalysisService,
    private readonly dataProcessingService: DataProcessingService,
    private readonly timeSeriesService: TimeSeriesAnalysisService,
  ) {}

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async performAnalysis(
    @Body()
    dto: {
      datasetId: string;
      type: AnalysisType;
      parameters: Record<string, any>;
    },
  ) {
    return this.dataAnalystService.performAnalysis(
      dto.datasetId,
      dto.type,
      dto.parameters,
    );
  }

  @Post('statistics/descriptive')
  @HttpCode(HttpStatus.OK)
  async calculateDescriptiveStats(@Body() dto: { data: number[] }) {
    return this.statisticalService.calculateDescriptiveStats(dto.data);
  }

  @Post('statistics/correlation')
  @HttpCode(HttpStatus.OK)
  async calculateCorrelation(
    @Body() dto: { data: Record<string, number[]> },
  ) {
    return this.statisticalService.calculateCorrelationMatrix(dto.data);
  }

  @Post('statistics/ttest')
  @HttpCode(HttpStatus.OK)
  async performTTest(
    @Body() dto: { sample1: number[]; sample2: number[] },
  ) {
    return this.statisticalService.performTTest(dto.sample1, dto.sample2);
  }

  @Post('statistics/anova')
  @HttpCode(HttpStatus.OK)
  async performANOVA(@Body() dto: { groups: number[][] }) {
    return this.statisticalService.performANOVA(dto.groups);
  }

  @Post('statistics/regression')
  @HttpCode(HttpStatus.OK)
  async performRegression(@Body() dto: { x: number[]; y: number[] }) {
    return this.statisticalService.performLinearRegression(dto.x, dto.y);
  }

  @Post('data/clean')
  @HttpCode(HttpStatus.OK)
  async cleanData(
    @Body()
    dto: {
      data: any[];
      options?: {
        removeDuplicates?: boolean;
        handleMissing?: 'remove' | 'mean' | 'median' | 'mode';
        removeOutliers?: boolean;
        normalizeNumeric?: boolean;
      };
    },
  ) {
    return this.dataProcessingService.cleanData(dto.data, dto.options);
  }

  @Post('data/quality')
  @HttpCode(HttpStatus.OK)
  async assessQuality(@Body() dto: { data: any[] }) {
    return this.dataProcessingService.assessDataQuality(dto.data);
  }

  @Post('timeseries/forecast')
  @HttpCode(HttpStatus.OK)
  async forecastTimeSeries(
    @Body()
    dto: {
      data: number[];
      steps: number;
      params?: { p: number; d: number; q: number };
    },
  ) {
    return this.timeSeriesService.arimaForecast(
      dto.data,
      dto.steps,
      dto.params,
    );
  }

  @Post('timeseries/decompose')
  @HttpCode(HttpStatus.OK)
  async decomposeTimeSeries(
    @Body() dto: { data: number[]; period: number },
  ) {
    return this.timeSeriesService.seasonalDecomposition(
      dto.data,
      dto.period,
    );
  }

  @Post('timeseries/anomalies')
  @HttpCode(HttpStatus.OK)
  async detectAnomalies(
    @Body() dto: { data: number[]; threshold?: number },
  ) {
    return this.timeSeriesService.detectAnomalies(dto.data, dto.threshold);
  }

  @Post('timeseries/trend')
  @HttpCode(HttpStatus.OK)
  async detectTrend(@Body() dto: { data: number[] }) {
    return this.timeSeriesService.detectTrend(dto.data);
  }
}
