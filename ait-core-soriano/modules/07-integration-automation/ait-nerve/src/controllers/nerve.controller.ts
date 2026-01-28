/**
 * AIT-NERVE Controller
 * Main controller for engine management and execution
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EngineOrchestratorService } from '../services/engine-orchestrator.service';
import { HealthMonitorService } from '../services/health-monitor.service';
import { RequestRouterService } from '../services/request-router.service';
import { FailoverManagerService } from '../services/failover-manager.service';
import { PerformanceMetricsService } from '../services/performance-metrics.service';
import { AlertingService } from '../services/alerting.service';
import {
  ExecutionRequest,
  BatchExecutionRequest,
  ScalingRequest,
} from '../types/engine.types';

@ApiTags('AIT-NERVE')
@Controller('nerve')
export class NerveController {
  private readonly logger = new Logger(NerveController.name);

  constructor(
    private readonly orchestrator: EngineOrchestratorService,
    private readonly healthMonitor: HealthMonitorService,
    private readonly router: RequestRouterService,
    private readonly failover: FailoverManagerService,
    private readonly metrics: PerformanceMetricsService,
    private readonly alerting: AlertingService
  ) {}

  // ==================== Engine Management ====================

  @Get('engines')
  @ApiOperation({ summary: 'List all engines' })
  @ApiResponse({ status: 200, description: 'List of all engines' })
  async listEngines(@Query('enabled') enabled?: boolean) {
    const engines = this.orchestrator.getAllEngines();

    if (enabled !== undefined) {
      return engines.filter(e => e.enabled === enabled);
    }

    return engines;
  }

  @Get('engines/:engineId')
  @ApiOperation({ summary: 'Get engine details' })
  @ApiResponse({ status: 200, description: 'Engine details' })
  async getEngine(@Param('engineId') engineId: string) {
    const engine = this.orchestrator.getEngine(engineId);
    if (!engine) {
      return { error: 'Engine not found' };
    }

    const instances = this.orchestrator.getEngineInstances(engineId);

    return {
      ...engine,
      instances: instances.map(i => ({
        id: i.id,
        status: i.status,
        healthy: i.healthStatus.healthy,
        uptime: i.healthStatus.uptime,
        metrics: i.metrics,
      })),
    };
  }

  @Post('engines/:engineId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start an engine' })
  @ApiResponse({ status: 200, description: 'Engine started successfully' })
  async startEngine(
    @Param('engineId') engineId: string,
    @Body('instances') instances?: number
  ) {
    try {
      await this.orchestrator.startEngine(engineId, instances);
      return {
        success: true,
        message: `Engine ${engineId} started`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('engines/:engineId/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop an engine' })
  @ApiResponse({ status: 200, description: 'Engine stopped successfully' })
  async stopEngine(@Param('engineId') engineId: string) {
    try {
      await this.orchestrator.stopEngine(engineId);
      return {
        success: true,
        message: `Engine ${engineId} stopped`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('engines/:engineId/restart')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restart an engine' })
  @ApiResponse({ status: 200, description: 'Engine restarted successfully' })
  async restartEngine(@Param('engineId') engineId: string) {
    try {
      await this.orchestrator.restartEngine(engineId);
      return {
        success: true,
        message: `Engine ${engineId} restarted`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Put('engines/:engineId/scale')
  @ApiOperation({ summary: 'Scale an engine' })
  @ApiResponse({ status: 200, description: 'Engine scaled successfully' })
  async scaleEngine(
    @Param('engineId') engineId: string,
    @Body() request: ScalingRequest
  ) {
    try {
      const response = await this.orchestrator.scaleEngine({
        ...request,
        engineId,
      });
      return response;
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== Engine Execution ====================

  @Post('execute/:engineId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute on specific engine' })
  @ApiResponse({ status: 200, description: 'Execution result' })
  async executeOnEngine(
    @Param('engineId') engineId: string,
    @Body() request: ExecutionRequest
  ) {
    try {
      const response = await this.failover.executeWithFailover({
        ...request,
        engineId,
      });
      return response;
    } catch (error) {
      this.logger.error(`Execution failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  @Post('execute/auto')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Auto-route to best engine' })
  @ApiResponse({ status: 200, description: 'Execution result' })
  async executeAuto(@Body() request: ExecutionRequest) {
    try {
      const response = await this.failover.executeWithFailover(request);
      return response;
    } catch (error) {
      this.logger.error(`Auto-execution failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Batch execution' })
  @ApiResponse({ status: 200, description: 'Batch execution results' })
  async executeBatch(@Body() request: BatchExecutionRequest) {
    const startTime = Date.now();
    const results = [];

    try {
      if (request.parallel) {
        // Execute in parallel
        const promises = request.requests.map(req =>
          this.failover.executeWithFailover(req).catch(error => ({
            requestId: 'unknown',
            engineId: req.engineId || 'unknown',
            engineInstance: 'unknown',
            status: 'error' as const,
            error: error.message,
            executionTime: 0,
            timestamp: new Date(),
          }))
        );

        results.push(...(await Promise.all(promises)));
      } else {
        // Execute sequentially
        for (const req of request.requests) {
          try {
            const result = await this.failover.executeWithFailover(req);
            results.push(result);

            if (request.failFast && result.status === 'error') {
              break;
            }
          } catch (error) {
            results.push({
              requestId: 'unknown',
              engineId: req.engineId || 'unknown',
              engineInstance: 'unknown',
              status: 'error',
              error: error.message,
              executionTime: 0,
              timestamp: new Date(),
            });

            if (request.failFast) {
              break;
            }
          }
        }
      }

      const successCount = results.filter(r => r.status === 'success').length;
      const failureCount = results.filter(r => r.status === 'error').length;

      return {
        batchId: `batch_${Date.now()}`,
        totalRequests: request.requests.length,
        successCount,
        failureCount,
        results,
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Batch execution failed: ${error.message}`);
      return {
        batchId: `batch_${Date.now()}`,
        totalRequests: request.requests.length,
        successCount: 0,
        failureCount: request.requests.length,
        results: [],
        executionTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  // ==================== Health & Monitoring ====================

  @Get('health')
  @ApiOperation({ summary: 'Get overall system health' })
  @ApiResponse({ status: 200, description: 'System health status' })
  async getSystemHealth() {
    return this.healthMonitor.getSystemHealth();
  }

  @Get('health/:engineId')
  @ApiOperation({ summary: 'Get engine health' })
  @ApiResponse({ status: 200, description: 'Engine health status' })
  async getEngineHealth(@Param('engineId') engineId: string) {
    return this.healthMonitor.getEngineHealth(engineId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics' })
  async getMetrics() {
    return this.metrics.getCurrentMetrics();
  }

  @Get('metrics/summary')
  @ApiOperation({ summary: 'Get metrics summary' })
  @ApiResponse({ status: 200, description: 'Metrics summary' })
  async getMetricsSummary() {
    return this.metrics.getMetricsSummary();
  }

  @Get('metrics/:engineId')
  @ApiOperation({ summary: 'Get engine-specific metrics' })
  @ApiResponse({ status: 200, description: 'Engine metrics' })
  async getEngineMetrics(@Param('engineId') engineId: string) {
    return this.metrics.getEngineMetrics(engineId);
  }

  @Get('metrics/prometheus')
  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics' })
  async getPrometheusMetrics() {
    const metrics = await this.metrics.getPrometheusMetrics();
    return metrics;
  }

  // ==================== Circuit Breakers ====================

  @Get('circuit-breakers')
  @ApiOperation({ summary: 'Get all circuit breaker states' })
  @ApiResponse({ status: 200, description: 'Circuit breaker states' })
  async getCircuitBreakers() {
    return this.failover.getAllCircuitBreakerStates();
  }

  @Get('circuit-breakers/:engineId')
  @ApiOperation({ summary: 'Get circuit breaker state for engine' })
  @ApiResponse({ status: 200, description: 'Circuit breaker state' })
  async getCircuitBreaker(@Param('engineId') engineId: string) {
    return this.failover.getCircuitBreakerState(engineId);
  }

  @Post('circuit-breakers/:engineId/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset circuit breaker' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset' })
  async resetCircuitBreaker(@Param('engineId') engineId: string) {
    this.failover.resetCircuitBreaker(engineId);
    return {
      success: true,
      message: `Circuit breaker for ${engineId} reset`,
    };
  }

  // ==================== Configuration ====================

  @Get('config')
  @ApiOperation({ summary: 'Get system configuration' })
  @ApiResponse({ status: 200, description: 'System configuration' })
  async getConfig() {
    const engines = this.orchestrator.getAllEngines();
    return {
      engines: engines.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type,
        enabled: e.enabled,
        maxInstances: e.maxInstances,
        minInstances: e.minInstances,
      })),
    };
  }

  @Get('config/:engineId')
  @ApiOperation({ summary: 'Get engine configuration' })
  @ApiResponse({ status: 200, description: 'Engine configuration' })
  async getEngineConfig(@Param('engineId') engineId: string) {
    return this.orchestrator.getEngine(engineId);
  }

  @Put('config/:engineId')
  @ApiOperation({ summary: 'Update engine configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated' })
  async updateEngineConfig(
    @Param('engineId') engineId: string,
    @Body() updates: any
  ) {
    try {
      this.orchestrator.updateEngineConfig(engineId, updates);
      return {
        success: true,
        message: `Configuration for ${engineId} updated`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ==================== Statistics ====================

  @Get('stats')
  @ApiOperation({ summary: 'Get system statistics' })
  @ApiResponse({ status: 200, description: 'System statistics' })
  async getStats() {
    const routingStats = this.router.getRoutingStats();
    const failoverStats = this.failover.getFailoverStats();
    const healthMetrics = this.healthMonitor.getHealthMetrics();

    return {
      routing: routingStats,
      failover: failoverStats,
      health: healthMetrics,
    };
  }

  // ==================== Alerting ====================

  @Get('alerts')
  @ApiOperation({ summary: 'Get all alerts' })
  @ApiResponse({ status: 200, description: 'List of alerts' })
  async getAlerts(
    @Query('severity') severity?: string,
    @Query('acknowledged') acknowledged?: boolean,
    @Query('engineId') engineId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.alerting.getAllAlerts({
      severity: severity as any,
      acknowledged,
      engineId,
      limit: limit ? parseInt(limit.toString()) : undefined,
    });
  }

  @Get('alerts/stats')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics' })
  async getAlertStats() {
    return this.alerting.getAlertStatistics();
  }

  @Get('alerts/:alertId')
  @ApiOperation({ summary: 'Get alert by ID' })
  @ApiResponse({ status: 200, description: 'Alert details' })
  async getAlert(@Param('alertId') alertId: string) {
    const alert = this.alerting.getAlert(alertId);
    if (!alert) {
      return { error: 'Alert not found' };
    }
    return alert;
  }

  @Post('alerts/:alertId/acknowledge')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged' })
  async acknowledgeAlert(
    @Param('alertId') alertId: string,
    @Body('acknowledgedBy') acknowledgedBy?: string,
  ) {
    const success = this.alerting.acknowledgeAlert(alertId, acknowledgedBy);
    return {
      success,
      message: success
        ? `Alert ${alertId} acknowledged`
        : 'Alert not found',
    };
  }

  @Get('alerts/rules')
  @ApiOperation({ summary: 'Get all alert rules' })
  @ApiResponse({ status: 200, description: 'Alert rules' })
  async getAlertRules() {
    return this.alerting.getAllAlertRules();
  }

  @Put('alerts/rules/:ruleId')
  @ApiOperation({ summary: 'Update alert rule' })
  @ApiResponse({ status: 200, description: 'Alert rule updated' })
  async updateAlertRule(
    @Param('ruleId') ruleId: string,
    @Body() updates: any,
  ) {
    try {
      this.alerting.updateAlertRule(ruleId, updates);
      return {
        success: true,
        message: `Alert rule ${ruleId} updated`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
