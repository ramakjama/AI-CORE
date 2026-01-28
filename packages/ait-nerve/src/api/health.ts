import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      checks: {
        database: { status: 'unknown' },
        redis: { status: 'unknown' },
        memory: { status: 'unknown', usage: 0 },
      },
    };

    // Database check
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.checks.database = { status: 'healthy' };
    } catch (error) {
      health.status = 'unhealthy';
      health.checks.database = { status: 'unhealthy' };
    }

    // Redis check (optional)
    if (redis) {
      try {
        await redis.ping();
        health.checks.redis = { status: 'healthy' };
      } catch (error) {
        health.checks.redis = { status: 'degraded' };
      }
    } else {
      health.checks.redis = { status: 'disabled' };
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    health.checks.memory = {
      status: memUsageMB < 1000 ? 'healthy' : 'degraded',
      usage: memUsageMB,
    };

    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  })
);

/**
 * GET /api/health/ready
 * Readiness check for Kubernetes
 */
router.get('/ready', (req, res) => {
  res.json({ ready: true });
});

/**
 * GET /api/health/live
 * Liveness check for Kubernetes
 */
router.get('/live', (req, res) => {
  res.json({ alive: true });
});

export { router as healthRouter };
