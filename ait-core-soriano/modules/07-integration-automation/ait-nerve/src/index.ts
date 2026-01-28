/**
 * AIT-NERVE - Motor Manager & Engine Orchestration
 * Main entry point and exports
 */

// Module
export { NerveModule } from './nerve.module';

// Services
export { EngineOrchestratorService } from './services/engine-orchestrator.service';
export { HealthMonitorService } from './services/health-monitor.service';
export { RequestRouterService } from './services/request-router.service';
export { FailoverManagerService } from './services/failover-manager.service';
export { PerformanceMetricsService } from './services/performance-metrics.service';

// Controllers
export { NerveController } from './controllers/nerve.controller';

// Types
export * from './types/engine.types';

// Config
export * from './config/engines.config';
