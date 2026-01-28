// ============================================================================
// Authentication & User Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  organization_id?: string;
  preferences?: UserPreferences;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard_layout?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organization_name?: string;
}

// ============================================================================
// Storage & Files Types
// ============================================================================

export interface Folder {
  id: string;
  name: string;
  parent_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  path: string;
  is_shared: boolean;
  item_count: number;
}

export interface File {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  folder_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  url: string;
  thumbnail_url?: string;
  is_shared: boolean;
  is_favorite: boolean;
  tags?: string[];
  version: number;
  checksum: string;
}

export interface FileShare {
  id: string;
  file_id: string;
  user_id: string;
  user: User;
  permission: 'view' | 'edit' | 'admin';
  created_at: string;
  expires_at?: string;
}

export interface FileVersion {
  id: string;
  file_id: string;
  version: number;
  size: number;
  created_at: string;
  created_by: string;
  comment?: string;
}

// ============================================================================
// Documents Types
// ============================================================================

export interface Document {
  id: string;
  title: string;
  content: string;
  content_type: 'text' | 'markdown' | 'html';
  folder_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  collaborators: DocumentCollaborator[];
  version: number;
  word_count: number;
  character_count: number;
  tags?: string[];
}

export interface DocumentCollaborator {
  user_id: string;
  user: User;
  permission: 'view' | 'comment' | 'edit';
  added_at: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  content: string;
  created_at: string;
  created_by: string;
  comment?: string;
}

// ============================================================================
// Spreadsheets Types
// ============================================================================

export interface Spreadsheet {
  id: string;
  title: string;
  folder_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  sheets: Sheet[];
  is_shared: boolean;
  collaborators: SpreadsheetCollaborator[];
}

export interface Sheet {
  id: string;
  spreadsheet_id: string;
  name: string;
  index: number;
  rows: number;
  columns: number;
  cells: Record<string, Cell>;
  frozen_rows?: number;
  frozen_columns?: number;
  hidden: boolean;
}

export interface Cell {
  value: string | number | boolean | null;
  formula?: string;
  format?: CellFormat;
  style?: CellStyle;
  validation?: CellValidation;
  comment?: string;
}

export interface CellFormat {
  type: 'text' | 'number' | 'currency' | 'percentage' | 'date' | 'time';
  pattern?: string;
  decimal_places?: number;
  currency?: string;
}

export interface CellStyle {
  font_family?: string;
  font_size?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  color?: string;
  background_color?: string;
  horizontal_align?: 'left' | 'center' | 'right';
  vertical_align?: 'top' | 'middle' | 'bottom';
  border?: CellBorder;
}

export interface CellBorder {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface CellValidation {
  type: 'list' | 'number' | 'date' | 'text' | 'custom';
  criteria: any;
  show_dropdown?: boolean;
  error_message?: string;
}

export interface SpreadsheetCollaborator {
  user_id: string;
  user: User;
  permission: 'view' | 'edit';
  added_at: string;
}

// ============================================================================
// Presentations Types
// ============================================================================

export interface Presentation {
  id: string;
  title: string;
  folder_id?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  slides: Slide[];
  theme: PresentationTheme;
  is_shared: boolean;
  collaborators: PresentationCollaborator[];
}

export interface Slide {
  id: string;
  presentation_id: string;
  index: number;
  layout: SlideLayout;
  elements: SlideElement[];
  notes?: string;
  transition?: SlideTransition;
  background?: SlideBackground;
}

export interface SlideLayout {
  type: 'title' | 'title-content' | 'two-column' | 'blank' | 'custom';
  template_id?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'chart' | 'table' | 'video';
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation?: number;
  z_index: number;
  content: any;
  style?: any;
}

export interface SlideTransition {
  type: 'none' | 'fade' | 'slide' | 'zoom' | 'flip';
  duration: number;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface SlideBackground {
  type: 'solid' | 'gradient' | 'image';
  color?: string;
  gradient?: {
    colors: string[];
    angle: number;
  };
  image_url?: string;
}

export interface PresentationTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
}

export interface PresentationCollaborator {
  user_id: string;
  user: User;
  permission: 'view' | 'edit';
  added_at: string;
}

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  all_day: boolean;
  location?: string;
  calendar_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  attendees?: EventAttendee[];
  recurrence?: RecurrenceRule;
  reminders?: EventReminder[];
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private';
  color?: string;
  metadata?: Record<string, any>;
}

export interface EventAttendee {
  user_id?: string;
  email: string;
  name?: string;
  status: 'accepted' | 'declined' | 'tentative' | 'pending';
  is_organizer?: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  count?: number;
  until?: string;
  by_day?: string[];
  by_month_day?: number[];
  by_month?: number[];
}

export interface EventReminder {
  type: 'email' | 'notification' | 'popup';
  minutes_before: number;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  owner_id: string;
  is_default: boolean;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Tasks & Projects Types
// ============================================================================

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  project_id?: string;
  assignee_id?: string;
  assignee?: User;
  creator_id: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  tags?: string[];
  attachments?: string[];
  checklist?: TaskChecklistItem[];
  parent_task_id?: string;
  subtasks?: Task[];
  time_estimate?: number;
  time_spent?: number;
}

export interface TaskChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  members: ProjectMember[];
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  start_date?: string;
  end_date?: string;
  progress?: number;
  task_count?: number;
}

export interface ProjectMember {
  user_id: string;
  user: User;
  role: 'owner' | 'admin' | 'member';
  added_at: string;
}

// ============================================================================
// Email Types
// ============================================================================

export interface Email {
  id: string;
  subject: string;
  body: string;
  body_html?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  reply_to?: EmailAddress;
  date: string;
  is_read: boolean;
  is_starred: boolean;
  folder: string;
  labels?: string[];
  attachments?: EmailAttachment[];
  thread_id?: string;
  in_reply_to?: string;
  references?: string[];
}

export interface EmailAddress {
  name?: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  mime_type: string;
  url: string;
}

export interface EmailFolder {
  id: string;
  name: string;
  type: 'inbox' | 'sent' | 'drafts' | 'trash' | 'spam' | 'custom';
  unread_count: number;
  total_count: number;
}

// ============================================================================
// CRM Types
// ============================================================================

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  address?: Address;
  birthday?: string;
  notes?: string;
  tags?: string[];
  owner_id: string;
  created_at: string;
  updated_at: string;
  custom_fields?: Record<string, any>;
  social_profiles?: SocialProfile[];
  interaction_count?: number;
  last_interaction?: string;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface SocialProfile {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram' | 'other';
  url: string;
}

export interface Note {
  id: string;
  content: string;
  contact_id: string;
  author_id: string;
  author: User;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Forms Types
// ============================================================================

export interface Form {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  owner_id: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_public: boolean;
  submit_button_text?: string;
  success_message?: string;
  notification_email?: string;
  response_count?: number;
}

export interface FormField {
  id: string;
  type:
    | 'text'
    | 'textarea'
    | 'email'
    | 'number'
    | 'select'
    | 'radio'
    | 'checkbox'
    | 'date'
    | 'time'
    | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: FormFieldValidation;
  order: number;
}

export interface FormFieldValidation {
  min?: number;
  max?: number;
  pattern?: string;
  message?: string;
}

export interface FormResponse {
  id: string;
  form_id: string;
  data: Record<string, any>;
  submitted_at: string;
  submitted_by?: string;
  ip_address?: string;
}

// ============================================================================
// Bookings Types
// ============================================================================

export interface Booking {
  id: string;
  resource_id: string;
  resource: Resource;
  user_id: string;
  user: User;
  start: string;
  end: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  type: string;
  capacity?: number;
  location?: string;
  available: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
  booking_rules?: BookingRules;
}

export interface BookingRules {
  min_duration?: number;
  max_duration?: number;
  advance_booking_days?: number;
  cancel_before_hours?: number;
  available_hours?: {
    start: string;
    end: string;
  };
  available_days?: string[];
}

// ============================================================================
// Notifications Types
// ============================================================================

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  user_id: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Collaboration Types
// ============================================================================

export interface CollaborationSession {
  id: string;
  document_id: string;
  document_type: 'document' | 'spreadsheet' | 'presentation';
  users: CollaborationUser[];
  started_at: string;
  last_activity: string;
}

export interface CollaborationUser {
  user_id: string;
  user: User;
  color: string;
  cursor_position?: CursorPosition;
  selection?: SelectionRange;
  joined_at: string;
  last_seen: string;
}

export interface CursorPosition {
  x: number;
  y: number;
  line?: number;
  column?: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

export interface CollaborationChange {
  id: string;
  session_id: string;
  user_id: string;
  type: 'insert' | 'delete' | 'update' | 'format';
  position: any;
  content: any;
  timestamp: string;
}

// ============================================================================
// AI Assistant Types
// ============================================================================

export interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: {
    model?: string;
    tokens_used?: number;
    processing_time?: number;
    sources?: string[];
  };
}

export interface AIConversation {
  id: string;
  title: string;
  user_id: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
  metadata?: {
    model?: string;
    total_tokens?: number;
    context?: string;
  };
}

export interface AICommand {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters?: AICommandParameter[];
}

export interface AICommandParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: any;
}

// ============================================================================
// Analytics Types
// ============================================================================

export interface Analytics {
  storage: StorageAnalytics;
  documents: DocumentAnalytics;
  collaboration: CollaborationAnalytics;
  usage: UsageAnalytics;
}

export interface StorageAnalytics {
  total_size: number;
  used_size: number;
  file_count: number;
  folder_count: number;
  shared_files: number;
  recent_uploads: File[];
  storage_by_type: Record<string, number>;
}

export interface DocumentAnalytics {
  total_documents: number;
  documents_created_today: number;
  documents_created_this_week: number;
  documents_created_this_month: number;
  most_edited: Document[];
  recent_documents: Document[];
}

export interface CollaborationAnalytics {
  active_sessions: number;
  total_collaborators: number;
  recent_collaborations: CollaborationSession[];
}

export interface UsageAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  user_activity: UserActivity[];
  feature_usage: Record<string, number>;
  api_calls: number;
}

export interface UserActivity {
  user_id: string;
  user: User;
  actions: number;
  last_active: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, any>;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters?: Record<string, any>;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user: User;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, any>;
  created_at: string;
  ip_address?: string;
  user_agent?: string;
}
