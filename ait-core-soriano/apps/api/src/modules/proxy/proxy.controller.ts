import {
  All,
  Controller,
  Req,
  Res,
  HttpStatus,
  Logger,
  Get,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ProxyService } from './proxy.service';
import { PROXY_CONFIG, getEnabledServices } from './proxy.config';

@ApiTags('Proxy / Gateway')
@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  /**
   * Gateway health check
   */
  @Get('gateway/health')
  @ApiOperation({ summary: 'Gateway health check' })
  @ApiResponse({ status: 200, description: 'Gateway is healthy' })
  async gatewayHealth() {
    const services = getEnabledServices();
    const healthChecks = await Promise.all(
      services.map(async (service) => ({
        name: service.name,
        healthy: await this.proxyService.checkServiceHealth(service.name),
        baseUrl: service.baseUrl,
      })),
    );

    const allHealthy = healthChecks.every((check) => check.healthy);

    return {
      status: allHealthy ? 'healthy' : 'degraded',
      gateway: 'AIT-API-Gateway',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      services: healthChecks,
      circuitBreakers: this.proxyService.getCircuitBreakerStatus(),
    };
  }

  /**
   * Gateway service status
   */
  @Get('gateway/services')
  @ApiOperation({ summary: 'List all configured services' })
  @ApiResponse({ status: 200, description: 'Services list' })
  getServices() {
    return {
      services: Object.entries(PROXY_CONFIG).map(([key, config]) => ({
        key,
        name: config.name,
        baseUrl: config.baseUrl,
        enabled: config.enabled,
        timeout: config.timeout,
        circuitBreaker: config.circuitBreaker,
      })),
      enabled: getEnabledServices().length,
      total: Object.keys(PROXY_CONFIG).length,
    };
  }

  /**
   * Proxy all requests to /pgc-engine/*
   */
  @All('pgc-engine/*')
  @ApiOperation({ summary: 'Proxy to AI-PGC-ENGINE service' })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async proxyPgcEngine(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  /**
   * Proxy all requests to /accountant/*
   */
  @All('accountant/*')
  @ApiOperation({ summary: 'Proxy to AI-ACCOUNTANT service' })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async proxyAccountant(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  /**
   * Proxy all requests to /treasury/*
   */
  @All('treasury/*')
  @ApiOperation({ summary: 'Proxy to AI-TREASURY service' })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async proxyTreasury(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  /**
   * Proxy all requests to /billing/*
   */
  @All('billing/*')
  @ApiOperation({ summary: 'Proxy to AI-BILLING service' })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async proxyBilling(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  /**
   * Proxy all requests to /policies/*
   */
  @All('policies/*')
  @ApiOperation({ summary: 'Proxy to AI-POLICY-MANAGER service' })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async proxyPolicies(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  /**
   * Proxy all requests to /claims/*
   */
  @All('claims/*')
  @ApiOperation({ summary: 'Proxy to AI-CLAIMS-PROCESSOR service' })
  @ApiResponse({ status: 200, description: 'Request forwarded successfully' })
  @ApiResponse({ status: 503, description: 'Service unavailable' })
  async proxyClaims(@Req() req: Request, @Res() res: Response) {
    return this.proxyRequest(req, res);
  }

  /**
   * Generic proxy handler
   */
  private async proxyRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    const path = req.path;
    const method = req.method;

    this.logger.debug(`Proxying ${method} ${path}`);

    try {
      // Forward request to appropriate service
      const response = await this.proxyService.forwardRequest(
        path,
        method,
        req.body,
        req.headers as Record<string, string>,
        req.query as Record<string, any>,
      );

      // Calculate request duration
      const duration = Date.now() - startTime;

      // Add custom headers
      res.setHeader('X-Gateway-Time', `${duration}ms`);
      res.setHeader('X-Proxied-By', 'AIT-API-Gateway');

      // Send response
      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `Proxy error for ${method} ${path}: ${error.message}`,
        error.stack,
      );

      // Add error headers
      res.setHeader('X-Gateway-Time', `${duration}ms`);
      res.setHeader('X-Proxied-By', 'AIT-API-Gateway');
      res.setHeader('X-Proxy-Error', 'true');

      // Determine status code
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;

      // Send error response
      res.status(statusCode).json({
        statusCode,
        message: error.message || 'Internal server error',
        error: error.name || 'ProxyError',
        path,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      });
    }
  }
}
