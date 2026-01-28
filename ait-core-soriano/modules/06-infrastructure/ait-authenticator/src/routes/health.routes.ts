import { Router, Request, Response } from 'express';
import { getPrismaClient } from '../config/database.config';
import { getRedisClient } from '../config/redis.config';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'ait-authenticator',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  try {
    const prisma = getPrismaClient();
    const redis = getRedisClient();

    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();

    res.json({
      success: true,
      database: 'connected',
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service not ready'
    });
  }
});

export default router;
