import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OCRResult, ClaimDocument } from '../entities/claim.entity';
import { DocumentType } from '../enums/claim-state.enum';

/**
 * Proveedor de OCR
 */
export type OCRProvider = 'tesseract' | 'google' | 'aws';

/**
 * Datos extraídos de factura
 */
export interface InvoiceData {
  invoiceNumber?: string;
  date?: Date;
  dueDate?: Date;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  vendor?: {
    name?: string;
    address?: string;
    taxId?: string;
    phone?: string;
  };
  customer?: {
    name?: string;
    address?: string;
  };
  items?: InvoiceItem[];
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

/**
 * Datos de reporte médico
 */
export interface MedicalReportData {
  patientName?: string;
  patientId?: string;
  date?: Date;
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  doctorName?: string;
  hospitalName?: string;
  estimatedRecoveryDays?: number;
}

/**
 * Datos de reporte policial
 */
export interface PoliceReportData {
  reportNumber?: string;
  date?: Date;
  location?: string;
  officerName?: string;
  badge?: string;
  description?: string;
  parties?: string[];
  witnesses?: string[];
}

/**
 * Resultado de validación
 */
export interface ValidationResult {
  valid: boolean;
  confidence: number;
  documentType: DocumentType;
  errors: string[];
  warnings: string[];
}

/**
 * Servicio de OCR para procesamiento de documentos
 */
@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);

  /**
   * Extrae texto de un documento usando el proveedor especificado
   */
  async extractText(file: Buffer, provider: OCRProvider = 'tesseract'): Promise<string> {
    this.logger.log(`Extracting text using ${provider}`);
    const startTime = Date.now();

    try {
      let text = '';

      switch (provider) {
        case 'tesseract':
          text = await this.extractWithTesseract(file);
          break;
        case 'google':
          text = await this.extractWithGoogleVision(file);
          break;
        case 'aws':
          text = await this.extractWithAWSTextract(file);
          break;
        default:
          throw new BadRequestException(`Proveedor OCR no soportado: ${provider}`);
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`OCR completed in ${processingTime}ms - extracted ${text.length} characters`);

      return text;
    } catch (error) {
      this.logger.error(`OCR failed with ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Procesa documento completo con OCR y devuelve resultado estructurado
   */
  async processDocument(file: Buffer, provider: OCRProvider = 'tesseract'): Promise<OCRResult> {
    const startTime = Date.now();
    const text = await this.extractText(file, provider);

    // Extraer datos estructurados
    const amounts = await this.extractAmounts(text);
    const dates = await this.extractDates(text);
    const names = await this.extractNames(text);
    const addresses = await this.extractAddresses(text);

    // Calcular confianza basado en la cantidad de datos extraídos
    const confidence = this.calculateConfidence(text, amounts, dates, names);

    const result: OCRResult = {
      provider,
      text,
      confidence,
      amounts,
      dates,
      names,
      addresses,
      processedAt: new Date(),
      processingTime: Date.now() - startTime,
    };

    return result;
  }

  /**
   * Parsea una factura y extrae datos estructurados
   */
  async parseInvoice(file: Buffer): Promise<InvoiceData> {
    this.logger.log('Parsing invoice...');
    const text = await this.extractText(file, 'google'); // Google es mejor para facturas

    const invoice: InvoiceData = {
      invoiceNumber: this.extractInvoiceNumber(text),
      date: this.extractInvoiceDate(text),
      totalAmount: this.extractTotalAmount(text),
      subtotal: this.extractSubtotal(text),
      tax: this.extractTax(text),
      currency: this.extractCurrency(text),
      vendor: this.extractVendorInfo(text),
      customer: this.extractCustomerInfo(text),
      items: this.extractInvoiceItems(text),
    };

    this.logger.log(`Invoice parsed: ${invoice.invoiceNumber} - Total: ${invoice.currency} ${invoice.totalAmount}`);
    return invoice;
  }

  /**
   * Parsea reporte médico
   */
  async parseMedicalReport(file: Buffer): Promise<MedicalReportData> {
    this.logger.log('Parsing medical report...');
    const text = await this.extractText(file, 'google');

    const report: MedicalReportData = {
      patientName: this.extractPatientName(text),
      date: this.extractReportDate(text),
      diagnosis: this.extractDiagnosis(text),
      treatment: this.extractTreatment(text),
      medications: this.extractMedications(text),
      doctorName: this.extractDoctorName(text),
      hospitalName: this.extractHospitalName(text),
    };

    return report;
  }

  /**
   * Parsea reporte policial
   */
  async parsePoliceReport(file: Buffer): Promise<PoliceReportData> {
    this.logger.log('Parsing police report...');
    const text = await this.extractText(file, 'aws');

    const report: PoliceReportData = {
      reportNumber: this.extractPoliceReportNumber(text),
      date: this.extractReportDate(text),
      location: this.extractLocation(text),
      officerName: this.extractOfficerName(text),
      description: this.extractIncidentDescription(text),
      parties: this.extractInvolvedParties(text),
      witnesses: this.extractWitnesses(text),
    };

    return report;
  }

  /**
   * Valida un documento contra el tipo esperado
   */
  async validateDocument(file: Buffer, expectedType: DocumentType): Promise<ValidationResult> {
    this.logger.log(`Validating document as ${expectedType}`);

    const text = await this.extractText(file, 'tesseract');
    const errors: string[] = [];
    const warnings: string[] = [];

    let confidence = 0.5; // Base confidence
    let valid = true;

    // Validar según tipo de documento
    switch (expectedType) {
      case DocumentType.INVOICE:
        if (!this.containsInvoiceKeywords(text)) {
          errors.push('No se detectaron palabras clave de factura');
          valid = false;
        }
        if (!this.extractTotalAmount(text)) {
          warnings.push('No se detectó monto total');
          confidence -= 0.2;
        }
        break;

      case DocumentType.MEDICAL_REPORT:
        if (!this.containsMedicalKeywords(text)) {
          errors.push('No se detectaron palabras clave médicas');
          valid = false;
        }
        break;

      case DocumentType.POLICE_REPORT:
        if (!this.containsPoliceKeywords(text)) {
          errors.push('No se detectaron palabras clave de reporte policial');
          valid = false;
        }
        break;

      case DocumentType.PHOTO_DAMAGE:
        // Para fotos, validar que sea imagen y tenga contenido visual
        warnings.push('Validación visual no implementada');
        break;
    }

    return {
      valid,
      confidence: Math.max(0, Math.min(1, confidence)),
      documentType: expectedType,
      errors,
      warnings,
    };
  }

  /**
   * Extrae montos del texto
   */
  async extractAmounts(text: string): Promise<number[]> {
    const amounts: number[] = [];

    // Patrones para detectar montos
    const patterns = [
      /\$\s*([0-9,]+\.?\d*)/g, // $1,234.56
      /€\s*([0-9,]+\.?\d*)/g,  // €1.234,56
      /([0-9,]+\.?\d*)\s*€/g,  // 1234.56 €
      /([0-9,]+\.?\d*)\s*USD/gi,
      /([0-9,]+\.?\d*)\s*EUR/gi,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        if (!isNaN(amount) && amount > 0) {
          amounts.push(amount);
        }
      }
    }

    return [...new Set(amounts)].sort((a, b) => b - a); // Únicos, ordenados desc
  }

  /**
   * Extrae fechas del texto
   */
  async extractDates(text: string): Promise<Date[]> {
    const dates: Date[] = [];

    // Patrones de fecha
    const patterns = [
      /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // DD/MM/YYYY o MM/DD/YYYY
      /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g,   // YYYY-MM-DD
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        try {
          // Intentar parsear fecha
          const dateStr = match[0];
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            dates.push(date);
          }
        } catch (error) {
          // Ignorar fechas inválidas
        }
      }
    }

    return dates;
  }

  /**
   * Extrae nombres del texto
   */
  async extractNames(text: string): Promise<string[]> {
    const names: string[] = [];

    // Patrones comunes para nombres
    const patterns = [
      /Nombre:\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s]+)/gi,
      /Patient:\s*([A-Za-z\s]+)/gi,
      /Dr\.\s*([A-Za-z\s]+)/gi,
      /Officer:\s*([A-Za-z\s]+)/gi,
    ];

    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        names.push(match[1].trim());
      }
    }

    return [...new Set(names)];
  }

  /**
   * Extrae direcciones del texto
   */
  private async extractAddresses(text: string): Promise<string[]> {
    const addresses: string[] = [];

    // Patrones para direcciones
    const pattern = /\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}/g;
    const matches = text.matchAll(pattern);

    for (const match of matches) {
      addresses.push(match[0]);
    }

    return addresses;
  }

  // ==================== PROVEEDORES OCR ====================

  /**
   * Extracción con Tesseract (simulado)
   */
  private async extractWithTesseract(file: Buffer): Promise<string> {
    // En producción, usar: import tesseract from 'node-tesseract-ocr'
    // Por ahora, simulamos la extracción
    this.logger.log('Using Tesseract OCR (simulated)');

    // Simulación de extracción
    return this.simulateOCR(file, 'tesseract');
  }

  /**
   * Extracción con Google Vision API (simulado)
   */
  private async extractWithGoogleVision(file: Buffer): Promise<string> {
    // En producción, usar: @google-cloud/vision
    this.logger.log('Using Google Vision API (simulated)');

    return this.simulateOCR(file, 'google');
  }

  /**
   * Extracción con AWS Textract (simulado)
   */
  private async extractWithAWSTextract(file: Buffer): Promise<string> {
    // En producción, usar: aws-sdk Textract
    this.logger.log('Using AWS Textract (simulated)');

    return this.simulateOCR(file, 'aws');
  }

  /**
   * Simula extracción OCR para testing
   */
  private simulateOCR(file: Buffer, provider: string): string {
    // Retornar texto de ejemplo basado en el tamaño del archivo
    const fileSize = file.length;

    return `
      [OCR SIMULATED - Provider: ${provider}]

      FACTURA / INVOICE
      Número: INV-2026-001234
      Fecha: 28/01/2026

      Proveedor: Taller Mecánico García S.L.
      CIF: B12345678
      Dirección: Calle Principal 123, Madrid, 28001

      Cliente: Juan Pérez
      DNI: 12345678A

      CONCEPTOS:
      - Reparación chapa frontal: 450.00 €
      - Pintura y acabado: 320.00 €
      - Cambio parachoques: 180.00 €
      - Mano de obra: 250.00 €

      Subtotal: 1,200.00 €
      IVA (21%): 252.00 €
      TOTAL: 1,452.00 €

      [File size: ${fileSize} bytes]
    `;
  }

  // ==================== EXTRACTORES ESPECÍFICOS ====================

  private extractInvoiceNumber(text: string): string | undefined {
    const patterns = [
      /Invoice\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /Factura\s*#?\s*:?\s*([A-Z0-9\-]+)/i,
      /N[úu]mero\s*:?\s*([A-Z0-9\-]+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1];
    }
    return undefined;
  }

  private extractInvoiceDate(text: string): Date | undefined {
    const pattern = /Fecha\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i;
    const match = text.match(pattern);
    if (match) {
      return new Date(match[1]);
    }
    return undefined;
  }

  private extractTotalAmount(text: string): number | undefined {
    const patterns = [
      /Total\s*:?\s*([0-9,]+\.?\d*)\s*€/i,
      /TOTAL\s*:?\s*€?\s*([0-9,]+\.?\d*)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
      }
    }
    return undefined;
  }

  private extractSubtotal(text: string): number | undefined {
    const pattern = /Subtotal\s*:?\s*([0-9,]+\.?\d*)\s*€/i;
    const match = text.match(pattern);
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
  }

  private extractTax(text: string): number | undefined {
    const pattern = /IVA.*?:?\s*([0-9,]+\.?\d*)\s*€/i;
    const match = text.match(pattern);
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
  }

  private extractCurrency(text: string): string {
    if (text.includes('€') || text.toLowerCase().includes('eur')) return 'EUR';
    if (text.includes('$') || text.toLowerCase().includes('usd')) return 'USD';
    return 'EUR'; // Default
  }

  private extractVendorInfo(text: string): any {
    return {
      name: this.extractWithPattern(text, /Proveedor\s*:?\s*([^\n]+)/i),
      taxId: this.extractWithPattern(text, /CIF\s*:?\s*([A-Z0-9]+)/i),
    };
  }

  private extractCustomerInfo(text: string): any {
    return {
      name: this.extractWithPattern(text, /Cliente\s*:?\s*([^\n]+)/i),
    };
  }

  private extractInvoiceItems(text: string): InvoiceItem[] {
    // Simplificado - en producción, usar parsing más sofisticado
    return [];
  }

  private extractPatientName(text: string): string | undefined {
    return this.extractWithPattern(text, /Paciente\s*:?\s*([^\n]+)/i);
  }

  private extractReportDate(text: string): Date | undefined {
    const match = text.match(/Fecha\s*:?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
    return match ? new Date(match[1]) : undefined;
  }

  private extractDiagnosis(text: string): string | undefined {
    return this.extractWithPattern(text, /Diagn[óo]stico\s*:?\s*([^\n]+)/i);
  }

  private extractTreatment(text: string): string | undefined {
    return this.extractWithPattern(text, /Tratamiento\s*:?\s*([^\n]+)/i);
  }

  private extractMedications(text: string): string[] {
    const pattern = /Medicaci[óo]n\s*:?\s*([^\n]+)/gi;
    const matches = text.matchAll(pattern);
    const meds: string[] = [];
    for (const match of matches) {
      meds.push(match[1]);
    }
    return meds;
  }

  private extractDoctorName(text: string): string | undefined {
    return this.extractWithPattern(text, /Dr\.\s*([A-Za-z\s]+)/i);
  }

  private extractHospitalName(text: string): string | undefined {
    return this.extractWithPattern(text, /Hospital\s*:?\s*([^\n]+)/i);
  }

  private extractPoliceReportNumber(text: string): string | undefined {
    return this.extractWithPattern(text, /Report\s*#?\s*:?\s*([A-Z0-9\-]+)/i);
  }

  private extractLocation(text: string): string | undefined {
    return this.extractWithPattern(text, /Location\s*:?\s*([^\n]+)/i);
  }

  private extractOfficerName(text: string): string | undefined {
    return this.extractWithPattern(text, /Officer\s*:?\s*([^\n]+)/i);
  }

  private extractIncidentDescription(text: string): string | undefined {
    return this.extractWithPattern(text, /Description\s*:?\s*([^\n]+)/i);
  }

  private extractInvolvedParties(text: string): string[] {
    return [];
  }

  private extractWitnesses(text: string): string[] {
    return [];
  }

  private extractWithPattern(text: string, pattern: RegExp): string | undefined {
    const match = text.match(pattern);
    return match ? match[1].trim() : undefined;
  }

  // ==================== VALIDADORES ====================

  private containsInvoiceKeywords(text: string): boolean {
    const keywords = ['invoice', 'factura', 'total', 'subtotal', 'iva', 'tax'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
  }

  private containsMedicalKeywords(text: string): boolean {
    const keywords = ['patient', 'paciente', 'diagnosis', 'diagnóstico', 'doctor', 'hospital'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
  }

  private containsPoliceKeywords(text: string): boolean {
    const keywords = ['police', 'policía', 'officer', 'report', 'incident'];
    return keywords.some(kw => text.toLowerCase().includes(kw));
  }

  private calculateConfidence(text: string, amounts: number[], dates: Date[], names: string[]): number {
    let confidence = 0.5;

    if (text.length > 100) confidence += 0.1;
    if (amounts.length > 0) confidence += 0.15;
    if (dates.length > 0) confidence += 0.15;
    if (names.length > 0) confidence += 0.1;

    return Math.min(1.0, confidence);
  }
}
