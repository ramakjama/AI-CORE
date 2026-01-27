/**
 * Health Module Index
 * Exports all health check components
 */

export {
  DatabaseHealthMonitor,
  getDatabaseHealthMonitor,
  quickHealthCheck,
  createHealthCheckEndpoint,
  type HealthCheckResult,
  type DomainHealth,
  type HealthTrend,
  type HealthCheckResponse,
} from './database-health';
