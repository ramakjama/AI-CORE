/**
 * OCR Service
 * Optical Character Recognition and document classification using Tesseract.js
 */

import { v4 as uuidv4 } from 'uuid';
import Tesseract, { createWorker, Worker, RecognizeResult, Page } from 'tesseract.js';
import {
  OCRResult,
  OCRPage,
  OCRStatus,
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
  ClassificationResult,
  ClassificationCategory,
  DocumentType,
  AlternativeClassification,
  ExtractedEntity,
  EntityPosition,
  OCROptions,
  OperationResult,
  ValidationError
} from '../types';

/**
 * Storage adapter interface
 */
export interface IStorageAdapter {
  download(tenantId: string, path: string): Promise<Buffer>;
  getUrl(tenantId: string, path: string): Promise<string>;
}

/**
 * Document repository interface
 */
export interface IDocumentRepository {
  findById(id: string): Promise<{ tenantId: string; filePath: string; mimeType: string } | null>;
  updateOCRData(id: string, ocrData: OCRResult): Promise<void>;
  updateClassification(id: string, classification: ClassificationResult): Promise<void>;
}

/**
 * ML Classifier interface
 */
export interface IMLClassifier {
  classify(text: string, features: ClassificationFeatures): Promise<ClassificationPrediction>;
}

/**
 * Classification features
 */
export interface ClassificationFeatures {
  wordCount: number;
  lineCount: number;
  hasNumbers: boolean;
  hasDates: boolean;
  hasCurrency: boolean;
  hasEmails: boolean;
  hasUrls: boolean;
  hasPhones: boolean;
  topKeywords: string[];
  entities: ExtractedEntity[];
}

/**
 * Classification prediction
 */
export interface ClassificationPrediction {
  category: ClassificationCategory;
  subcategory?: string;
  documentType: DocumentType;
  confidence: number;
  alternatives: AlternativeClassification[];
}

/**
 * OCR Service Class
 */
export class OCRService {
  private storage: IStorageAdapter;
  private repository: IDocumentRepository;
  private classifier?: IMLClassifier;
  private workers: Map<string, Worker>;
  private workerPool: Worker[];
  private maxWorkers: number;

  constructor(
    storage: IStorageAdapter,
    repository: IDocumentRepository,
    classifier?: IMLClassifier,
    maxWorkers: number = 2
  ) {
    this.storage = storage;
    this.repository = repository;
    this.classifier = classifier;
    this.workers = new Map();
    this.workerPool = [];
    this.maxWorkers = maxWorkers;
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize OCR worker
   */
  private async getWorker(language: string = 'eng'): Promise<Worker> {
    const cacheKey = language;

    if (this.workers.has(cacheKey)) {
      return this.workers.get(cacheKey)!;
    }

    const worker = await createWorker(language);
    this.workers.set(cacheKey, worker);

    return worker;
  }

  /**
   * Terminate all workers
   */
  async terminate(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.terminate();
    }
    this.workers.clear();
  }

  // ============================================================================
  // TEXT EXTRACTION
  // ============================================================================

  /**
   * Extract text from document using OCR
   */
  async extractText(
    documentId: string,
    options: OCROptions = {}
  ): Promise<OperationResult<OCRResult>> {
    const startTime = Date.now();

    try {
      // Get document info
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      // Validate mime type
      if (!this.isSupportedFormat(document.mimeType)) {
        return {
          success: false,
          message: `Unsupported format: ${document.mimeType}. OCR supports images and PDFs.`
        };
      }

      // Download file
      const fileBuffer = await this.storage.download(document.tenantId, document.filePath);

      // Determine language
      const languages = options.languages || ['spa', 'eng'];
      const langString = languages.join('+');

      // Get worker
      const worker = await this.getWorker(langString);

      // Configure worker
      if (options.pageSegmentationMode !== undefined) {
        await worker.setParameters({
          tessedit_pageseg_mode: String(options.pageSegmentationMode)
        });
      }

      // Perform OCR
      const result = await worker.recognize(fileBuffer);

      // Process results
      const ocrResult = this.processOCRResult(documentId, result, languages, startTime);

      // Extract tables if requested
      if (options.recognizeTables) {
        ocrResult.tables = this.extractTablesFromBlocks(ocrResult.pages);
      }

      // Detect language
      const languageDetections = this.detectLanguages(ocrResult.text);
      ocrResult.detectedLanguages = languageDetections;
      ocrResult.language = languageDetections[0]?.language || languages[0];

      // Save OCR data
      await this.repository.updateOCRData(documentId, ocrResult);

      return {
        success: true,
        data: ocrResult,
        message: 'OCR extraction completed successfully'
      };
    } catch (error) {
      const errorResult: OCRResult = {
        documentId,
        status: OCRStatus.FAILED,
        text: '',
        confidence: 0,
        language: '',
        detectedLanguages: [],
        pages: [],
        tables: [],
        processingTime: Date.now() - startTime,
        processedAt: new Date(),
        engineVersion: Tesseract.version || '5.0.0',
        errors: [(error as Error).message]
      };

      return {
        success: false,
        data: errorResult,
        message: 'OCR extraction failed',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Extract structured data using schema
   */
  async extractStructured(
    documentId: string,
    schema: ExtractionSchema,
    options: OCROptions = {}
  ): Promise<OperationResult<ExtractionResult>> {
    try {
      // First, extract text
      const ocrResult = await this.extractText(documentId, options);
      if (!ocrResult.success || !ocrResult.data) {
        return { success: false, message: ocrResult.message, errors: ocrResult.errors };
      }

      const ocr = ocrResult.data;
      const extractedData: Record<string, ExtractedField> = {};
      const validationErrors: ValidationError[] = [];

      // Extract each field
      for (const field of schema.fields) {
        const extracted = this.extractField(field, ocr);

        if (extracted) {
          extractedData[field.name] = extracted;

          // Validate
          if (field.required && !extracted.value) {
            validationErrors.push({
              field: field.name,
              message: `Required field '${field.label}' not found`
            });
            extracted.validationStatus = 'invalid';
          }
        } else if (field.required) {
          validationErrors.push({
            field: field.name,
            message: `Required field '${field.label}' not found`
          });
        }
      }

      // Apply post-processing
      if (schema.postProcessing) {
        for (const rule of schema.postProcessing) {
          const field = extractedData[rule.field];
          if (field) {
            field.value = this.applyPostProcessing(field.value, rule.operation, rule.params);
          }
        }
      }

      // Calculate overall confidence
      const confidences = Object.values(extractedData).map(f => f.confidence);
      const avgConfidence = confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

      const result: ExtractionResult = {
        documentId,
        schemaId: schema.id,
        extractedData,
        confidence: avgConfidence,
        validationErrors,
        processedAt: new Date()
      };

      return {
        success: true,
        data: result,
        message: validationErrors.length > 0
          ? `Extraction completed with ${validationErrors.length} validation errors`
          : 'Extraction completed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Structured extraction failed',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // LANGUAGE DETECTION
  // ============================================================================

  /**
   * Detect document language
   */
  async detectLanguage(
    documentId: string
  ): Promise<OperationResult<LanguageDetection[]>> {
    try {
      // Get document info
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      // Download and OCR with multiple languages
      const fileBuffer = await this.storage.download(document.tenantId, document.filePath);
      const worker = await this.getWorker('eng+spa+fra+deu+ita+por');

      const result = await worker.recognize(fileBuffer);
      const text = result.data.text;

      // Detect languages
      const detections = this.detectLanguages(text);

      return {
        success: true,
        data: detections,
        message: 'Language detection completed'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Language detection failed',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // TABLE EXTRACTION
  // ============================================================================

  /**
   * Extract tables from document
   */
  async extractTables(
    documentId: string,
    options: OCROptions = {}
  ): Promise<OperationResult<ExtractedTable[]>> {
    try {
      // Extract text with table recognition
      const ocrResult = await this.extractText(documentId, {
        ...options,
        recognizeTables: true
      });

      if (!ocrResult.success || !ocrResult.data) {
        return { success: false, message: ocrResult.message, errors: ocrResult.errors };
      }

      return {
        success: true,
        data: ocrResult.data.tables,
        message: `Found ${ocrResult.data.tables.length} tables`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Table extraction failed',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // DOCUMENT CLASSIFICATION
  // ============================================================================

  /**
   * Classify document automatically using ML
   */
  async classifyDocument(
    documentId: string,
    options: OCROptions = {}
  ): Promise<OperationResult<ClassificationResult>> {
    try {
      // Extract text first
      const ocrResult = await this.extractText(documentId, options);
      if (!ocrResult.success || !ocrResult.data) {
        return { success: false, message: ocrResult.message, errors: ocrResult.errors };
      }

      const text = ocrResult.data.text;

      // Extract entities
      const entities = this.extractEntities(text, ocrResult.data.pages);

      // Extract classification features
      const features: ClassificationFeatures = {
        wordCount: text.split(/\s+/).length,
        lineCount: text.split('\n').length,
        hasNumbers: /\d+/.test(text),
        hasDates: this.hasDatePatterns(text),
        hasCurrency: this.hasCurrencyPatterns(text),
        hasEmails: /[^\s@]+@[^\s@]+\.[^\s@]+/.test(text),
        hasUrls: /https?:\/\/[^\s]+/.test(text),
        hasPhones: /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(text),
        topKeywords: this.extractKeywords(text, 20),
        entities
      };

      let classification: ClassificationResult;

      if (this.classifier) {
        // Use ML classifier
        const prediction = await this.classifier.classify(text, features);

        classification = {
          documentId,
          category: prediction.category,
          subcategory: prediction.subcategory,
          documentType: prediction.documentType,
          confidence: prediction.confidence,
          alternativeClassifications: prediction.alternatives,
          keywords: features.topKeywords,
          entities,
          processedAt: new Date()
        };
      } else {
        // Use rule-based classification
        classification = this.ruleBasedClassification(documentId, text, features, entities);
      }

      // Save classification
      await this.repository.updateClassification(documentId, classification);

      return {
        success: true,
        data: classification,
        message: `Document classified as ${classification.category}/${classification.documentType} with ${(classification.confidence * 100).toFixed(1)}% confidence`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Document classification failed',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if format is supported for OCR
   */
  private isSupportedFormat(mimeType: string): boolean {
    const supportedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'image/webp',
      'application/pdf'
    ];
    return supportedTypes.includes(mimeType);
  }

  /**
   * Process Tesseract OCR result
   */
  private processOCRResult(
    documentId: string,
    result: RecognizeResult,
    languages: string[],
    startTime: number
  ): OCRResult {
    const data = result.data;
    const pages: OCRPage[] = [];

    // Process page data
    const pageData = data as unknown as Page;

    const blocks: TextBlock[] = (pageData.blocks || []).map((block: Tesseract.Block, idx: number) => ({
      id: `block_${idx}`,
      text: block.text,
      confidence: block.confidence,
      boundingBox: this.convertBbox(block.bbox),
      blockType: 'text' as const
    }));

    const lines: TextLine[] = (pageData.lines || []).map((line: Tesseract.Line, idx: number) => ({
      id: `line_${idx}`,
      text: line.text,
      confidence: line.confidence,
      boundingBox: this.convertBbox(line.bbox),
      baseline: line.baseline?.y0 || 0
    }));

    const words: TextWord[] = (pageData.words || []).map((word: Tesseract.Word) => ({
      text: word.text,
      confidence: word.confidence,
      boundingBox: this.convertBbox(word.bbox),
      isNumeric: /^\d+$/.test(word.text),
      isBold: word.is_bold,
      isItalic: word.is_italic
    }));

    pages.push({
      pageNumber: 1,
      text: data.text,
      confidence: data.confidence,
      width: pageData.blocks?.[0]?.bbox?.x1 || 0,
      height: pageData.blocks?.[0]?.bbox?.y1 || 0,
      blocks,
      lines,
      words
    });

    return {
      documentId,
      status: OCRStatus.COMPLETED,
      text: data.text,
      confidence: data.confidence,
      language: languages[0],
      detectedLanguages: [],
      pages,
      tables: [],
      processingTime: Date.now() - startTime,
      processedAt: new Date(),
      engineVersion: Tesseract.version || '5.0.0'
    };
  }

  /**
   * Convert Tesseract bbox to BoundingBox
   */
  private convertBbox(bbox: Tesseract.Bbox): BoundingBox {
    return {
      x: bbox.x0,
      y: bbox.y0,
      width: bbox.x1 - bbox.x0,
      height: bbox.y1 - bbox.y0
    };
  }

  /**
   * Extract tables from text blocks
   */
  private extractTablesFromBlocks(pages: OCRPage[]): ExtractedTable[] {
    const tables: ExtractedTable[] = [];

    for (const page of pages) {
      // Simple table detection based on aligned columns
      const potentialTables = this.detectTableRegions(page.lines);

      for (const tableLines of potentialTables) {
        const table = this.parseTableFromLines(tableLines, page.pageNumber);
        if (table && table.rows >= 2 && table.columns >= 2) {
          tables.push(table);
        }
      }
    }

    return tables;
  }

  /**
   * Detect table regions in lines
   */
  private detectTableRegions(lines: TextLine[]): TextLine[][] {
    const tables: TextLine[][] = [];
    let currentTable: TextLine[] = [];
    let lastY = -1;
    const lineSpacingThreshold = 30;

    for (const line of lines) {
      // Check if line has multiple "columns" (tab or multiple spaces separated)
      const hasMultipleColumns = /\t|  {2,}/.test(line.text);

      if (hasMultipleColumns) {
        if (lastY < 0 || line.boundingBox.y - lastY < lineSpacingThreshold) {
          currentTable.push(line);
        } else {
          if (currentTable.length >= 2) {
            tables.push([...currentTable]);
          }
          currentTable = [line];
        }
        lastY = line.boundingBox.y;
      } else {
        if (currentTable.length >= 2) {
          tables.push([...currentTable]);
        }
        currentTable = [];
        lastY = -1;
      }
    }

    if (currentTable.length >= 2) {
      tables.push(currentTable);
    }

    return tables;
  }

  /**
   * Parse table from lines
   */
  private parseTableFromLines(lines: TextLine[], pageNumber: number): ExtractedTable | null {
    if (lines.length < 2) return null;

    const cells: TableCell[][] = [];
    let maxColumns = 0;

    for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
      const line = lines[rowIdx];
      const columns = line.text.split(/\t|  {2,}/).filter(c => c.trim());

      maxColumns = Math.max(maxColumns, columns.length);

      const rowCells: TableCell[] = columns.map((text, colIdx) => ({
        text: text.trim(),
        rowSpan: 1,
        colSpan: 1,
        isHeader: rowIdx === 0,
        confidence: line.confidence,
        boundingBox: {
          x: line.boundingBox.x + (colIdx * line.boundingBox.width / columns.length),
          y: line.boundingBox.y,
          width: line.boundingBox.width / columns.length,
          height: line.boundingBox.height
        }
      }));

      cells.push(rowCells);
    }

    // Calculate bounding box
    const firstLine = lines[0];
    const lastLine = lines[lines.length - 1];

    return {
      id: uuidv4(),
      pageNumber,
      boundingBox: {
        x: firstLine.boundingBox.x,
        y: firstLine.boundingBox.y,
        width: firstLine.boundingBox.width,
        height: lastLine.boundingBox.y + lastLine.boundingBox.height - firstLine.boundingBox.y
      },
      rows: cells.length,
      columns: maxColumns,
      cells,
      headers: cells[0]?.map(c => c.text),
      confidence: lines.reduce((sum, l) => sum + l.confidence, 0) / lines.length
    };
  }

  /**
   * Detect languages from text
   */
  private detectLanguages(text: string): LanguageDetection[] {
    const detections: LanguageDetection[] = [];

    // Simple language detection based on character patterns and common words
    const languagePatterns: Record<string, { patterns: RegExp[]; script: string }> = {
      spa: {
        patterns: [/\b(el|la|los|las|de|en|que|y|es|un|una|por|con|para)\b/gi, /[ñáéíóú]/g],
        script: 'Latin'
      },
      eng: {
        patterns: [/\b(the|is|are|was|were|have|has|had|be|been|will|would|could|should)\b/gi],
        script: 'Latin'
      },
      fra: {
        patterns: [/\b(le|la|les|de|des|un|une|et|est|que|pour|avec|dans)\b/gi, /[àâæçéèêëïîôùûüÿœ]/g],
        script: 'Latin'
      },
      deu: {
        patterns: [/\b(der|die|das|und|ist|ein|eine|für|mit|auf|von)\b/gi, /[äöüß]/g],
        script: 'Latin'
      },
      por: {
        patterns: [/\b(o|a|os|as|de|do|da|em|que|e|um|uma|para|com)\b/gi, /[ãõçáàâéêíóôú]/g],
        script: 'Latin'
      }
    };

    const scores: Record<string, number> = {};

    for (const [lang, config] of Object.entries(languagePatterns)) {
      let score = 0;
      for (const pattern of config.patterns) {
        const matches = text.match(pattern);
        score += matches?.length || 0;
      }
      scores[lang] = score;
    }

    // Normalize scores
    const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

    for (const [lang, score] of Object.entries(scores)) {
      if (score > 0) {
        detections.push({
          language: lang,
          confidence: score / total,
          script: languagePatterns[lang].script
        });
      }
    }

    // Sort by confidence
    return detections.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extract field from OCR result
   */
  private extractField(
    fieldSchema: ExtractionSchemaField,
    ocr: OCRResult
  ): ExtractedField | null {
    const text = ocr.text;

    // Try patterns first
    if (fieldSchema.patterns) {
      for (const patternStr of fieldSchema.patterns) {
        const pattern = new RegExp(patternStr, 'i');
        const match = text.match(pattern);

        if (match) {
          const value = this.parseFieldValue(match[1] || match[0], fieldSchema.type);

          return {
            fieldName: fieldSchema.name,
            value,
            rawValue: match[0],
            confidence: 0.8,
            validationStatus: 'valid'
          };
        }
      }
    }

    // Try keyword-based extraction
    if (fieldSchema.keywords) {
      for (const keyword of fieldSchema.keywords) {
        const pattern = new RegExp(`${keyword}[:\\s]+([^\\n]+)`, 'i');
        const match = text.match(pattern);

        if (match) {
          const value = this.parseFieldValue(match[1].trim(), fieldSchema.type);

          return {
            fieldName: fieldSchema.name,
            value,
            rawValue: match[1],
            confidence: 0.7,
            validationStatus: 'valid'
          };
        }
      }
    }

    return null;
  }

  /**
   * Parse field value to correct type
   */
  private parseFieldValue(
    rawValue: string,
    type: string
  ): unknown {
    switch (type) {
      case 'number':
        return parseFloat(rawValue.replace(/[^\d.,]/g, '').replace(',', '.'));

      case 'date':
        return new Date(rawValue);

      case 'boolean':
        return /^(yes|si|true|1|x)$/i.test(rawValue);

      case 'currency':
        const numStr = rawValue.replace(/[^\d.,]/g, '').replace(',', '.');
        return parseFloat(numStr);

      case 'array':
        return rawValue.split(/[,;]/).map(s => s.trim());

      default:
        return rawValue;
    }
  }

  /**
   * Apply post-processing to field value
   */
  private applyPostProcessing(
    value: unknown,
    operation: string,
    params?: Record<string, unknown>
  ): unknown {
    if (typeof value !== 'string') return value;

    switch (operation) {
      case 'trim':
        return value.trim();

      case 'uppercase':
        return value.toUpperCase();

      case 'lowercase':
        return value.toLowerCase();

      case 'replace':
        if (params?.pattern && params?.replacement !== undefined) {
          const pattern = new RegExp(params.pattern as string, 'g');
          return value.replace(pattern, params.replacement as string);
        }
        return value;

      case 'split':
        const delimiter = (params?.delimiter as string) || ',';
        return value.split(delimiter).map(s => s.trim());

      case 'join':
        if (Array.isArray(value)) {
          const separator = (params?.separator as string) || ', ';
          return value.join(separator);
        }
        return value;

      default:
        return value;
    }
  }

  /**
   * Check if text has date patterns
   */
  private hasDatePatterns(text: string): boolean {
    const datePatterns = [
      /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/,
      /\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}/,
      /\d{1,2}\s+(de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i,
      /\d{1,2}\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i
    ];

    return datePatterns.some(p => p.test(text));
  }

  /**
   * Check if text has currency patterns
   */
  private hasCurrencyPatterns(text: string): boolean {
    const currencyPatterns = [
      /[\$\€\£]\s*\d+[\.,]?\d*/,
      /\d+[\.,]?\d*\s*[\$\€\£]/,
      /\d+[\.,]\d{2}\s*(EUR|USD|GBP|euros?|dollars?)/i
    ];

    return currencyPatterns.some(p => p.test(text));
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string, limit: number = 20): string[] {
    // Remove common stop words
    const stopWords = new Set([
      'el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'que', 'y', 'a', 'por', 'con', 'para',
      'es', 'al', 'lo', 'como', 'su', 'se', 'no', 'si', 'le', 'o', 'más', 'pero',
      'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
      'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    ]);

    // Extract words
    const words = text.toLowerCase()
      .replace(/[^\wáéíóúñü\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopWords.has(w));

    // Count frequency
    const frequency: Record<string, number> = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }

    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word]) => word);
  }

  /**
   * Extract entities from text
   */
  private extractEntities(text: string, pages: OCRPage[]): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Email pattern
    const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    const emails = text.match(emailPattern) || [];
    for (const email of emails) {
      this.addEntity(entities, 'email', email, text);
    }

    // Phone pattern
    const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
    const phones = text.match(phonePattern) || [];
    for (const phone of phones) {
      if (phone.replace(/\D/g, '').length >= 9) {
        this.addEntity(entities, 'phone', phone.trim(), text);
      }
    }

    // URL pattern
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern) || [];
    for (const url of urls) {
      this.addEntity(entities, 'url', url, text);
    }

    // Money pattern
    const moneyPattern = /[\$\€\£]\s*[\d,]+\.?\d*|\d+[\.,]\d{2}\s*(EUR|USD|GBP|euros?)/gi;
    const money = text.match(moneyPattern) || [];
    for (const m of money) {
      this.addEntity(entities, 'money', m, text);
    }

    // Date pattern
    const datePattern = /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/g;
    const dates = text.match(datePattern) || [];
    for (const date of dates) {
      this.addEntity(entities, 'date', date, text);
    }

    return entities;
  }

  /**
   * Add entity to list with positions
   */
  private addEntity(
    entities: ExtractedEntity[],
    type: ExtractedEntity['type'],
    value: string,
    text: string
  ): void {
    const existing = entities.find(e => e.type === type && e.value === value);

    if (existing) {
      existing.occurrences++;
    } else {
      const positions: EntityPosition[] = [];
      let pos = 0;

      while ((pos = text.indexOf(value, pos)) !== -1) {
        positions.push({
          pageNumber: 1,
          start: pos,
          end: pos + value.length
        });
        pos += value.length;
      }

      entities.push({
        type,
        value,
        normalizedValue: this.normalizeEntityValue(type, value),
        confidence: 0.9,
        occurrences: 1,
        positions
      });
    }
  }

  /**
   * Normalize entity value
   */
  private normalizeEntityValue(type: string, value: string): string {
    switch (type) {
      case 'email':
        return value.toLowerCase();
      case 'phone':
        return value.replace(/\D/g, '');
      case 'url':
        return value.toLowerCase();
      default:
        return value;
    }
  }

  /**
   * Rule-based document classification
   */
  private ruleBasedClassification(
    documentId: string,
    text: string,
    features: ClassificationFeatures,
    entities: ExtractedEntity[]
  ): ClassificationResult {
    const textLower = text.toLowerCase();
    const alternatives: AlternativeClassification[] = [];

    // Invoice detection
    const invoiceKeywords = ['factura', 'invoice', 'nif', 'cif', 'iva', 'total', 'subtotal', 'importe'];
    const invoiceScore = invoiceKeywords.filter(k => textLower.includes(k)).length / invoiceKeywords.length;

    if (invoiceScore > 0.3 && features.hasCurrency) {
      return {
        documentId,
        category: ClassificationCategory.FINANCIAL,
        subcategory: 'invoicing',
        documentType: DocumentType.INVOICE,
        confidence: Math.min(0.5 + invoiceScore, 0.95),
        alternativeClassifications: alternatives,
        keywords: features.topKeywords,
        entities,
        processedAt: new Date()
      };
    }

    // Contract detection
    const contractKeywords = ['contrato', 'contract', 'acuerdo', 'agreement', 'partes', 'parties', 'cláusula', 'clause'];
    const contractScore = contractKeywords.filter(k => textLower.includes(k)).length / contractKeywords.length;

    if (contractScore > 0.3) {
      return {
        documentId,
        category: ClassificationCategory.LEGAL,
        subcategory: 'contracts',
        documentType: DocumentType.CONTRACT,
        confidence: Math.min(0.5 + contractScore, 0.95),
        alternativeClassifications: alternatives,
        keywords: features.topKeywords,
        entities,
        processedAt: new Date()
      };
    }

    // HR detection
    const hrKeywords = ['nómina', 'payroll', 'salario', 'salary', 'empleado', 'employee', 'curriculum', 'resume', 'cv'];
    const hrScore = hrKeywords.filter(k => textLower.includes(k)).length / hrKeywords.length;

    if (hrScore > 0.2) {
      return {
        documentId,
        category: ClassificationCategory.HR,
        subcategory: hrKeywords.some(k => ['curriculum', 'resume', 'cv'].includes(k) && textLower.includes(k)) ? 'recruitment' : 'payroll',
        documentType: DocumentType.HR,
        confidence: Math.min(0.5 + hrScore, 0.90),
        alternativeClassifications: alternatives,
        keywords: features.topKeywords,
        entities,
        processedAt: new Date()
      };
    }

    // Report detection
    const reportKeywords = ['informe', 'report', 'análisis', 'analysis', 'resumen', 'summary', 'conclusiones', 'conclusions'];
    const reportScore = reportKeywords.filter(k => textLower.includes(k)).length / reportKeywords.length;

    if (reportScore > 0.2) {
      return {
        documentId,
        category: ClassificationCategory.OPERATIONS,
        subcategory: 'reports',
        documentType: DocumentType.REPORT,
        confidence: Math.min(0.5 + reportScore, 0.85),
        alternativeClassifications: alternatives,
        keywords: features.topKeywords,
        entities,
        processedAt: new Date()
      };
    }

    // Default classification
    return {
      documentId,
      category: ClassificationCategory.UNKNOWN,
      documentType: DocumentType.DOCUMENT,
      confidence: 0.3,
      alternativeClassifications: [
        { category: ClassificationCategory.ADMINISTRATIVE, documentType: DocumentType.DOCUMENT, confidence: 0.25 },
        { category: ClassificationCategory.OPERATIONS, documentType: DocumentType.DOCUMENT, confidence: 0.20 }
      ],
      keywords: features.topKeywords,
      entities,
      processedAt: new Date()
    };
  }
}

export default OCRService;
