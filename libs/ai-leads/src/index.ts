/**
 * AI-Leads Module
 * CRM and Lead Management with ML Scoring, BANT Qualification, and Pipeline Analytics
 *
 * @packageDocumentation
 */

// ============================================================================
// TYPES EXPORTS
// ============================================================================

export {
  // Enums
  LeadStatus,
  LeadSource,
  OpportunityStage,
  ActivityType,
  CampaignType,
  CampaignStatus,
  CampaignMemberStatus,
  TaskPriority,
  TaskStatus,
  CallDisposition,

  // Lead interfaces
  Lead,
  LeadScore,
  LeadScoreFactor,
  LeadQualification,
  LeadCaptureData,

  // Opportunity interfaces
  Opportunity,
  OpportunityProduct,
  Quote,
  QuoteLineItem,
  CampaignInfluence,

  // Activity interfaces
  Activity,
  Task,
  Event,
  Call,
  EmailActivity,
  EmailAttachment,
  EventAttendee,

  // Campaign interfaces
  Campaign,
  CampaignMember,
  CampaignMetrics,
  CampaignVariant,

  // Pipeline interfaces
  Pipeline,
  PipelineStage,
  FunnelMetrics,
  FunnelStageMetrics,

  // Analytics interfaces
  SalesForecast,
  SalesVelocity,
  WinLossAnalysis,
  SalesRepPerformance,
  NextBestAction,
  LeadSourceAnalysis,

  // Utility types
  AssignmentRule,
  Territory
} from './types';

// ============================================================================
// SERVICES EXPORTS
// ============================================================================

// Lead Service
export {
  LeadService,
  leadService,
  CreateLeadData,
  UpdateLeadData,
  BANTInput
} from './services/lead.service';

// Opportunity Service
export {
  OpportunityService,
  opportunityService,
  CreateOpportunityData,
  UpdateOpportunityData,
  AddProductData,
  CreateQuoteData
} from './services/opportunity.service';

// Activity Service
export {
  ActivityService,
  activityService,
  LogCallData,
  LogEmailData,
  LogMeetingData,
  ScheduleTaskData,
  ScheduleEventData
} from './services/activity.service';

// Campaign Service
export {
  CampaignService,
  campaignService,
  CreateCampaignData,
  UpdateCampaignData,
  VariantData
} from './services/campaign.service';

// Analytics Service
export {
  AnalyticsService,
  createAnalyticsService,
  Period
} from './services/analytics.service';

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

import { leadService } from './services/lead.service';
import { opportunityService } from './services/opportunity.service';
import { activityService } from './services/activity.service';
import { campaignService } from './services/campaign.service';
import { createAnalyticsService } from './services/analytics.service';

/**
 * Pre-configured AI Leads module with all services
 */
export const AILeads = {
  leads: leadService,
  opportunities: opportunityService,
  activities: activityService,
  campaigns: campaignService,
  analytics: createAnalyticsService(leadService, opportunityService, activityService)
};

/**
 * Default export
 */
export default AILeads;
