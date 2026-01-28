import { Router } from 'express';
import { z } from 'zod';
import { MetricsService } from '../services/metrics.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

const createMetricSchema = z.object({
  motorId: z.string(),
  requestsPerHour: z.number().int().min(0).optional(),
  avgResponseTimeMs: z.number().int().min(0).optional(),
  errorRate: z.number().min(0).max(100).optional(),
  uptime: z.number().min(0).max(100).optional(),
  cpuUsage: z.number().min(0).max(100).optional(),
  memoryUsageMB: z.number().int().min(0).optional(),
  activeConnections: z.number().int().min(0).optional(),
  customMetrics: z.record(z.any()).optional(),
});

/**
 * POST /api/metrics
 * Record new metric
 */
router.post(
  '/',
  authenticate,
  requirePermission('write'),
  asyncHandler(async (req, res) => {
    const data = createMetricSchema.parse(req.body);
    const metric = await MetricsService.create(data);

    res.status(201).json({ metric });
  })
);

/**
 * GET /api/metrics/:motorId
 * Query metrics for motor
 */
router.get(
  '/:motorId',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const { from, to, limit } = req.query;

    const metrics = await MetricsService.query({
      motorId: req.params.motorId,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });

    res.json({ metrics });
  })
);

/**
 * GET /api/metrics/:motorId/latest
 * Get latest metric for motor
 */
router.get(
  '/:motorId/latest',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const metric = await MetricsService.getLatest(req.params.motorId);

    if (!metric) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'No metrics found for this motor' },
      });
    }

    res.json({ metric });
  })
);

/**
 * GET /api/metrics/:motorId/timeseries
 * Get time-series metrics
 */
router.get(
  '/:motorId/timeseries',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const { from, to, interval } = req.query;

    const metrics = await MetricsService.getTimeSeries(
      req.params.motorId,
      new Date(from as string),
      new Date(to as string),
      (interval as 'minute' | 'hour' | 'day') || 'hour'
    );

    res.json({ metrics });
  })
);

export { router as metricsRouter };
