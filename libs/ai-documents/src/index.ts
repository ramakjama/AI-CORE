/**
 * AI Documents Module
 * Enterprise Document Management (GED) System
 *
 * Features:
 * - Document lifecycle management with automatic versioning
 * - Template-based document generation with Handlebars
 * - OCR text extraction and document classification
 * - PDF manipulation (merge, split, watermark, sign, compress)
 * - Full-text search capabilities
 * - Permission and sharing management
 *
 * @packageDocumentation
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export {
  // Enums
  DocumentStatus,
  DocumentType,
  PermissionLevel,
  TemplateFieldType,
  OCRStatus,
  ClassificationCategory,

  // Document interfaces
  Document,
  DocumentVersion,
  DocumentMetadata,
  DocumentCategory,
  DocumentPermission,
  DocumentShare,
  DocumentEvent,
  DocumentEventType,

  // Template interfaces
  Template,
  TemplateField,
  TemplateVariable,
  TemplateVersion,
  FieldValidation,
  FieldOption,
  ConditionalRule,
  PageSettings,

  // OCR interfaces
  OCRResult,
  OCRPage,
  TextBlock,
  TextLine,
  TextWord,
  BoundingBox,
  LanguageDetection,
  ExtractedTable,
  TableCell,
  ExtractionResult,
  ExtractedField,
  ExtractionSchema,
  ExtractionSchemaField,
  ExtractionValidationRule,
  PostProcessingRule,
  ClassificationResult,
  AlternativeClassification,
  ExtractedEntity,
  EntityPosition,

  // Options interfaces
  UploadOptions,
  DownloadOptions,
  SearchOptions,
  ShareOptions,
  RenderOptions,
  OCROptions,
  PDFOptions,
  PDFPermissions,
  WatermarkConfig,
  SignatureData,

  // Result interfaces
  SearchResult,
  SearchFacets,
  FacetItem,
  OperationResult,
  BatchResult,
  ValidationError
} from './types';

// ============================================================================
// SERVICES
// ============================================================================

export {
  DocumentService,
  FileData,
  OperationContext as DocumentContext,
  IStorageAdapter as IDocumentStorageAdapter,
  IDocumentRepository
} from './services/document.service';

export {
  TemplateService,
  OperationContext as TemplateContext,
  ITemplateRepository,
  IPDFGenerator,
  PDFGeneratorOptions,
  TemplateValidationResult,
  RenderResult
} from './services/template.service';

export {
  OCRService,
  IStorageAdapter as IOCRStorageAdapter,
  IDocumentRepository as IOCRDocumentRepository,
  IMLClassifier,
  ClassificationFeatures,
  ClassificationPrediction
} from './services/ocr.service';

export {
  PDFService,
  IStorageAdapter as IPDFStorageAdapter,
  IDocumentRepository as IPDFDocumentRepository,
  OperationContext as PDFContext,
  MergeOptions,
  SplitOptions,
  ConversionOptions,
  PDFProcessingResult,
  PDFMetadata
} from './services/pdf.service';

// ============================================================================
// DEFAULT EXPORTS
// ============================================================================

import { DocumentService } from './services/document.service';
import { TemplateService } from './services/template.service';
import { OCRService } from './services/ocr.service';
import { PDFService } from './services/pdf.service';

export default {
  DocumentService,
  TemplateService,
  OCRService,
  PDFService
};

// ============================================================================
// MODULE FACTORY
// ============================================================================

/**
 * Configuration for creating AI Documents module instance
 */
export interface AIDocumentsConfig {
  storage: {
    upload: (tenantId: string, path: string, buffer: Buffer) => Promise<string>;
    download: (tenantId: string, path: string) => Promise<Buffer>;
    delete: (tenantId: string, path: string) => Promise<void>;
    exists: (tenantId: string, path: string) => Promise<boolean>;
    copy: (tenantId: string, sourcePath: string, targetPath: string) => Promise<string>;
    getUrl: (tenantId: string, path: string, expiresIn?: number) => Promise<string>;
  };
  pdfGenerator?: {
    generateFromHtml: (html: string, options?: Record<string, unknown>) => Promise<Buffer>;
  };
  mlClassifier?: {
    classify: (text: string, features: Record<string, unknown>) => Promise<{
      category: string;
      subcategory?: string;
      documentType: string;
      confidence: number;
      alternatives: Array<{ category: string; documentType: string; confidence: number }>;
    }>;
  };
}

/**
 * AI Documents module instance
 */
export interface AIDocumentsInstance {
  documents: DocumentService;
  templates: TemplateService;
  ocr: OCRService;
  pdf: PDFService;
}

/**
 * Create AI Documents module instance with provided configuration
 *
 * @example
 * ```typescript
 * import { createAIDocuments } from '@ai-core/ai-documents';
 *
 * const aiDocuments = createAIDocuments({
 *   storage: myStorageAdapter,
 *   pdfGenerator: myPdfGenerator,
 *   mlClassifier: myMLClassifier
 * }, {
 *   documentRepository: myDocumentRepo,
 *   templateRepository: myTemplateRepo
 * });
 *
 * // Upload a document
 * const result = await aiDocuments.documents.upload(
 *   fileData,
 *   { title: 'My Document' },
 *   folderId,
 *   context
 * );
 *
 * // Generate PDF from template
 * const pdf = await aiDocuments.templates.render(
 *   'invoice_template',
 *   invoiceData,
 *   context
 * );
 *
 * // Extract text with OCR
 * const ocrResult = await aiDocuments.ocr.extractText(documentId);
 *
 * // Merge PDFs
 * const merged = await aiDocuments.pdf.merge(documentIds, context);
 * ```
 */
export function createAIDocuments(
  config: AIDocumentsConfig,
  repositories: {
    documentRepository: IDocumentRepository;
    templateRepository: ITemplateRepository;
  }
): AIDocumentsInstance {
  const { storage, pdfGenerator, mlClassifier } = config;
  const { documentRepository, templateRepository } = repositories;

  // Create storage adapter
  const storageAdapter = {
    upload: storage.upload,
    download: storage.download,
    delete: storage.delete,
    exists: storage.exists,
    copy: storage.copy,
    getUrl: storage.getUrl
  };

  // Create PDF generator adapter
  const pdfGeneratorAdapter = pdfGenerator || {
    generateFromHtml: async (_html: string, _options?: Record<string, unknown>) => {
      throw new Error('PDF generator not configured. Please provide a pdfGenerator in config.');
    }
  };

  // Create services
  const documentService = new DocumentService(storageAdapter, documentRepository);
  const templateService = new TemplateService(templateRepository, pdfGeneratorAdapter);
  const ocrService = new OCRService(storageAdapter, documentRepository as any, mlClassifier as any);
  const pdfService = new PDFService(storageAdapter, documentRepository as any);

  return {
    documents: documentService,
    templates: templateService,
    ocr: ocrService,
    pdf: pdfService
  };
}

// ============================================================================
// VERSION
// ============================================================================

export const VERSION = '1.0.0';
