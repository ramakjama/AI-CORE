import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { config } from '../config';

// Create a Registry
export const register = new client.Registry();

// Add default metrics
if (config.prometheusEnabled) {
  client.collectDefaultMetrics({
    register,
    prefix: 'ait_nerve_',
  });
}

// Custom metrics

// HTTP request duration histogram
export const httpRequestDuration = new client.Histogram({
  name: 'ait_nerve_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // seconds
  registers: [register],
});

// HTTP request counter
export const httpRequestTotal = new client.Counter({
  name: 'ait_nerve_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Motor status gauge
export const motorStatusGauge = new client.Gauge({
  name: 'ait_nerve_motor_status',
  help: 'Status of motors (1 = healthy, 0 = unhealthy)',
  labelNames: ['motor_id', 'motor_name'],
  registers: [register],
});

// Motor requests per hour gauge
export const motorRequestsPerHour = new client.Gauge({
  name: 'ait_nerve_motor_requests_per_hour',
  help: 'Number of requests per hour for each motor',
  labelNames: ['motor_id', 'motor_name'],
  registers: [register],
});

// Motor response time histogram
export const motorResponseTime = new client.Histogram({
  name: 'ait_nerve_motor_response_time_ms',
  help: 'Motor response time in milliseconds',
  labelNames: ['motor_id', 'motor_name'],
  buckets: [50, 100, 200, 300, 500, 1000, 2000, 5000], // ms
  registers: [register],
});

// Motor error rate gauge
export const motorErrorRate = new client.Gauge({
  name: 'ait_nerve_motor_error_rate',
  help: 'Motor error rate (percentage)',
  labelNames: ['motor_id', 'motor_name'],
  registers: [register],
});

// Active WebSocket connections
export const websocketConnections = new client.Gauge({
  name: 'ait_nerve_websocket_connections',
  help: 'Number of active WebSocket connections',
  registers: [register],
});

// Cache hit/miss counters
export const cacheHits = new client.Counter({
  name: 'ait_nerve_cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_key_prefix'],
  registers: [register],
});

export const cacheMisses = new client.Counter({
  name: 'ait_nerve_cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_key_prefix'],
  registers: [register],
});

// Database query duration
export const dbQueryDuration = new client.Histogram({
  name: 'ait_nerve_db_query_duration_ms',
  help: 'Database query duration in milliseconds',
  labelNames: ['operation'],
  buckets: [10, 50, 100, 300, 500, 1000, 3000, 5000], // ms
  registers: [register],
});

/**
 * Prometheus middleware to track HTTP metrics
 */
export function prometheusMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!config.prometheusEnabled) {
    return next();
  }

  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    };

    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });

  next();
}

/**
 * Metrics endpoint handler
 */
export async function metricsEndpoint(req: Request, res: Response) {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
}

/**
 * Update motor metrics
 */
export function updateMotorMetrics(motorId: string, motorName: string, metrics: {
  health: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  requestsPerHour: number;
  avgResponseTimeMs: number;
  errorRate: number;
}) {
  const healthValue = metrics.health === 'HEALTHY' ? 1 : 0;

  motorStatusGauge.set({ motor_id: motorId, motor_name: motorName }, healthValue);
  motorRequestsPerHour.set({ motor_id: motorId, motor_name: motorName }, metrics.requestsPerHour);
  motorResponseTime.observe({ motor_id: motorId, motor_name: motorName }, metrics.avgResponseTimeMs);
  motorErrorRate.set({ motor_id: motorId, motor_name: motorName }, metrics.errorRate);
}
