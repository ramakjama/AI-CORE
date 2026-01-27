/**
 * Invoicing Service
 * Servicio de facturación con soporte para factura electrónica Facturae
 */

import { v4 as uuidv4 } from 'uuid';
import Decimal from 'decimal.js';
import {
  Invoice,
  InvoiceLine,
  InvoiceStatus,
  Payment,
  PaymentStatus,
  VATType,
  VATBreakdown,
  ElectronicInvoice,
  Address,
  AgedReport,
  AgedPartner,
  AgedInvoice,
  AccountingResult,
  InvoiceQueryOptions,
} from '../types';

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

interface CreateInvoiceInput {
  type: 'ISSUED' | 'RECEIVED';
  series?: string;
  partnerId: string;
  partnerName: string;
  partnerVAT: string;
  partnerAddress?: Address;
  issueDate: Date;
  operationDate?: Date;
  dueDate: Date;
  lines: CreateInvoiceLineInput[];
  notes?: string;
  internalNotes?: string;
  metadata?: Record<string, unknown>;
}

interface CreateInvoiceLineInput {
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  vatType: VATType;
  vatRate: number;
  withholdingRate?: number;
  surchargeRate?: number;
  accountCode?: string;
  costCenter?: string;
}

interface RecordPaymentInput {
  date: Date;
  amount: number;
  method: Payment['method'];
  reference?: string;
  bankAccountId?: string;
  notes?: string;
}

interface CreateCreditNoteInput {
  lines: Array<{
    originalLineId: string;
    quantity: number;
    reason: string;
  }>;
  reason: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const VAT_RATES: Record<VATType, number> = {
  [VATType.GENERAL]: 21,
  [VATType.REDUCED]: 10,
  [VATType.SUPER_REDUCED]: 4,
  [VATType.EXEMPT]: 0,
  [VATType.NOT_SUBJECT]: 0,
  [VATType.INTRA_EU]: 0,
  [VATType.REVERSE_CHARGE]: 0,
};

// ============================================================================
// ALMACENAMIENTO EN MEMORIA
// ============================================================================

const invoices: Map<string, Invoice> = new Map();
const payments: Map<string, Payment> = new Map();
let invoiceCounter: Record<string, number> = {};

// ============================================================================
// SERVICIO DE FACTURACIÓN
// ============================================================================

export class InvoicingService {
  /**
   * Crea una nueva factura
   */
  async createInvoice(input: CreateInvoiceInput): Promise<AccountingResult<Invoice>> {
    try {
      // Validaciones
      if (!input.lines || input.lines.length === 0) {
        return {
          success: false,
          error: 'La factura debe tener al menos una línea',
        };
      }

      if (!input.partnerVAT) {
        return {
          success: false,
          error: 'El NIF/CIF del cliente/proveedor es obligatorio',
        };
      }

      const invoiceId = uuidv4();
      const year = input.issueDate.getFullYear();
      const series = input.series || (input.type === 'ISSUED' ? 'FE' : 'FR');
      const seriesKey = `${series}-${year}`;

      if (!invoiceCounter[seriesKey]) {
        invoiceCounter[seriesKey] = 0;
      }
      invoiceCounter[seriesKey]++;

      const invoiceNumber = `${series}${year}-${String(invoiceCounter[seriesKey]).padStart(6, '0')}`;

      // Procesar líneas
      const invoiceLines: InvoiceLine[] = [];
      const vatBreakdownMap: Map<string, VATBreakdown> = new Map();

      let subtotal = new Decimal(0);
      let totalTax = new Decimal(0);
      let totalWithholding = new Decimal(0);

      for (let i = 0; i < input.lines.length; i++) {
        const lineInput = input.lines[i];
        const lineId = uuidv4();

        // Calcular importes de línea
        const quantity = new Decimal(lineInput.quantity);
        const unitPrice = new Decimal(lineInput.unitPrice);
        const discountPercent = new Decimal(lineInput.discount || 0);

        const grossAmount = quantity.times(unitPrice);
        const discountAmount = grossAmount.times(discountPercent).div(100);
        const lineSubtotal = grossAmount.minus(discountAmount);

        // IVA
        const vatRate = new Decimal(lineInput.vatRate || VAT_RATES[lineInput.vatType]);
        const vatAmount = lineSubtotal.times(vatRate).div(100);

        // Recargo de equivalencia
        const surchargeRate = new Decimal(lineInput.surchargeRate || 0);
        const surchargeAmount = lineSubtotal.times(surchargeRate).div(100);

        // Retención
        const withholdingRate = new Decimal(lineInput.withholdingRate || 0);
        const withholdingAmount = lineSubtotal.times(withholdingRate).div(100);

        const lineTotal = lineSubtotal.plus(vatAmount).plus(surchargeAmount).minus(withholdingAmount);

        const line: InvoiceLine = {
          id: lineId,
          invoiceId,
          lineNumber: i + 1,
          productId: lineInput.productId,
          productCode: lineInput.productCode,
          description: lineInput.description,
          quantity: lineInput.quantity,
          unitPrice: lineInput.unitPrice,
          discount: lineInput.discount || 0,
          discountAmount: discountAmount.toNumber(),
          subtotal: lineSubtotal.toNumber(),
          vatType: lineInput.vatType,
          vatRate: vatRate.toNumber(),
          vatAmount: vatAmount.toNumber(),
          withholdingRate: lineInput.withholdingRate,
          withholdingAmount: withholdingAmount.toNumber(),
          surchargeRate: lineInput.surchargeRate,
          surchargeAmount: surchargeAmount.toNumber(),
          accountCode: lineInput.accountCode,
          costCenter: lineInput.costCenter,
          total: lineTotal.toNumber(),
        };

        invoiceLines.push(line);

        // Acumular totales
        subtotal = subtotal.plus(lineSubtotal);
        totalTax = totalTax.plus(vatAmount).plus(surchargeAmount);
        totalWithholding = totalWithholding.plus(withholdingAmount);

        // Acumular desglose de IVA
        const vatKey = `${lineInput.vatType}-${vatRate.toNumber()}`;
        const existing = vatBreakdownMap.get(vatKey);
        if (existing) {
          existing.baseAmount = new Decimal(existing.baseAmount).plus(lineSubtotal).toNumber();
          existing.vatAmount = new Decimal(existing.vatAmount).plus(vatAmount).toNumber();
          if (existing.surchargeAmount !== undefined) {
            existing.surchargeAmount = new Decimal(existing.surchargeAmount).plus(surchargeAmount).toNumber();
          }
        } else {
          vatBreakdownMap.set(vatKey, {
            vatType: lineInput.vatType,
            vatRate: vatRate.toNumber(),
            baseAmount: lineSubtotal.toNumber(),
            vatAmount: vatAmount.toNumber(),
            surchargeRate: lineInput.surchargeRate,
            surchargeAmount: surchargeAmount.toNumber(),
          });
        }
      }

      const total = subtotal.plus(totalTax).minus(totalWithholding);

      const invoice: Invoice = {
        id: invoiceId,
        number: invoiceNumber,
        series,
        type: input.type,
        isRectificative: false,
        issueDate: input.issueDate,
        operationDate: input.operationDate,
        dueDate: input.dueDate,
        partnerId: input.partnerId,
        partnerName: input.partnerName,
        partnerVAT: input.partnerVAT,
        partnerAddress: input.partnerAddress,
        lines: invoiceLines,
        subtotal: subtotal.toNumber(),
        totalTax: totalTax.toNumber(),
        totalWithholding: totalWithholding.toNumber(),
        total: total.toNumber(),
        currency: 'EUR',
        vatBreakdown: Array.from(vatBreakdownMap.values()),
        payments: [],
        paidAmount: 0,
        pendingAmount: total.toNumber(),
        status: InvoiceStatus.DRAFT,
        notes: input.notes,
        internalNotes: input.internalNotes,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        metadata: input.metadata,
      };

      invoices.set(invoiceId, invoice);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear factura: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Valida y envía una factura
   */
  async sendInvoice(invoiceId: string): Promise<AccountingResult<Invoice>> {
    try {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return {
          success: false,
          error: `Factura ${invoiceId} no encontrada`,
        };
      }

      if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.VALIDATED) {
        return {
          success: false,
          error: `La factura está en estado ${invoice.status} y no puede ser enviada`,
        };
      }

      // Validar datos obligatorios
      const warnings: string[] = [];

      if (!invoice.partnerVAT) {
        return {
          success: false,
          error: 'El NIF/CIF del cliente es obligatorio',
        };
      }

      if (!invoice.partnerAddress) {
        warnings.push('La factura no tiene dirección del cliente');
      }

      // Actualizar estado
      invoice.status = InvoiceStatus.SENT;
      invoice.updatedAt = new Date();

      invoices.set(invoiceId, invoice);

      return {
        success: true,
        data: invoice,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar factura: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Registra un cobro/pago para una factura
   */
  async recordPayment(
    invoiceId: string,
    paymentData: RecordPaymentInput
  ): Promise<AccountingResult<Payment>> {
    try {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return {
          success: false,
          error: `Factura ${invoiceId} no encontrada`,
        };
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        return {
          success: false,
          error: 'No se puede registrar pago en una factura anulada',
        };
      }

      if (invoice.status === InvoiceStatus.PAID) {
        return {
          success: false,
          error: 'La factura ya está completamente pagada',
        };
      }

      const paymentAmount = new Decimal(paymentData.amount);
      const pendingAmount = new Decimal(invoice.pendingAmount);

      if (paymentAmount.gt(pendingAmount)) {
        return {
          success: false,
          error: `El importe del pago (${paymentAmount}) supera el pendiente (${pendingAmount})`,
        };
      }

      const paymentId = uuidv4();
      const paymentNumber = `PAY-${new Date().getFullYear()}-${uuidv4().substring(0, 8).toUpperCase()}`;

      const payment: Payment = {
        id: paymentId,
        number: paymentNumber,
        type: invoice.type === 'ISSUED' ? 'INCOMING' : 'OUTGOING',
        method: paymentData.method,
        date: paymentData.date,
        partnerId: invoice.partnerId,
        partnerName: invoice.partnerName,
        amount: paymentData.amount,
        currency: invoice.currency,
        bankAccountId: paymentData.bankAccountId,
        invoiceAllocations: [
          {
            id: uuidv4(),
            paymentId,
            invoiceId,
            invoiceNumber: invoice.number,
            amount: paymentData.amount,
            allocatedAt: new Date(),
          },
        ],
        status: PaymentStatus.COMPLETED,
        reference: paymentData.reference,
        notes: paymentData.notes,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      payments.set(paymentId, payment);

      // Actualizar factura
      invoice.payments.push(payment);
      invoice.paidAmount = new Decimal(invoice.paidAmount).plus(paymentAmount).toNumber();
      invoice.pendingAmount = pendingAmount.minus(paymentAmount).toNumber();

      if (invoice.pendingAmount <= 0.01) {
        invoice.status = InvoiceStatus.PAID;
      } else {
        invoice.status = InvoiceStatus.PARTIAL;
      }

      invoice.updatedAt = new Date();
      invoices.set(invoiceId, invoice);

      return {
        success: true,
        data: payment,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al registrar pago: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Anula una factura
   */
  async cancelInvoice(invoiceId: string, reason: string): Promise<AccountingResult<Invoice>> {
    try {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return {
          success: false,
          error: `Factura ${invoiceId} no encontrada`,
        };
      }

      if (invoice.status === InvoiceStatus.CANCELLED) {
        return {
          success: false,
          error: 'La factura ya está anulada',
        };
      }

      if (invoice.paidAmount > 0) {
        return {
          success: false,
          error: 'No se puede anular una factura con pagos. Cree una factura rectificativa.',
        };
      }

      invoice.status = InvoiceStatus.CANCELLED;
      invoice.internalNotes = `${invoice.internalNotes || ''}\n[ANULADA] ${reason}`;
      invoice.updatedAt = new Date();

      invoices.set(invoiceId, invoice);

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al anular factura: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Crea una factura rectificativa (nota de crédito)
   */
  async createCreditNote(
    invoiceId: string,
    input: CreateCreditNoteInput
  ): Promise<AccountingResult<Invoice>> {
    try {
      const originalInvoice = invoices.get(invoiceId);
      if (!originalInvoice) {
        return {
          success: false,
          error: `Factura ${invoiceId} no encontrada`,
        };
      }

      if (originalInvoice.status === InvoiceStatus.CANCELLED) {
        return {
          success: false,
          error: 'No se puede rectificar una factura anulada',
        };
      }

      // Crear líneas para la rectificativa
      const creditNoteLines: CreateInvoiceLineInput[] = [];

      for (const rectLine of input.lines) {
        const originalLine = originalInvoice.lines.find(l => l.id === rectLine.originalLineId);
        if (!originalLine) {
          return {
            success: false,
            error: `Línea ${rectLine.originalLineId} no encontrada en la factura original`,
          };
        }

        if (rectLine.quantity > originalLine.quantity) {
          return {
            success: false,
            error: `La cantidad a rectificar (${rectLine.quantity}) supera la original (${originalLine.quantity})`,
          };
        }

        creditNoteLines.push({
          productId: originalLine.productId,
          productCode: originalLine.productCode,
          description: `Rectificación: ${rectLine.reason} - ${originalLine.description}`,
          quantity: -rectLine.quantity, // Cantidad negativa
          unitPrice: originalLine.unitPrice,
          discount: originalLine.discount,
          vatType: originalLine.vatType,
          vatRate: originalLine.vatRate,
          withholdingRate: originalLine.withholdingRate,
          surchargeRate: originalLine.surchargeRate,
          accountCode: originalLine.accountCode,
          costCenter: originalLine.costCenter,
        });
      }

      // Crear factura rectificativa
      const result = await this.createInvoice({
        type: originalInvoice.type,
        series: originalInvoice.type === 'ISSUED' ? 'RE' : 'RR', // Rectificativa emitida/recibida
        partnerId: originalInvoice.partnerId,
        partnerName: originalInvoice.partnerName,
        partnerVAT: originalInvoice.partnerVAT,
        partnerAddress: originalInvoice.partnerAddress,
        issueDate: new Date(),
        dueDate: new Date(),
        lines: creditNoteLines,
        notes: `Factura rectificativa de ${originalInvoice.number}. Motivo: ${input.reason}`,
        metadata: {
          rectifiedInvoiceId: invoiceId,
          rectifiedInvoiceNumber: originalInvoice.number,
          rectificationReason: input.reason,
        },
      });

      if (result.success && result.data) {
        result.data.isRectificative = true;
        result.data.rectifiedInvoiceId = invoiceId;
        invoices.set(result.data.id, result.data);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: `Error al crear factura rectificativa: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Obtiene facturas por cliente/proveedor
   */
  async getInvoicesByCustomer(
    customerId: string,
    options?: InvoiceQueryOptions
  ): Promise<AccountingResult<Invoice[]>> {
    try {
      let result = Array.from(invoices.values()).filter(
        inv => inv.partnerId === customerId
      );

      // Aplicar filtros adicionales
      if (options?.type) {
        result = result.filter(inv => inv.type === options.type);
      }
      if (options?.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status];
        result = result.filter(inv => statuses.includes(inv.status));
      }
      if (options?.startDate) {
        result = result.filter(inv => inv.issueDate >= options.startDate!);
      }
      if (options?.endDate) {
        result = result.filter(inv => inv.issueDate <= options.endDate!);
      }

      // Ordenar por fecha descendente
      result.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

      // Paginación
      if (options?.offset) {
        result = result.slice(options.offset);
      }
      if (options?.limit) {
        result = result.slice(0, options.limit);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener facturas: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera informe de antigüedad de saldos (Aged Receivables)
   */
  async getAgedReceivables(asOfDate?: Date): Promise<AccountingResult<AgedReport>> {
    try {
      const reportDate = asOfDate || new Date();
      const partnerMap: Map<string, AgedPartner> = new Map();

      // Inicializar totales
      let totalCurrent = new Decimal(0);
      let total1to30 = new Decimal(0);
      let total31to60 = new Decimal(0);
      let total61to90 = new Decimal(0);
      let total91to120 = new Decimal(0);
      let totalOver120 = new Decimal(0);

      // Procesar facturas emitidas pendientes
      for (const invoice of invoices.values()) {
        if (invoice.type !== 'ISSUED') continue;
        if (invoice.status === InvoiceStatus.CANCELLED) continue;
        if (invoice.status === InvoiceStatus.PAID) continue;
        if (invoice.pendingAmount <= 0) continue;

        const daysOverdue = Math.floor(
          (reportDate.getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Obtener o crear registro del partner
        let partner = partnerMap.get(invoice.partnerId);
        if (!partner) {
          partner = {
            partnerId: invoice.partnerId,
            partnerName: invoice.partnerName,
            partnerVAT: invoice.partnerVAT,
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            days91to120: 0,
            over120days: 0,
            total: 0,
            invoices: [],
          };
          partnerMap.set(invoice.partnerId, partner);
        }

        const agedInvoice: AgedInvoice = {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          invoiceDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          daysOverdue: Math.max(0, daysOverdue),
          originalAmount: invoice.total,
          pendingAmount: invoice.pendingAmount,
        };

        partner.invoices!.push(agedInvoice);
        partner.total = new Decimal(partner.total).plus(invoice.pendingAmount).toNumber();

        // Clasificar por antigüedad
        if (daysOverdue <= 0) {
          partner.current = new Decimal(partner.current).plus(invoice.pendingAmount).toNumber();
          totalCurrent = totalCurrent.plus(invoice.pendingAmount);
        } else if (daysOverdue <= 30) {
          partner.days1to30 = new Decimal(partner.days1to30).plus(invoice.pendingAmount).toNumber();
          total1to30 = total1to30.plus(invoice.pendingAmount);
        } else if (daysOverdue <= 60) {
          partner.days31to60 = new Decimal(partner.days31to60).plus(invoice.pendingAmount).toNumber();
          total31to60 = total31to60.plus(invoice.pendingAmount);
        } else if (daysOverdue <= 90) {
          partner.days61to90 = new Decimal(partner.days61to90).plus(invoice.pendingAmount).toNumber();
          total61to90 = total61to90.plus(invoice.pendingAmount);
        } else if (daysOverdue <= 120) {
          partner.days91to120 = new Decimal(partner.days91to120).plus(invoice.pendingAmount).toNumber();
          total91to120 = total91to120.plus(invoice.pendingAmount);
        } else {
          partner.over120days = new Decimal(partner.over120days).plus(invoice.pendingAmount).toNumber();
          totalOver120 = totalOver120.plus(invoice.pendingAmount);
        }
      }

      const partners = Array.from(partnerMap.values()).sort((a, b) => b.total - a.total);

      return {
        success: true,
        data: {
          type: 'RECEIVABLES',
          asOfDate: reportDate,
          partners,
          current: totalCurrent.toNumber(),
          days1to30: total1to30.toNumber(),
          days31to60: total31to60.toNumber(),
          days61to90: total61to90.toNumber(),
          days91to120: total91to120.toNumber(),
          over120days: totalOver120.toNumber(),
          total: totalCurrent
            .plus(total1to30)
            .plus(total31to60)
            .plus(total61to90)
            .plus(total91to120)
            .plus(totalOver120)
            .toNumber(),
          generatedAt: new Date(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar informe de antigüedad: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera factura electrónica en formato Facturae
   */
  async generateFacturaE(invoiceId: string): Promise<AccountingResult<ElectronicInvoice>> {
    try {
      const invoice = invoices.get(invoiceId);
      if (!invoice) {
        return {
          success: false,
          error: `Factura ${invoiceId} no encontrada`,
        };
      }

      if (invoice.type !== 'ISSUED') {
        return {
          success: false,
          error: 'Solo se pueden generar facturas electrónicas para facturas emitidas',
        };
      }

      if (invoice.status === InvoiceStatus.DRAFT) {
        return {
          success: false,
          error: 'La factura debe estar validada antes de generar la factura electrónica',
        };
      }

      // Generar XML Facturae 3.2.2
      const xml = this.generateFacturaeXML(invoice);

      const electronicInvoice: ElectronicInvoice = {
        id: uuidv4(),
        invoiceId,
        format: 'FACTURAE',
        version: '3.2.2',
        xmlContent: xml,
        status: 'GENERATED',
      };

      // Actualizar factura
      invoice.electronicInvoice = electronicInvoice;
      invoice.updatedAt = new Date();
      invoices.set(invoiceId, invoice);

      return {
        success: true,
        data: electronicInvoice,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar factura electrónica: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Genera el XML de Facturae
   */
  private generateFacturaeXML(invoice: Invoice): string {
    const formatDate = (date: Date) => date.toISOString().split('T')[0];
    const formatAmount = (amount: number) => amount.toFixed(2);

    // Generar líneas de factura
    const invoiceLines = invoice.lines.map((line, index) => `
      <InvoiceLine>
        <ItemDescription>${this.escapeXml(line.description)}</ItemDescription>
        <Quantity>${line.quantity}</Quantity>
        <UnitOfMeasure>01</UnitOfMeasure>
        <UnitPriceWithoutTax>${formatAmount(line.unitPrice)}</UnitPriceWithoutTax>
        <TotalCost>${formatAmount(line.subtotal)}</TotalCost>
        <GrossAmount>${formatAmount(line.subtotal)}</GrossAmount>
        <TaxesOutputs>
          <Tax>
            <TaxTypeCode>01</TaxTypeCode>
            <TaxRate>${formatAmount(line.vatRate)}</TaxRate>
            <TaxableBase>
              <TotalAmount>${formatAmount(line.subtotal)}</TotalAmount>
            </TaxableBase>
            <TaxAmount>
              <TotalAmount>${formatAmount(line.vatAmount)}</TotalAmount>
            </TaxAmount>
          </Tax>
        </TaxesOutputs>
      </InvoiceLine>`).join('');

    // Generar desglose de impuestos
    const taxSummary = invoice.vatBreakdown.map(vat => `
      <Tax>
        <TaxTypeCode>01</TaxTypeCode>
        <TaxRate>${formatAmount(vat.vatRate)}</TaxRate>
        <TaxableBase>
          <TotalAmount>${formatAmount(vat.baseAmount)}</TotalAmount>
        </TaxableBase>
        <TaxAmount>
          <TotalAmount>${formatAmount(vat.vatAmount)}</TotalAmount>
        </TaxAmount>
      </Tax>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<fe:Facturae xmlns:fe="http://www.facturae.gob.es/formato/Versiones/Facturaev3_2_2.xml">
  <FileHeader>
    <SchemaVersion>3.2.2</SchemaVersion>
    <Modality>I</Modality>
    <InvoiceIssuerType>EM</InvoiceIssuerType>
    <Batch>
      <BatchIdentifier>${invoice.number}</BatchIdentifier>
      <InvoicesCount>1</InvoicesCount>
      <TotalInvoicesAmount>
        <TotalAmount>${formatAmount(invoice.total)}</TotalAmount>
      </TotalInvoicesAmount>
      <TotalOutstandingAmount>
        <TotalAmount>${formatAmount(invoice.pendingAmount)}</TotalAmount>
      </TotalOutstandingAmount>
      <TotalExecutableAmount>
        <TotalAmount>${formatAmount(invoice.total)}</TotalAmount>
      </TotalExecutableAmount>
      <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>
    </Batch>
  </FileHeader>
  <Parties>
    <SellerParty>
      <TaxIdentification>
        <PersonTypeCode>J</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>EMISOR_NIF</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>EMPRESA EMISORA</CorporateName>
        <AddressInSpain>
          <Address>DIRECCION EMISOR</Address>
          <PostCode>00000</PostCode>
          <Town>CIUDAD</Town>
          <Province>PROVINCIA</Province>
          <CountryCode>ESP</CountryCode>
        </AddressInSpain>
      </LegalEntity>
    </SellerParty>
    <BuyerParty>
      <TaxIdentification>
        <PersonTypeCode>${invoice.partnerVAT.startsWith('B') || invoice.partnerVAT.startsWith('A') ? 'J' : 'F'}</PersonTypeCode>
        <ResidenceTypeCode>R</ResidenceTypeCode>
        <TaxIdentificationNumber>${invoice.partnerVAT}</TaxIdentificationNumber>
      </TaxIdentification>
      <LegalEntity>
        <CorporateName>${this.escapeXml(invoice.partnerName)}</CorporateName>
        ${invoice.partnerAddress ? `
        <AddressInSpain>
          <Address>${this.escapeXml(invoice.partnerAddress.street)}</Address>
          <PostCode>${invoice.partnerAddress.postalCode}</PostCode>
          <Town>${this.escapeXml(invoice.partnerAddress.city)}</Town>
          <Province>${this.escapeXml(invoice.partnerAddress.province || '')}</Province>
          <CountryCode>ESP</CountryCode>
        </AddressInSpain>` : ''}
      </LegalEntity>
    </BuyerParty>
  </Parties>
  <Invoices>
    <Invoice>
      <InvoiceHeader>
        <InvoiceNumber>${invoice.number}</InvoiceNumber>
        <InvoiceSeriesCode>${invoice.series || ''}</InvoiceSeriesCode>
        <InvoiceDocumentType>${invoice.isRectificative ? 'R1' : 'FC'}</InvoiceDocumentType>
        <InvoiceClass>OO</InvoiceClass>
      </InvoiceHeader>
      <InvoiceIssueData>
        <IssueDate>${formatDate(invoice.issueDate)}</IssueDate>
        ${invoice.operationDate ? `<OperationDate>${formatDate(invoice.operationDate)}</OperationDate>` : ''}
        <InvoiceCurrencyCode>EUR</InvoiceCurrencyCode>
        <TaxCurrencyCode>EUR</TaxCurrencyCode>
        <LanguageName>es</LanguageName>
      </InvoiceIssueData>
      <TaxesOutputs>${taxSummary}
      </TaxesOutputs>
      <InvoiceTotals>
        <TotalGrossAmount>${formatAmount(invoice.subtotal)}</TotalGrossAmount>
        <TotalGrossAmountBeforeTaxes>${formatAmount(invoice.subtotal)}</TotalGrossAmountBeforeTaxes>
        <TotalTaxOutputs>${formatAmount(invoice.totalTax)}</TotalTaxOutputs>
        <TotalTaxesWithheld>${formatAmount(invoice.totalWithholding)}</TotalTaxesWithheld>
        <InvoiceTotal>${formatAmount(invoice.total)}</InvoiceTotal>
        <TotalOutstandingAmount>${formatAmount(invoice.pendingAmount)}</TotalOutstandingAmount>
        <TotalExecutableAmount>${formatAmount(invoice.total)}</TotalExecutableAmount>
      </InvoiceTotals>
      <Items>${invoiceLines}
      </Items>
      <PaymentDetails>
        <Installment>
          <InstallmentDueDate>${formatDate(invoice.dueDate)}</InstallmentDueDate>
          <InstallmentAmount>${formatAmount(invoice.total)}</InstallmentAmount>
          <PaymentMeans>04</PaymentMeans>
        </Installment>
      </PaymentDetails>
    </Invoice>
  </Invoices>
</fe:Facturae>`;
  }

  /**
   * Escapa caracteres especiales para XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Obtiene una factura por ID
   */
  async getInvoice(invoiceId: string): Promise<AccountingResult<Invoice>> {
    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return {
        success: false,
        error: `Factura ${invoiceId} no encontrada`,
      };
    }
    return {
      success: true,
      data: invoice,
    };
  }

  /**
   * Lista facturas con filtros
   */
  async getInvoices(options?: InvoiceQueryOptions): Promise<AccountingResult<Invoice[]>> {
    try {
      let result = Array.from(invoices.values());

      if (options?.type) {
        result = result.filter(inv => inv.type === options.type);
      }
      if (options?.status) {
        const statuses = Array.isArray(options.status) ? options.status : [options.status];
        result = result.filter(inv => statuses.includes(inv.status));
      }
      if (options?.partnerId) {
        result = result.filter(inv => inv.partnerId === options.partnerId);
      }
      if (options?.startDate) {
        result = result.filter(inv => inv.issueDate >= options.startDate!);
      }
      if (options?.endDate) {
        result = result.filter(inv => inv.issueDate <= options.endDate!);
      }
      if (options?.minAmount !== undefined) {
        result = result.filter(inv => inv.total >= options.minAmount!);
      }
      if (options?.maxAmount !== undefined) {
        result = result.filter(inv => inv.total <= options.maxAmount!);
      }

      result.sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());

      if (options?.offset) {
        result = result.slice(options.offset);
      }
      if (options?.limit) {
        result = result.slice(0, options.limit);
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener facturas: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

// Exportar instancia singleton
export const invoicingService = new InvoicingService();
