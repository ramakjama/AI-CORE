import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from '../services/report.service';
import {
  CreateReportDto,
  UpdateReportDto,
  FilterReportDto,
  ReportParameters,
  ReportFormat,
  CronExpression,
} from '../types/report.types';
import { Period } from '../types/metrics.types';

@ApiTags('Reports')
@Controller('api/v1/bi/reports')
export class ReportsController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new report' })
  @ApiResponse({ status: 201, description: 'Report created successfully' })
  async create(@Body() dto: CreateReportDto) {
    return this.reportService.create('current-user-id', dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reports with filters' })
  @ApiResponse({ status: 200, description: 'Returns paginated reports' })
  async findAll(@Query() filters: FilterReportDto) {
    return this.reportService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update report' })
  async update(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete report' })
  async delete(@Param('id') id: string) {
    return this.reportService.delete(id);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Generate report with optional parameters' })
  async generate(
    @Param('id') id: string,
    @Body() parameters?: ReportParameters,
  ) {
    return this.reportService.generate(id, parameters);
  }

  @Post(':id/schedule')
  @ApiOperation({ summary: 'Schedule report generation' })
  async schedule(
    @Param('id') id: string,
    @Body() body: { schedule: CronExpression },
  ) {
    return this.reportService.schedule(id, body.schedule);
  }

  @Delete(':id/schedule')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancel scheduled report' })
  async cancelSchedule(@Param('id') id: string) {
    return this.reportService.cancelSchedule(`schedule_${id}`);
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export report in specified format' })
  @ApiQuery({ name: 'format', enum: ['pdf', 'excel', 'csv', 'json', 'html'] })
  async exportReport(
    @Param('id') id: string,
    @Query('format') format: ReportFormat = 'pdf',
    @Res({ passthrough: true }) res: Response,
  ) {
    const data = await this.reportService.exportReport(id, format);

    // Set appropriate headers based on format
    switch (format) {
      case 'pdf':
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="report-${id}.pdf"`,
        });
        return new StreamableFile(data as Buffer);

      case 'excel':
        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="report-${id}.xlsx"`,
        });
        return new StreamableFile(data as Buffer);

      case 'csv':
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${id}.csv"`,
        });
        return new StreamableFile(data as Buffer);

      case 'html':
        res.set({
          'Content-Type': 'text/html',
        });
        return data;

      case 'json':
        res.set({
          'Content-Type': 'application/json',
        });
        return data;

      default:
        return data;
    }
  }

  // ==================== PREDEFINED REPORT TEMPLATES ====================

  @Post('templates/monthly-revenue')
  @ApiOperation({ summary: 'Generate monthly revenue report' })
  async monthlyRevenue(@Body() body: { month: number; year: number }) {
    return this.reportService.monthlyRevenue(body.month, body.year);
  }

  @Post('templates/quarterly-performance')
  @ApiOperation({ summary: 'Generate quarterly performance report' })
  async quarterlyPerformance(@Body() body: { quarter: number; year: number }) {
    return this.reportService.quarterlyPerformance(body.quarter, body.year);
  }

  @Post('templates/annual-summary')
  @ApiOperation({ summary: 'Generate annual summary report' })
  async annualSummary(@Body() body: { year: number }) {
    return this.reportService.annualSummary(body.year);
  }

  @Post('templates/policy-report')
  @ApiOperation({ summary: 'Generate policy report' })
  async policyReport(@Body() filters: any) {
    return this.reportService.policyReport(filters);
  }

  @Post('templates/claim-report')
  @ApiOperation({ summary: 'Generate claims report' })
  async claimReport(@Body() filters: any) {
    return this.reportService.claimReport(filters);
  }

  @Post('templates/customer-report')
  @ApiOperation({ summary: 'Generate customer report' })
  async customerReport(@Body() filters: any) {
    return this.reportService.customerReport(filters);
  }

  @Post('templates/agent-performance')
  @ApiOperation({ summary: 'Generate agent performance report' })
  async agentPerformance(@Body() body: { agentId: string; period: Period }) {
    return this.reportService.agentPerformance(body.agentId, body.period);
  }

  @Post('templates/commission-report')
  @ApiOperation({ summary: 'Generate commission report' })
  async commissionReport(@Body() body: { period: Period }) {
    return this.reportService.commissionReport(body.period);
  }

  @Post('templates/loss-ratio')
  @ApiOperation({ summary: 'Generate loss ratio report' })
  async lossRatio(@Body() body: { period: Period }) {
    return this.reportService.lossRatio(body.period);
  }

  @Post('templates/expense-ratio')
  @ApiOperation({ summary: 'Generate expense ratio report' })
  async expenseRatio(@Body() body: { period: Period }) {
    return this.reportService.expenseRatio(body.period);
  }

  @Post('templates/combined-ratio')
  @ApiOperation({ summary: 'Generate combined ratio report' })
  async combinedRatio(@Body() body: { period: Period }) {
    return this.reportService.combinedRatio(body.period);
  }

  @Post('templates/renewal-report')
  @ApiOperation({ summary: 'Generate renewal report' })
  async renewalReport(@Body() body: { upcoming: boolean }) {
    return this.reportService.renewalReport(body.upcoming);
  }

  @Post('templates/cancellation-report')
  @ApiOperation({ summary: 'Generate cancellation report' })
  async cancellationReport(@Body() body: { period: Period }) {
    return this.reportService.cancellationReport(body.period);
  }

  @Post('templates/customer-segmentation')
  @ApiOperation({ summary: 'Generate customer segmentation report' })
  async customerSegmentation() {
    return this.reportService.customerSegmentation();
  }

  @Post('templates/product-performance')
  @ApiOperation({ summary: 'Generate product performance report' })
  async productPerformance(@Body() body: { period: Period }) {
    return this.reportService.productPerformance(body.period);
  }
}
