import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DashboardTemplatesService } from '../services/dashboard-templates.service';

@ApiTags('Dashboard Templates')
@Controller('api/v1/bi/dashboard-templates')
export class DashboardTemplatesController {
  constructor(private readonly dashboardTemplatesService: DashboardTemplatesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available dashboard templates' })
  @ApiResponse({ status: 200, description: 'Returns list of templates' })
  getAvailableTemplates() {
    return this.dashboardTemplatesService.getAvailableTemplates();
  }

  @Post(':templateId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create dashboard from template' })
  @ApiParam({ name: 'templateId', description: 'Template ID' })
  async createFromTemplate(@Param('templateId') templateId: string) {
    return this.dashboardTemplatesService.createFromTemplate(templateId, 'current-user-id');
  }

  @Post('executive')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Executive Dashboard' })
  async createExecutiveDashboard() {
    return this.dashboardTemplatesService.createExecutiveDashboard('current-user-id');
  }

  @Post('sales')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Sales Dashboard' })
  async createSalesDashboard() {
    return this.dashboardTemplatesService.createSalesDashboard('current-user-id');
  }

  @Post('operations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Operations Dashboard' })
  async createOperationsDashboard() {
    return this.dashboardTemplatesService.createOperationsDashboard('current-user-id');
  }

  @Post('finance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Finance Dashboard' })
  async createFinanceDashboard() {
    return this.dashboardTemplatesService.createFinanceDashboard('current-user-id');
  }

  @Post('claims')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Claims Dashboard' })
  async createClaimsDashboard() {
    return this.dashboardTemplatesService.createClaimsDashboard('current-user-id');
  }

  @Post('crm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create CRM Dashboard' })
  async createCRMDashboard() {
    return this.dashboardTemplatesService.createCRMDashboard('current-user-id');
  }

  @Post('agent')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Agent Performance Dashboard' })
  async createAgentDashboard() {
    return this.dashboardTemplatesService.createAgentDashboard('current-user-id');
  }

  @Post('customer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Customer Dashboard' })
  async createCustomerDashboard() {
    return this.dashboardTemplatesService.createCustomerDashboard('current-user-id');
  }

  @Post('compliance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Compliance Dashboard' })
  async createComplianceDashboard() {
    return this.dashboardTemplatesService.createComplianceDashboard('current-user-id');
  }

  @Post('marketing')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Marketing Dashboard' })
  async createMarketingDashboard() {
    return this.dashboardTemplatesService.createMarketingDashboard('current-user-id');
  }
}
