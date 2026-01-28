/**
 * Authentication Routes
 *
 * Defines all authentication-related endpoints
 */

import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

/**
 * POST /auth/login
 * Login with email and password
 */
router.post('/login', AuthController.login);

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register', AuthController.register);

/**
 * POST /auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', AuthController.refresh);

/**
 * POST /auth/forgot-password
 * Request password reset email
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * POST /auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', AuthController.resetPassword);

// ============================================================================
// OAUTH ROUTES
// ============================================================================

/**
 * GET /auth/google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', { session: false })
);

/**
 * GET /auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login' }),
  AuthController.googleCallback
);

/**
 * GET /auth/microsoft
 * Initiate Microsoft OAuth flow
 */
router.get(
  '/microsoft',
  passport.authenticate('microsoft', { session: false })
);

/**
 * GET /auth/microsoft/callback
 * Microsoft OAuth callback
 */
router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { session: false, failureRedirect: '/auth/login' }),
  AuthController.microsoftCallback
);

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

/**
 * POST /auth/logout
 * Logout and revoke refresh token
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * GET /auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, AuthController.me);

/**
 * POST /auth/change-password
 * Change password (requires current password)
 */
router.post('/change-password', authenticate, AuthController.changePassword);

// ============================================================================
// TWO-FACTOR AUTHENTICATION ROUTES
// ============================================================================

/**
 * POST /auth/2fa/enable
 * Enable 2FA for authenticated user
 */
router.post('/2fa/enable', authenticate, AuthController.enable2FA);

/**
 * POST /auth/2fa/verify
 * Verify 2FA token
 */
router.post('/2fa/verify', authenticate, AuthController.verify2FA);

/**
 * POST /auth/2fa/disable
 * Disable 2FA for authenticated user
 */
router.post('/2fa/disable', authenticate, AuthController.disable2FA);

// ============================================================================
// EXPORT ROUTER
// ============================================================================

export default router;
