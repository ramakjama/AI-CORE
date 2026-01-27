/**
 * AI Gateway Types
 * Core type definitions for GraphQL Federation Gateway
 */

import { Request, Response } from 'express';
import DataLoader from 'dataloader';

// ============================================================================
// Enums
// ============================================================================

export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  AGENT = 'AGENT',
  SYSTEM = 'SYSTEM',
}

export enum PartyType {
  INDIVIDUAL = 'INDIVIDUAL',
  ORGANIZATION = 'ORGANIZATION',
  HOUSEHOLD = 'HOUSEHOLD',
}

export enum PolicyStatus {
  DRAFT = 'DRAFT',
  QUOTED = 'QUOTED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  RENEWED = 'RENEWED',
}

export enum ClaimStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PAID = 'PAID',
  CLOSED = 'CLOSED',
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// ============================================================================
// User & Authentication Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: Role;
  permissions: string[];
  partyId?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  permissions: string[];
  partyId?: string;
  organizationId?: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;
}

// ============================================================================
// Context Types
// ============================================================================

export interface GraphQLContext {
  req: Request;
  res: Response;
  requestId: string;
  startTime: number;
  dataloaders: DataLoaderRegistry;
  cacheService: CacheService;
  logger: Logger;
}

export interface AuthenticatedContext extends GraphQLContext {
  user: User;
  token: string;
}

export interface DataLoaderRegistry {
  party: DataLoader<string, Party | null>;
  policy: DataLoader<string, Policy | null>;
  claim: DataLoader<string, Claim | null>;
  household: DataLoader<string, Household | null>;
  document: DataLoader<string, Document | null>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix: string;
  skipFailedRequests?: boolean;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (context: GraphQLContext) => string;
  onLimitReached?: (context: GraphQLContext, key: string) => void;
}

export interface CacheConfig {
  ttlSeconds: number;
  keyPrefix: string;
  invalidateOnMutation?: boolean;
  tags?: string[];
  compress?: boolean;
}

export interface SubgraphConfig {
  name: string;
  url: string;
  healthCheckPath?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  wsUrl?: string;
}

export interface FederationConfig {
  subgraphs: SubgraphConfig[];
  polling?: {
    enabled: boolean;
    intervalMs: number;
  };
  supergraphSdl?: string;
  experimental?: {
    reuseQueryPlans?: boolean;
  };
}

export interface GatewayConfig {
  port: number;
  host: string;
  cors: CorsConfig;
  redis: RedisConfig;
  jwt: JwtConfig;
  rateLimit: RateLimitConfig;
  cache: CacheConfig;
  federation: FederationConfig;
  tracing: TracingConfig;
}

export interface CorsConfig {
  origin: string | string[] | boolean;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  tls?: boolean;
  cluster?: boolean;
  sentinels?: Array<{ host: string; port: number }>;
  sentinelName?: string;
}

export interface JwtConfig {
  secret: string;
  publicKey?: string;
  algorithm: 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512';
  expiresIn: string;
  refreshExpiresIn: string;
  issuer: string;
  audience: string;
}

export interface TracingConfig {
  enabled: boolean;
  serviceName: string;
  jaegerEndpoint?: string;
  samplingRate: number;
}

// ============================================================================
// Logging & Metrics Types
// ============================================================================

export interface RequestLog {
  requestId: string;
  timestamp: Date;
  method: string;
  path: string;
  operationName?: string;
  operationType?: 'query' | 'mutation' | 'subscription';
  userId?: string;
  userRole?: Role;
  clientIp: string;
  userAgent?: string;
  duration: number;
  status: number;
  errors?: string[];
  variables?: Record<string, unknown>;
}

export interface MetricsData {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  cacheHitRate: number;
  rateLimitHits: number;
  activeConnections: number;
  subgraphHealth: Record<string, SubgraphHealthMetrics>;
}

export interface SubgraphHealthMetrics {
  name: string;
  healthy: boolean;
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  requestCount: number;
}

// ============================================================================
// Domain Types - Party/MDM
// ============================================================================

export interface Party {
  id: string;
  type: PartyType;
  fullName: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  identifiers: PartyIdentifier[];
  addresses: Address[];
  contacts: Contact[];
  segment?: CustomerSegment;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface PartyIdentifier {
  type: string;
  value: string;
  issuedBy?: string;
  validFrom?: Date;
  validTo?: Date;
  isPrimary: boolean;
}

export interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface Contact {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
  verifiedAt?: Date;
}

export interface CustomerSegment {
  code: string;
  name: string;
  tier: string;
  score: number;
}

export interface Household {
  id: string;
  name: string;
  members: Party[];
  primaryContact: Party;
  address?: Address;
  createdAt: Date;
}

// ============================================================================
// Domain Types - Insurance
// ============================================================================

export interface Policy {
  id: string;
  policyNumber: string;
  status: PolicyStatus;
  productCode: string;
  productName: string;
  holder: Party;
  holderId: string;
  insuredParties: Party[];
  coverages: Coverage[];
  premium: Money;
  effectiveDate: Date;
  expirationDate: Date;
  renewalDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Coverage {
  id: string;
  code: string;
  name: string;
  description: string;
  limit: Money;
  deductible: Money;
  premium: Money;
  isOptional: boolean;
  isSelected: boolean;
}

export interface Claim {
  id: string;
  claimNumber: string;
  status: ClaimStatus;
  policy: Policy;
  policyId: string;
  claimant: Party;
  claimantId: string;
  lossDate: Date;
  reportedDate: Date;
  description: string;
  estimatedAmount?: Money;
  approvedAmount?: Money;
  paidAmount?: Money;
  documents: Document[];
  notes: ClaimNote[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ClaimNote {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
  isInternal: boolean;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  productCode: string;
  holder: Party;
  coverages: Coverage[];
  totalPremium: Money;
  validUntil: Date;
  createdAt: Date;
}

export interface Receipt {
  id: string;
  receiptNumber: string;
  policyId: string;
  amount: Money;
  dueDate: Date;
  paidDate?: Date;
  status: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface Money {
  amount: number;
  currency: string;
}

// ============================================================================
// Domain Types - Workflow
// ============================================================================

export interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  currentStep: WorkflowStep;
  steps: WorkflowStep[];
  context: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  createdBy: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  status: WorkflowStatus;
  assignee?: string;
  dueDate?: Date;
  completedAt?: Date;
  output?: Record<string, unknown>;
}

// ============================================================================
// Domain Types - Communication
// ============================================================================

export interface Communication {
  id: string;
  type: string;
  channel: string;
  recipient: Party;
  subject?: string;
  content: string;
  status: string;
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface Template {
  id: string;
  name: string;
  channel: string;
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

// ============================================================================
// Domain Types - Analytics
// ============================================================================

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId?: string;
  timestamp: Date;
  properties: Record<string, unknown>;
}

export interface Report {
  id: string;
  name: string;
  type: string;
  filters: Record<string, unknown>;
  data: Record<string, unknown>;
  generatedAt: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
  createdBy: string;
  isPublic: boolean;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}

// ============================================================================
// Input Types
// ============================================================================

export interface QuoteInput {
  productCode: string;
  holderId?: string;
  holderData?: PartyInput;
  coverages: string[];
  effectiveDate: Date;
  additionalData?: Record<string, unknown>;
}

export interface PartyInput {
  type: PartyType;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  identifiers: PartyIdentifierInput[];
  addresses?: AddressInput[];
  contacts?: ContactInput[];
}

export interface PartyIdentifierInput {
  type: string;
  value: string;
  issuedBy?: string;
}

export interface AddressInput {
  type: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isPrimary?: boolean;
}

export interface ContactInput {
  type: string;
  value: string;
  isPrimary?: boolean;
}

export interface ClaimInput {
  policyId: string;
  lossDate: Date;
  description: string;
  estimatedAmount?: MoneyInput;
  documents?: DocumentInput[];
}

export interface MoneyInput {
  amount: number;
  currency: string;
}

export interface DocumentInput {
  name: string;
  type: string;
  content: string; // Base64 encoded
}

// ============================================================================
// Service Interfaces
// ============================================================================

export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
  exists(key: string): Promise<boolean>;
}

export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}

// ============================================================================
// Error Types
// ============================================================================

export class GatewayError extends Error {
  code: string;
  statusCode: number;
  extensions?: Record<string, unknown>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    extensions?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.statusCode = statusCode;
    this.extensions = extensions;
  }
}

export class AuthenticationError extends GatewayError {
  constructor(message: string = 'Authentication required') {
    super(message, 'UNAUTHENTICATED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends GatewayError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends GatewayError {
  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter?: number
  ) {
    super(message, 'RATE_LIMITED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends GatewayError {
  constructor(
    message: string,
    validationErrors?: Record<string, string[]>
  ) {
    super(message, 'VALIDATION_ERROR', 400, { validationErrors });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends GatewayError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  facets?: Record<string, Array<{ value: string; count: number }>>;
}
