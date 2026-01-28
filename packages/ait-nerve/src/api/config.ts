import { Router } from 'express';
import { z } from 'zod';
import { ConfigService } from '../services/config.service';
import { authenticate } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../middleware/error-handler';

const router = Router();

const updateConfigSchema = z.object({
  config: z.record(z.any()),
  reason: z.string().optional(),
  hotReload: z.boolean().optional(),
});

/**
 * GET /api/config/:motorId
 * Get current config for motor
 */
router.get(
  '/:motorId',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const config = await ConfigService.getCurrent(req.params.motorId);
    res.json({ config });
  })
);

/**
 * PATCH /api/config/:motorId
 * Update motor config
 */
router.patch(
  '/:motorId',
  authenticate,
  requirePermission('write'),
  asyncHandler(async (req, res) => {
    const data = updateConfigSchema.parse(req.body);
    const motor = await ConfigService.update(req.params.motorId, data, req.user!.userId);

    res.json({ motor });
  })
);

/**
 * GET /api/config/:motorId/history
 * Get config history
 */
router.get(
  '/:motorId/history',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const { limit } = req.query;

    const history = await ConfigService.getHistory(
      req.params.motorId,
      limit ? parseInt(limit as string) : undefined
    );

    res.json({ history });
  })
);

/**
 * GET /api/config/:motorId/version/:version
 * Get specific config version
 */
router.get(
  '/:motorId/version/:version',
  authenticate,
  requirePermission('read'),
  asyncHandler(async (req, res) => {
    const version = parseInt(req.params.version);
    const configHistory = await ConfigService.getVersion(req.params.motorId, version);

    if (!configHistory) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Config version not found' },
      });
    }

    res.json({ configHistory });
  })
);

/**
 * POST /api/config/:motorId/rollback/:version
 * Rollback to previous config version
 */
router.post(
  '/:motorId/rollback/:version',
  authenticate,
  requirePermission('write'),
  asyncHandler(async (req, res) => {
    const version = parseInt(req.params.version);
    const motor = await ConfigService.rollback(req.params.motorId, version, req.user!.userId);

    res.json({ motor });
  })
);

export { router as configRouter };
