import { Router } from 'express';
import { z } from 'zod';
import { MotorService } from '../services/motor.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

// Schema validation
const createMotorSchema = z.object({
  slug: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['AI_ML', 'BUSINESS_LOGIC', 'AUTOMATION', 'COMMUNICATION', 'INTEGRATION', 'ANALYTICS', 'SECURITY', 'OTHER']),
  version: z.string().optional(),
  config: z.record(z.any()).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  order: z.number().int().optional(),
});

const updateMotorSchema = createMotorSchema.partial();

const updateStatusSchema = z.object({
  status: z.enum(['STOPPED', 'STARTING', 'RUNNING', 'PAUSED', 'STOPPING', 'ERROR']),
});

/**
 * GET /api/motors
 * Get all motors with optional filters
 */
router.get(
  '/',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const { category, enabled, status, health } = req.query;

    const motors = await MotorService.findAll({
      category: category as any,
      enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
      status: status as any,
      health: health as any,
    });

    res.json({ motors });
  })
);

/**
 * GET /api/motors/stats
 * Get motor statistics
 */
router.get(
  '/stats',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const stats = await MotorService.getStats();
    res.json(stats);
  })
);

/**
 * GET /api/motors/:id
 * Get motor by ID
 */
router.get(
  '/:id',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const motor = await MotorService.findById(req.params.id);

    if (!motor) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Motor not found' },
      });
    }

    res.json({ motor });
  })
);

/**
 * POST /api/motors
 * Create new motor
 */
router.post(
  '/',
  authenticate,
  requirePermission('write'),
  asyncHandler(async (req, res) => {
    const data = createMotorSchema.parse(req.body);
    const motor = await MotorService.create(data, req.user!.userId);

    res.status(201).json({ motor });
  })
);

/**
 * PATCH /api/motors/:id
 * Update motor
 */
router.patch(
  '/:id',
  authenticate,
  requirePermission('write'),
  asyncHandler(async (req, res) => {
    const data = updateMotorSchema.parse(req.body);
    const motor = await MotorService.update(req.params.id, data, req.user!.userId);

    res.json({ motor });
  })
);

/**
 * DELETE /api/motors/:id
 * Delete motor
 */
router.delete(
  '/:id',
  authenticate,
  requirePermission('delete'),
  asyncHandler(async (req, res) => {
    await MotorService.delete(req.params.id, req.user!.userId);

    res.status(204).send();
  })
);

/**
 * POST /api/motors/:id/start
 * Start motor
 */
router.post(
  '/:id/start',
  authenticate,
  requirePermission('execute'),
  asyncHandler(async (req, res) => {
    const motor = await MotorService.updateStatus(req.params.id, 'RUNNING', req.user!.userId);

    res.json({ motor });
  })
);

/**
 * POST /api/motors/:id/stop
 * Stop motor
 */
router.post(
  '/:id/stop',
  authenticate,
  requirePermission('execute'),
  asyncHandler(async (req, res) => {
    const motor = await MotorService.updateStatus(req.params.id, 'STOPPED', req.user!.userId);

    res.json({ motor });
  })
);

/**
 * POST /api/motors/:id/restart
 * Restart motor
 */
router.post(
  '/:id/restart',
  authenticate,
  requirePermission('execute'),
  asyncHandler(async (req, res) => {
    // Stop then start
    await MotorService.updateStatus(req.params.id, 'STOPPING', req.user!.userId);
    const motor = await MotorService.updateStatus(req.params.id, 'RUNNING', req.user!.userId);

    res.json({ motor });
  })
);

export { router as motorsRouter };
