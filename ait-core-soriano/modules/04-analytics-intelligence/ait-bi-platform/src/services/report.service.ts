import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from '../entities/report.entity';
import {
  CreateReportDto,
  UpdateReportDto,
  FilterReportDto,
  ReportOutput,
  ReportParameters,
  ScheduledReport,
  CronExpression,
  PaginatedResult,
  PolicyFilters,
  ClaimFilters,
  CustomerFilters,
  ReportFormat,
} from '../types/report.types';
import { Period } from '../types/metrics.types';
import { KafkaService } from './kafka.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);

  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    private kafkaService: KafkaService,
    private metricsService: MetricsService,
  ) {}

  // ==================== CRUD OPERATIONS ====================

  async create(userId: string, dto: CreateReportDto): Promise<Report> {
    this.logger.log(`Creating report: ${dto.name}`);

    const report = this.reportRepository.create({
      name: dto.name,
      description: dto.description,
      templateId: dto.templateId,
      parameters: dto.parameters,
      schedule: dto.schedule,
      recipients: dto.recipients,
      format: dto.format || 'pdf',
      createdBy: userId,
      isActive: true,
    });

    const saved = await this.reportRepository.save(report);

    await this.kafkaService.emit('report.created', {
      reportId: saved.id,
      userId,
      timestamp: new Date(),
    });

    return saved;
  }

  async findAll(filters: FilterReportDto): Promise<PaginatedResult<Report>> {
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;

    const query = this.reportRepository.createQueryBuilder('report');

    if (filters.type) {
      query.andWhere('report.type = :type', { type: filters.type });
    }

    if (filters.status) {
      query.andWhere('report.status = :status', { status: filters.status });
    }

    if (filters.createdBy) {
      query.andWhere('report.createdBy = :createdBy', { createdBy: filters.createdBy });
    }

    if (filters.dateFrom) {
      query.andWhere('report.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters.dateTo) {
      query.andWhere('report.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    const [data, total] = await query
      .orderBy('report.createdAt', 'DESC')
      .skip(offset)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportRepository.findOne({ where: { id } });

    if (!report) {
      throw new NotFoundException(`Report ${id} not found`);
    }

    return report;
  }

  async update(id: string, dto: UpdateReportDto): Promise<Report> {
    const report = await this.findOne(id);

    Object.assign(report, dto);
    report.updatedAt = new Date();

    const updated = await this.reportRepository.save(report);

    await this.kafkaService.emit('report.updated', {
      reportId: id,
      changes: dto,
      timestamp: new Date(),
    });

    return updated;
  }

  async delete(id: string): Promise<void> {
    const report = await this.findOne(id);
    await this.reportRepository.remove(report);

    await this.kafkaService.emit('report.deleted', {
      reportId: id,
      timestamp: new Date(),
    });
  }

  // ==================== REPORT GENERATION ====================

  async generate(reportId: string, parameters?: ReportParameters): Promise<ReportOutput> {
    this.logger.log(`Generating report ${reportId}`);

    const report = await this.findOne(reportId);
    const startTime = Date.now();

    // Merge default parameters with provided parameters
    const finalParams = { ...report.parameters, ...parameters };

    // Generate report data based on template
    const data = await this.generateReportData(report.templateId, finalParams);

    const executionTime = Date.now() - startTime;

    const output: ReportOutput = {
      reportId: report.id,
      name: report.name,
      generatedAt: new Date(),
      data,
      metadata: {
        recordCount: Array.isArray(data) ? data.length : Object.keys(data).length,
        executionTime,
        parameters: finalParams,
      },
    };

    // Update report statistics
    report.lastGeneratedAt = new Date();
    report.generationCount = (report.generationCount || 0) + 1;
    await this.reportRepository.save(report);

    await this.kafkaService.emit('report.generated', {
      reportId,
      executionTime,
      recordCount: output.metadata.recordCount,
      timestamp: new Date(),
    });

    return output;
  }

  // ==================== SCHEDULING ====================

  async schedule(reportId: string, schedule: CronExpression): Promise<ScheduledReport> {
    this.logger.log(`Scheduling report ${reportId} with cron: ${schedule}`);

    const report = await this.findOne(reportId);
    report.schedule = schedule;
    report.isActive = true;
    await this.reportRepository.save(report);

    const scheduledReport: ScheduledReport = {
      id: `schedule_${reportId}`,
      reportId,
      schedule,
      nextRun: this.calculateNextRun(schedule),
      isActive: true,
      recipients: report.recipients || [],
    };

    await this.kafkaService.emit('report.scheduled', {
      reportId,
      schedule,
      timestamp: new Date(),
    });

    return scheduledReport;
  }

  async cancelSchedule(scheduleId: string): Promise<void> {
    this.logger.log(`Cancelling schedule ${scheduleId}`);

    const reportId = scheduleId.replace('schedule_', '');
    const report = await this.findOne(reportId);
    report.schedule = null;
    report.isActive = false;
    await this.reportRepository.save(report);

    await this.kafkaService.emit('report.schedule_cancelled', {
      scheduleId,
      timestamp: new Date(),
    });
  }

  // ==================== EXPORT FORMATS ====================

  async exportPDF(reportId: string, parameters?: ReportParameters): Promise<Buffer> {
    this.logger.log(`Exporting report ${reportId} as PDF`);

    const output = await this.generate(reportId, parameters);

    // In production, use a PDF generation library like puppeteer or pdfkit
    const pdfContent = this.generatePDFContent(output);
    return Buffer.from(pdfContent);
  }

  async exportExcel(reportId: string, parameters?: ReportParameters): Promise<Buffer> {
    this.logger.log(`Exporting report ${reportId} as Excel`);

    const output = await this.generate(reportId, parameters);

    // In production, use a library like exceljs
    const excelContent = this.generateExcelContent(output);
    return Buffer.from(excelContent);
  }

  async exportCSV(reportId: string, parameters?: ReportParameters): Promise<Buffer> {
    this.logger.log(`Exporting report ${reportId} as CSV`);

    const output = await this.generate(reportId, parameters);
    const csv = this.generateCSVContent(output);
    return Buffer.from(csv);
  }

  async exportJSON(reportId: string, parameters?: ReportParameters): Promise<object> {
    this.logger.log(`Exporting report ${reportId} as JSON`);

    const output = await this.generate(reportId, parameters);
    return output;
  }

  async exportHTML(reportId: string, parameters?: ReportParameters): Promise<string> {
    this.logger.log(`Exporting report ${reportId} as HTML`);

    const output = await this.generate(reportId, parameters);
    return this.generateHTMLContent(output);
  }

  async exportReport(
    reportId: string,
    format: ReportFormat,
    parameters?: ReportParameters,
  ): Promise<Buffer | object | string> {
    switch (format) {
      case 'pdf':
        return this.exportPDF(reportId, parameters);
      case 'excel':
        return this.exportExcel(reportId, parameters);
      case 'csv':
        return this.exportCSV(reportId, parameters);
      case 'json':
        return this.exportJSON(reportId, parameters);
      case 'html':
        return this.exportHTML(reportId, parameters);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // ==================== REPORT TEMPLATES ====================

  async monthlyRevenue(month: number, year: number): Promise<Report> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.create('system', {
      name: `Monthly Revenue Report - ${month}/${year}`,
      description: 'Monthly revenue breakdown and analysis',
      templateId: 'monthly_revenue',
      parameters: {
        period: { startDate, endDate },
        groupBy: ['product', 'region'],
      },
    });
  }

  async quarterlyPerformance(quarter: number, year: number): Promise<Report> {
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);

    return this.create('system', {
      name: `Q${quarter} ${year} Performance Report`,
      description: 'Quarterly business performance metrics',
      templateId: 'quarterly_performance',
      parameters: {
        period: { startDate, endDate },
      },
    });
  }

  async annualSummary(year: number): Promise<Report> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    return this.create('system', {
      name: `Annual Summary ${year}`,
      description: 'Annual business summary and KPIs',
      templateId: 'annual_summary',
      parameters: {
        period: { startDate, endDate },
      },
    });
  }

  async policyReport(filters: PolicyFilters): Promise<Report> {
    return this.create('system', {
      name: 'Policy Report',
      description: 'Detailed policy information and statistics',
      templateId: 'policy_report',
      parameters: {
        filters: filters as any,
      },
    });
  }

  async claimReport(filters: ClaimFilters): Promise<Report> {
    return this.create('system', {
      name: 'Claims Report',
      description: 'Claims analysis and settlement data',
      templateId: 'claim_report',
      parameters: {
        filters: filters as any,
      },
    });
  }

  async customerReport(filters: CustomerFilters): Promise<Report> {
    return this.create('system', {
      name: 'Customer Report',
      description: 'Customer demographics and behavior',
      templateId: 'customer_report',
      parameters: {
        filters: filters as any,
      },
    });
  }

  async agentPerformance(agentId: string, period: Period): Promise<Report> {
    return this.create('system', {
      name: `Agent Performance - ${agentId}`,
      description: 'Individual agent sales and productivity',
      templateId: 'agent_performance',
      parameters: {
        period,
        filters: { agentId: [agentId] },
      },
    });
  }

  async commissionReport(period: Period): Promise<Report> {
    return this.create('system', {
      name: 'Commission Report',
      description: 'Agent commissions and payouts',
      templateId: 'commission_report',
      parameters: { period },
    });
  }

  async lossRatio(period: Period): Promise<Report> {
    return this.create('system', {
      name: 'Loss Ratio Report',
      description: 'Loss ratio analysis by product and region',
      templateId: 'loss_ratio',
      parameters: { period },
    });
  }

  async expenseRatio(period: Period): Promise<Report> {
    return this.create('system', {
      name: 'Expense Ratio Report',
      description: 'Operating expense analysis',
      templateId: 'expense_ratio',
      parameters: { period },
    });
  }

  async combinedRatio(period: Period): Promise<Report> {
    return this.create('system', {
      name: 'Combined Ratio Report',
      description: 'Combined ratio analysis and trends',
      templateId: 'combined_ratio',
      parameters: { period },
    });
  }

  async renewalReport(upcoming: boolean = true): Promise<Report> {
    const days = upcoming ? 30 : -30;
    const startDate = new Date();
    const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    return this.create('system', {
      name: upcoming ? 'Upcoming Renewals' : 'Recent Renewals',
      description: 'Policy renewal status and opportunities',
      templateId: 'renewal_report',
      parameters: {
        period: { startDate, endDate },
      },
    });
  }

  async cancellationReport(period: Period): Promise<Report> {
    return this.create('system', {
      name: 'Cancellation Report',
      description: 'Policy cancellations and reasons',
      templateId: 'cancellation_report',
      parameters: { period },
    });
  }

  async customerSegmentation(): Promise<Report> {
    return this.create('system', {
      name: 'Customer Segmentation Report',
      description: 'Customer segments and characteristics',
      templateId: 'customer_segmentation',
    });
  }

  async productPerformance(period: Period): Promise<Report> {
    return this.create('system', {
      name: 'Product Performance Report',
      description: 'Product-level performance metrics',
      templateId: 'product_performance',
      parameters: { period },
    });
  }

  // ==================== HELPER METHODS ====================

  private async generateReportData(templateId: string, parameters: ReportParameters): Promise<any> {
    // Mock implementation - in production, this would query actual data
    const period: Period = parameters.period || {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    };

    const kpis = await this.metricsService.getKPIs(period, parameters.filters);

    // Generate different data based on template
    switch (templateId) {
      case 'monthly_revenue':
      case 'quarterly_performance':
      case 'annual_summary':
        return {
          summary: kpis,
          breakdown: this.generateBreakdown(kpis, parameters.groupBy),
          trends: await this.metricsService.getMetricTimeSeries('revenue', period, 'month'),
        };

      case 'policy_report':
        return {
          total: kpis.policies,
          new: kpis.newPolicies,
          renewed: kpis.renewedPolicies,
          canceled: kpis.canceledPolicies,
          details: this.generateMockPolicies(50),
        };

      case 'claim_report':
        return {
          total: kpis.claims,
          paid: kpis.paidClaims,
          reserved: kpis.reservedClaims,
          rejected: kpis.rejectedClaims,
          amount: kpis.claimAmount,
          details: this.generateMockClaims(30),
        };

      case 'customer_report':
        return {
          total: kpis.customers,
          new: kpis.newCustomers,
          active: kpis.activeCustomers,
          retention: kpis.retention,
          ltv: kpis.ltv,
          details: this.generateMockCustomers(100),
        };

      default:
        return kpis;
    }
  }

  private generateBreakdown(kpis: any, groupBy?: string[]): any {
    const categories = ['Auto', 'Home', 'Life', 'Health', 'Business'];
    return categories.map(cat => ({
      category: cat,
      value: Math.random() * 100000 + 50000,
      percentage: Math.random() * 30 + 10,
    }));
  }

  private generateMockPolicies(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      policyNumber: `POL-${String(i + 1).padStart(6, '0')}`,
      product: ['Auto', 'Home', 'Life', 'Health'][Math.floor(Math.random() * 4)],
      status: ['Active', 'Pending', 'Expired'][Math.floor(Math.random() * 3)],
      premium: Math.random() * 2000 + 500,
      startDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
    }));
  }

  private generateMockClaims(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      claimNumber: `CLM-${String(i + 1).padStart(6, '0')}`,
      type: ['Auto', 'Property', 'Medical'][Math.floor(Math.random() * 3)],
      status: ['Open', 'Paid', 'Rejected'][Math.floor(Math.random() * 3)],
      amount: Math.random() * 50000 + 1000,
      filedDate: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000),
    }));
  }

  private generateMockCustomers(count: number): any[] {
    return Array.from({ length: count }, (_, i) => ({
      customerId: `CUST-${String(i + 1).padStart(6, '0')}`,
      name: `Customer ${i + 1}`,
      segment: ['Premium', 'Standard', 'Basic'][Math.floor(Math.random() * 3)],
      policies: Math.floor(Math.random() * 5) + 1,
      ltv: Math.random() * 10000 + 2000,
      joinedDate: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
    }));
  }

  private generatePDFContent(output: ReportOutput): string {
    // Mock PDF generation - in production use puppeteer or pdfkit
    return `PDF Report: ${output.name}\nGenerated: ${output.generatedAt}\nData: ${JSON.stringify(output.data, null, 2)}`;
  }

  private generateExcelContent(output: ReportOutput): string {
    // Mock Excel generation - in production use exceljs
    return `Excel Report: ${output.name}\nGenerated: ${output.generatedAt}`;
  }

  private generateCSVContent(output: ReportOutput): string {
    const data = Array.isArray(output.data) ? output.data : [output.data];
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(','));

    return [headers, ...rows].join('\n');
  }

  private generateHTMLContent(output: ReportOutput): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${output.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #4CAF50; color: white; }
        </style>
      </head>
      <body>
        <h1>${output.name}</h1>
        <p>Generated: ${output.generatedAt}</p>
        <pre>${JSON.stringify(output.data, null, 2)}</pre>
      </body>
      </html>
    `;
  }

  private calculateNextRun(cronExpression: CronExpression): Date {
    // Simple mock - in production use a cron parsing library like node-cron
    return new Date(Date.now() + 24 * 60 * 60 * 1000); // Next day
  }
}
