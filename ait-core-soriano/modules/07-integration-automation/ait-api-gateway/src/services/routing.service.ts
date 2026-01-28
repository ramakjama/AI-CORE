import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ApiRoute, RouteMethod, RouteStatus } from '../entities';
import { CreateRouteDto, UpdateRouteDto } from '../dto';
import { IRouteMatch } from '../interfaces/gateway.interface';

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);
  private routes: Map<string, ApiRoute> = new Map();
  private routeCache: Map<string, IRouteMatch> = new Map();

  async createRoute(dto: CreateRouteDto, userId: string): Promise<ApiRoute> {
    this.logger.log(`Creating route: ${dto.method} ${dto.path}`);

    const route: ApiRoute = {
      id: this.generateId(),
      path: dto.path,
      method: dto.method,
      targetUrl: dto.targetUrl,
      status: dto.status || RouteStatus.ACTIVE,
      priority: dto.priority || 0,
      requiresAuth: dto.requiresAuth !== undefined ? dto.requiresAuth : true,
      requiredRoles: dto.requiredRoles,
      rateLimitPerMinute: dto.rateLimitPerMinute,
      cacheTTL: dto.cacheTTL,
      timeout: dto.timeout || 30000,
      retries: dto.retries || 0,
      circuitBreakerEnabled: dto.circuitBreakerEnabled || false,
      requestTransform: dto.requestTransform,
      responseTransform: dto.responseTransform,
      metadata: dto.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
    };

    this.routes.set(route.id, route);
    this.clearRouteCache();

    this.logger.log(`Route created: ${route.id}`);
    return route;
  }

  async findRoute(path: string, method: string): Promise<IRouteMatch | null> {
    const cacheKey = `${method}:${path}`;
    
    if (this.routeCache.has(cacheKey)) {
      return this.routeCache.get(cacheKey)!;
    }

    const activeRoutes = Array.from(this.routes.values())
      .filter(r => r.status === RouteStatus.ACTIVE)
      .filter(r => r.method === method || r.method === RouteMethod.ALL)
      .sort((a, b) => b.priority - a.priority);

    for (const route of activeRoutes) {
      const match = this.matchRoute(route.path, path);
      if (match) {
        const routeMatch: IRouteMatch = {
          route,
          params: match.params,
          score: match.score,
        };
        this.routeCache.set(cacheKey, routeMatch);
        return routeMatch;
      }
    }

    return null;
  }

  async updateRoute(id: string, dto: UpdateRouteDto): Promise<ApiRoute> {
    const route = this.routes.get(id);
    if (!route) {
      throw new NotFoundException(`Route ${id} not found`);
    }

    const updated: ApiRoute = {
      ...route,
      ...dto,
      updatedAt: new Date(),
    };

    this.routes.set(id, updated);
    this.clearRouteCache();

    this.logger.log(`Route updated: ${id}`);
    return updated;
  }

  async deleteRoute(id: string): Promise<void> {
    if (!this.routes.has(id)) {
      throw new NotFoundException(`Route ${id} not found`);
    }

    this.routes.delete(id);
    this.clearRouteCache();
    this.logger.log(`Route deleted: ${id}`);
  }

  async getAllRoutes(): Promise<ApiRoute[]> {
    return Array.from(this.routes.values());
  }

  async getRouteById(id: string): Promise<ApiRoute> {
    const route = this.routes.get(id);
    if (!route) {
      throw new NotFoundException(`Route ${id} not found`);
    }
    return route;
  }

  private matchRoute(
    pattern: string,
    path: string,
  ): { params: Record<string, string>; score: number } | null {
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params: Record<string, string> = {};
    let score = 0;

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = pathPart;
        score += 1;
      } else if (patternPart === '*') {
        params[`wildcard${i}`] = pathPart;
        score += 0.5;
      } else if (patternPart === pathPart) {
        score += 10;
      } else {
        return null;
      }
    }

    return { params, score };
  }

  private clearRouteCache(): void {
    this.routeCache.clear();
  }

  private generateId(): string {
    return 'route_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async getRouteStats(): Promise<any> {
    const routes = Array.from(this.routes.values());
    return {
      total: routes.length,
      active: routes.filter(r => r.status === RouteStatus.ACTIVE).length,
      inactive: routes.filter(r => r.status === RouteStatus.INACTIVE).length,
      maintenance: routes.filter(r => r.status === RouteStatus.MAINTENANCE).length,
      withAuth: routes.filter(r => r.requiresAuth).length,
      withCircuitBreaker: routes.filter(r => r.circuitBreakerEnabled).length,
    };
  }
}
