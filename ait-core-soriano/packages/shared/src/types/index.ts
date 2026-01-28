/**
 * Shared Types for AIT-CORE Ecosystem
 * Used across all services: AIT-COMMS, ERP, Auth, DataHub, etc.
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agentId?: string;
  customerId?: string;
  permissions: Permission[];
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole =
  | 'admin'
  | 'supervisor'
  | 'agent'
  | 'customer'
  | 'readonly';

export type Permission =
  | 'call:make'
  | 'call:receive'
  | 'call:transfer'
  | 'call:monitor'
  | 'call:barge'
  | 'customer:read'
  | 'customer:write'
  | 'policy:read'
  | 'policy:write'
  | 'quote:create'
  | 'quote:approve'
  | 'claim:create'
  | 'claim:approve'
  | 'analytics:view'
  | 'admin:*';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  twilioToken?: string;
  twilioIdentity?: string;
}

// ============================================================================
// CUSTOMER & CRM
// ============================================================================

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  phoneSecondary?: string;
  dni: string;
  address: Address;
  dateOfBirth: Date;
  language: 'es' | 'en' | 'ca';
  segment: CustomerSegment;
  status: CustomerStatus;
  preferredContact: 'phone' | 'email' | 'whatsapp';
  lastContactDate?: Date;
  lastContactType?: InteractionType;
  lastAgentId?: string;
  yearsAsCustomer: number;
  lifetimeValue: number;
  satisfactionScore?: number;
  churnRisk?: 'low' | 'medium' | 'high';
  tags: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerSegment = 'vip' | 'premium' | 'regular' | 'new' | 'churned';
export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'prospect';

export interface Address {
  street: string;
  number: string;
  floor?: string;
  door?: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
}

// ============================================================================
// POLICIES & INSURANCE
// ============================================================================

export interface Policy {
  id: string;
  policyNumber: string;
  customerId: string;
  type: PolicyType;
  carrier: string;
  status: PolicyStatus;
  startDate: Date;
  endDate: Date;
  renewalDate: Date;
  premium: number;
  paymentFrequency: 'monthly' | 'quarterly' | 'annual';
  coverage: Coverage;
  vehicleData?: VehicleData;
  propertyData?: PropertyData;
  lifeData?: LifeData;
  deductible: number;
  createdDuringCallSid?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PolicyType = 'auto' | 'home' | 'life' | 'health' | 'business' | 'travel';
export type PolicyStatus =
  | 'pending_payment'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'suspended';

export interface Coverage {
  liability: number;
  collision: boolean;
  comprehensive: boolean;
  personalInjury: boolean;
  uninsuredMotorist: boolean;
  roadAssistance: boolean;
  rentalCar: boolean;
  customCoverages?: Record<string, any>;
}

export interface VehicleData {
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  usage: 'personal' | 'commercial' | 'rideshare';
  annualKm: number;
  parkingType: 'garage' | 'street' | 'covered';
  drivers: Driver[];
}

export interface Driver {
  name: string;
  dni: string;
  dateOfBirth: Date;
  licenseDate: Date;
  age: number;
  experience: number;
  claims: number;
  isPrimary: boolean;
}

export interface PropertyData {
  type: 'apartment' | 'house' | 'commercial';
  squareMeters: number;
  yearBuilt: number;
  constructionType: string;
  hasAlarm: boolean;
  hasSecurityDoor: boolean;
  address: Address;
}

export interface LifeData {
  insuredAmount: number;
  beneficiaries: Beneficiary[];
  smoker: boolean;
  occupation: string;
  healthConditions: string[];
}

export interface Beneficiary {
  name: string;
  relationship: string;
  percentage: number;
}

// ============================================================================
// CALLS & TELEPHONY
// ============================================================================

export interface Call {
  id: string;
  callSid: string;
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  agentId?: string;
  customerId?: string;
  status: CallStatus;
  state: CallState;
  startedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  duration?: number;
  queueTime?: number;
  recordingUrl?: string;
  recordingSid?: string;
  quality?: CallQuality;
  outcome?: CallOutcome;
  metadata: Record<string, any>;
}

export type CallStatus =
  | 'initiated'
  | 'ringing'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no-answer';

export type CallState =
  | 'idle'
  | 'dialing'
  | 'ringing'
  | 'active'
  | 'hold'
  | 'muted';

export interface CallQuality {
  mos: number; // Mean Opinion Score (1-5)
  jitter: number; // ms
  latency: number; // ms
  packetLoss: number; // percentage
}

export type CallOutcome =
  | 'resolved'
  | 'escalated'
  | 'callback_scheduled'
  | 'transferred'
  | 'abandoned'
  | 'voicemail';

export interface CallContext {
  callSid: string;
  customer?: Customer;
  policies?: Policy[];
  claims?: Claim[];
  recentInteractions?: Interaction[];
  pendingTasks?: Task[];
  aiSuggestions?: AISuggestion[];
}

// ============================================================================
// INTERACTIONS & HISTORY
// ============================================================================

export interface Interaction {
  id: string;
  customerId: string;
  agentId?: string;
  type: InteractionType;
  direction: 'inbound' | 'outbound';
  channel: InteractionChannel;
  duration?: number;
  outcome?: string;
  sentiment?: SentimentAnalysis;
  summary?: string;
  transcription?: string;
  recording?: string;
  tags: string[];
  metadata: Record<string, any>;
  callSid?: string;
  createdAt: Date;
}

export type InteractionType =
  | 'phone_call'
  | 'email'
  | 'chat'
  | 'whatsapp'
  | 'sms'
  | 'meeting'
  | 'callback';

export type InteractionChannel =
  | 'phone'
  | 'email'
  | 'chat'
  | 'whatsapp'
  | 'web'
  | 'mobile';

export interface SentimentAnalysis {
  score: number; // -1 to 1
  label: 'negative' | 'neutral' | 'positive';
  confidence: number;
}

// ============================================================================
// QUOTES & PRICING
// ============================================================================

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  agentId?: string;
  callSid?: string;
  type: PolicyType;
  status: QuoteStatus;
  calculatedPremium: number;
  breakdown: PremiumBreakdown;
  vehicleData?: VehicleData;
  propertyData?: PropertyData;
  lifeData?: LifeData;
  validUntil: Date;
  acceptedAt?: Date;
  policyId?: string;
  competitorPrices?: CompetitorPrice[];
  createdAt: Date;
  updatedAt: Date;
}

export type QuoteStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'converted';

export interface PremiumBreakdown {
  base: number;
  factors: Record<string, number>;
  discounts: Record<string, number>;
  final: number;
}

export interface CompetitorPrice {
  carrier: string;
  price: number;
  scrapedAt: Date;
  source: string;
}

// ============================================================================
// CLAIMS & INCIDENTS
// ============================================================================

export interface Claim {
  id: string;
  claimNumber: string;
  policyId: string;
  customerId: string;
  type: ClaimType;
  status: ClaimStatus;
  reportedDate: Date;
  incidentDate: Date;
  location?: string;
  description: string;
  estimatedAmount?: number;
  approvedAmount?: number;
  paidAmount?: number;
  deductible: number;
  assignedAdjusterId?: string;
  callSid?: string;
  documents: Document[];
  timeline: ClaimEvent[];
  createdAt: Date;
  updatedAt: Date;
}

export type ClaimType =
  | 'auto_accident'
  | 'theft'
  | 'fire'
  | 'water_damage'
  | 'glass'
  | 'vandalism'
  | 'natural_disaster'
  | 'liability';

export type ClaimStatus =
  | 'open'
  | 'investigating'
  | 'approved'
  | 'rejected'
  | 'paid'
  | 'closed';

export interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface ClaimEvent {
  type: string;
  description: string;
  userId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// TASKS & WORKFLOW
// ============================================================================

export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  customerId?: string;
  policyId?: string;
  claimId?: string;
  assignedTo?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: Date;
  completedAt?: Date;
  scheduledFor?: Date;
  callbackPhone?: string;
  source: TaskSource;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type TaskType =
  | 'callback'
  | 'follow_up'
  | 'quote_follow_up'
  | 'renewal'
  | 'claim_follow_up'
  | 'document_request'
  | 'payment_reminder'
  | 'survey'
  | 'general';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskSource =
  | 'manual'
  | 'ai_call_analysis'
  | 'customer_request'
  | 'system_generated'
  | 'workflow';

// ============================================================================
// EVENTS & MESSAGING
// ============================================================================

export interface Event<T = any> {
  id: string;
  type: EventType;
  timestamp: number;
  userId?: string;
  agentId?: string;
  customerId?: string;
  data: T;
  metadata?: Record<string, any>;
}

export type EventType =
  // Call events
  | 'call.initiated'
  | 'call.ringing'
  | 'call.answered'
  | 'call.completed'
  | 'call.failed'
  | 'call.transferred'
  | 'call.hold'
  | 'call.muted'
  // Customer events
  | 'customer.created'
  | 'customer.updated'
  | 'customer.interaction'
  // Policy events
  | 'policy.created'
  | 'policy.renewed'
  | 'policy.cancelled'
  | 'policy.expired'
  // Quote events
  | 'quote.created'
  | 'quote.accepted'
  | 'quote.rejected'
  | 'quote.expired'
  // Claim events
  | 'claim.created'
  | 'claim.updated'
  | 'claim.approved'
  | 'claim.paid'
  // Task events
  | 'task.created'
  | 'task.assigned'
  | 'task.completed'
  // Agent events
  | 'agent.login'
  | 'agent.logout'
  | 'agent.status_changed'
  // System events
  | 'system.error'
  | 'system.alert';

// ============================================================================
// ANALYTICS & METRICS
// ============================================================================

export interface CallMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  abandonedCalls: number;
  averageDuration: number;
  averageWaitTime: number;
  averageHandleTime: number;
  serviceLevel: number; // % answered within threshold
  abandonmentRate: number;
  firstCallResolution: number;
  averageQuality: number;
}

export interface AgentMetrics {
  agentId: string;
  status: AgentStatus;
  callsHandled: number;
  averageDuration: number;
  averageQuality: number;
  customerSatisfaction: number;
  firstCallResolution: number;
  activeCallSid?: string;
  activeCallDuration?: number;
  lastCallAt?: Date;
}

export type AgentStatus =
  | 'available'
  | 'busy'
  | 'in_call'
  | 'wrap_up'
  | 'break'
  | 'offline';

export interface RevenueMetrics {
  totalRevenue: number;
  newPolicies: number;
  renewals: number;
  cancellations: number;
  averagePremium: number;
  conversionRate: number;
}

// ============================================================================
// AI & SUGGESTIONS
// ============================================================================

export interface AISuggestion {
  type: SuggestionType;
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
  action?: {
    type: string;
    params: Record<string, any>;
  };
  metadata?: Record<string, any>;
}

export type SuggestionType =
  | 'upsell'
  | 'cross_sell'
  | 'retention'
  | 'discount'
  | 'follow_up'
  | 'escalation'
  | 'next_best_action';

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
}

export type NotificationType =
  | 'call_missed'
  | 'callback_scheduled'
  | 'task_assigned'
  | 'policy_renewal'
  | 'claim_update'
  | 'payment_due'
  | 'system_alert';

// ============================================================================
// API RESPONSES
// ============================================================================

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: APIError;
  metadata?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: number;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

// ============================================================================
// WEBSOCKET MESSAGES
// ============================================================================

export interface WebSocketMessage<T = any> {
  event: string;
  data: T;
  timestamp: number;
  room?: string;
}
