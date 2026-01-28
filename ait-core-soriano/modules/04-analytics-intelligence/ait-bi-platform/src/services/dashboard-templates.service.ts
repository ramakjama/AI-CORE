import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard, DashboardType, DashboardVisibility } from '../entities/dashboard.entity';
import { Widget } from '../entities/widget.entity';
import { WidgetType } from '../types/widget.types';

@Injectable()
export class DashboardTemplatesService {
  private readonly logger = new Logger(DashboardTemplatesService.name);

  constructor(
    @InjectRepository(Dashboard)
    private dashboardRepository: Repository<Dashboard>,
    @InjectRepository(Widget)
    private widgetRepository: Repository<Widget>,
  ) {}

  /**
   * Create Executive Dashboard
   * High-level overview with key business metrics
   */
  async createExecutiveDashboard(userId: string): Promise<Dashboard> {
    this.logger.log('Creating Executive Dashboard');

    const dashboard = await this.dashboardRepository.save({
      name: 'Executive Dashboard',
      description: 'High-level overview of key business metrics and KPIs',
      type: DashboardType.EXECUTIVE,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 300, // 5 minutes
      layout: { type: 'grid', columns: 12 },
      tags: ['executive', 'overview', 'kpis'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Total Revenue',
        type: WidgetType.NUMBER_CARD,
        config: {
          metric: 'revenue',
          period: 'month',
          showTrend: true,
          prefix: '€',
        },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'Active Policies',
        type: WidgetType.NUMBER_CARD,
        config: {
          metric: 'activePolicies',
          showTrend: true,
        },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Customer Retention',
        type: WidgetType.GAUGE_CHART,
        config: {
          metric: 'retention',
          min: 0,
          max: 100,
          suffix: '%',
          thresholds: [
            { value: 70, color: 'red' },
            { value: 85, color: 'yellow' },
            { value: 95, color: 'green' },
          ],
        },
        position: { x: 6, y: 0, width: 3, height: 2 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Combined Ratio',
        type: WidgetType.GAUGE_CHART,
        config: {
          metric: 'combinedRatio',
          min: 0,
          max: 120,
          suffix: '%',
          thresholds: [
            { value: 100, color: 'green' },
            { value: 110, color: 'yellow' },
            { value: 120, color: 'red' },
          ],
        },
        position: { x: 9, y: 0, width: 3, height: 2 },
        order: 4,
      },
      {
        dashboardId: dashboard.id,
        name: 'Revenue Trend',
        type: WidgetType.LINE_CHART,
        config: {
          metric: 'revenue',
          period: 'last_12_months',
          granularity: 'month',
        },
        position: { x: 0, y: 2, width: 6, height: 4 },
        order: 5,
      },
      {
        dashboardId: dashboard.id,
        name: 'Policy Growth',
        type: WidgetType.AREA_CHART,
        config: {
          metrics: ['newPolicies', 'renewedPolicies', 'canceledPolicies'],
          period: 'last_6_months',
          granularity: 'month',
        },
        position: { x: 6, y: 2, width: 6, height: 4 },
        order: 6,
      },
      {
        dashboardId: dashboard.id,
        name: 'Top Products',
        type: WidgetType.BAR_CHART,
        config: {
          metric: 'revenue',
          groupBy: 'product',
          limit: 10,
        },
        position: { x: 0, y: 6, width: 6, height: 3 },
        order: 7,
      },
      {
        dashboardId: dashboard.id,
        name: 'Regional Performance',
        type: WidgetType.MAP,
        config: {
          metric: 'revenue',
          groupBy: 'region',
        },
        position: { x: 6, y: 6, width: 6, height: 3 },
        order: 8,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Sales Dashboard
   * Focus on sales metrics and conversion
   */
  async createSalesDashboard(userId: string): Promise<Dashboard> {
    this.logger.log('Creating Sales Dashboard');

    const dashboard = await this.dashboardRepository.save({
      name: 'Sales Dashboard',
      description: 'Sales performance, conversion rates, and pipeline metrics',
      type: DashboardType.OPERATIONAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 180,
      tags: ['sales', 'conversion', 'pipeline'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Conversion Rate',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'conversionRate', suffix: '%', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'New Policies',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'newPolicies', showTrend: true },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Sales Funnel',
        type: WidgetType.FUNNEL_CHART,
        config: {
          stages: ['Leads', 'Quotes', 'Proposals', 'Closed'],
        },
        position: { x: 6, y: 0, width: 6, height: 4 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Daily Sales',
        type: WidgetType.LINE_CHART,
        config: {
          metric: 'newPolicies',
          period: 'last_30_days',
          granularity: 'day',
        },
        position: { x: 0, y: 2, width: 6, height: 4 },
        order: 4,
      },
      {
        dashboardId: dashboard.id,
        name: 'Top Agents',
        type: WidgetType.LEADERBOARD,
        config: {
          metric: 'revenue',
          groupBy: 'agent',
          limit: 10,
        },
        position: { x: 0, y: 6, width: 6, height: 4 },
        order: 5,
      },
      {
        dashboardId: dashboard.id,
        name: 'Product Mix',
        type: WidgetType.PIE_CHART,
        config: {
          metric: 'policies',
          groupBy: 'product',
        },
        position: { x: 6, y: 4, width: 6, height: 4 },
        order: 6,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Operations Dashboard
   */
  async createOperationsDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'Operations Dashboard',
      description: 'Operational efficiency and process metrics',
      type: DashboardType.OPERATIONAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 120,
      tags: ['operations', 'efficiency', 'process'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Average Response Time',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'averageResponseTime', suffix: 'h', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'Pending Policies',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'pendingPolicies', showTrend: true },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Processing Time Trend',
        type: WidgetType.LINE_CHART,
        config: {
          metric: 'averageResponseTime',
          period: 'last_30_days',
          granularity: 'day',
        },
        position: { x: 0, y: 2, width: 8, height: 4 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Workload Distribution',
        type: WidgetType.HEATMAP,
        config: {
          metric: 'tasks',
          dimensions: ['day_of_week', 'hour'],
        },
        position: { x: 8, y: 0, width: 4, height: 6 },
        order: 4,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Finance Dashboard
   */
  async createFinanceDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'Finance Dashboard',
      description: 'Financial metrics, ratios, and profitability',
      type: DashboardType.ANALYTICAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 600,
      tags: ['finance', 'profitability', 'ratios'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Gross Premium',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'grossPremium', prefix: '€', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'Loss Ratio',
        type: WidgetType.GAUGE_CHART,
        config: {
          metric: 'lossRatio',
          suffix: '%',
          min: 0,
          max: 100,
          thresholds: [
            { value: 60, color: 'green' },
            { value: 75, color: 'yellow' },
            { value: 90, color: 'red' },
          ],
        },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Expense Ratio',
        type: WidgetType.GAUGE_CHART,
        config: {
          metric: 'expenseRatio',
          suffix: '%',
          min: 0,
          max: 50,
        },
        position: { x: 6, y: 0, width: 3, height: 2 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Combined Ratio',
        type: WidgetType.GAUGE_CHART,
        config: {
          metric: 'combinedRatio',
          suffix: '%',
          min: 0,
          max: 120,
        },
        position: { x: 9, y: 0, width: 3, height: 2 },
        order: 4,
      },
      {
        dashboardId: dashboard.id,
        name: 'Premium Breakdown',
        type: WidgetType.BAR_CHART,
        config: {
          metrics: ['grossPremium', 'netPremium', 'earnedPremium'],
          period: 'last_12_months',
          granularity: 'month',
        },
        position: { x: 0, y: 2, width: 12, height: 4 },
        order: 5,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Claims Dashboard
   */
  async createClaimsDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'Claims Dashboard',
      description: 'Claims processing, status, and settlement metrics',
      type: DashboardType.OPERATIONAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 300,
      tags: ['claims', 'settlement', 'processing'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Total Claims',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'claims', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'Claim Amount',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'claimAmount', prefix: '€', showTrend: true },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Average Claim',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'averageClaimAmount', prefix: '€', showTrend: true },
        position: { x: 6, y: 0, width: 3, height: 2 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Claims by Status',
        type: WidgetType.PIE_CHART,
        config: {
          metric: 'claims',
          groupBy: 'status',
        },
        position: { x: 9, y: 0, width: 3, height: 4 },
        order: 4,
      },
      {
        dashboardId: dashboard.id,
        name: 'Claims Timeline',
        type: WidgetType.LINE_CHART,
        config: {
          metric: 'claims',
          period: 'last_6_months',
          granularity: 'month',
        },
        position: { x: 0, y: 2, width: 9, height: 4 },
        order: 5,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create CRM Dashboard
   */
  async createCRMDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'CRM Dashboard',
      description: 'Customer relationship and engagement metrics',
      type: DashboardType.ANALYTICAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 300,
      tags: ['crm', 'customers', 'engagement'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Total Customers',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'customers', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'New Customers',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'newCustomers', showTrend: true },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Customer LTV',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'ltv', prefix: '€', showTrend: true },
        position: { x: 6, y: 0, width: 3, height: 2 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Customer Growth',
        type: WidgetType.AREA_CHART,
        config: {
          metric: 'customers',
          period: 'last_12_months',
          granularity: 'month',
        },
        position: { x: 0, y: 2, width: 12, height: 4 },
        order: 4,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Agent Dashboard
   */
  async createAgentDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'Agent Performance',
      description: 'Individual agent performance and productivity',
      type: DashboardType.OPERATIONAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 180,
      tags: ['agent', 'performance', 'productivity'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'My Sales',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'newPolicies', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'My Commission',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'commissionRevenue', prefix: '€', showTrend: true },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Sales Progress',
        type: WidgetType.PROGRESS_BAR,
        config: {
          metric: 'newPolicies',
          target: 100,
          period: 'month',
        },
        position: { x: 6, y: 0, width: 6, height: 2 },
        order: 3,
      },
      {
        dashboardId: dashboard.id,
        name: 'Daily Activity',
        type: WidgetType.SPARKLINE,
        config: {
          metric: 'newPolicies',
          period: 'last_30_days',
          granularity: 'day',
        },
        position: { x: 0, y: 2, width: 12, height: 2 },
        order: 4,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Customer Dashboard (for end customers)
   */
  async createCustomerDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'My Insurance',
      description: 'Personal insurance overview for customers',
      type: DashboardType.CUSTOM,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 600,
      tags: ['customer', 'personal', 'policies'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'My Policies',
        type: WidgetType.TABLE,
        config: {
          columns: ['policy_number', 'product', 'status', 'renewal_date'],
        },
        position: { x: 0, y: 0, width: 8, height: 6 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'Coverage Summary',
        type: WidgetType.PIE_CHART,
        config: {
          metric: 'coverage',
          groupBy: 'type',
        },
        position: { x: 8, y: 0, width: 4, height: 6 },
        order: 2,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Compliance Dashboard
   */
  async createComplianceDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'Compliance Dashboard',
      description: 'Regulatory compliance and audit metrics',
      type: DashboardType.ANALYTICAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 1800,
      tags: ['compliance', 'regulatory', 'audit'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'Compliance Score',
        type: WidgetType.GAUGE_CHART,
        config: {
          metric: 'complianceScore',
          min: 0,
          max: 100,
          suffix: '%',
        },
        position: { x: 0, y: 0, width: 4, height: 4 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'Audit Timeline',
        type: WidgetType.TIMELINE,
        config: {
          events: 'audits',
          period: 'last_12_months',
        },
        position: { x: 4, y: 0, width: 8, height: 4 },
        order: 2,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * Create Marketing Dashboard
   */
  async createMarketingDashboard(userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.save({
      name: 'Marketing Dashboard',
      description: 'Marketing campaign performance and ROI',
      type: DashboardType.ANALYTICAL,
      visibility: DashboardVisibility.PRIVATE,
      ownerId: userId,
      refreshInterval: 300,
      tags: ['marketing', 'campaigns', 'roi'],
    });

    const widgets = [
      {
        dashboardId: dashboard.id,
        name: 'CAC',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'cac', prefix: '€', showTrend: true },
        position: { x: 0, y: 0, width: 3, height: 2 },
        order: 1,
      },
      {
        dashboardId: dashboard.id,
        name: 'LTV:CAC Ratio',
        type: WidgetType.NUMBER_CARD,
        config: { metric: 'ltvCacRatio', showTrend: true },
        position: { x: 3, y: 0, width: 3, height: 2 },
        order: 2,
      },
      {
        dashboardId: dashboard.id,
        name: 'Campaign Performance',
        type: WidgetType.BAR_CHART,
        config: {
          metric: 'conversions',
          groupBy: 'campaign',
          limit: 10,
        },
        position: { x: 0, y: 2, width: 12, height: 4 },
        order: 3,
      },
    ];

    await this.widgetRepository.save(widgets);
    return this.dashboardRepository.findOne({
      where: { id: dashboard.id },
      relations: ['widgets'],
    });
  }

  /**
   * List all available templates
   */
  getAvailableTemplates(): Array<{
    id: string;
    name: string;
    description: string;
    type: DashboardType;
    tags: string[];
  }> {
    return [
      {
        id: 'executive',
        name: 'Executive Dashboard',
        description: 'High-level overview of key business metrics and KPIs',
        type: DashboardType.EXECUTIVE,
        tags: ['executive', 'overview', 'kpis'],
      },
      {
        id: 'sales',
        name: 'Sales Dashboard',
        description: 'Sales performance, conversion rates, and pipeline metrics',
        type: DashboardType.OPERATIONAL,
        tags: ['sales', 'conversion', 'pipeline'],
      },
      {
        id: 'operations',
        name: 'Operations Dashboard',
        description: 'Operational efficiency and process metrics',
        type: DashboardType.OPERATIONAL,
        tags: ['operations', 'efficiency', 'process'],
      },
      {
        id: 'finance',
        name: 'Finance Dashboard',
        description: 'Financial metrics, ratios, and profitability',
        type: DashboardType.ANALYTICAL,
        tags: ['finance', 'profitability', 'ratios'],
      },
      {
        id: 'claims',
        name: 'Claims Dashboard',
        description: 'Claims processing, status, and settlement metrics',
        type: DashboardType.OPERATIONAL,
        tags: ['claims', 'settlement', 'processing'],
      },
      {
        id: 'crm',
        name: 'CRM Dashboard',
        description: 'Customer relationship and engagement metrics',
        type: DashboardType.ANALYTICAL,
        tags: ['crm', 'customers', 'engagement'],
      },
      {
        id: 'agent',
        name: 'Agent Performance',
        description: 'Individual agent performance and productivity',
        type: DashboardType.OPERATIONAL,
        tags: ['agent', 'performance', 'productivity'],
      },
      {
        id: 'customer',
        name: 'My Insurance',
        description: 'Personal insurance overview for customers',
        type: DashboardType.CUSTOM,
        tags: ['customer', 'personal', 'policies'],
      },
      {
        id: 'compliance',
        name: 'Compliance Dashboard',
        description: 'Regulatory compliance and audit metrics',
        type: DashboardType.ANALYTICAL,
        tags: ['compliance', 'regulatory', 'audit'],
      },
      {
        id: 'marketing',
        name: 'Marketing Dashboard',
        description: 'Marketing campaign performance and ROI',
        type: DashboardType.ANALYTICAL,
        tags: ['marketing', 'campaigns', 'roi'],
      },
    ];
  }

  /**
   * Create dashboard from template
   */
  async createFromTemplate(templateId: string, userId: string): Promise<Dashboard> {
    const methodMap: Record<string, (userId: string) => Promise<Dashboard>> = {
      executive: this.createExecutiveDashboard.bind(this),
      sales: this.createSalesDashboard.bind(this),
      operations: this.createOperationsDashboard.bind(this),
      finance: this.createFinanceDashboard.bind(this),
      claims: this.createClaimsDashboard.bind(this),
      crm: this.createCRMDashboard.bind(this),
      agent: this.createAgentDashboard.bind(this),
      customer: this.createCustomerDashboard.bind(this),
      compliance: this.createComplianceDashboard.bind(this),
      marketing: this.createMarketingDashboard.bind(this),
    };

    const method = methodMap[templateId];
    if (!method) {
      throw new Error(`Template ${templateId} not found`);
    }

    return method(userId);
  }
}
