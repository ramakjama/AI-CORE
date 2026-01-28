import { Request, Response, NextFunction } from 'express';
import promClient from 'prom-client';

export const register = new promClient.Registry();

// Default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

export const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

export const authenticationAttempts = new promClient.Counter({
  name: 'authentication_attempts_total',
  help: 'Total number of authentication attempts',
  labelNames: ['method', 'status']
});

export const activeUsers = new promClient.Gauge({
  name: 'active_users',
  help: 'Number of currently active users'
});

register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(authenticationAttempts);
register.registerMetric(activeUsers);

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};
