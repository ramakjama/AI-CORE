import { Router } from 'express';
import { z } from 'zod';
import { LogsService } from '../services/logs.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

const createLogSchema = z.object({
  motorId: z.string(),
  level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']),
  message: z.string(),
  metadata: z.record(z.any()).optional(),
  errorCode: z.string().optional(),
  errorStack: z.string().optional(),
  requestId: z.string().optional(),
});

/**
 * POST /api/logs
 * Create log entry
 */
router.post(
  '/',
  authenticate,
  requirePermission('write'),
  asyncHandler(async (req, res) => {
    const data = createLogSchema.parse(req.body);
    const log = await LogsService.create({
      ...data,
      userId: req.user!.userId,
    });

    res.status(201).json({ log });
  })
);

/**
 * GET /api/logs
 * Query logs
 */
router.get(
  '/',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const { motorId, level, from, to, requestId, userId, search, limit, offset } = req.query;

    const result = await LogsService.query({
      motorId: motorId as string,
      level: level ? (level as string).split(',') as any[] : undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      requestId: requestId as string,
      userId: userId as string,
      search: search as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });

    res.json(result);
  })
);

/**
 * GET /api/logs/:motorId/errors
 * Get error logs for motor
 */
router.get(
  '/:motorId/errors',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const { limit } = req.query;

    const logs = await LogsService.getErrors(
      req.params.motorId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({ logs });
  })
);

export { router as logsRouter };
