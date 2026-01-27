/**
 * AI Portal Types
 * Types for e-cliente and web premium portals
 * Based on soriano-ecliente and soriano-web-premium schemas
 */

// ============================================================================
// USER & SESSION TYPES
// ============================================================================

export interface PortalUser {
  id: string;
  email: string;
  passwordHash: string;
  partyId: string; // Link to Party in ai-party module
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  status: UserStatus;
  lastLogin?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserStatus = 'pending_verification' | 'active' | 'suspended' | 'locked' | 'inactive';

export interface UserPreferences {
  id: string;
  userId: string;
  language: 'es' | 'en' | 'ca' | 'eu' | 'gl';
  timezone: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  currency: 'EUR' | 'USD';
  theme: 'light' | 'dark' | 'system';
  dashboardLayout: DashboardLayout;
  emailDigest: 'daily' | 'weekly' | 'never';
  twoFactorEnabled: boolean;
  twoFactorMethod?: 'sms' | 'email' | 'app';
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardLayout {
  widgets: DashboardWidget[];
  columns: number;
}

export interface DashboardWidget {
  id: string;
  type: 'policies' | 'claims' | 'payments' | 'notifications' | 'gamification' | 'news';
  position: { row: number; col: number };
  size: { width: number; height: number };
  visible: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  token: string;
  refreshToken: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  expiresAt: Date;
  refreshExpiresAt: Date;
  isActive: boolean;
  createdAt: Date;
  lastActivityAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  browser?: string;
  os?: string;
  device?: string;
  isMobile: boolean;
}

export interface AuthTokenPayload {
  userId: string;
  email: string;
  partyId: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface LoginResult {
  success: boolean;
  user?: Omit<PortalUser, 'passwordHash'>;
  session?: UserSession;
  token?: string;
  refreshToken?: string;
  error?: string;
  requiresTwoFactor?: boolean;
}

// ============================================================================
// POLICY VIEW TYPES (Simplified views for portal)
// ============================================================================

export interface PolicySummary {
  id: string;
  policyNumber: string;
  productName: string;
  productCategory: PolicyCategory;
  status: PolicyStatus;
  effectiveDate: Date;
  expirationDate: Date;
  premium: MoneyAmount;
  paymentFrequency: PaymentFrequency;
  nextPaymentDate?: Date;
  insuredItems: InsuredItemSummary[];
  coverages: CoverageSummary[];
  alerts: PolicyAlert[];
}

export type PolicyCategory =
  | 'auto'
  | 'home'
  | 'life'
  | 'health'
  | 'business'
  | 'travel'
  | 'pet'
  | 'cyber'
  | 'other';

export type PolicyStatus =
  | 'active'
  | 'pending'
  | 'suspended'
  | 'cancelled'
  | 'expired'
  | 'renewal_pending';

export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual' | 'single';

export interface MoneyAmount {
  amount: number;
  currency: string;
}

export interface InsuredItemSummary {
  id: string;
  type: string;
  description: string;
  value?: MoneyAmount;
}

export interface CoverageSummary {
  id: string;
  name: string;
  limit: MoneyAmount;
  deductible?: MoneyAmount;
  isActive: boolean;
}

export interface PolicyAlert {
  type: 'renewal' | 'payment_due' | 'document_required' | 'coverage_gap' | 'price_change';
  message: string;
  severity: 'info' | 'warning' | 'urgent';
  actionUrl?: string;
}

export interface PolicyChangeRequest {
  id: string;
  policyId: string;
  userId: string;
  changeType: PolicyChangeType;
  requestData: Record<string, unknown>;
  status: ChangeRequestStatus;
  submittedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  notes?: string;
}

export type PolicyChangeType =
  | 'add_coverage'
  | 'remove_coverage'
  | 'modify_coverage'
  | 'add_insured'
  | 'remove_insured'
  | 'update_address'
  | 'update_vehicle'
  | 'cancel'
  | 'other';

export type ChangeRequestStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';

export interface PolicyDocument {
  id: string;
  policyId: string;
  type: PolicyDocumentType;
  name: string;
  url: string;
  generatedAt: Date;
  expiresAt?: Date;
}

export type PolicyDocumentType =
  | 'policy_schedule'
  | 'certificate'
  | 'conditions'
  | 'receipt'
  | 'endorsement'
  | 'renewal_offer';

// ============================================================================
// CLAIM VIEW TYPES (Simplified views for portal)
// ============================================================================

export interface ClaimSummary {
  id: string;
  claimNumber: string;
  policyId: string;
  policyNumber: string;
  productName: string;
  status: ClaimStatus;
  type: string;
  description: string;
  incidentDate: Date;
  reportedDate: Date;
  estimatedAmount?: MoneyAmount;
  approvedAmount?: MoneyAmount;
  paidAmount?: MoneyAmount;
  handler?: ClaimHandlerInfo;
  lastUpdate: Date;
  nextStep?: string;
}

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'documentation_required'
  | 'assessment'
  | 'approved'
  | 'partially_approved'
  | 'rejected'
  | 'paid'
  | 'closed';

export interface ClaimHandlerInfo {
  name: string;
  email?: string;
  phone?: string;
}

export interface ClaimTimelineEvent {
  id: string;
  claimId: string;
  eventType: ClaimEventType;
  title: string;
  description: string;
  occurredAt: Date;
  actor?: string;
  metadata?: Record<string, unknown>;
}

export type ClaimEventType =
  | 'created'
  | 'submitted'
  | 'assigned'
  | 'document_uploaded'
  | 'document_requested'
  | 'status_changed'
  | 'assessment_completed'
  | 'payment_issued'
  | 'message_sent'
  | 'closed';

export interface NewClaimData {
  policyId: string;
  type: string;
  incidentDate: Date;
  incidentLocation?: string;
  description: string;
  estimatedLoss?: MoneyAmount;
  involvedParties?: InvolvedParty[];
  witnesses?: Witness[];
  policeReportNumber?: string;
}

export interface InvolvedParty {
  name: string;
  role: 'insured' | 'claimant' | 'third_party' | 'witness';
  contact?: string;
  vehicleInfo?: string;
  insurerInfo?: string;
}

export interface Witness {
  name: string;
  contact: string;
  statement?: string;
}

export interface ClaimDocument {
  id: string;
  claimId: string;
  type: ClaimDocumentType;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  status: 'pending' | 'verified' | 'rejected';
}

export type ClaimDocumentType =
  | 'photo'
  | 'video'
  | 'police_report'
  | 'medical_report'
  | 'invoice'
  | 'repair_estimate'
  | 'id_document'
  | 'other';

// ============================================================================
// RECEIPT TYPES
// ============================================================================

export interface ReceiptSummary {
  id: string;
  receiptNumber: string;
  policyId: string;
  policyNumber: string;
  type: ReceiptType;
  status: ReceiptStatus;
  amount: MoneyAmount;
  dueDate: Date;
  paidDate?: Date;
  paymentMethod?: string;
  period: {
    from: Date;
    to: Date;
  };
}

export type ReceiptType = 'premium' | 'endorsement' | 'renewal' | 'cancellation_refund';
export type ReceiptStatus = 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  scheduledAt?: Date;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'policy_renewal'
  | 'policy_expiry'
  | 'payment_due'
  | 'payment_received'
  | 'payment_failed'
  | 'claim_update'
  | 'claim_approved'
  | 'claim_rejected'
  | 'document_available'
  | 'document_required'
  | 'badge_earned'
  | 'points_awarded'
  | 'reward_available'
  | 'referral_success'
  | 'security_alert'
  | 'account_update'
  | 'new_article'
  | 'promotion'
  | 'system_maintenance'
  | 'custom';

export type NotificationChannel = 'push' | 'email' | 'sms' | 'in_app' | 'whatsapp';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationStatus = 'pending' | 'scheduled' | 'sent' | 'delivered' | 'read' | 'failed';

export interface NotificationPreference {
  id: string;
  userId: string;
  notificationType: NotificationType;
  channels: NotificationChannelPreference[];
  enabled: boolean;
  quietHours?: QuietHours;
  updatedAt: Date;
}

export interface NotificationChannelPreference {
  channel: NotificationChannel;
  enabled: boolean;
  address?: string; // email, phone, etc.
}

export interface QuietHours {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string;
  timezone: string;
  exceptUrgent: boolean;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  type: NotificationType;
  content: NotificationContent;
  scheduledAt: Date;
  status: 'scheduled' | 'sent' | 'cancelled';
  createdAt: Date;
}

export interface NotificationContent {
  title: string;
  message: string;
  data?: Record<string, unknown>;
  actionUrl?: string;
  actionLabel?: string;
  priority?: NotificationPriority;
}

// ============================================================================
// GAMIFICATION TYPES
// ============================================================================

export interface GamificationProfile {
  id: string;
  userId: string;
  level: number;
  levelName: string;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate?: Date;
  badges: UserBadge[];
  achievements: UserAchievement[];
  rank?: number;
  percentile?: number;
  memberSince: Date;
  updatedAt: Date;
}

export interface Points {
  id: string;
  userId: string;
  amount: number;
  action: PointAction;
  description: string;
  referenceType?: string;
  referenceId?: string;
  expiresAt?: Date;
  createdAt: Date;
}

export type PointAction =
  | 'login'
  | 'profile_complete'
  | 'policy_purchase'
  | 'policy_renewal'
  | 'claim_submitted'
  | 'document_uploaded'
  | 'referral_sent'
  | 'referral_converted'
  | 'article_read'
  | 'survey_completed'
  | 'app_download'
  | 'paperless_signup'
  | 'autopay_signup'
  | 'birthday_bonus'
  | 'anniversary_bonus'
  | 'reward_redemption'
  | 'admin_adjustment';

export interface Badge {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  pointsRequired?: number;
  criteria: BadgeCriteria;
  isActive: boolean;
  createdAt: Date;
}

export type BadgeCategory =
  | 'loyalty'
  | 'engagement'
  | 'social'
  | 'safety'
  | 'eco'
  | 'special'
  | 'seasonal';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface BadgeCriteria {
  type: 'points' | 'action_count' | 'streak' | 'tenure' | 'referrals' | 'custom';
  threshold: number;
  action?: PointAction;
  customLogic?: string;
}

export interface UserBadge {
  badgeId: string;
  badge: Badge;
  earnedAt: Date;
  displayOrder?: number;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  iconUrl: string;
  category: string;
  tiers: AchievementTier[];
  isActive: boolean;
  createdAt: Date;
}

export interface AchievementTier {
  tier: number;
  name: string;
  threshold: number;
  pointsReward: number;
  badgeId?: string;
}

export interface UserAchievement {
  achievementId: string;
  achievement: Achievement;
  currentTier: number;
  progress: number;
  completedAt?: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referrerId: string;
  referralCode: string;
  referredEmail: string;
  referredUserId?: string;
  status: ReferralStatus;
  rewardPoints: number;
  rewardPaid: boolean;
  createdAt: Date;
  convertedAt?: Date;
  expiresAt: Date;
}

export type ReferralStatus = 'pending' | 'registered' | 'converted' | 'rewarded' | 'expired' | 'cancelled';

export interface Reward {
  id: string;
  code: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: RewardCategory;
  pointsCost: number;
  monetaryValue?: MoneyAmount;
  stock?: number;
  maxPerUser?: number;
  validFrom: Date;
  validUntil?: Date;
  terms?: string;
  isActive: boolean;
}

export type RewardCategory =
  | 'discount'
  | 'gift_card'
  | 'merchandise'
  | 'experience'
  | 'donation'
  | 'partner';

export interface RewardRedemption {
  id: string;
  userId: string;
  rewardId: string;
  reward: Reward;
  pointsSpent: number;
  status: RedemptionStatus;
  redemptionCode?: string;
  redeemedAt: Date;
  expiresAt?: Date;
  usedAt?: Date;
}

export type RedemptionStatus = 'pending' | 'confirmed' | 'delivered' | 'used' | 'expired' | 'cancelled';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  points: number;
  level: number;
  badgeCount: number;
  isCurrentUser: boolean;
}

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'yearly' | 'all_time';

// ============================================================================
// CONTENT TYPES (Blog/Articles)
// ============================================================================

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentHtml: string;
  author: Author;
  category: Category;
  tags: Tag[];
  featuredImage?: MediaAsset;
  gallery?: MediaAsset[];
  status: ContentStatus;
  publishedAt?: Date;
  updatedAt: Date;
  createdAt: Date;
  seo: SeoMetadata;
  readingTime: number;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  relatedArticles?: ArticlePreview[];
}

export interface ArticlePreview {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  featuredImage?: MediaAsset;
  category: Category;
  publishedAt?: Date;
  readingTime: number;
}

export interface Author {
  id: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  role?: string;
  socialLinks?: SocialLink[];
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  iconUrl?: string;
  parentId?: string;
  articleCount: number;
  order: number;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  articleCount: number;
}

export interface MediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  alt: string;
  width?: number;
  height?: number;
  mimeType: string;
}

export type ContentStatus = 'draft' | 'scheduled' | 'published' | 'archived';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export interface ContentSearchResult {
  articles: ArticlePreview[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  query: string;
  filters?: ContentFilters;
}

export interface ContentFilters {
  category?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  author?: string;
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface AuditInfo {
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy?: string;
}
