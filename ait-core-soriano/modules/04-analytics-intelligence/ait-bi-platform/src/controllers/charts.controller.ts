import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import {
  ChartService,
  ChartConfig,
  ChartType,
  ChartOptions,
  TimeSeriesData,
  CategoricalData,
  ProportionData,
  XYData,
  MatrixData,
} from '../services/chart.service';

@ApiTags('Charts')
@Controller('api/v1/bi/charts')
export class ChartsController {
  constructor(private readonly chartService: ChartService) {}

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate chart from configuration' })
  @ApiResponse({ status: 200, description: 'Chart generated successfully' })
  async generateChart(@Body() config: ChartConfig) {
    return this.chartService.generateChart(config);
  }

  @Get('types')
  @ApiOperation({ summary: 'Get all supported chart types' })
  async getSupportedChartTypes() {
    return this.chartService.getSupportedChartTypes();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate chart configuration' })
  async validateConfig(@Body() config: ChartConfig) {
    return this.chartService.validateConfig(config);
  }

  // ==================== SPECIFIC CHART TYPES ====================

  @Post('line')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create line chart' })
  async lineChart(
    @Body() body: { data: TimeSeriesData; options?: ChartOptions },
  ) {
    return this.chartService.lineChart(body.data, body.options);
  }

  @Post('bar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create bar chart' })
  async barChart(
    @Body() body: { data: CategoricalData; options?: ChartOptions },
  ) {
    return this.chartService.barChart(body.data, body.options);
  }

  @Post('pie')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create pie chart' })
  async pieChart(
    @Body() body: { data: ProportionData; options?: ChartOptions },
  ) {
    return this.chartService.pieChart(body.data, body.options);
  }

  @Post('scatter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create scatter chart' })
  async scatterChart(@Body() body: { data: XYData; options?: ChartOptions }) {
    return this.chartService.scatterChart(body.data, body.options);
  }

  @Post('heatmap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create heatmap' })
  async heatmap(@Body() body: { data: MatrixData; options?: ChartOptions }) {
    return this.chartService.heatmap(body.data, body.options);
  }

  @Post('area')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create area chart' })
  async areaChart(
    @Body() body: { data: TimeSeriesData; options?: ChartOptions },
  ) {
    return this.chartService.areaChart(body.data, body.options);
  }

  @Post('funnel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create funnel chart' })
  async funnelChart(
    @Body() body: { data: CategoricalData; options?: ChartOptions },
  ) {
    return this.chartService.funnelChart(body.data, body.options);
  }

  @Post('gauge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create gauge chart' })
  async gaugeChart(
    @Body()
    body: {
      value: number;
      min: number;
      max: number;
      options?: ChartOptions;
    },
  ) {
    return this.chartService.gaugeChart(body.value, body.min, body.max, body.options);
  }

  @Post('waterfall')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create waterfall chart' })
  async waterfallChart(
    @Body() body: { data: CategoricalData; options?: ChartOptions },
  ) {
    return this.chartService.waterfallChart(body.data, body.options);
  }

  @Post('sankey')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create sankey diagram' })
  async sankeyChart(
    @Body()
    body: {
      data: {
        nodes: Array<{ id: string; label: string }>;
        links: Array<{ source: string; target: string; value: number }>;
      };
      options?: ChartOptions;
    },
  ) {
    return this.chartService.sankeyChart(body.data, body.options);
  }

  @Post('treemap')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create treemap' })
  async treemapChart(
    @Body()
    body: {
      data: {
        name: string;
        value?: number;
        children?: any[];
      };
      options?: ChartOptions;
    },
  ) {
    return this.chartService.treemapChart(body.data, body.options);
  }

  @Post('combo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create combo chart (multiple types)' })
  async comboChart(
    @Body()
    body: {
      data: {
        labels: string[];
        datasets: Array<{
          type: ChartType;
          label: string;
          data: number[];
        }>;
      };
      options?: ChartOptions;
    },
  ) {
    return this.chartService.comboChart(body.data, body.options);
  }

  // ==================== UTILITY ENDPOINTS ====================

  @Post('convert-format')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert data format for different libraries' })
  @ApiQuery({ name: 'targetLibrary', enum: ['chartjs', 'recharts', 'echarts'] })
  async convertDataFormat(
    @Body() data: any,
    @Query('targetLibrary') targetLibrary: 'chartjs' | 'recharts' | 'echarts',
  ) {
    return this.chartService.convertDataFormat(data, targetLibrary);
  }

  @Post('recommend-type')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get recommended chart type for data' })
  async getRecommendedChartType(@Body() data: any) {
    return {
      recommendedType: this.chartService.getRecommendedChartType(data),
    };
  }

  @Post('apply-theme')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Apply theme to chart' })
  @ApiQuery({ name: 'theme', enum: ['light', 'dark'] })
  async applyTheme(
    @Body() config: ChartConfig,
    @Query('theme') theme: 'light' | 'dark',
  ) {
    return this.chartService.applyTheme(config, theme);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export chart as image' })
  @ApiParam({ name: 'id', description: 'Chart ID' })
  @ApiQuery({ name: 'format', enum: ['png', 'svg'] })
  async exportChartAsImage(
    @Param('id') id: string,
    @Query('format') format: 'png' | 'svg' = 'png',
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.chartService.exportChartAsImage(id, format);

    const contentType = format === 'png' ? 'image/png' : 'image/svg+xml';
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="chart-${id}.${format}"`,
    });

    return new StreamableFile(buffer);
  }

  @Post('make-responsive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Make chart configuration responsive' })
  async makeResponsive(@Body() config: ChartConfig) {
    return this.chartService.makeResponsive(config);
  }
}
