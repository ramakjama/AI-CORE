/**
 * Gamification Service
 * Manages points, badges, achievements, referrals, and rewards
 * for customer engagement in the portal
 */

import { v4 as uuidv4 } from 'uuid';
import {
  GamificationProfile,
  Points,
  PointAction,
  Badge,
  BadgeCategory,
  BadgeRarity,
  UserBadge,
  Achievement,
  UserAchievement,
  Referral,
  ReferralStatus,
  Reward,
  RewardCategory,
  RewardRedemption,
  RedemptionStatus,
  LeaderboardEntry,
  LeaderboardPeriod,
  ServiceResult,
  PaginatedResult,
} from '../types';

// Configuration
const REFERRAL_EXPIRY_DAYS = 30;
const REFERRAL_POINTS_SENT = 100;
const REFERRAL_POINTS_CONVERTED = 500;

// Point values for different actions
const POINT_VALUES: Record<PointAction, number> = {
  login: 5,
  profile_complete: 100,
  policy_purchase: 500,
  policy_renewal: 300,
  claim_submitted: 50,
  document_uploaded: 25,
  referral_sent: REFERRAL_POINTS_SENT,
  referral_converted: REFERRAL_POINTS_CONVERTED,
  article_read: 10,
  survey_completed: 75,
  app_download: 200,
  paperless_signup: 150,
  autopay_signup: 100,
  birthday_bonus: 50,
  anniversary_bonus: 100,
  reward_redemption: 0, // Negative points applied separately
  admin_adjustment: 0,
};

// Level thresholds
const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Bronce', minPoints: 0 },
  { level: 2, name: 'Plata', minPoints: 500 },
  { level: 3, name: 'Oro', minPoints: 1500 },
  { level: 4, name: 'Platino', minPoints: 3500 },
  { level: 5, name: 'Diamante', minPoints: 7500 },
  { level: 6, name: 'Elite', minPoints: 15000 },
];

// In-memory storage (replace with database in production)
const profiles: Map<string, GamificationProfile> = new Map();
const pointsHistory: Map<string, Points[]> = new Map();
const badges: Map<string, Badge> = new Map();
const userBadges: Map<string, UserBadge[]> = new Map();
const achievements: Map<string, Achievement> = new Map();
const userAchievements: Map<string, UserAchievement[]> = new Map();
const referrals: Map<string, Referral> = new Map();
const referralsByCode: Map<string, string> = new Map();
const rewards: Map<string, Reward> = new Map();
const redemptions: Map<string, RewardRedemption[]> = new Map();

// Initialize default badges
initializeDefaultBadges();
initializeDefaultAchievements();
initializeDefaultRewards();

/**
 * Gamification Service
 */
export class GamificationService {
  /**
   * Get user's gamification profile
   */
  async getProfile(userId: string): Promise<ServiceResult<GamificationProfile>> {
    try {
      let profile = profiles.get(userId);

      if (!profile) {
        // Create new profile
        profile = await this.createProfile(userId);
      }

      // Update rank
      profile.rank = await this.calculateRank(userId);
      profile.percentile = await this.calculatePercentile(userId);

      // Get badges and achievements
      profile.badges = userBadges.get(userId) || [];
      profile.achievements = userAchievements.get(userId) || [];

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'PROFILE_ERROR',
          message: 'Error al obtener el perfil de gamificación',
        },
      };
    }
  }

  /**
   * Award points to user
   */
  async awardPoints(
    userId: string,
    action: PointAction,
    customAmount?: number,
    description?: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<ServiceResult<Points>> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const amount = customAmount ?? POINT_VALUES[action];

      if (amount <= 0 && action !== 'reward_redemption') {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'La cantidad de puntos debe ser positiva',
          },
        };
      }

      // Check for duplicate actions (prevent gaming)
      if (await this.isDuplicateAction(userId, action, referenceId)) {
        return {
          success: false,
          error: {
            code: 'DUPLICATE_ACTION',
            message: 'Ya ha recibido puntos por esta acción',
          },
        };
      }

      const pointsEntry: Points = {
        id: uuidv4(),
        userId,
        amount,
        action,
        description: description || this.getActionDescription(action),
        referenceType,
        referenceId,
        createdAt: new Date(),
      };

      // Store points
      const userPoints = pointsHistory.get(userId) || [];
      userPoints.push(pointsEntry);
      pointsHistory.set(userId, userPoints);

      // Update profile
      profile.totalPoints += amount;
      profile.availablePoints += amount;
      profile.lifetimePoints += amount;
      profile.lastActivityDate = new Date();

      // Update streak
      this.updateStreak(profile);

      // Update level
      this.updateLevel(profile);

      profiles.set(userId, profile);

      // Check for new badges
      await this.checkBadgeEligibility(userId);

      // Check for achievement progress
      await this.updateAchievementProgress(userId, action);

      return {
        success: true,
        data: pointsEntry,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'POINTS_ERROR',
          message: 'Error al otorgar puntos',
        },
      };
    }
  }

  /**
   * Check badge eligibility for user
   */
  async checkBadgeEligibility(userId: string): Promise<ServiceResult<Badge[]>> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const earnedBadges: Badge[] = [];
      const currentUserBadges = userBadges.get(userId) || [];
      const earnedBadgeIds = new Set(currentUserBadges.map(b => b.badgeId));

      for (const badge of badges.values()) {
        if (badge.isActive && !earnedBadgeIds.has(badge.id)) {
          const eligible = await this.evaluateBadgeCriteria(userId, profile, badge);

          if (eligible) {
            await this.awardBadge(userId, badge.code);
            earnedBadges.push(badge);
          }
        }
      }

      return {
        success: true,
        data: earnedBadges,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BADGE_CHECK_ERROR',
          message: 'Error al verificar elegibilidad de badges',
        },
      };
    }
  }

  /**
   * Award a specific badge to user
   */
  async awardBadge(
    userId: string,
    badgeCode: string
  ): Promise<ServiceResult<UserBadge>> {
    try {
      // Find badge by code
      let targetBadge: Badge | undefined;
      for (const badge of badges.values()) {
        if (badge.code === badgeCode) {
          targetBadge = badge;
          break;
        }
      }

      if (!targetBadge) {
        return {
          success: false,
          error: {
            code: 'BADGE_NOT_FOUND',
            message: 'Badge no encontrado',
          },
        };
      }

      // Check if already earned
      const currentBadges = userBadges.get(userId) || [];
      if (currentBadges.some(b => b.badgeId === targetBadge!.id)) {
        return {
          success: false,
          error: {
            code: 'BADGE_ALREADY_EARNED',
            message: 'Ya tiene este badge',
          },
        };
      }

      const userBadge: UserBadge = {
        badgeId: targetBadge.id,
        badge: targetBadge,
        earnedAt: new Date(),
        displayOrder: currentBadges.length + 1,
      };

      currentBadges.push(userBadge);
      userBadges.set(userId, currentBadges);

      // Award bonus points for rare badges
      const rarityPoints: Record<BadgeRarity, number> = {
        common: 25,
        uncommon: 50,
        rare: 100,
        epic: 250,
        legendary: 500,
      };

      const bonusPoints = rarityPoints[targetBadge.rarity];
      if (bonusPoints > 0) {
        await this.awardPoints(
          userId,
          'admin_adjustment',
          bonusPoints,
          `Bonus por obtener badge: ${targetBadge.name}`
        );
      }

      return {
        success: true,
        data: userBadge,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'BADGE_AWARD_ERROR',
          message: 'Error al otorgar el badge',
        },
      };
    }
  }

  /**
   * Create a referral
   */
  async createReferral(
    userId: string,
    referredEmail: string
  ): Promise<ServiceResult<Referral>> {
    try {
      // Validate email
      if (!this.isValidEmail(referredEmail)) {
        return {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Email inválido',
          },
        };
      }

      // Check if already referred
      for (const referral of referrals.values()) {
        if (referral.referredEmail.toLowerCase() === referredEmail.toLowerCase()) {
          return {
            success: false,
            error: {
              code: 'ALREADY_REFERRED',
              message: 'Este email ya ha sido referido',
            },
          };
        }
      }

      // Generate unique referral code
      const referralCode = this.generateReferralCode();
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + REFERRAL_EXPIRY_DAYS);

      const referral: Referral = {
        id: uuidv4(),
        referrerId: userId,
        referralCode,
        referredEmail: referredEmail.toLowerCase(),
        status: 'pending',
        rewardPoints: REFERRAL_POINTS_CONVERTED,
        rewardPaid: false,
        createdAt: now,
        expiresAt,
      };

      referrals.set(referral.id, referral);
      referralsByCode.set(referralCode, referral.id);

      // Award points for sending referral
      await this.awardPoints(
        userId,
        'referral_sent',
        REFERRAL_POINTS_SENT,
        `Referido enviado a ${referredEmail}`,
        'referral',
        referral.id
      );

      return {
        success: true,
        data: referral,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFERRAL_ERROR',
          message: 'Error al crear el referido',
        },
      };
    }
  }

  /**
   * Process referral conversion (when referred user completes action)
   */
  async processReferralConversion(
    referralCode: string,
    referredUserId: string
  ): Promise<ServiceResult<Referral>> {
    try {
      const referralId = referralsByCode.get(referralCode);
      if (!referralId) {
        return {
          success: false,
          error: {
            code: 'REFERRAL_NOT_FOUND',
            message: 'Código de referido no válido',
          },
        };
      }

      const referral = referrals.get(referralId);
      if (!referral) {
        return {
          success: false,
          error: {
            code: 'REFERRAL_NOT_FOUND',
            message: 'Referido no encontrado',
          },
        };
      }

      // Check if expired
      if (new Date() > referral.expiresAt) {
        referral.status = 'expired';
        referrals.set(referralId, referral);
        return {
          success: false,
          error: {
            code: 'REFERRAL_EXPIRED',
            message: 'El código de referido ha expirado',
          },
        };
      }

      // Check if already converted
      if (referral.status !== 'pending' && referral.status !== 'registered') {
        return {
          success: false,
          error: {
            code: 'REFERRAL_USED',
            message: 'Este referido ya ha sido procesado',
          },
        };
      }

      // Update referral
      referral.status = 'converted';
      referral.referredUserId = referredUserId;
      referral.convertedAt = new Date();
      referrals.set(referralId, referral);

      // Award points to referrer
      await this.awardPoints(
        referral.referrerId,
        'referral_converted',
        REFERRAL_POINTS_CONVERTED,
        `Referido convertido: ${referral.referredEmail}`,
        'referral',
        referral.id
      );

      referral.rewardPaid = true;
      referral.status = 'rewarded';
      referrals.set(referralId, referral);

      return {
        success: true,
        data: referral,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONVERSION_ERROR',
          message: 'Error al procesar la conversión del referido',
        },
      };
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(
    period: LeaderboardPeriod,
    limit: number = 10
  ): Promise<ServiceResult<LeaderboardEntry[]>> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'yearly':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'all_time':
        default:
          startDate = new Date(0);
      }

      // Calculate points per user for period
      const userScores: Map<string, number> = new Map();

      for (const [userId, points] of pointsHistory.entries()) {
        const periodPoints = points
          .filter(p => new Date(p.createdAt) >= startDate)
          .reduce((sum, p) => sum + p.amount, 0);

        if (periodPoints > 0) {
          userScores.set(userId, periodPoints);
        }
      }

      // Sort and create leaderboard entries
      const sortedEntries = [...userScores.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      const leaderboard: LeaderboardEntry[] = sortedEntries.map(([uId, pts], index) => {
        const profile = profiles.get(uId);
        const uBadges = userBadges.get(uId) || [];

        return {
          rank: index + 1,
          userId: uId,
          displayName: `Usuario ${uId.slice(0, 8)}`, // Would be fetched from user service
          points: pts,
          level: profile?.level || 1,
          badgeCount: uBadges.length,
          isCurrentUser: false, // Set by caller
        };
      });

      return {
        success: true,
        data: leaderboard,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'LEADERBOARD_ERROR',
          message: 'Error al obtener el ranking',
        },
      };
    }
  }

  /**
   * Get available rewards for user
   */
  async getAvailableRewards(
    userId: string
  ): Promise<ServiceResult<Reward[]>> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const now = new Date();
      const available: Reward[] = [];

      for (const reward of rewards.values()) {
        if (!reward.isActive) continue;
        if (reward.validFrom > now) continue;
        if (reward.validUntil && reward.validUntil < now) continue;
        if (reward.stock !== undefined && reward.stock <= 0) continue;
        if (reward.pointsCost > profile.availablePoints) continue;

        // Check max per user
        if (reward.maxPerUser) {
          const userRedemptions = (redemptions.get(userId) || [])
            .filter(r => r.rewardId === reward.id);
          if (userRedemptions.length >= reward.maxPerUser) continue;
        }

        available.push(reward);
      }

      // Sort by points cost
      available.sort((a, b) => a.pointsCost - b.pointsCost);

      return {
        success: true,
        data: available,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REWARDS_ERROR',
          message: 'Error al obtener las recompensas disponibles',
        },
      };
    }
  }

  /**
   * Redeem a reward
   */
  async redeemReward(
    userId: string,
    rewardId: string
  ): Promise<ServiceResult<RewardRedemption>> {
    try {
      const profile = await this.getOrCreateProfile(userId);
      const reward = rewards.get(rewardId);

      if (!reward) {
        return {
          success: false,
          error: {
            code: 'REWARD_NOT_FOUND',
            message: 'Recompensa no encontrada',
          },
        };
      }

      // Validate availability
      const now = new Date();
      if (!reward.isActive) {
        return {
          success: false,
          error: {
            code: 'REWARD_INACTIVE',
            message: 'Esta recompensa no está disponible',
          },
        };
      }

      if (reward.validUntil && reward.validUntil < now) {
        return {
          success: false,
          error: {
            code: 'REWARD_EXPIRED',
            message: 'Esta recompensa ha expirado',
          },
        };
      }

      if (profile.availablePoints < reward.pointsCost) {
        return {
          success: false,
          error: {
            code: 'INSUFFICIENT_POINTS',
            message: `Necesita ${reward.pointsCost - profile.availablePoints} puntos más`,
          },
        };
      }

      if (reward.stock !== undefined && reward.stock <= 0) {
        return {
          success: false,
          error: {
            code: 'OUT_OF_STOCK',
            message: 'Esta recompensa está agotada',
          },
        };
      }

      // Check max per user
      if (reward.maxPerUser) {
        const userRedemptions = (redemptions.get(userId) || [])
          .filter(r => r.rewardId === rewardId);
        if (userRedemptions.length >= reward.maxPerUser) {
          return {
            success: false,
            error: {
              code: 'MAX_REDEMPTIONS',
              message: 'Ha alcanzado el máximo de canjes para esta recompensa',
            },
          };
        }
      }

      // Deduct points
      profile.availablePoints -= reward.pointsCost;
      profiles.set(userId, profile);

      // Record points deduction
      const pointsEntry: Points = {
        id: uuidv4(),
        userId,
        amount: -reward.pointsCost,
        action: 'reward_redemption',
        description: `Canje de recompensa: ${reward.name}`,
        referenceType: 'reward',
        referenceId: rewardId,
        createdAt: now,
      };

      const userPoints = pointsHistory.get(userId) || [];
      userPoints.push(pointsEntry);
      pointsHistory.set(userId, userPoints);

      // Create redemption
      const redemption: RewardRedemption = {
        id: uuidv4(),
        userId,
        rewardId,
        reward,
        pointsSpent: reward.pointsCost,
        status: 'pending',
        redemptionCode: this.generateRedemptionCode(),
        redeemedAt: now,
        expiresAt: reward.category === 'discount'
          ? new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days
          : undefined,
      };

      // Store redemption
      const userRedemptions = redemptions.get(userId) || [];
      userRedemptions.push(redemption);
      redemptions.set(userId, userRedemptions);

      // Update stock
      if (reward.stock !== undefined) {
        reward.stock--;
        rewards.set(rewardId, reward);
      }

      return {
        success: true,
        data: redemption,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REDEMPTION_ERROR',
          message: 'Error al canjear la recompensa',
        },
      };
    }
  }

  /**
   * Get user's referrals
   */
  async getUserReferrals(userId: string): Promise<ServiceResult<Referral[]>> {
    try {
      const userReferrals: Referral[] = [];

      for (const referral of referrals.values()) {
        if (referral.referrerId === userId) {
          userReferrals.push(referral);
        }
      }

      // Sort by creation date
      userReferrals.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        success: true,
        data: userReferrals,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REFERRALS_ERROR',
          message: 'Error al obtener los referidos',
        },
      };
    }
  }

  /**
   * Get user's redemption history
   */
  async getRedemptionHistory(
    userId: string
  ): Promise<ServiceResult<RewardRedemption[]>> {
    try {
      const userRedemptions = redemptions.get(userId) || [];

      // Sort by redemption date
      const sorted = [...userRedemptions].sort((a, b) =>
        new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
      );

      return {
        success: true,
        data: sorted,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HISTORY_ERROR',
          message: 'Error al obtener el historial de canjes',
        },
      };
    }
  }

  /**
   * Get points history
   */
  async getPointsHistory(
    userId: string,
    options?: {
      page?: number;
      pageSize?: number;
      action?: PointAction;
    }
  ): Promise<ServiceResult<PaginatedResult<Points>>> {
    try {
      let userPoints = pointsHistory.get(userId) || [];

      // Filter by action if specified
      if (options?.action) {
        userPoints = userPoints.filter(p => p.action === options.action);
      }

      // Sort by date (most recent first)
      userPoints = [...userPoints].sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // Pagination
      const page = options?.page || 1;
      const pageSize = options?.pageSize || 20;
      const totalCount = userPoints.length;
      const totalPages = Math.ceil(totalCount / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      const paginatedPoints = userPoints.slice(start, end);

      return {
        success: true,
        data: {
          items: paginatedPoints,
          totalCount,
          page,
          pageSize,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'HISTORY_ERROR',
          message: 'Error al obtener el historial de puntos',
        },
      };
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private async createProfile(userId: string): Promise<GamificationProfile> {
    const now = new Date();

    const profile: GamificationProfile = {
      id: uuidv4(),
      userId,
      level: 1,
      levelName: 'Bronce',
      totalPoints: 0,
      availablePoints: 0,
      lifetimePoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      badges: [],
      achievements: [],
      memberSince: now,
      updatedAt: now,
    };

    profiles.set(userId, profile);

    return profile;
  }

  private async getOrCreateProfile(userId: string): Promise<GamificationProfile> {
    let profile = profiles.get(userId);
    if (!profile) {
      profile = await this.createProfile(userId);
    }
    return profile;
  }

  private async calculateRank(userId: string): Promise<number> {
    const profile = profiles.get(userId);
    if (!profile) return 0;

    let rank = 1;
    for (const p of profiles.values()) {
      if (p.userId !== userId && p.totalPoints > profile.totalPoints) {
        rank++;
      }
    }

    return rank;
  }

  private async calculatePercentile(userId: string): Promise<number> {
    const profile = profiles.get(userId);
    if (!profile) return 0;

    const totalUsers = profiles.size;
    if (totalUsers <= 1) return 100;

    const rank = await this.calculateRank(userId);
    return Math.round(((totalUsers - rank) / totalUsers) * 100);
  }

  private updateStreak(profile: GamificationProfile): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (profile.lastActivityDate) {
      const lastActivity = new Date(profile.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (daysDiff === 1) {
        // Consecutive day
        profile.currentStreak++;
        if (profile.currentStreak > profile.longestStreak) {
          profile.longestStreak = profile.currentStreak;
        }
      } else if (daysDiff > 1) {
        // Streak broken
        profile.currentStreak = 1;
      }
      // Same day - no change
    } else {
      profile.currentStreak = 1;
    }
  }

  private updateLevel(profile: GamificationProfile): void {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (profile.totalPoints >= LEVEL_THRESHOLDS[i].minPoints) {
        profile.level = LEVEL_THRESHOLDS[i].level;
        profile.levelName = LEVEL_THRESHOLDS[i].name;
        break;
      }
    }
  }

  private async isDuplicateAction(
    userId: string,
    action: PointAction,
    referenceId?: string
  ): Promise<boolean> {
    if (!referenceId) return false;

    const userPoints = pointsHistory.get(userId) || [];
    return userPoints.some(
      p => p.action === action && p.referenceId === referenceId
    );
  }

  private getActionDescription(action: PointAction): string {
    const descriptions: Record<PointAction, string> = {
      login: 'Inicio de sesión diario',
      profile_complete: 'Perfil completado',
      policy_purchase: 'Nueva póliza contratada',
      policy_renewal: 'Renovación de póliza',
      claim_submitted: 'Siniestro reportado',
      document_uploaded: 'Documento subido',
      referral_sent: 'Referido enviado',
      referral_converted: 'Referido convertido',
      article_read: 'Artículo leído',
      survey_completed: 'Encuesta completada',
      app_download: 'App descargada',
      paperless_signup: 'Sin papel activado',
      autopay_signup: 'Pago automático activado',
      birthday_bonus: 'Bonus de cumpleaños',
      anniversary_bonus: 'Bonus de aniversario',
      reward_redemption: 'Canje de recompensa',
      admin_adjustment: 'Ajuste administrativo',
    };

    return descriptions[action];
  }

  private async evaluateBadgeCriteria(
    userId: string,
    profile: GamificationProfile,
    badge: Badge
  ): Promise<boolean> {
    const { criteria } = badge;

    switch (criteria.type) {
      case 'points':
        return profile.totalPoints >= criteria.threshold;

      case 'streak':
        return profile.currentStreak >= criteria.threshold;

      case 'tenure': {
        const memberDays = Math.floor(
          (Date.now() - profile.memberSince.getTime()) / (24 * 60 * 60 * 1000)
        );
        return memberDays >= criteria.threshold;
      }

      case 'referrals': {
        let convertedReferrals = 0;
        for (const referral of referrals.values()) {
          if (referral.referrerId === userId && referral.status === 'rewarded') {
            convertedReferrals++;
          }
        }
        return convertedReferrals >= criteria.threshold;
      }

      case 'action_count': {
        if (!criteria.action) return false;
        const userPoints = pointsHistory.get(userId) || [];
        const actionCount = userPoints.filter(p => p.action === criteria.action).length;
        return actionCount >= criteria.threshold;
      }

      default:
        return false;
    }
  }

  private async updateAchievementProgress(
    userId: string,
    action: PointAction
  ): Promise<void> {
    // Implementation would track progress toward achievements
    // based on the action performed
  }

  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'REF-';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private generateRedemptionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// ============================================================================
// INITIALIZATION FUNCTIONS
// ============================================================================

function initializeDefaultBadges(): void {
  const defaultBadges: Badge[] = [
    {
      id: uuidv4(),
      code: 'first_login',
      name: 'Primer Paso',
      description: 'Primer inicio de sesión en el portal',
      iconUrl: '/badges/first-login.svg',
      category: 'engagement',
      rarity: 'common',
      criteria: { type: 'action_count', threshold: 1, action: 'login' },
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'profile_complete',
      name: 'Perfil Completo',
      description: 'Completar toda la información del perfil',
      iconUrl: '/badges/profile.svg',
      category: 'engagement',
      rarity: 'common',
      criteria: { type: 'action_count', threshold: 1, action: 'profile_complete' },
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'loyal_member_1',
      name: 'Cliente Fiel',
      description: 'Un año como cliente',
      iconUrl: '/badges/loyal-1.svg',
      category: 'loyalty',
      rarity: 'uncommon',
      criteria: { type: 'tenure', threshold: 365 },
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'streak_7',
      name: 'Racha Semanal',
      description: '7 días consecutivos de actividad',
      iconUrl: '/badges/streak-7.svg',
      category: 'engagement',
      rarity: 'uncommon',
      criteria: { type: 'streak', threshold: 7 },
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'referrer_1',
      name: 'Embajador',
      description: 'Conseguir tu primer referido',
      iconUrl: '/badges/referrer.svg',
      category: 'social',
      rarity: 'rare',
      criteria: { type: 'referrals', threshold: 1 },
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'points_1000',
      name: 'Coleccionista',
      description: 'Acumular 1000 puntos',
      iconUrl: '/badges/points-1000.svg',
      category: 'engagement',
      rarity: 'uncommon',
      criteria: { type: 'points', threshold: 1000 },
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'paperless',
      name: 'Eco-Friendly',
      description: 'Activar comunicaciones sin papel',
      iconUrl: '/badges/eco.svg',
      category: 'eco',
      rarity: 'common',
      criteria: { type: 'action_count', threshold: 1, action: 'paperless_signup' },
      isActive: true,
      createdAt: new Date(),
    },
  ];

  for (const badge of defaultBadges) {
    badges.set(badge.id, badge);
  }
}

function initializeDefaultAchievements(): void {
  const defaultAchievements: Achievement[] = [
    {
      id: uuidv4(),
      code: 'referral_master',
      name: 'Maestro de Referidos',
      description: 'Consigue referidos exitosos',
      iconUrl: '/achievements/referral.svg',
      category: 'social',
      tiers: [
        { tier: 1, name: 'Novato', threshold: 1, pointsReward: 100 },
        { tier: 2, name: 'Intermedio', threshold: 5, pointsReward: 300 },
        { tier: 3, name: 'Experto', threshold: 10, pointsReward: 500 },
        { tier: 4, name: 'Maestro', threshold: 25, pointsReward: 1000 },
      ],
      isActive: true,
      createdAt: new Date(),
    },
    {
      id: uuidv4(),
      code: 'loyal_customer',
      name: 'Cliente Leal',
      description: 'Mantén tus pólizas activas',
      iconUrl: '/achievements/loyalty.svg',
      category: 'loyalty',
      tiers: [
        { tier: 1, name: '1 Año', threshold: 1, pointsReward: 200 },
        { tier: 2, name: '3 Años', threshold: 3, pointsReward: 500 },
        { tier: 3, name: '5 Años', threshold: 5, pointsReward: 1000 },
        { tier: 4, name: '10 Años', threshold: 10, pointsReward: 2500 },
      ],
      isActive: true,
      createdAt: new Date(),
    },
  ];

  for (const achievement of defaultAchievements) {
    achievements.set(achievement.id, achievement);
  }
}

function initializeDefaultRewards(): void {
  const defaultRewards: Reward[] = [
    {
      id: uuidv4(),
      code: 'discount_5',
      name: '5% Descuento en Renovación',
      description: 'Aplica un 5% de descuento en tu próxima renovación',
      category: 'discount',
      pointsCost: 500,
      monetaryValue: { amount: 25, currency: 'EUR' },
      validFrom: new Date(),
      terms: 'Válido para una única renovación. No acumulable con otras ofertas.',
      isActive: true,
    },
    {
      id: uuidv4(),
      code: 'amazon_10',
      name: 'Tarjeta Amazon 10EUR',
      description: 'Tarjeta regalo de Amazon de 10 euros',
      imageUrl: '/rewards/amazon.png',
      category: 'gift_card',
      pointsCost: 1000,
      monetaryValue: { amount: 10, currency: 'EUR' },
      stock: 100,
      maxPerUser: 3,
      validFrom: new Date(),
      isActive: true,
    },
    {
      id: uuidv4(),
      code: 'charity_donation',
      name: 'Donación Solidaria',
      description: 'Dona 5 euros a una ONG de tu elección',
      category: 'donation',
      pointsCost: 300,
      monetaryValue: { amount: 5, currency: 'EUR' },
      validFrom: new Date(),
      isActive: true,
    },
  ];

  for (const reward of defaultRewards) {
    rewards.set(reward.id, reward);
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
