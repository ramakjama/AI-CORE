/**
 * Passport Configuration
 *
 * Sets up authentication strategies:
 * - JWT (for API authentication)
 * - Google OAuth
 * - Microsoft OAuth
 */

import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { User } from '@ait-core/shared/types';
import { db } from '../index';
import { logger } from '../utils/logger';

// ============================================================================
// JWT Strategy
// ============================================================================

const jwtOptions: StrategyOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  issuer: 'aintech',
  audience: 'aintech-api'
};

passport.use(
  new JwtStrategy(jwtOptions, async (payload, done) => {
    try {
      // Extract user ID from JWT payload
      const userId = payload.sub || payload.userId;

      if (!userId) {
        return done(null, false, { message: 'Invalid token payload' });
      }

      // Find user in database
      const result = await db.query(
        `SELECT
          id,
          email,
          first_name as "firstName",
          last_name as "lastName",
          phone,
          role,
          status,
          email_verified as "emailVerified",
          two_factor_enabled as "twoFactorEnabled",
          created_at as "createdAt",
          updated_at as "updatedAt",
          last_login_at as "lastLoginAt",
          metadata
        FROM users
        WHERE id = $1 AND status = 'active'`,
        [userId]
      );

      if (result.rows.length === 0) {
        return done(null, false, { message: 'User not found or inactive' });
      }

      const user: User = result.rows[0];

      return done(null, user);
    } catch (error) {
      logger.error('JWT Strategy error:', error);
      return done(error, false);
    }
  })
);

// ============================================================================
// Google OAuth Strategy
// ============================================================================

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3004/auth/google/callback',
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info('Google OAuth callback', { profileId: profile.id });

          // Extract user info from Google profile
          const email = profile.emails?.[0]?.value;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';

          if (!email) {
            return done(new Error('No email provided by Google'), undefined);
          }

          // Check if OAuth identity exists
          const oauthResult = await db.query(
            `SELECT user_id FROM oauth_identities
             WHERE provider = 'google' AND provider_user_id = $1`,
            [profile.id]
          );

          let userId: string;

          if (oauthResult.rows.length > 0) {
            // Existing OAuth identity
            userId = oauthResult.rows[0].user_id;
          } else {
            // Check if user exists by email
            const userResult = await db.query(
              'SELECT id FROM users WHERE email = $1',
              [email]
            );

            if (userResult.rows.length > 0) {
              // Link OAuth to existing user
              userId = userResult.rows[0].id;
            } else {
              // Create new user
              const newUserResult = await db.query(
                `INSERT INTO users (email, first_name, last_name, email_verified, role)
                 VALUES ($1, $2, $3, true, 'customer')
                 RETURNING id`,
                [email, firstName, lastName]
              );
              userId = newUserResult.rows[0].id;
            }

            // Create OAuth identity
            await db.query(
              `INSERT INTO oauth_identities (user_id, provider, provider_user_id, access_token, refresh_token, profile_data)
               VALUES ($1, 'google', $2, $3, $4, $5)`,
              [userId, profile.id, accessToken, refreshToken, JSON.stringify(profile._json)]
            );
          }

          // Get complete user object
          const userResult = await db.query(
            `SELECT
              id,
              email,
              first_name as "firstName",
              last_name as "lastName",
              phone,
              role,
              status,
              email_verified as "emailVerified",
              two_factor_enabled as "twoFactorEnabled",
              created_at as "createdAt",
              updated_at as "updatedAt",
              last_login_at as "lastLoginAt",
              metadata
            FROM users
            WHERE id = $1`,
            [userId]
          );

          const user: User = userResult.rows[0];

          return done(null, user);
        } catch (error) {
          logger.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// ============================================================================
// Microsoft OAuth Strategy
// ============================================================================

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3004/auth/microsoft/callback',
        scope: ['user.read']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          logger.info('Microsoft OAuth callback', { profileId: profile.id });

          // Extract user info from Microsoft profile
          const email = profile.emails?.[0]?.value || profile.upn;
          const firstName = profile.name?.givenName || '';
          const lastName = profile.name?.familyName || '';

          if (!email) {
            return done(new Error('No email provided by Microsoft'), undefined);
          }

          // Check if OAuth identity exists
          const oauthResult = await db.query(
            `SELECT user_id FROM oauth_identities
             WHERE provider = 'microsoft' AND provider_user_id = $1`,
            [profile.id]
          );

          let userId: string;

          if (oauthResult.rows.length > 0) {
            // Existing OAuth identity
            userId = oauthResult.rows[0].user_id;
          } else {
            // Check if user exists by email
            const userResult = await db.query(
              'SELECT id FROM users WHERE email = $1',
              [email]
            );

            if (userResult.rows.length > 0) {
              // Link OAuth to existing user
              userId = userResult.rows[0].id;
            } else {
              // Create new user
              const newUserResult = await db.query(
                `INSERT INTO users (email, first_name, last_name, email_verified, role)
                 VALUES ($1, $2, $3, true, 'customer')
                 RETURNING id`,
                [email, firstName, lastName]
              );
              userId = newUserResult.rows[0].id;
            }

            // Create OAuth identity
            await db.query(
              `INSERT INTO oauth_identities (user_id, provider, provider_user_id, access_token, refresh_token, profile_data)
               VALUES ($1, 'microsoft', $2, $3, $4, $5)`,
              [userId, profile.id, accessToken, refreshToken, JSON.stringify(profile._json)]
            );
          }

          // Get complete user object
          const userResult = await db.query(
            `SELECT
              id,
              email,
              first_name as "firstName",
              last_name as "lastName",
              phone,
              role,
              status,
              email_verified as "emailVerified",
              two_factor_enabled as "twoFactorEnabled",
              created_at as "createdAt",
              updated_at as "updatedAt",
              last_login_at as "lastLoginAt",
              metadata
            FROM users
            WHERE id = $1`,
            [userId]
          );

          const user: User = userResult.rows[0];

          return done(null, user);
        } catch (error) {
          logger.error('Microsoft OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
}

// ============================================================================
// Setup Function
// ============================================================================

export function setupPassport(passportInstance: typeof passport): void {
  logger.info('Passport strategies configured');

  // Log which strategies are enabled
  const strategies = ['JWT'];
  if (process.env.GOOGLE_CLIENT_ID) strategies.push('Google');
  if (process.env.MICROSOFT_CLIENT_ID) strategies.push('Microsoft');

  logger.info(`Enabled authentication strategies: ${strategies.join(', ')}`);
}

export default passport;
