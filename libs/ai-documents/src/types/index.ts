/**
 * AI Documents Module - Types and Interfaces
 * Enterprise Document Management (GED) System
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Document lifecycle status
 */
export enum DocumentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  EXPIRED = 'expired'
}

/**
 * Document type classification
 */
export enum DocumentType {
  // General
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',

  // Business specific
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  REPORT = 'report',
  POLICY = 'policy',
  PROCEDURE = 'procedure',
  FORM = 'form',
  TEMPLATE = 'template',
  CORRESPONDENCE = 'correspondence',
  LEGAL = 'legal',
  FINANCIAL = 'financial',
  HR = 'hr',
  TECHNICAL = 'technical',

  // Other
  OTHER = 'other'
}

/**
 * Permission levels for document access
 */
export enum PermissionLevel {
  NONE = 'none',
  VIEW = 'view',
  COMMENT = 'comment',
  EDIT = 'edit',
  FULL_ACCESS = 'full_access',
  OWNER = 'owner'
}

/**
 * Template field types
 */
export enum TemplateFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  CURRENCY = 'currency',
  IMAGE = 'image',
  SIGNATURE = 'signature',
  TABLE = 'table',
  RICH_TEXT = 'rich_text'
}

/**
 * OCR processing status
 */
export enum OCRStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  PARTIAL = 'partial'
}

/**
 * Document classification categories
 */
export enum ClassificationCategory {
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  HR = 'hr',
  TECHNICAL = 'technical',
  MARKETING = 'marketing',
  OPERATIONS = 'operations',
  ADMINISTRATIVE = 'administrative',
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  UNKNOWN = 'unknown'
}

// ============================================================================
// DOCUMENT INTERFACES
// ============================================================================

/**
 * Document metadata
 */
export interface DocumentMetadata {
  title: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
  author?: string;
  language?: string;
  documentType?: DocumentType;
  category?: string;
  customFields?: Record<string, unknown>;
  expirationDate?: Date;
  retentionPeriod?: number; // days
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
}

/**
 * Document version information
 */
export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  majorVersion: number;
  minorVersion: number;
  fileSize: number;
  filePath: string;
  fileHash: string;
  mimeType: string;
  createdAt: Date;
  createdBy: string;
  comment?: string;
  changes?: string;
  isLatest: boolean;
}

/**
 * Main document interface
 */
export interface Document {
  id: string;
  tenantId: string;
  folderId?: string;
  name: string;
  originalName: string;
  extension: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  documentType: DocumentType;
  currentVersionId: string;
  currentVersionNumber: number;
  metadata: DocumentMetadata;
  permissions: DocumentPermission[];
  versions: DocumentVersion[];
  ocrData?: OCRResult;
  classification?: ClassificationResult;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  deletedAt?: Date;
  deletedBy?: string;
  lockedAt?: Date;
  lockedBy?: string;
  checksum: string;
}

/**
 * Document category for organization
 */
export interface DocumentCategory {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string;
  parentId?: string;
  path: string;
  level: number;
  sortOrder: number;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document permission assignment
 */
export interface DocumentPermission {
  id: string;
  documentId: string;
  entityType: 'user' | 'group' | 'role' | 'department';
  entityId: string;
  permissionLevel: PermissionLevel;
  canDownload: boolean;
  canPrint: boolean;
  canShare: boolean;
  canDelete: boolean;
  expiresAt?: Date;
  grantedAt: Date;
  grantedBy: string;
}

/**
 * Document share configuration
 */
export interface DocumentShare {
  id: string;
  documentId: string;
  shareType: 'link' | 'email' | 'embed';
  shareToken: string;
  shareUrl: string;
  permissionLevel: PermissionLevel;
  password?: string;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  allowedEmails?: string[];
  notifyOnAccess: boolean;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}

// ============================================================================
// TEMPLATE INTERFACES
// ============================================================================

/**
 * Template field definition
 */
export interface TemplateField {
  id: string;
  templateId: string;
  name: string;
  label: string;
  fieldType: TemplateFieldType;
  placeholder?: string;
  defaultValue?: unknown;
  isRequired: boolean;
  isReadonly: boolean;
  validation?: FieldValidation;
  options?: FieldOption[];
  conditionalDisplay?: ConditionalRule[];
  helpText?: string;
  sortOrder: number;
  groupName?: string;
  width?: number; // percentage
}

/**
 * Field validation rules
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  customValidator?: string;
}

/**
 * Field option for select/multiselect
 */
export interface FieldOption {
  value: string;
  label: string;
  isDefault?: boolean;
  sortOrder?: number;
}

/**
 * Conditional display rule
 */
export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value: unknown;
}

/**
 * Template variable for dynamic content
 */
export interface TemplateVariable {
  name: string;
  path: string;
  type: TemplateFieldType;
  format?: string;
  defaultValue?: unknown;
  transform?: 'uppercase' | 'lowercase' | 'capitalize' | 'currency' | 'date' | 'number';
}

/**
 * Template version
 */
export interface TemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  content: string;
  compiledContent?: string;
  fields: TemplateField[];
  variables: TemplateVariable[];
  createdAt: Date;
  createdBy: string;
  comment?: string;
  isActive: boolean;
}

/**
 * Main template interface
 */
export interface Template {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  outputFormat: 'pdf' | 'html' | 'docx' | 'xlsx' | 'txt';
  content: string;
  compiledContent?: string;
  fields: TemplateField[];
  variables: TemplateVariable[];
  currentVersionId: string;
  currentVersionNumber: number;
  versions: TemplateVersion[];
  headerTemplate?: string;
  footerTemplate?: string;
  styles?: string;
  pageSettings?: PageSettings;
  isActive: boolean;
  isDefault: boolean;
  usageCount: number;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

/**
 * Page settings for PDF generation
 */
export interface PageSettings {
  format: 'A4' | 'A3' | 'Letter' | 'Legal' | 'custom';
  orientation: 'portrait' | 'landscape';
  width?: number; // mm
  height?: number; // mm
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// ============================================================================
// OCR AND EXTRACTION INTERFACES
// ============================================================================

/**
 * OCR processing result
 */
export interface OCRResult {
  documentId: string;
  status: OCRStatus;
  text: string;
  confidence: number;
  language: string;
  detectedLanguages: LanguageDetection[];
  pages: OCRPage[];
  tables: ExtractedTable[];
  processingTime: number; // ms
  processedAt: Date;
  engineVersion: string;
  errors?: string[];
}

/**
 * OCR page result
 */
export interface OCRPage {
  pageNumber: number;
  text: string;
  confidence: number;
  width: number;
  height: number;
  blocks: TextBlock[];
  lines: TextLine[];
  words: TextWord[];
}

/**
 * Text block from OCR
 */
export interface TextBlock {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  blockType: 'text' | 'table' | 'figure' | 'list' | 'header' | 'footer';
}

/**
 * Text line from OCR
 */
export interface TextLine {
  id: string;
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  baseline: number;
}

/**
 * Text word from OCR
 */
export interface TextWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  isNumeric: boolean;
  isBold?: boolean;
  isItalic?: boolean;
}

/**
 * Bounding box coordinates
 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Language detection result
 */
export interface LanguageDetection {
  language: string;
  confidence: number;
  script?: string;
}

/**
 * Extracted table from document
 */
export interface ExtractedTable {
  id: string;
  pageNumber: number;
  boundingBox: BoundingBox;
  rows: number;
  columns: number;
  cells: TableCell[][];
  headers?: string[];
  confidence: number;
}

/**
 * Table cell data
 */
export interface TableCell {
  text: string;
  rowSpan: number;
  colSpan: number;
  isHeader: boolean;
  confidence: number;
  boundingBox: BoundingBox;
}

/**
 * Structured data extraction result
 */
export interface ExtractionResult {
  documentId: string;
  schemaId: string;
  extractedData: Record<string, ExtractedField>;
  confidence: number;
  validationErrors: ValidationError[];
  processedAt: Date;
}

/**
 * Extracted field data
 */
export interface ExtractedField {
  fieldName: string;
  value: unknown;
  rawValue: string;
  confidence: number;
  boundingBox?: BoundingBox;
  pageNumber?: number;
  validationStatus: 'valid' | 'invalid' | 'uncertain';
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  expectedType?: string;
  actualValue?: unknown;
}

/**
 * Document classification result
 */
export interface ClassificationResult {
  documentId: string;
  category: ClassificationCategory;
  subcategory?: string;
  documentType: DocumentType;
  confidence: number;
  alternativeClassifications: AlternativeClassification[];
  keywords: string[];
  entities: ExtractedEntity[];
  processedAt: Date;
}

/**
 * Alternative classification option
 */
export interface AlternativeClassification {
  category: ClassificationCategory;
  documentType: DocumentType;
  confidence: number;
}

/**
 * Extracted entity from document
 */
export interface ExtractedEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'email' | 'phone' | 'url' | 'custom';
  value: string;
  normalizedValue?: string;
  confidence: number;
  occurrences: number;
  positions: EntityPosition[];
}

/**
 * Entity position in document
 */
export interface EntityPosition {
  pageNumber: number;
  start: number;
  end: number;
  boundingBox?: BoundingBox;
}

// ============================================================================
// OPTIONS INTERFACES
// ============================================================================

/**
 * Document upload options
 */
export interface UploadOptions {
  overwrite?: boolean;
  createVersion?: boolean;
  versionComment?: string;
  autoClassify?: boolean;
  runOCR?: boolean;
  extractMetadata?: boolean;
  validateContent?: boolean;
  notifyUsers?: string[];
  setPermissions?: Partial<DocumentPermission>[];
  customProcessing?: string[];
}

/**
 * Document download options
 */
export interface DownloadOptions {
  versionId?: string;
  format?: 'original' | 'pdf' | 'preview';
  quality?: 'original' | 'high' | 'medium' | 'low';
  watermark?: string;
  includeMetadata?: boolean;
  trackDownload?: boolean;
  expiresIn?: number; // seconds
}

/**
 * Document search options
 */
export interface SearchOptions {
  query?: string;
  folderId?: string;
  folderPath?: string;
  includeSubfolders?: boolean;
  documentTypes?: DocumentType[];
  statuses?: DocumentStatus[];
  categories?: string[];
  tags?: string[];
  createdBy?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  updatedAfter?: Date;
  updatedBefore?: Date;
  minSize?: number;
  maxSize?: number;
  mimeTypes?: string[];
  extensions?: string[];
  hasOCR?: boolean;
  confidentiality?: string[];
  customFilters?: Record<string, unknown>;
  fullTextSearch?: boolean;
  fuzzySearch?: boolean;
  highlightMatches?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'size' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

/**
 * Share options configuration
 */
export interface ShareOptions {
  shareType: 'link' | 'email' | 'embed';
  permissionLevel: PermissionLevel;
  password?: string;
  expiresAt?: Date;
  maxDownloads?: number;
  allowedEmails?: string[];
  notifyOnAccess?: boolean;
  message?: string;
  sendEmail?: boolean;
}

/**
 * Template render options
 */
export interface RenderOptions {
  format?: 'pdf' | 'html' | 'docx';
  includeHeader?: boolean;
  includeFooter?: boolean;
  pageNumbers?: boolean;
  tableOfContents?: boolean;
  watermark?: string;
  fileName?: string;
  compress?: boolean;
}

/**
 * OCR processing options
 */
export interface OCROptions {
  languages?: string[];
  detectOrientation?: boolean;
  deskew?: boolean;
  denoise?: boolean;
  enhanceContrast?: boolean;
  recognizeTables?: boolean;
  outputFormat?: 'text' | 'hocr' | 'tsv' | 'json';
  pageSegmentationMode?: number;
  preserveInterwordSpaces?: boolean;
}

/**
 * PDF processing options
 */
export interface PDFOptions {
  quality?: 'original' | 'high' | 'medium' | 'low' | 'web';
  maxDimension?: number;
  grayscale?: boolean;
  removeMetadata?: boolean;
  linearize?: boolean; // Fast web view
  userPassword?: string;
  ownerPassword?: string;
  permissions?: PDFPermissions;
}

/**
 * PDF permission flags
 */
export interface PDFPermissions {
  printing?: 'none' | 'lowResolution' | 'highResolution';
  copying?: boolean;
  modifying?: boolean;
  annotating?: boolean;
  fillingForms?: boolean;
  contentAccessibility?: boolean;
  documentAssembly?: boolean;
}

/**
 * Watermark configuration
 */
export interface WatermarkConfig {
  text?: string;
  imagePath?: string;
  opacity?: number; // 0-1
  rotation?: number; // degrees
  position?: 'center' | 'diagonal' | 'top' | 'bottom' | 'custom';
  customPosition?: { x: number; y: number };
  fontSize?: number;
  fontColor?: string;
  repeat?: boolean;
}

/**
 * Signature data for PDF signing
 */
export interface SignatureData {
  signatureImage?: Buffer;
  signatureText?: string;
  signerName: string;
  signerEmail?: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  position?: { page: number; x: number; y: number };
  size?: { width: number; height: number };
  timestamp?: boolean;
  visible?: boolean;
}

// ============================================================================
// RESULT INTERFACES
// ============================================================================

/**
 * Search result
 */
export interface SearchResult {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets?: SearchFacets;
  highlights?: Record<string, string[]>;
}

/**
 * Search facets for filtering
 */
export interface SearchFacets {
  documentTypes: FacetItem[];
  categories: FacetItem[];
  tags: FacetItem[];
  statuses: FacetItem[];
  extensions: FacetItem[];
  createdBy: FacetItem[];
}

/**
 * Facet item
 */
export interface FacetItem {
  value: string;
  count: number;
  label?: string;
}

/**
 * Operation result
 */
export interface OperationResult<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Batch operation result
 */
export interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    id: string;
    success: boolean;
    error?: string;
  }>;
}

// ============================================================================
// EVENT INTERFACES
// ============================================================================

/**
 * Document event for audit trail
 */
export interface DocumentEvent {
  id: string;
  documentId: string;
  eventType: DocumentEventType;
  userId: string;
  userEmail?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
}

/**
 * Document event types
 */
export type DocumentEventType =
  | 'created'
  | 'viewed'
  | 'downloaded'
  | 'updated'
  | 'version_created'
  | 'moved'
  | 'copied'
  | 'deleted'
  | 'restored'
  | 'shared'
  | 'permission_changed'
  | 'locked'
  | 'unlocked'
  | 'commented'
  | 'classified'
  | 'ocr_processed'
  | 'signed'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'archived'
  | 'expired';

// ============================================================================
// EXTRACTION SCHEMA INTERFACES
// ============================================================================

/**
 * Schema for structured data extraction
 */
export interface ExtractionSchema {
  id: string;
  name: string;
  description?: string;
  documentTypes: DocumentType[];
  fields: ExtractionSchemaField[];
  validationRules?: ExtractionValidationRule[];
  postProcessing?: PostProcessingRule[];
}

/**
 * Extraction schema field
 */
export interface ExtractionSchemaField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'array' | 'object';
  required: boolean;
  patterns?: string[];
  keywords?: string[];
  position?: 'header' | 'body' | 'footer' | 'table' | 'any';
  format?: string;
  defaultValue?: unknown;
  transform?: string;
  subFields?: ExtractionSchemaField[];
}

/**
 * Extraction validation rule
 */
export interface ExtractionValidationRule {
  field: string;
  rule: 'required' | 'format' | 'range' | 'enum' | 'custom';
  params?: Record<string, unknown>;
  message: string;
}

/**
 * Post-processing rule
 */
export interface PostProcessingRule {
  field: string;
  operation: 'trim' | 'uppercase' | 'lowercase' | 'replace' | 'split' | 'join' | 'calculate' | 'custom';
  params?: Record<string, unknown>;
}
