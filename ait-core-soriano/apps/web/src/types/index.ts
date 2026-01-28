// Core Types and Interfaces for AIT-CORE Soriano Application

export type UserRole = 'admin' | 'manager' | 'agent' | 'client' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  phone?: string;
  department?: string;
  position?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

// Insurance Policy Types
export type PolicyStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'suspended';
export type PolicyType = 'auto' | 'home' | 'life' | 'health' | 'business' | 'travel' | 'other';
export type PaymentFrequency = 'monthly' | 'quarterly' | 'semi-annual' | 'annual';

export interface Policy {
  id: string;
  policyNumber: string;
  type: PolicyType;
  status: PolicyStatus;
  clientId: string;
  client?: Client;
  insuranceCompany: string;
  startDate: Date;
  endDate: Date;
  renewalDate?: Date;
  premium: number;
  paymentFrequency: PaymentFrequency;
  coverage: PolicyCoverage[];
  beneficiaries?: Beneficiary[];
  documents: Document[];
  notes?: string;
  agentId: string;
  agent?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyCoverage {
  id: string;
  type: string;
  description: string;
  amount: number;
  deductible?: number;
}

export interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  percentage: number;
  phone?: string;
  email?: string;
}

// Client Types
export type ClientType = 'individual' | 'business';
export type ClientStatus = 'active' | 'inactive' | 'lead' | 'prospect';

export interface Client {
  id: string;
  type: ClientType;
  status: ClientStatus;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  phone: string;
  alternatePhone?: string;
  address: Address;
  dateOfBirth?: Date;
  taxId?: string;
  occupation?: string;
  policies: Policy[];
  claims: Claim[];
  documents: Document[];
  notes?: string;
  tags?: string[];
  assignedAgentId: string;
  assignedAgent?: User;
  totalPremium: number;
  totalClaims: number;
  createdAt: Date;
  updatedAt: Date;
  lastContactDate?: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Claims Types
export type ClaimStatus = 'submitted' | 'under-review' | 'approved' | 'denied' | 'paid' | 'closed';
export type ClaimType = 'accident' | 'theft' | 'damage' | 'medical' | 'liability' | 'other';
export type ClaimPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Claim {
  id: string;
  claimNumber: string;
  policyId: string;
  policy?: Policy;
  clientId: string;
  client?: Client;
  type: ClaimType;
  status: ClaimStatus;
  priority: ClaimPriority;
  incidentDate: Date;
  reportDate: Date;
  description: string;
  estimatedAmount: number;
  approvedAmount?: number;
  paidAmount?: number;
  documents: Document[];
  timeline: ClaimTimeline[];
  assignedAdjusterId?: string;
  assignedAdjuster?: User;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface ClaimTimeline {
  id: string;
  date: Date;
  action: string;
  description: string;
  userId: string;
  user?: User;
}

// Document Types
export type DocumentType = 'policy' | 'claim' | 'identification' | 'medical' | 'financial' | 'other';
export type DocumentStatus = 'pending' | 'verified' | 'rejected';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  uploadedById: string;
  uploadedBy?: User;
  relatedEntityId?: string;
  relatedEntityType?: 'policy' | 'claim' | 'client';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high';

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  userId: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalPolicies: number;
  activePolicies: number;
  totalClients: number;
  activeClients: number;
  pendingClaims: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  policyRenewalRate: number;
  averageClaimProcessingTime: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  policies: number;
  claims: number;
}

export interface PolicyDistribution {
  type: PolicyType;
  count: number;
  revenue: number;
  percentage: number;
}

// Report Types
export type ReportType = 'sales' | 'claims' | 'financial' | 'client' | 'agent-performance' | 'custom';
export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Report {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  parameters: ReportParameters;
  fileUrl?: string;
  generatedById: string;
  generatedBy?: User;
  createdAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface ReportParameters {
  dateFrom: Date;
  dateTo: Date;
  groupBy?: string;
  filters?: Record<string, any>;
  includeCharts?: boolean;
  includeDetails?: boolean;
}

// Activity Log Types
export type ActivityType = 'create' | 'update' | 'delete' | 'view' | 'export' | 'login' | 'logout';

export interface Activity {
  id: string;
  type: ActivityType;
  entityType: string;
  entityId: string;
  description: string;
  userId: string;
  user?: User;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// WebSocket Types
export type WebSocketEvent =
  | 'notification'
  | 'policy-update'
  | 'claim-update'
  | 'client-update'
  | 'user-online'
  | 'user-offline'
  | 'system-message';

export interface WebSocketMessage {
  event: WebSocketEvent;
  data: any;
  timestamp: Date;
  userId?: string;
}

// Settings Types
export interface CompanySettings {
  name: string;
  logo?: string;
  email: string;
  phone: string;
  address: Address;
  website?: string;
  taxId: string;
  license?: string;
  workingHours: WorkingHours;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoRenewalReminder: boolean;
  reminderDaysBefore: number;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: boolean;
  from?: string;
  to?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  totalItems?: number;
  totalPages?: number;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Filter Types
export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'in';
  value: any;
}

// Form Types
export interface FormState {
  isSubmitting: boolean;
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

// Table Types
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableAction<T = any> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  disabled?: (row: T) => boolean;
  hidden?: (row: T) => boolean;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Toast Types
export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// Search Types
export interface SearchParams {
  query: string;
  filters?: FilterConfig[];
  pagination?: PaginationParams;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

// Export/Import Types
export interface ExportOptions {
  format: 'excel' | 'csv' | 'pdf' | 'json';
  fields?: string[];
  includeHeaders?: boolean;
  filename?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: ImportError[];
}

export interface ImportError {
  row: number;
  field?: string;
  message: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
