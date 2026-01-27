/**
 * PDF Service
 * PDF manipulation, merging, splitting, watermarking, signing, and conversion
 */

import { v4 as uuidv4 } from 'uuid';
import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
  degrees,
  PageSizes,
  PDFImage
} from 'pdf-lib';
import {
  Document,
  DocumentVersion,
  PDFOptions,
  PDFPermissions,
  WatermarkConfig,
  SignatureData,
  OperationResult,
  BatchResult
} from '../types';

/**
 * Storage adapter interface
 */
export interface IStorageAdapter {
  download(tenantId: string, path: string): Promise<Buffer>;
  upload(tenantId: string, path: string, buffer: Buffer): Promise<string>;
}

/**
 * Document repository interface
 */
export interface IDocumentRepository {
  findById(id: string): Promise<Document | null>;
  getLatestVersion(documentId: string): Promise<DocumentVersion | null>;
  createVersion(version: DocumentVersion): Promise<DocumentVersion>;
  update(id: string, data: Partial<Document>): Promise<Document>;
}

/**
 * Context interface for operations
 */
export interface OperationContext {
  tenantId: string;
  userId: string;
  userEmail?: string;
}

/**
 * Merge options
 */
export interface MergeOptions {
  addTableOfContents?: boolean;
  addPageNumbers?: boolean;
  pageNumberFormat?: string;
  outputName?: string;
}

/**
 * Split options
 */
export interface SplitOptions {
  pages?: number[] | string; // e.g., [1,2,5] or "1-3,5,7-10"
  everyNPages?: number;
  maxPagesPerDocument?: number;
  outputNamePattern?: string;
}

/**
 * Conversion options
 */
export interface ConversionOptions {
  quality?: 'original' | 'high' | 'medium' | 'low';
  dpi?: number;
  grayscale?: boolean;
  optimize?: boolean;
}

/**
 * PDF processing result
 */
export interface PDFProcessingResult {
  documentId?: string;
  buffer: Buffer;
  pageCount: number;
  fileSize: number;
  metadata?: PDFMetadata;
}

/**
 * PDF metadata
 */
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

/**
 * PDF Service Class
 */
export class PDFService {
  private storage: IStorageAdapter;
  private repository: IDocumentRepository;

  constructor(storage: IStorageAdapter, repository: IDocumentRepository) {
    this.storage = storage;
    this.repository = repository;
  }

  // ============================================================================
  // MERGE OPERATIONS
  // ============================================================================

  /**
   * Merge multiple PDFs into one
   */
  async merge(
    documentIds: string[],
    context: OperationContext,
    options: MergeOptions = {}
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      if (documentIds.length < 2) {
        return { success: false, message: 'At least 2 documents are required for merging' };
      }

      // Create new PDF
      const mergedPdf = await PDFDocument.create();

      // Track page origins for table of contents
      const pageOrigins: Array<{ title: string; startPage: number }> = [];
      let currentPage = 1;

      // Process each document
      for (const docId of documentIds) {
        const document = await this.repository.findById(docId);
        if (!document) {
          return { success: false, message: `Document ${docId} not found` };
        }

        if (document.mimeType !== 'application/pdf') {
          return { success: false, message: `Document ${docId} is not a PDF` };
        }

        const version = await this.repository.getLatestVersion(docId);
        if (!version) {
          return { success: false, message: `No version found for document ${docId}` };
        }

        // Download and load PDF
        const buffer = await this.storage.download(document.tenantId, version.filePath);
        const pdf = await PDFDocument.load(buffer);

        // Track origin
        pageOrigins.push({
          title: document.name,
          startPage: currentPage
        });

        // Copy pages
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(page => {
          mergedPdf.addPage(page);
          currentPage++;
        });
      }

      // Add page numbers if requested
      if (options.addPageNumbers) {
        await this.addPageNumbers(mergedPdf, options.pageNumberFormat);
      }

      // Save merged PDF
      const pdfBytes = await mergedPdf.save();
      const buffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          buffer,
          pageCount: mergedPdf.getPageCount(),
          fileSize: buffer.length,
          metadata: {
            title: options.outputName || 'Merged Document',
            creationDate: new Date()
          }
        },
        message: `Successfully merged ${documentIds.length} documents`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to merge documents',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // SPLIT OPERATIONS
  // ============================================================================

  /**
   * Split a PDF into multiple documents
   */
  async split(
    documentId: string,
    context: OperationContext,
    options: SplitOptions = {}
  ): Promise<OperationResult<PDFProcessingResult[]>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.mimeType !== 'application/pdf') {
        return { success: false, message: 'Document is not a PDF' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      // Download and load PDF
      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);
      const totalPages = pdf.getPageCount();

      // Parse page ranges
      const pageGroups = this.parsePageRanges(options, totalPages);

      const results: PDFProcessingResult[] = [];

      for (let i = 0; i < pageGroups.length; i++) {
        const pageRange = pageGroups[i];
        const newPdf = await PDFDocument.create();

        // Copy specified pages
        const pageIndices = pageRange.map(p => p - 1); // Convert to 0-indexed
        const pages = await newPdf.copyPages(pdf, pageIndices);
        pages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const resultBuffer = Buffer.from(pdfBytes);

        results.push({
          buffer: resultBuffer,
          pageCount: newPdf.getPageCount(),
          fileSize: resultBuffer.length,
          metadata: {
            title: `${document.name} - Part ${i + 1}`,
            creationDate: new Date()
          }
        });
      }

      return {
        success: true,
        data: results,
        message: `Successfully split document into ${results.length} parts`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to split document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // WATERMARK OPERATIONS
  // ============================================================================

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    documentId: string,
    config: WatermarkConfig,
    context: OperationContext
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.mimeType !== 'application/pdf') {
        return { success: false, message: 'Document is not a PDF' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      // Download and load PDF
      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);
      const pages = pdf.getPages();

      // Get font
      const font = await pdf.embedFont(StandardFonts.Helvetica);

      // Parse color
      const color = this.parseColor(config.fontColor || '#808080');
      const opacity = config.opacity ?? 0.3;

      for (const page of pages) {
        const { width, height } = page.getSize();

        if (config.text) {
          const fontSize = config.fontSize || 48;
          const textWidth = font.widthOfTextAtSize(config.text, fontSize);
          const textHeight = fontSize;

          // Calculate position
          let x: number, y: number;

          if (config.position === 'custom' && config.customPosition) {
            x = config.customPosition.x;
            y = config.customPosition.y;
          } else {
            switch (config.position) {
              case 'top':
                x = (width - textWidth) / 2;
                y = height - 50 - textHeight;
                break;
              case 'bottom':
                x = (width - textWidth) / 2;
                y = 50;
                break;
              case 'diagonal':
                x = (width - textWidth) / 2;
                y = (height - textHeight) / 2;
                break;
              case 'center':
              default:
                x = (width - textWidth) / 2;
                y = (height - textHeight) / 2;
            }
          }

          // Calculate rotation
          const rotation = config.rotation ??
            (config.position === 'diagonal' ? 45 : 0);

          // Draw watermark
          if (config.repeat) {
            // Repeat watermark across page
            const spacingX = textWidth + 100;
            const spacingY = textHeight + 100;

            for (let yi = 0; yi < height + spacingY; yi += spacingY) {
              for (let xi = 0; xi < width + spacingX; xi += spacingX) {
                page.drawText(config.text, {
                  x: xi,
                  y: yi,
                  size: fontSize,
                  font,
                  color: rgb(color.r, color.g, color.b),
                  opacity,
                  rotate: degrees(rotation)
                });
              }
            }
          } else {
            page.drawText(config.text, {
              x,
              y,
              size: fontSize,
              font,
              color: rgb(color.r, color.g, color.b),
              opacity,
              rotate: degrees(rotation)
            });
          }
        }

        // Add image watermark if provided
        if (config.imagePath) {
          // Note: Image watermark would require loading the image first
          // This would need the image buffer to be passed or loaded from storage
        }
      }

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          documentId,
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length
        },
        message: 'Watermark added successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to add watermark',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // SIGNING OPERATIONS
  // ============================================================================

  /**
   * Add signature to PDF
   */
  async sign(
    documentId: string,
    signatureData: SignatureData,
    context: OperationContext
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.mimeType !== 'application/pdf') {
        return { success: false, message: 'Document is not a PDF' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      // Download and load PDF
      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);

      // Get page for signature
      const pageIndex = (signatureData.position?.page || 1) - 1;
      const pages = pdf.getPages();

      if (pageIndex < 0 || pageIndex >= pages.length) {
        return { success: false, message: 'Invalid page number for signature' };
      }

      const page = pages[pageIndex];
      const { width, height } = page.getSize();

      // Default position (bottom right)
      const sigWidth = signatureData.size?.width || 200;
      const sigHeight = signatureData.size?.height || 80;
      const x = signatureData.position?.x ?? (width - sigWidth - 50);
      const y = signatureData.position?.y ?? 50;

      // Draw signature box
      page.drawRectangle({
        x,
        y,
        width: sigWidth,
        height: sigHeight,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
        color: rgb(1, 1, 1),
        opacity: 0.9
      });

      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

      // Add signature image if provided
      if (signatureData.signatureImage) {
        try {
          let image: PDFImage;

          // Try to detect image type and embed
          const imageBuffer = signatureData.signatureImage;
          const isPng = imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50;

          if (isPng) {
            image = await pdf.embedPng(imageBuffer);
          } else {
            image = await pdf.embedJpg(imageBuffer);
          }

          const scaleFactor = Math.min(
            (sigWidth - 20) / image.width,
            (sigHeight - 30) / image.height
          );

          page.drawImage(image, {
            x: x + 10,
            y: y + 25,
            width: image.width * scaleFactor,
            height: image.height * scaleFactor
          });
        } catch {
          // If image embedding fails, use text signature
          if (signatureData.signatureText) {
            page.drawText(signatureData.signatureText, {
              x: x + 10,
              y: y + sigHeight - 40,
              size: 16,
              font: boldFont,
              color: rgb(0, 0, 0.5)
            });
          }
        }
      } else if (signatureData.signatureText) {
        page.drawText(signatureData.signatureText, {
          x: x + 10,
          y: y + sigHeight - 40,
          size: 16,
          font: boldFont,
          color: rgb(0, 0, 0.5)
        });
      }

      // Add signer name
      page.drawText(`Firmado por: ${signatureData.signerName}`, {
        x: x + 5,
        y: y + 20,
        size: 8,
        font,
        color: rgb(0.3, 0.3, 0.3)
      });

      // Add timestamp
      if (signatureData.timestamp !== false) {
        const timestamp = new Date().toLocaleString('es-ES');
        page.drawText(`Fecha: ${timestamp}`, {
          x: x + 5,
          y: y + 8,
          size: 8,
          font,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      // Add reason if provided
      if (signatureData.reason) {
        page.drawText(`Motivo: ${signatureData.reason}`, {
          x: x + sigWidth / 2,
          y: y + 20,
          size: 8,
          font,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      // Add location if provided
      if (signatureData.location) {
        page.drawText(`Lugar: ${signatureData.location}`, {
          x: x + sigWidth / 2,
          y: y + 8,
          size: 8,
          font,
          color: rgb(0.3, 0.3, 0.3)
        });
      }

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          documentId,
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length
        },
        message: 'Document signed successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to sign document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // FLATTEN OPERATIONS
  // ============================================================================

  /**
   * Flatten PDF (merge form fields, annotations into static content)
   */
  async flatten(
    documentId: string,
    context: OperationContext
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.mimeType !== 'application/pdf') {
        return { success: false, message: 'Document is not a PDF' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      // Download and load PDF
      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);

      // Get form if exists
      const form = pdf.getForm();

      // Flatten all form fields
      try {
        form.flatten();
      } catch {
        // No form fields to flatten
      }

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          documentId,
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length
        },
        message: 'Document flattened successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to flatten document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // COMPRESS OPERATIONS
  // ============================================================================

  /**
   * Compress PDF to reduce file size
   */
  async compress(
    documentId: string,
    context: OperationContext,
    options: PDFOptions = {}
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      if (document.mimeType !== 'application/pdf') {
        return { success: false, message: 'Document is not a PDF' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      // Download and load PDF
      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const originalSize = buffer.length;

      const pdf = await PDFDocument.load(buffer, {
        updateMetadata: false
      });

      // Remove metadata if requested
      if (options.removeMetadata) {
        pdf.setTitle('');
        pdf.setAuthor('');
        pdf.setSubject('');
        pdf.setKeywords([]);
        pdf.setProducer('');
        pdf.setCreator('');
      }

      // Save with compression options
      const pdfBytes = await pdf.save({
        useObjectStreams: true,
        addDefaultPage: false,
        objectsPerTick: 50
      });

      const resultBuffer = Buffer.from(pdfBytes);
      const compressionRatio = ((originalSize - resultBuffer.length) / originalSize * 100).toFixed(1);

      return {
        success: true,
        data: {
          documentId,
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length
        },
        message: `Document compressed by ${compressionRatio}% (${this.formatFileSize(originalSize)} -> ${this.formatFileSize(resultBuffer.length)})`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to compress document',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // CONVERSION OPERATIONS
  // ============================================================================

  /**
   * Convert document to PDF
   */
  async convertToPdf(
    documentId: string,
    context: OperationContext,
    options: ConversionOptions = {}
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      // Already a PDF
      if (document.mimeType === 'application/pdf') {
        const version = await this.repository.getLatestVersion(documentId);
        if (!version) {
          return { success: false, message: 'No version found' };
        }

        const buffer = await this.storage.download(document.tenantId, version.filePath);
        const pdf = await PDFDocument.load(buffer);

        return {
          success: true,
          data: {
            documentId,
            buffer,
            pageCount: pdf.getPageCount(),
            fileSize: buffer.length
          },
          message: 'Document is already a PDF'
        };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      const buffer = await this.storage.download(document.tenantId, version.filePath);

      // Handle image conversion
      if (document.mimeType.startsWith('image/')) {
        return this.convertImageToPdf(buffer, document.mimeType, document.name, options);
      }

      // Handle text files
      if (document.mimeType === 'text/plain') {
        return this.convertTextToPdf(buffer, document.name);
      }

      // For Office documents, we would need external tools like LibreOffice
      // This is a placeholder for those conversions
      return {
        success: false,
        message: `Conversion from ${document.mimeType} is not yet supported. Supported formats: images, text files.`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to convert document',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Convert image to PDF
   */
  private async convertImageToPdf(
    imageBuffer: Buffer,
    mimeType: string,
    name: string,
    options: ConversionOptions
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const pdf = await PDFDocument.create();

      let image: PDFImage;

      if (mimeType === 'image/png') {
        image = await pdf.embedPng(imageBuffer);
      } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
        image = await pdf.embedJpg(imageBuffer);
      } else {
        return {
          success: false,
          message: `Image format ${mimeType} not supported. Use PNG or JPEG.`
        };
      }

      // Calculate page size based on image
      const imageWidth = image.width;
      const imageHeight = image.height;

      // Scale to fit A4 while maintaining aspect ratio
      const maxWidth = PageSizes.A4[0] - 40; // margins
      const maxHeight = PageSizes.A4[1] - 40;

      let scale = 1;
      if (imageWidth > maxWidth || imageHeight > maxHeight) {
        scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
      }

      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;

      // Create page
      const page = pdf.addPage(PageSizes.A4);
      const { width, height } = page.getSize();

      // Center image on page
      const x = (width - scaledWidth) / 2;
      const y = (height - scaledHeight) / 2;

      // Apply grayscale if requested (note: pdf-lib doesn't support this directly)
      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight
      });

      // Set metadata
      pdf.setTitle(name);
      pdf.setCreationDate(new Date());

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          buffer: resultBuffer,
          pageCount: 1,
          fileSize: resultBuffer.length,
          metadata: {
            title: name,
            creationDate: new Date()
          }
        },
        message: 'Image converted to PDF successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to convert image to PDF',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Convert text file to PDF
   */
  private async convertTextToPdf(
    textBuffer: Buffer,
    name: string
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const text = textBuffer.toString('utf-8');
      const lines = text.split('\n');

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Courier);
      const fontSize = 10;
      const lineHeight = fontSize * 1.5;
      const margin = 50;

      let page = pdf.addPage(PageSizes.A4);
      let { width, height } = page.getSize();
      let y = height - margin;
      const maxWidth = width - margin * 2;
      const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));

      for (const line of lines) {
        // Word wrap long lines
        const wrappedLines = this.wrapText(line, charsPerLine);

        for (const wrappedLine of wrappedLines) {
          if (y < margin + lineHeight) {
            // Add new page
            page = pdf.addPage(PageSizes.A4);
            ({ height } = page.getSize());
            y = height - margin;
          }

          page.drawText(wrappedLine, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0)
          });

          y -= lineHeight;
        }
      }

      // Set metadata
      pdf.setTitle(name);
      pdf.setCreationDate(new Date());

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length,
          metadata: {
            title: name,
            creationDate: new Date()
          }
        },
        message: 'Text file converted to PDF successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to convert text to PDF',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // PAGE OPERATIONS
  // ============================================================================

  /**
   * Extract specific pages from PDF
   */
  async extractPages(
    documentId: string,
    pages: number[],
    context: OperationContext
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);
      const totalPages = pdf.getPageCount();

      // Validate page numbers
      const invalidPages = pages.filter(p => p < 1 || p > totalPages);
      if (invalidPages.length > 0) {
        return {
          success: false,
          message: `Invalid page numbers: ${invalidPages.join(', ')}. Document has ${totalPages} pages.`
        };
      }

      // Create new PDF with selected pages
      const newPdf = await PDFDocument.create();
      const pageIndices = pages.map(p => p - 1);
      const copiedPages = await newPdf.copyPages(pdf, pageIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          buffer: resultBuffer,
          pageCount: newPdf.getPageCount(),
          fileSize: resultBuffer.length
        },
        message: `Extracted ${pages.length} pages`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to extract pages',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Rotate pages in PDF
   */
  async rotatePages(
    documentId: string,
    pageRotations: Array<{ page: number; degrees: 0 | 90 | 180 | 270 }>,
    context: OperationContext
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);
      const pages = pdf.getPages();

      for (const { page, degrees: deg } of pageRotations) {
        if (page < 1 || page > pages.length) continue;

        const pdfPage = pages[page - 1];
        const currentRotation = pdfPage.getRotation().angle;
        pdfPage.setRotation(degrees(currentRotation + deg));
      }

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          documentId,
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length
        },
        message: 'Pages rotated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to rotate pages',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // METADATA OPERATIONS
  // ============================================================================

  /**
   * Get PDF metadata
   */
  async getMetadata(
    documentId: string,
    context: OperationContext
  ): Promise<OperationResult<PDFMetadata>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);

      return {
        success: true,
        data: {
          title: pdf.getTitle(),
          author: pdf.getAuthor(),
          subject: pdf.getSubject(),
          keywords: pdf.getKeywords()?.split(',').map(k => k.trim()),
          creator: pdf.getCreator(),
          producer: pdf.getProducer(),
          creationDate: pdf.getCreationDate(),
          modificationDate: pdf.getModificationDate()
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to get metadata',
        errors: [(error as Error).message]
      };
    }
  }

  /**
   * Set PDF metadata
   */
  async setMetadata(
    documentId: string,
    metadata: PDFMetadata,
    context: OperationContext
  ): Promise<OperationResult<PDFProcessingResult>> {
    try {
      const document = await this.repository.findById(documentId);
      if (!document) {
        return { success: false, message: 'Document not found' };
      }

      const version = await this.repository.getLatestVersion(documentId);
      if (!version) {
        return { success: false, message: 'No version found' };
      }

      const buffer = await this.storage.download(document.tenantId, version.filePath);
      const pdf = await PDFDocument.load(buffer);

      if (metadata.title !== undefined) pdf.setTitle(metadata.title);
      if (metadata.author !== undefined) pdf.setAuthor(metadata.author);
      if (metadata.subject !== undefined) pdf.setSubject(metadata.subject);
      if (metadata.keywords !== undefined) pdf.setKeywords(metadata.keywords);
      if (metadata.creator !== undefined) pdf.setCreator(metadata.creator);
      if (metadata.producer !== undefined) pdf.setProducer(metadata.producer);

      const pdfBytes = await pdf.save();
      const resultBuffer = Buffer.from(pdfBytes);

      return {
        success: true,
        data: {
          documentId,
          buffer: resultBuffer,
          pageCount: pdf.getPageCount(),
          fileSize: resultBuffer.length,
          metadata
        },
        message: 'Metadata updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to set metadata',
        errors: [(error as Error).message]
      };
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Add page numbers to PDF
   */
  private async addPageNumbers(
    pdf: PDFDocument,
    format: string = 'Page {page} of {total}'
  ): Promise<void> {
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pages = pdf.getPages();
    const total = pages.length;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { width } = page.getSize();

      const text = format
        .replace('{page}', String(i + 1))
        .replace('{total}', String(total));

      const textWidth = font.widthOfTextAtSize(text, 10);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: 20,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5)
      });
    }
  }

  /**
   * Parse page ranges string or array
   */
  private parsePageRanges(options: SplitOptions, totalPages: number): number[][] {
    const groups: number[][] = [];

    if (options.pages) {
      if (Array.isArray(options.pages)) {
        groups.push(options.pages);
      } else {
        // Parse string like "1-3,5,7-10"
        const ranges = options.pages.split(',');
        const pages: number[] = [];

        for (const range of ranges) {
          const trimmed = range.trim();
          if (trimmed.includes('-')) {
            const [start, end] = trimmed.split('-').map(Number);
            for (let i = start; i <= end && i <= totalPages; i++) {
              if (i >= 1) pages.push(i);
            }
          } else {
            const page = parseInt(trimmed);
            if (page >= 1 && page <= totalPages) {
              pages.push(page);
            }
          }
        }

        groups.push(pages);
      }
    } else if (options.everyNPages) {
      // Split every N pages
      for (let i = 1; i <= totalPages; i += options.everyNPages) {
        const end = Math.min(i + options.everyNPages - 1, totalPages);
        const pageGroup: number[] = [];
        for (let j = i; j <= end; j++) {
          pageGroup.push(j);
        }
        groups.push(pageGroup);
      }
    } else if (options.maxPagesPerDocument) {
      // Split with max pages per document
      const maxPages = options.maxPagesPerDocument;
      for (let i = 1; i <= totalPages; i += maxPages) {
        const end = Math.min(i + maxPages - 1, totalPages);
        const pageGroup: number[] = [];
        for (let j = i; j <= end; j++) {
          pageGroup.push(j);
        }
        groups.push(pageGroup);
      }
    } else {
      // Default: one page per document
      for (let i = 1; i <= totalPages; i++) {
        groups.push([i]);
      }
    }

    return groups;
  }

  /**
   * Parse color string to RGB
   */
  private parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const bigint = parseInt(hex, 16);
      return {
        r: ((bigint >> 16) & 255) / 255,
        g: ((bigint >> 8) & 255) / 255,
        b: (bigint & 255) / 255
      };
    }

    // Default gray
    return { r: 0.5, g: 0.5, b: 0.5 };
  }

  /**
   * Wrap text to fit within character limit
   */
  private wrapText(text: string, maxChars: number): string[] {
    if (text.length <= maxChars) return [text];

    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }

    if (currentLine) lines.push(currentLine);
    return lines;
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export default PDFService;
