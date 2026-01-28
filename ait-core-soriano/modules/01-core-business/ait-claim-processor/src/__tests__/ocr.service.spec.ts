import { OCRService } from '../ocr/ocr.service';
import { DocumentType } from '../enums/claim-state.enum';

describe('OCRService', () => {
  let service: OCRService;

  beforeEach(() => {
    service = new OCRService();
  });

  describe('extractText', () => {
    it('should extract text using tesseract provider', async () => {
      const buffer = Buffer.from('test file content');
      const text = await service.extractText(buffer, 'tesseract');

      expect(text).toBeDefined();
      expect(text.length).toBeGreaterThan(0);
    });

    it('should extract text using google provider', async () => {
      const buffer = Buffer.from('test file content');
      const text = await service.extractText(buffer, 'google');

      expect(text).toBeDefined();
      expect(text).toContain('Provider: google');
    });

    it('should extract text using aws provider', async () => {
      const buffer = Buffer.from('test file content');
      const text = await service.extractText(buffer, 'aws');

      expect(text).toBeDefined();
      expect(text).toContain('Provider: aws');
    });

    it('should throw error for invalid provider', async () => {
      const buffer = Buffer.from('test');
      await expect(service.extractText(buffer, 'invalid' as any)).rejects.toThrow();
    });
  });

  describe('processDocument', () => {
    it('should return OCRResult with confidence', async () => {
      const buffer = Buffer.from('test content');
      const result = await service.processDocument(buffer);

      expect(result).toBeDefined();
      expect(result.text).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.processedAt).toBeInstanceOf(Date);
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it('should extract structured data', async () => {
      const buffer = Buffer.from('Invoice total: €1,234.56');
      const result = await service.processDocument(buffer);

      expect(result.amounts).toBeDefined();
      expect(result.dates).toBeDefined();
      expect(result.names).toBeDefined();
    });
  });

  describe('parseInvoice', () => {
    it('should parse invoice data', async () => {
      const buffer = Buffer.from('test invoice');
      const invoice = await service.parseInvoice(buffer);

      expect(invoice).toBeDefined();
      expect(invoice.totalAmount).toBeDefined();
      expect(invoice.currency).toBeDefined();
    });

    it('should extract vendor information', async () => {
      const buffer = Buffer.from('test invoice');
      const invoice = await service.parseInvoice(buffer);

      expect(invoice.vendor).toBeDefined();
    });
  });

  describe('parseMedicalReport', () => {
    it('should parse medical report', async () => {
      const buffer = Buffer.from('medical report');
      const report = await service.parseMedicalReport(buffer);

      expect(report).toBeDefined();
    });
  });

  describe('parsePoliceReport', () => {
    it('should parse police report', async () => {
      const buffer = Buffer.from('police report');
      const report = await service.parsePoliceReport(buffer);

      expect(report).toBeDefined();
    });
  });

  describe('validateDocument', () => {
    it('should validate invoice document', async () => {
      const buffer = Buffer.from('INVOICE Total: €100');
      const result = await service.validateDocument(buffer, DocumentType.INVOICE);

      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.documentType).toBe(DocumentType.INVOICE);
    });

    it('should detect invalid document type', async () => {
      const buffer = Buffer.from('random text without keywords');
      const result = await service.validateDocument(buffer, DocumentType.INVOICE);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('extractAmounts', () => {
    it('should extract amounts with $ symbol', async () => {
      const text = 'Total: $1,234.56 and $789.00';
      const amounts = await service.extractAmounts(text);

      expect(amounts.length).toBeGreaterThan(0);
    });

    it('should extract amounts with € symbol', async () => {
      const text = 'Total: €1.234,56 y €789,00';
      const amounts = await service.extractAmounts(text);

      expect(amounts.length).toBeGreaterThan(0);
    });

    it('should return unique amounts sorted descending', async () => {
      const text = '€100, €500, €100, €200';
      const amounts = await service.extractAmounts(text);

      // Verificar que estén ordenados descendente
      for (let i = 0; i < amounts.length - 1; i++) {
        expect(amounts[i]).toBeGreaterThanOrEqual(amounts[i + 1]);
      }
    });
  });

  describe('extractDates', () => {
    it('should extract dates from text', async () => {
      const text = 'Date: 28/01/2026 and 2026-01-15';
      const dates = await service.extractDates(text);

      expect(dates.length).toBeGreaterThan(0);
    });
  });

  describe('extractNames', () => {
    it('should extract names with common patterns', async () => {
      const text = 'Nombre: Juan Pérez, Patient: John Doe';
      const names = await service.extractNames(text);

      expect(names.length).toBeGreaterThan(0);
    });
  });
});
