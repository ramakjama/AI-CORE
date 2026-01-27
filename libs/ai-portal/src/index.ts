/**
 * AI Portal Module
 * Customer portal for e-cliente and web premium
 *
 * This module provides:
 * - Secure user authentication with JWT
 * - Simplified policy and claims views
 * - Points and badges gamification system
 * - Referral program
 * - Multichannel notifications
 * - Blog/news content management
 *
 * @module @anthropic/ai-portal
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export * from './types';

// ============================================================================
// SERVICE IMPORTS & EXPORTS
// ============================================================================

// Portal User Service
import { PortalUserService, portalUserService } from './services/portal-user.service';
export { PortalUserService, portalUserService };

// Policy View Service
import { PolicyViewService, policyViewService } from './services/policy-view.service';
export { PolicyViewService, policyViewService };

// Claim View Service
import { ClaimViewService, claimViewService } from './services/claim-view.service';
export { ClaimViewService, claimViewService };

// Gamification Service
import { GamificationService, gamificationService } from './services/gamification.service';
export { GamificationService, gamificationService };

// Notification Service
import { NotificationService, notificationService } from './services/notification.service';
export { NotificationService, notificationService };

// Content Service
import { ContentService, contentService } from './services/content.service';
export { ContentService, contentService };

// ============================================================================
// CONVENIENCE FACADE
// ============================================================================

/**
 * AI Portal Facade
 * Provides a unified interface to all portal services
 */
export class AIPortal {
  readonly users = portalUserService;
  readonly policies = policyViewService;
  readonly claims = claimViewService;
  readonly gamification = gamificationService;
  readonly notifications = notificationService;
  readonly content = contentService;

  /**
   * Get module version
   */
  getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get module name
   */
  getName(): string {
    return '@anthropic/ai-portal';
  }

  /**
   * Get module description
   */
  getDescription(): string {
    return 'Customer portal module for e-cliente and web premium - Soriano Seguros';
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, boolean>;
  }> {
    const services: Record<string, boolean> = {
      users: true,
      policies: true,
      claims: true,
      gamification: true,
      notifications: true,
      content: true,
    };

    // In production, each service would perform its own health check
    // For now, assume all services are healthy

    const allHealthy = Object.values(services).every(s => s);
    const anyHealthy = Object.values(services).some(s => s);

    return {
      status: allHealthy ? 'healthy' : anyHealthy ? 'degraded' : 'unhealthy',
      services,
    };
  }
}

// Export singleton instance of facade
export const aiPortal = new AIPortal();

// Default export
export default aiPortal;

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Point action values for gamification
 */
export const POINT_VALUES = {
  login: 5,
  profile_complete: 100,
  policy_purchase: 500,
  policy_renewal: 300,
  claim_submitted: 50,
  document_uploaded: 25,
  referral_sent: 100,
  referral_converted: 500,
  article_read: 10,
  survey_completed: 75,
  app_download: 200,
  paperless_signup: 150,
  autopay_signup: 100,
  birthday_bonus: 50,
  anniversary_bonus: 100,
} as const;

/**
 * Level thresholds for gamification
 */
export const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Bronce', minPoints: 0 },
  { level: 2, name: 'Plata', minPoints: 500 },
  { level: 3, name: 'Oro', minPoints: 1500 },
  { level: 4, name: 'Platino', minPoints: 3500 },
  { level: 5, name: 'Diamante', minPoints: 7500 },
  { level: 6, name: 'Elite', minPoints: 15000 },
] as const;

/**
 * Notification channel defaults per type
 */
export const NOTIFICATION_DEFAULTS = {
  policy_renewal: ['email', 'push', 'in_app'],
  policy_expiry: ['email', 'sms', 'push', 'in_app'],
  payment_due: ['email', 'push', 'in_app'],
  payment_received: ['email', 'in_app'],
  payment_failed: ['email', 'sms', 'push', 'in_app'],
  claim_update: ['email', 'push', 'in_app'],
  claim_approved: ['email', 'push', 'in_app'],
  claim_rejected: ['email', 'push', 'in_app'],
  document_available: ['email', 'push', 'in_app'],
  document_required: ['email', 'push', 'in_app'],
  badge_earned: ['push', 'in_app'],
  points_awarded: ['in_app'],
  reward_available: ['push', 'in_app'],
  referral_success: ['email', 'push', 'in_app'],
  security_alert: ['email', 'sms', 'push', 'in_app'],
  account_update: ['email', 'in_app'],
  new_article: ['push', 'in_app'],
  promotion: ['email', 'push', 'in_app'],
  system_maintenance: ['email', 'in_app'],
} as const;
