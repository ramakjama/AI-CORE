import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { strictRateLimiter } from '../middleware/rate-limit.middleware';
import passport from 'passport';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware';

const router = Router();

// Registration
router.post(
  '/register',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('name').trim().notEmpty(),
    validate
  ],
  authController.register.bind(authController)
);

// Login
router.post(
  '/login',
  strictRateLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate
  ],
  authController.login.bind(authController)
);

// MFA verification
router.post(
  '/mfa/verify',
  strictRateLimiter,
  [
    body('sessionToken').notEmpty(),
    body('code').isLength({ min: 6, max: 6 }),
    validate
  ],
  authController.verifyMFA.bind(authController)
);

// Refresh token
router.post(
  '/refresh',
  [body('refreshToken').notEmpty(), validate],
  authController.refresh.bind(authController)
);

// Logout
router.post(
  '/logout',
  passport.authenticate('jwt', { session: false }),
  authController.logout.bind(authController)
);

// Get current user
router.get(
  '/me',
  passport.authenticate('jwt', { session: false }),
  authController.me.bind(authController)
);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
  // Redirect with token
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
});

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));
router.get('/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/auth/callback`);
});

export default router;
