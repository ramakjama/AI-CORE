/**
 * AI-Leads Types
 * CRM and Lead Management Type Definitions
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Lead status in the sales pipeline
 */
export enum LeadStatus {
  NEW = 'new',
  CONTACTED = 'contacted',
  QUALIFIED = 'qualified',
  UNQUALIFIED = 'unqualified',
  NURTURING = 'nurturing',
  CONVERTED = 'converted',
  LOST = 'lost',
  RECYCLED = 'recycled'
}

/**
 * Source of lead acquisition
 */
export enum LeadSource {
  WEBSITE = 'website',
  WEBFORM = 'webform',
  LANDING_PAGE = 'landing_page',
  SOCIAL_MEDIA = 'social_media',
  EMAIL_CAMPAIGN = 'email_campaign',
  PAID_ADS = 'paid_ads',
  ORGANIC_SEARCH = 'organic_search',
  REFERRAL = 'referral',
  PARTNER = 'partner',
  EVENT = 'event',
  TRADE_SHOW = 'trade_show',
  COLD_CALL = 'cold_call',
  INBOUND_CALL = 'inbound_call',
  CHAT = 'chat',
  API = 'api',
  IMPORT = 'import',
  MANUAL = 'manual',
  OTHER = 'other'
}

/**
 * Opportunity stages in sales pipeline
 */
export enum OpportunityStage {
  PROSPECTING = 'prospecting',
  QUALIFICATION = 'qualification',
  NEEDS_ANALYSIS = 'needs_analysis',
  VALUE_PROPOSITION = 'value_proposition',
  DECISION_MAKERS = 'decision_makers',
  PROPOSAL = 'proposal',
  NEGOTIATION = 'negotiation',
  CLOSED_WON = 'closed_won',
  CLOSED_LOST = 'closed_lost'
}

/**
 * Types of activities tracked
 */
export enum ActivityType {
  CALL = 'call',
  EMAIL = 'email',
  MEETING = 'meeting',
  TASK = 'task',
  EVENT = 'event',
  NOTE = 'note',
  SMS = 'sms',
  SOCIAL = 'social',
  WEBINAR = 'webinar',
  DEMO = 'demo',
  PROPOSAL_SENT = 'proposal_sent',
  CONTRACT_SENT = 'contract_sent'
}

/**
 * Campaign types
 */
export enum CampaignType {
  EMAIL = 'email',
  SOCIAL = 'social',
  PAID_ADS = 'paid_ads',
  CONTENT = 'content',
  EVENT = 'event',
  WEBINAR = 'webinar',
  DIRECT_MAIL = 'direct_mail',
  TELEMARKETING = 'telemarketing',
  REFERRAL = 'referral',
  PARTNER = 'partner',
  OTHER = 'other'
}

/**
 * Campaign status
 */
export enum CampaignStatus {
  DRAFT = 'draft',
  PLANNED = 'planned',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABORTED = 'aborted'
}

/**
 * Campaign member status
 */
export enum CampaignMemberStatus {
  SENT = 'sent',
  OPENED = 'opened',
  CLICKED = 'clicked',
  RESPONDED = 'responded',
  CONVERTED = 'converted',
  UNSUBSCRIBED = 'unsubscribed',
  BOUNCED = 'bounced'
}

/**
 * Task priority levels
 */
export enum TaskPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * Task status
 */
export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  WAITING = 'waiting',
  DEFERRED = 'deferred'
}

/**
 * Call disposition/result
 */
export enum CallDisposition {
  CONNECTED = 'connected',
  LEFT_VOICEMAIL = 'left_voicemail',
  NO_ANSWER = 'no_answer',
  BUSY = 'busy',
  WRONG_NUMBER = 'wrong_number',
  CALLBACK_REQUESTED = 'callback_requested',
  NOT_INTERESTED = 'not_interested',
  QUALIFIED = 'qualified',
  MEETING_SCHEDULED = 'meeting_scheduled'
}

// ============================================================================
// LEAD INTERFACES
// ============================================================================

/**
 * Lead entity - potential customer
 */
export interface Lead {
  id: string;

  // Contact information
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  title?: string;

  // Company information
  company?: string;
  industry?: string;
  companySize?: string;
  website?: string;
  annualRevenue?: number;

  // Address
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  // Lead details
  source: LeadSource;
  status: LeadStatus;
  rating?: 'hot' | 'warm' | 'cold';

  // Scoring and qualification
  score?: LeadScore;
  qualification?: LeadQualification;

  // Assignment
  ownerId?: string;
  ownerName?: string;
  territory?: string;

  // Campaign association
  campaignId?: string;

  // Conversion
  convertedOpportunityId?: string;
  convertedContactId?: string;
  convertedAccountId?: string;
  convertedDate?: Date;

  // Tracking
  lastActivityDate?: Date;
  lastContactedDate?: Date;
  numberOfActivities: number;

  // Custom fields
  customFields?: Record<string, unknown>;
  tags?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Lead score - ML-based scoring
 */
export interface LeadScore {
  overall: number; // 0-100

  // Score breakdown
  demographic: number; // Based on company/title match
  behavioral: number; // Based on engagement
  firmographic: number; // Based on company data
  engagement: number; // Based on interactions

  // ML predictions
  conversionProbability: number; // 0-1
  expectedValue: number;
  timeToConvert?: number; // Days

  // Scoring details
  factors: LeadScoreFactor[];
  lastCalculated: Date;
  model: string;
  modelVersion: string;
}

/**
 * Individual scoring factor
 */
export interface LeadScoreFactor {
  name: string;
  category: 'demographic' | 'behavioral' | 'firmographic' | 'engagement';
  value: unknown;
  points: number;
  weight: number;
  description: string;
}

/**
 * BANT Qualification
 */
export interface LeadQualification {
  // Budget
  budget: {
    qualified: boolean;
    amount?: number;
    currency?: string;
    timeframe?: string;
    notes?: string;
  };

  // Authority
  authority: {
    qualified: boolean;
    isDecisionMaker: boolean;
    decisionMakerName?: string;
    decisionMakerTitle?: string;
    buyingProcess?: string;
    notes?: string;
  };

  // Need
  need: {
    qualified: boolean;
    painPoints?: string[];
    currentSolution?: string;
    urgency?: 'low' | 'medium' | 'high' | 'critical';
    notes?: string;
  };

  // Timeline
  timeline: {
    qualified: boolean;
    targetDate?: Date;
    stage?: string;
    blockers?: string[];
    notes?: string;
  };

  // Overall
  overallQualified: boolean;
  qualificationScore: number; // 0-100
  qualifiedDate?: Date;
  qualifiedBy?: string;
}

// ============================================================================
// OPPORTUNITY INTERFACES
// ============================================================================

/**
 * Sales opportunity
 */
export interface Opportunity {
  id: string;

  // Basic info
  name: string;
  description?: string;

  // Related entities
  accountId?: string;
  accountName?: string;
  contactId?: string;
  contactName?: string;
  leadId?: string;

  // Stage and status
  stage: OpportunityStage;
  probability: number; // 0-100
  forecastCategory: 'pipeline' | 'best_case' | 'commit' | 'closed';

  // Financials
  amount: number;
  currency: string;
  products?: OpportunityProduct[];

  // Dates
  closeDate: Date;
  createdDate: Date;
  lastActivityDate?: Date;
  lastStageChangeDate?: Date;

  // Assignment
  ownerId: string;
  ownerName?: string;
  teamMembers?: string[];

  // Win/Loss
  isWon?: boolean;
  isClosed: boolean;
  lossReason?: string;
  competitor?: string;

  // Quotes
  quotes?: Quote[];
  activeQuoteId?: string;

  // Campaign attribution
  primaryCampaignId?: string;
  campaignInfluence?: CampaignInfluence[];

  // Custom fields
  customFields?: Record<string, unknown>;
  tags?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Product line item in opportunity
 */
export interface OpportunityProduct {
  id: string;
  opportunityId: string;

  productId: string;
  productName: string;
  productCode?: string;

  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalPrice: number;

  description?: string;
  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Quote for opportunity
 */
export interface Quote {
  id: string;
  opportunityId: string;

  // Quote details
  name: string;
  quoteNumber: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'accepted' | 'expired';

  // Financials
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  taxRate?: number;
  shipping?: number;
  total: number;
  currency: string;

  // Line items
  lineItems: QuoteLineItem[];

  // Dates
  issueDate: Date;
  expirationDate: Date;
  acceptedDate?: Date;

  // Contact
  contactId?: string;
  contactName?: string;
  contactEmail?: string;

  // Billing address
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;

  // Terms
  terms?: string;
  notes?: string;

  // PDF
  pdfUrl?: string;

  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Quote line item
 */
export interface QuoteLineItem {
  id: string;
  quoteId: string;

  productId?: string;
  productName: string;
  description?: string;

  quantity: number;
  unitPrice: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  totalPrice: number;

  sortOrder: number;
}

/**
 * Campaign influence on opportunity
 */
export interface CampaignInfluence {
  campaignId: string;
  campaignName: string;
  influencePercentage: number;
  revenueShare: number;
  touchDate: Date;
  touchType: string;
}

// ============================================================================
// ACTIVITY INTERFACES
// ============================================================================

/**
 * Base activity interface
 */
export interface Activity {
  id: string;
  type: ActivityType;

  // Related to
  relatedToType: 'lead' | 'contact' | 'account' | 'opportunity';
  relatedToId: string;
  relatedToName?: string;

  // Details
  subject: string;
  description?: string;

  // Assignment
  ownerId: string;
  ownerName?: string;

  // Status
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';

  // Timing
  dueDate?: Date;
  startDateTime?: Date;
  endDateTime?: Date;
  duration?: number; // Minutes

  // Outcome
  outcome?: string;
  notes?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * Task activity
 */
export interface Task extends Activity {
  type: ActivityType.TASK;

  priority: TaskPriority;
  taskStatus: TaskStatus;

  // Recurrence
  isRecurring?: boolean;
  recurrencePattern?: string;

  // Reminder
  reminderDateTime?: Date;
  reminderSent?: boolean;
}

/**
 * Event/Meeting activity
 */
export interface Event extends Activity {
  type: ActivityType.MEETING | ActivityType.EVENT;

  // Location
  location?: string;
  isVirtual?: boolean;
  meetingLink?: string;

  // Attendees
  attendees?: EventAttendee[];

  // Calendar
  calendarEventId?: string;
  allDay?: boolean;

  // Response
  showAs?: 'free' | 'tentative' | 'busy' | 'out_of_office';
}

/**
 * Event attendee
 */
export interface EventAttendee {
  id: string;
  email: string;
  name?: string;
  type: 'required' | 'optional' | 'resource';
  responseStatus: 'needs_action' | 'tentative' | 'accepted' | 'declined';
}

/**
 * Call activity
 */
export interface Call extends Activity {
  type: ActivityType.CALL;

  // Call details
  direction: 'inbound' | 'outbound';
  phoneNumber?: string;

  // Duration
  callDuration?: number; // Seconds

  // Disposition
  disposition?: CallDisposition;

  // Recording
  recordingUrl?: string;
  transcription?: string;

  // Scheduled callback
  callbackDateTime?: Date;
}

/**
 * Email activity
 */
export interface EmailActivity extends Activity {
  type: ActivityType.EMAIL;

  // Email details
  direction: 'sent' | 'received';
  fromAddress: string;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];

  // Content
  htmlBody?: string;
  textBody?: string;

  // Attachments
  hasAttachments: boolean;
  attachments?: EmailAttachment[];

  // Tracking
  opened?: boolean;
  openedAt?: Date;
  clicked?: boolean;
  clickedAt?: Date;
  replied?: boolean;
  repliedAt?: Date;

  // Threading
  threadId?: string;
  messageId?: string;
  inReplyTo?: string;
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  url?: string;
}

// ============================================================================
// CAMPAIGN INTERFACES
// ============================================================================

/**
 * Marketing campaign
 */
export interface Campaign {
  id: string;

  // Basic info
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;

  // Dates
  startDate: Date;
  endDate?: Date;

  // Budget
  budgetedCost?: number;
  actualCost?: number;
  currency?: string;

  // Goals
  expectedRevenue?: number;
  expectedResponse?: number; // Percentage
  numberSent?: number;

  // Parent campaign
  parentCampaignId?: string;

  // Assignment
  ownerId: string;
  ownerName?: string;

  // Members
  numberOfMembers: number;
  numberOfLeads: number;
  numberOfContacts: number;
  numberOfOpportunities: number;
  numberOfConvertedLeads: number;

  // Metrics
  metrics?: CampaignMetrics;

  // A/B Testing
  isABTest?: boolean;
  variants?: CampaignVariant[];
  winningVariant?: string;

  // Custom fields
  customFields?: Record<string, unknown>;
  tags?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

/**
 * Campaign member
 */
export interface CampaignMember {
  id: string;
  campaignId: string;

  // Member
  memberType: 'lead' | 'contact';
  memberId: string;
  memberName?: string;
  memberEmail?: string;

  // Status
  status: CampaignMemberStatus;
  respondedDate?: Date;
  firstRespondedDate?: Date;

  // Conversion
  hasConverted: boolean;
  convertedDate?: Date;
  convertedOpportunityId?: string;

  // Variant (for A/B testing)
  variantId?: string;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Campaign metrics
 */
export interface CampaignMetrics {
  // Delivery
  sent: number;
  delivered: number;
  bounced: number;
  deliveryRate: number;

  // Engagement
  opened: number;
  openRate: number;
  uniqueOpens: number;

  clicked: number;
  clickRate: number;
  uniqueClicks: number;
  clickToOpenRate: number;

  // Response
  responded: number;
  responseRate: number;

  // Conversion
  converted: number;
  conversionRate: number;

  // Revenue
  totalRevenue: number;
  averageDealSize: number;

  // ROI
  totalCost: number;
  roi: number; // (Revenue - Cost) / Cost * 100
  costPerLead: number;
  costPerConversion: number;

  // Calculated at
  calculatedAt: Date;
}

/**
 * Campaign variant for A/B testing
 */
export interface CampaignVariant {
  id: string;
  name: string;
  description?: string;

  // Content variations
  subject?: string;
  content?: string;

  // Distribution
  percentage: number; // % of audience

  // Metrics
  sent: number;
  opened: number;
  clicked: number;
  converted: number;

  // Performance
  openRate: number;
  clickRate: number;
  conversionRate: number;

  isControl: boolean;
  isWinner: boolean;
}

// ============================================================================
// PIPELINE INTERFACES
// ============================================================================

/**
 * Sales pipeline
 */
export interface Pipeline {
  id: string;

  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;

  // Stages
  stages: PipelineStage[];

  // Assignment
  ownerId?: string;
  teamId?: string;

  // Metrics
  totalValue: number;
  totalOpportunities: number;
  weightedValue: number;
  averageDealSize: number;
  averageSalesCycle: number; // Days

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Pipeline stage
 */
export interface PipelineStage {
  id: string;
  pipelineId: string;

  name: string;
  order: number;

  // Probabilities
  probability: number; // Default probability for this stage

  // Requirements
  requiredFields?: string[];

  // SLA
  targetDays?: number; // Target days to move to next stage

  // Metrics
  opportunityCount: number;
  totalValue: number;

  // Display
  color?: string;
  isActive: boolean;
  isClosed: boolean;
  isWon: boolean;
}

/**
 * Funnel metrics
 */
export interface FunnelMetrics {
  period: {
    start: Date;
    end: Date;
  };

  // Stage metrics
  stages: FunnelStageMetrics[];

  // Conversion rates
  overallConversionRate: number;
  leadToOpportunityRate: number;
  opportunityToWinRate: number;

  // Velocity
  averageTimeInPipeline: number; // Days
  averageTimePerStage: Record<string, number>;

  // Value
  totalPipelineValue: number;
  weightedPipelineValue: number;
  closedWonValue: number;
  closedLostValue: number;

  // Volume
  newLeads: number;
  newOpportunities: number;
  closedWon: number;
  closedLost: number;

  // Leakage
  leakageByStage: Record<string, number>;
  topLossReasons: Array<{ reason: string; count: number; value: number }>;
}

/**
 * Individual funnel stage metrics
 */
export interface FunnelStageMetrics {
  stageId: string;
  stageName: string;

  // Volume
  entered: number;
  exited: number;
  currentCount: number;

  // Value
  enteredValue: number;
  exitedValue: number;
  currentValue: number;

  // Conversion
  conversionRate: number;
  conversionToNext: number;

  // Time
  averageTimeInStage: number; // Days

  // Win/Loss from this stage
  wonFromStage: number;
  lostFromStage: number;
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

/**
 * Sales forecast
 */
export interface SalesForecast {
  period: {
    start: Date;
    end: Date;
  };

  userId?: string;
  teamId?: string;

  // Amounts
  pipeline: number;
  bestCase: number;
  commit: number;
  closed: number;

  // Quota
  quota?: number;
  quotaAttainment?: number;

  // Breakdown by stage
  byStage: Record<string, { count: number; value: number }>;

  // Breakdown by product
  byProduct?: Record<string, { count: number; value: number }>;

  // Predictions
  predictedClose: number;
  confidence: number;
}

/**
 * Sales velocity metrics
 */
export interface SalesVelocity {
  period: {
    start: Date;
    end: Date;
  };

  // Core metrics
  numberOfOpportunities: number;
  averageDealValue: number;
  winRate: number;
  salesCycleLength: number; // Days

  // Velocity = (Opportunities * Deal Value * Win Rate) / Sales Cycle
  velocity: number;
  velocityPerDay: number;

  // Trends
  velocityTrend: number; // % change from previous period

  // Breakdown
  byRep?: Record<string, SalesVelocity>;
  byProduct?: Record<string, SalesVelocity>;
  bySource?: Record<string, SalesVelocity>;
}

/**
 * Win/Loss analysis
 */
export interface WinLossAnalysis {
  period: {
    start: Date;
    end: Date;
  };

  // Overview
  totalClosed: number;
  won: number;
  lost: number;
  winRate: number;

  // Value
  wonValue: number;
  lostValue: number;
  averageWonValue: number;
  averageLostValue: number;

  // Reasons
  lossReasons: Array<{
    reason: string;
    count: number;
    value: number;
    percentage: number;
  }>;

  // Competitors
  competitorAnalysis?: Array<{
    competitor: string;
    encounters: number;
    wins: number;
    losses: number;
    winRate: number;
  }>;

  // By segment
  byIndustry?: Record<string, { won: number; lost: number; winRate: number }>;
  bySize?: Record<string, { won: number; lost: number; winRate: number }>;
  bySource?: Record<string, { won: number; lost: number; winRate: number }>;
}

/**
 * Sales rep performance
 */
export interface SalesRepPerformance {
  userId: string;
  userName: string;

  period: {
    start: Date;
    end: Date;
  };

  // Quota
  quota: number;
  closed: number;
  quotaAttainment: number;

  // Pipeline
  pipelineValue: number;
  pipelineCount: number;

  // Activity
  activitiesCompleted: number;
  callsMade: number;
  emailsSent: number;
  meetingsHeld: number;

  // Efficiency
  winRate: number;
  averageDealSize: number;
  averageSalesCycle: number;
  conversionRate: number;

  // Rankings
  rank?: number;
  percentile?: number;
}

/**
 * Next best action recommendation
 */
export interface NextBestAction {
  leadId?: string;
  opportunityId?: string;

  // Recommendation
  action: string;
  actionType: ActivityType;
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Reasoning
  reason: string;
  factors: string[];

  // Impact
  expectedImpact: {
    conversionLift: number;
    revenueImpact: number;
    timeToClose: number;
  };

  // Confidence
  confidence: number;

  // Suggested timing
  suggestedDate?: Date;
  urgency: 'immediate' | 'today' | 'this_week' | 'this_month';

  // Content suggestions
  suggestedContent?: {
    type: string;
    template?: string;
    talking_points?: string[];
  };
}

/**
 * Lead source analysis
 */
export interface LeadSourceAnalysis {
  period: {
    start: Date;
    end: Date;
  };

  sources: Array<{
    source: LeadSource;

    // Volume
    leads: number;
    leadsPercentage: number;

    // Quality
    qualified: number;
    qualificationRate: number;
    averageScore: number;

    // Conversion
    converted: number;
    conversionRate: number;

    // Value
    revenue: number;
    averageDealSize: number;

    // Velocity
    averageTimeToConvert: number;

    // Cost
    cost?: number;
    costPerLead?: number;
    costPerConversion?: number;
    roi?: number;
  }>;

  // Best performers
  bestByVolume: LeadSource;
  bestByConversion: LeadSource;
  bestByRevenue: LeadSource;
  bestByROI?: LeadSource;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Lead capture data from web/API
 */
export interface LeadCaptureData {
  // Required
  email: string;

  // Optional contact info
  firstName?: string;
  lastName?: string;
  phone?: string;

  // Company
  company?: string;
  title?: string;

  // Tracking
  source: LeadSource;
  campaignId?: string;

  // UTM parameters
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;

  // Page info
  landingPage?: string;
  referrer?: string;

  // Custom
  customFields?: Record<string, unknown>;
  formData?: Record<string, unknown>;

  // Consent
  marketingConsent?: boolean;
  privacyPolicyAccepted?: boolean;
}

/**
 * Assignment rule
 */
export interface AssignmentRule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number;

  // Conditions
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in';
    value: unknown;
  }>;

  // Assignment
  assignmentType: 'user' | 'queue' | 'round_robin' | 'load_balanced';
  assignToId?: string;
  roundRobinUsers?: string[];

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Territory
 */
export interface Territory {
  id: string;
  name: string;
  description?: string;

  parentTerritoryId?: string;

  // Rules
  rules: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;

  // Assignment
  assignedUsers: string[];

  // Metrics
  leadCount: number;
  opportunityCount: number;
  totalValue: number;

  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
