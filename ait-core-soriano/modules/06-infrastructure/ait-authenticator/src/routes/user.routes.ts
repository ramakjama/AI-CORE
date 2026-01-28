import { Router } from 'express';
import passport from 'passport';

const router = Router();

// All routes require authentication
router.use(passport.authenticate('jwt', { session: false }));

// User routes placeholder
router.get('/', (req, res) => {
  res.json({ success: true, message: 'User routes' });
});

export default router;
