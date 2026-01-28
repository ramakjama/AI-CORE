import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { userService } from '../services/user.service';
import { oauthConfig } from './oauth.config';
import { logger } from '../utils/logger.utils';

export const initializePassport = (): void => {
  // Local Strategy for username/password authentication
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password'
      },
      async (email, password, done) => {
        try {
          const user = await userService.validateCredentials(email, password);
          if (!user) {
            return done(null, false, { message: 'Invalid credentials' });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // JWT Strategy for token-based authentication
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: oauthConfig.jwt.secret,
        issuer: oauthConfig.jwt.issuer,
        audience: oauthConfig.jwt.audience
      },
      async (payload, done) => {
        try {
          const user = await userService.findById(payload.sub);
          if (!user) {
            return done(null, false);
          }
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );

  // Google OAuth Strategy
  if (oauthConfig.providers.google.enabled) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: oauthConfig.providers.google.clientID,
          clientSecret: oauthConfig.providers.google.clientSecret,
          callbackURL: oauthConfig.providers.google.callbackURL
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await userService.findOrCreateSocialUser({
              provider: 'google',
              providerId: profile.id,
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value
            });
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
    logger.info('✓ Google OAuth strategy enabled');
  }

  // GitHub OAuth Strategy
  if (oauthConfig.providers.github.enabled) {
    passport.use(
      new GitHubStrategy(
        {
          clientID: oauthConfig.providers.github.clientID,
          clientSecret: oauthConfig.providers.github.clientSecret,
          callbackURL: oauthConfig.providers.github.callbackURL
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const user = await userService.findOrCreateSocialUser({
              provider: 'github',
              providerId: profile.id,
              email: profile.emails?.[0]?.value || '',
              name: profile.displayName || profile.username || '',
              avatar: profile.photos?.[0]?.value
            });
            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
    logger.info('✓ GitHub OAuth strategy enabled');
  }

  logger.info('Passport strategies initialized');
};
