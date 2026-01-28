import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BiDashboardService } from '../services/bi-dashboard.service';
import { CreateDashboardDto, UpdateDashboardDto } from '../dtos/create-dashboard.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('BI Dashboards')
@ApiBearerAuth()
@Controller('api/v1/bi/dashboards')
@UseGuards(JwtAuthGuard)
export class BiDashboardController {
  constructor(private readonly dashboardService: BiDashboardService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard created successfully' })
  async create(@Request() req, @Body() dto: CreateDashboardDto) {
    return this.dashboardService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all dashboards' })
  @ApiResponse({ status: 200, description: 'Returns all dashboards' })
  async findAll(@Request() req, @Query() filters: any) {
    return this.dashboardService.findAll(req.user.id, filters);
  }

  @Get('favorites')
  @ApiOperation({ summary: 'Get favorite dashboards' })
  @ApiResponse({ status: 200, description: 'Returns favorite dashboards' })
  async getFavorites(@Request() req) {
    return this.dashboardService.getFavorites(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard statistics' })
  async getStats(@Request() req) {
    return this.dashboardService.getStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dashboard by ID' })
  @ApiResponse({ status: 200, description: 'Returns dashboard details' })
  @ApiResponse({ status: 404, description: 'Dashboard not found' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.dashboardService.findOne(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard updated successfully' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateDashboardDto) {
    return this.dashboardService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard deleted successfully' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.dashboardService.remove(id, req.user.id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicate dashboard' })
  @ApiResponse({ status: 201, description: 'Dashboard duplicated successfully' })
  async duplicate(@Request() req, @Param('id') id: string) {
    return this.dashboardService.duplicate(id, req.user.id);
  }

  @Post(':id/refresh')
  @ApiOperation({ summary: 'Refresh dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data refreshed' })
  async refreshData(@Request() req, @Param('id') id: string) {
    return this.dashboardService.refreshData(id, req.user.id);
  }

  @Post(':id/favorite')
  @ApiOperation({ summary: 'Toggle dashboard favorite status' })
  @ApiResponse({ status: 200, description: 'Favorite status toggled' })
  async toggleFavorite(@Request() req, @Param('id') id: string) {
    return this.dashboardService.toggleFavorite(id, req.user.id);
  }

  @Get(':id/export/:format')
  @ApiOperation({ summary: 'Export dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard exported' })
  async exportDashboard(
    @Request() req,
    @Param('id') id: string,
    @Param('format') format: 'json' | 'pdf'
  ) {
    return this.dashboardService.exportDashboard(id, req.user.id, format);
  }
}
