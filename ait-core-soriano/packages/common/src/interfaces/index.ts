// User interfaces
export * from './user.interface';

// Document interfaces
export * from './document.interface';

// API interfaces
export * from './api.interface';

// Calendar interfaces
export * from './calendar.interface';

// Task interfaces
export * from './task.interface';

// Email interfaces
export * from './email.interface';

// Additional common interfaces

// File/Storage
export interface FileItem {
  id: string;
  name: string;
  path: string;
  mimeType: string;
  size: number;
  isFolder: boolean;
  parentId?: string;
  ownerId: string;
  sharedWith: string[];
  thumbnail?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
}

// Note
export interface Note {
  id: string;
  title: string;
  content: string;
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  tags: string[];
  ownerId: string;
  folderId?: string;
  createdAt: string;
  updatedAt: string;
}

// Contact (CRM)
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  status: 'lead' | 'prospect' | 'customer' | 'churned';
  source?: string;
  score: number;
  tags: string[];
  customFields: Record<string, unknown>;
  ownerId: string;
  lastContactedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Deal (CRM)
export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  probability: number;
  contactId: string;
  companyId?: string;
  ownerId: string;
  expectedCloseDate?: string;
  closedAt?: string;
  lostReason?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Employee (HR)
export interface Employee {
  id: string;
  userId: string;
  employeeNumber: string;
  department: string;
  position: string;
  manager?: string;
  hireDate: string;
  terminationDate?: string;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'intern';
  status: 'active' | 'on_leave' | 'terminated';
  salary?: number;
  currency?: string;
  benefits: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Booking
export interface Booking {
  id: string;
  resourceId: string;
  resourceType: 'room' | 'equipment' | 'vehicle' | 'desk';
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  attendees: string[];
  createdAt: string;
  updatedAt: string;
}

// Resource (for bookings)
export interface Resource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'vehicle' | 'desk';
  description?: string;
  location: string;
  capacity?: number;
  amenities: string[];
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Form
export interface Form {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  settings: FormSettings;
  status: 'draft' | 'published' | 'closed';
  ownerId: string;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'number' | 'email' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'file' | 'rating';
  label: string;
  description?: string;
  required: boolean;
  placeholder?: string;
  defaultValue?: unknown;
  options?: Array<{ label: string; value: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  order: number;
}

export interface FormSettings {
  allowMultipleResponses: boolean;
  requireLogin: boolean;
  showProgressBar: boolean;
  confirmationMessage: string;
  redirectUrl?: string;
  notifyOnResponse: boolean;
  closeDate?: string;
  responseLimit?: number;
}

// Workflow
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  status: 'draft' | 'active' | 'paused' | 'archived';
  ownerId: string;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  type: 'action' | 'condition' | 'delay' | 'loop';
  name: string;
  config: Record<string, unknown>;
  nextStepId?: string;
  onSuccess?: string;
  onFailure?: string;
}

// Whiteboard
export interface Whiteboard {
  id: string;
  name: string;
  thumbnail?: string;
  content: string; // JSON canvas data
  ownerId: string;
  collaborators: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Translation
export interface Translation {
  id: string;
  sourceText: string;
  targetText: string;
  sourceLang: string;
  targetLang: string;
  quality: number;
  userId: string;
  createdAt: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
