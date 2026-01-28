import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard } from '../entities/dashboard.entity';
import { Widget } from '../entities/widget.entity';
import { CreateDashboardDto, UpdateDashboardDto } from '../dtos/create-dashboard.dto';
import { DataQueryService } from './data-query.service';
import { KafkaService } from './kafka.service';
import { AddWidgetDto, UpdateWidgetDto, WidgetData } from '../types/widget.types';

@Injectable()
export class BiDashboardService {
  private readonly logger = new Logger(BiDashboardService.name);

  constructor(
    @InjectRepository(Dashboard)
    private dashboardRepository: Repository<Dashboard>,
    @InjectRepository(Widget)
    private widgetRepository: Repository<Widget>,
    private dataQueryService: DataQueryService,
    private kafkaService: KafkaService,
  ) {}

  async create(userId: string, dto: CreateDashboardDto): Promise<Dashboard> {
    this.logger.log(`Creating dashboard: ${dto.name}`);

    const dashboard = this.dashboardRepository.create({
      ...dto,
      ownerId: userId,
    });

    const saved = await this.dashboardRepository.save(dashboard);

    await this.kafkaService.emit('dashboard.created', {
      dashboardId: saved.id,
      userId,
      timestamp: new Date(),
    });

    return saved;
  }

  async findAll(userId: string, filters?: any): Promise<Dashboard[]> {
    const query = this.dashboardRepository.createQueryBuilder('dashboard')
      .leftJoinAndSelect('dashboard.widgets', 'widgets')
      .where('dashboard.ownerId = :userId', { userId })
      .orWhere('dashboard.visibility = :visibility', { visibility: 'public' });

    if (filters?.type) {
      query.andWhere('dashboard.type = :type', { type: filters.type });
    }

    if (filters?.tags && filters.tags.length > 0) {
      query.andWhere('dashboard.tags && ARRAY[:...tags]', { tags: filters.tags });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('dashboard.isActive = :isActive', { isActive: filters.isActive });
    }

    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Dashboard> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id },
      relations: ['widgets'],
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard ${id} not found`);
    }

    // Update last accessed
    dashboard.lastAccessedAt = new Date();
    await this.dashboardRepository.save(dashboard);

    return dashboard;
  }

  async update(id: string, userId: string, dto: UpdateDashboardDto): Promise<Dashboard> {
    const dashboard = await this.findOne(id, userId);

    Object.assign(dashboard, dto);
    const updated = await this.dashboardRepository.save(dashboard);

    await this.kafkaService.emit('dashboard.updated', {
      dashboardId: id,
      userId,
      changes: dto,
      timestamp: new Date(),
    });

    return updated;
  }

  async remove(id: string, userId: string): Promise<void> {
    const dashboard = await this.findOne(id, userId);

    if (dashboard.ownerId !== userId) {
      throw new BadRequestException('You can only delete your own dashboards');
    }

    await this.dashboardRepository.remove(dashboard);

    await this.kafkaService.emit('dashboard.deleted', {
      dashboardId: id,
      userId,
      timestamp: new Date(),
    });
  }

  async duplicate(id: string, userId: string): Promise<Dashboard> {
    const original = await this.findOne(id, userId);

    const duplicate = this.dashboardRepository.create({
      ...original,
      id: undefined,
      name: `${original.name} (Copy)`,
      ownerId: userId,
      createdAt: undefined,
      updatedAt: undefined,
    });

    const saved = await this.dashboardRepository.save(duplicate);

    // Duplicate widgets
    if (original.widgets && original.widgets.length > 0) {
      const newWidgets = original.widgets.map(widget =>
        this.widgetRepository.create({
          ...widget,
          id: undefined,
          dashboardId: saved.id,
          createdAt: undefined,
          updatedAt: undefined,
        })
      );

      await this.widgetRepository.save(newWidgets);
    }

    return saved;
  }

  async refreshData(id: string, userId: string): Promise<any> {
    const dashboard = await this.findOne(id, userId);

    const widgetData = await Promise.all(
      dashboard.widgets.map(async (widget) => ({
        widgetId: widget.id,
        data: await this.dataQueryService.executeQuery(widget.dataQuery),
      }))
    );

    await this.kafkaService.emit('dashboard.refreshed', {
      dashboardId: id,
      userId,
      timestamp: new Date(),
    });

    return {
      dashboardId: id,
      widgets: widgetData,
      refreshedAt: new Date(),
    };
  }

  async exportDashboard(id: string, userId: string, format: 'json' | 'pdf'): Promise<any> {
    const dashboard = await this.findOne(id, userId);

    if (format === 'json') {
      return {
        dashboard,
        exportedAt: new Date(),
      };
    }

    // PDF export would integrate with a PDF generation service
    throw new BadRequestException('PDF export not yet implemented');
  }

  async getFavorites(userId: string): Promise<Dashboard[]> {
    return this.dashboardRepository.find({
      where: {
        ownerId: userId,
        isFavorite: true,
      },
      relations: ['widgets'],
    });
  }

  async toggleFavorite(id: string, userId: string): Promise<Dashboard> {
    const dashboard = await this.findOne(id, userId);
    dashboard.isFavorite = !dashboard.isFavorite;
    return this.dashboardRepository.save(dashboard);
  }

  async getStats(userId: string): Promise<any> {
    const dashboards = await this.dashboardRepository.find({
      where: { ownerId: userId },
    });

    return {
      total: dashboards.length,
      byType: dashboards.reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {}),
      favorites: dashboards.filter(d => d.isFavorite).length,
      active: dashboards.filter(d => d.isActive).length,
    };
  }

  // ==================== WIDGET MANAGEMENT ====================

  async addWidget(dashboardId: string, dto: AddWidgetDto): Promise<Dashboard> {
    this.logger.log(`Adding widget to dashboard ${dashboardId}`);

    const dashboard = await this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard ${dashboardId} not found`);
    }

    const widget = this.widgetRepository.create({
      dashboardId,
      name: dto.config.title,
      type: dto.config.type,
      config: dto.config,
      position: dto.position || { x: 0, y: 0, width: 4, height: 4 },
      order: dashboard.widgets.length + 1,
    });

    await this.widgetRepository.save(widget);

    await this.kafkaService.emit('widget.added', {
      dashboardId,
      widgetId: widget.id,
      timestamp: new Date(),
    });

    return this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });
  }

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    dto: UpdateWidgetDto,
  ): Promise<Dashboard> {
    this.logger.log(`Updating widget ${widgetId} in dashboard ${dashboardId}`);

    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found in dashboard ${dashboardId}`);
    }

    if (dto.config) {
      widget.config = { ...widget.config, ...dto.config };
      if (dto.config.title) {
        widget.name = dto.config.title;
      }
    }

    if (dto.position) {
      widget.position = { ...widget.position, ...dto.position };
    }

    await this.widgetRepository.save(widget);

    await this.kafkaService.emit('widget.updated', {
      dashboardId,
      widgetId,
      timestamp: new Date(),
    });

    return this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    this.logger.log(`Removing widget ${widgetId} from dashboard ${dashboardId}`);

    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found in dashboard ${dashboardId}`);
    }

    await this.widgetRepository.remove(widget);

    await this.kafkaService.emit('widget.removed', {
      dashboardId,
      widgetId,
      timestamp: new Date(),
    });

    return this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });
  }

  async reorderWidgets(dashboardId: string, order: string[]): Promise<Dashboard> {
    this.logger.log(`Reordering widgets in dashboard ${dashboardId}`);

    const dashboard = await this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });

    if (!dashboard) {
      throw new NotFoundException(`Dashboard ${dashboardId} not found`);
    }

    // Update order for each widget
    const updates = order.map((widgetId, index) => {
      const widget = dashboard.widgets.find(w => w.id === widgetId);
      if (widget) {
        widget.order = index + 1;
        return this.widgetRepository.save(widget);
      }
    });

    await Promise.all(updates);

    await this.kafkaService.emit('widgets.reordered', {
      dashboardId,
      order,
      timestamp: new Date(),
    });

    return this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });
  }

  async getWidgetData(widgetId: string, filters?: any): Promise<WidgetData> {
    this.logger.log(`Fetching data for widget ${widgetId}`);

    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found`);
    }

    // Execute query based on widget configuration
    const data = await this.dataQueryService.executeQuery({
      ...widget.config,
      filters,
    });

    return {
      widgetId,
      data,
      metadata: {
        lastUpdated: new Date(),
        source: widget.config.dataSource || 'default',
        recordCount: Array.isArray(data) ? data.length : undefined,
      },
    };
  }

  async refreshWidget(widgetId: string): Promise<WidgetData> {
    return this.getWidgetData(widgetId);
  }

  async duplicateWidget(dashboardId: string, widgetId: string): Promise<Dashboard> {
    this.logger.log(`Duplicating widget ${widgetId}`);

    const widget = await this.widgetRepository.findOne({
      where: { id: widgetId, dashboardId },
    });

    if (!widget) {
      throw new NotFoundException(`Widget ${widgetId} not found`);
    }

    const duplicate = this.widgetRepository.create({
      ...widget,
      id: undefined,
      name: `${widget.name} (Copy)`,
      order: widget.order + 1,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await this.widgetRepository.save(duplicate);

    return this.dashboardRepository.findOne({
      where: { id: dashboardId },
      relations: ['widgets'],
    });
  }
}
