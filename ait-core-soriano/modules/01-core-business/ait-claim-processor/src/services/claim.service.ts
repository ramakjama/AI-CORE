import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Claim, ClaimDocument, ClaimNote, FraudFlag } from '../entities/claim.entity';
import { ClaimState, ClaimType, ClaimPriority, FraudRiskLevel, DocumentType } from '../enums/claim-state.enum';
import { ClaimStateMachine } from '../workflow/claim-state-machine';
import { OCRService } from '../ocr/ocr.service';
import { DamageAssessmentService } from '../ocr/damage-assessment.service';
import {
  CreateClaimDto,
  UpdateClaimDto,
  FilterClaimDto,
  PaginatedResult,
  ReviewClaimDto,
  ApproveClaimDto,
  RejectClaimDto,
  ProcessPaymentDto,
  ClaimStatistics,
  RejectReason,
  FraudAnalysis,
  FraudReview,
} from '../dto/claim.dto';

/**
 * Documento procesado con OCR
 */
export interface ProcessedDocument {
  document: ClaimDocument;
  ocrResult: any;
  extractedData: Record<string, any>;
  validated: boolean;
  validationErrors: string[];
}

/**
 * Servicio principal para gestión de Claims/Siniestros
 *
 * Funcionalidades:
 * - CRUD completo de claims
 * - Workflow de estados con state machine
 * - Gestión de documentos con OCR
 * - Aprobación multinivel
 * - Detección de fraude
 * - Analytics y reportes
 */
@Injectable()
export class ClaimService {
  private readonly logger = new Logger(ClaimService.name);
  private claims: Map<string, Claim> = new Map(); // En producción: usar BD

  constructor(
    private readonly stateMachine: ClaimStateMachine,
    private readonly ocrService: OCRService,
    private readonly damageAssessment: DamageAssessmentService,
  ) {
    this.logger.log('ClaimService initialized');
  }

  // ==================== CRUD BÁSICO ====================

  /**
   * Crea un nuevo claim
   */
  async create(dto: CreateClaimDto): Promise<Claim> {
    this.logger.log(`Creating new claim for policy ${dto.policyId}`);

    const claim: Claim = {
      id: this.generateId(),
      claimNumber: this.generateClaimNumber(),
      policyId: dto.policyId,
      policyNumber: `POL-${dto.policyId}`,
      customerId: dto.customerId,
      customerName: 'Customer Name', // Obtener de customer service
      customerEmail: 'customer@example.com',
      customerPhone: '+34600000000',
      type: dto.type,
      state: ClaimState.DRAFT,
      priority: dto.priority || ClaimPriority.NORMAL,
      incidentDate: new Date(dto.incidentDate),
      reportedDate: new Date(),
      title: dto.title,
      description: dto.description,
      location: dto.location,
      estimatedAmount: dto.estimatedAmount,
      claimedAmount: dto.estimatedAmount,
      currency: 'EUR',
      documents: [],
      hasRequiredDocuments: false,
      fraudRiskLevel: FraudRiskLevel.LOW,
      requiresApproval: dto.estimatedAmount > 1000,
      stateHistory: [],
      notes: [],
      metadata: dto.metadata,
      createdAt: new Date(),
      createdBy: 'system', // En producción: obtener del contexto
      updatedAt: new Date(),
      updatedBy: 'system',
    };

    // Ejecutar detección inicial de fraude
    const fraudAnalysis = await this.detectFraud(claim);
    claim.fraudRiskLevel = fraudAnalysis.riskLevel as FraudRiskLevel;
    claim.fraudScore = fraudAnalysis.score;

    this.claims.set(claim.id, claim);

    this.logger.log(`Claim created: ${claim.claimNumber} (ID: ${claim.id})`);

    return claim;
  }

  /**
   * Obtiene todos los claims con filtros y paginación
   */
  async findAll(filters: FilterClaimDto = {}): Promise<PaginatedResult<Claim>> {
    this.logger.log('Finding claims with filters', filters);

    let claims = Array.from(this.claims.values());

    // Aplicar filtros
    if (filters.state) {
      claims = claims.filter(c => c.state === filters.state);
    }

    if (filters.type) {
      claims = claims.filter(c => c.type === filters.type);
    }

    if (filters.customerId) {
      claims = claims.filter(c => c.customerId === filters.customerId);
    }

    if (filters.policyId) {
      claims = claims.filter(c => c.policyId === filters.policyId);
    }

    if (filters.adjusterId) {
      claims = claims.filter(c => c.adjusterId === filters.adjusterId);
    }

    if (filters.priority) {
      claims = claims.filter(c => c.priority === filters.priority);
    }

    if (filters.fromDate) {
      claims = claims.filter(c => c.incidentDate >= new Date(filters.fromDate));
    }

    if (filters.toDate) {
      claims = claims.filter(c => c.incidentDate <= new Date(filters.toDate));
    }

    // Ordenar por fecha de creación (más recientes primero)
    claims.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Paginación
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    const paginatedClaims = claims.slice(startIndex, endIndex);

    return {
      data: paginatedClaims,
      total: claims.length,
      page,
      limit,
      totalPages: Math.ceil(claims.length / limit),
    };
  }

  /**
   * Obtiene un claim por ID
   */
  async findOne(id: string): Promise<Claim> {
    const claim = this.claims.get(id);

    if (!claim) {
      throw new NotFoundException(`Claim with ID ${id} not found`);
    }

    return claim;
  }

  /**
   * Actualiza un claim
   */
  async update(id: string, dto: UpdateClaimDto): Promise<Claim> {
    const claim = await this.findOne(id);

    // Solo permitir actualización en ciertos estados
    if (!['DRAFT', 'PENDING_DOCUMENTS'].includes(claim.state)) {
      throw new BadRequestException(`Cannot update claim in state ${claim.state}`);
    }

    if (dto.title) claim.title = dto.title;
    if (dto.description) claim.description = dto.description;
    if (dto.estimatedAmount !== undefined) {
      claim.estimatedAmount = dto.estimatedAmount;
      claim.claimedAmount = dto.estimatedAmount;
    }
    if (dto.priority) claim.priority = dto.priority;
    if (dto.metadata) claim.metadata = { ...claim.metadata, ...dto.metadata };

    claim.updatedAt = new Date();

    this.logger.log(`Claim ${claim.claimNumber} updated`);

    return claim;
  }

  // ==================== WORKFLOW (10 MÉTODOS) ====================

  /**
   * Envía un claim para revisión
   */
  async submit(id: string): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.SUBMITTED,
      'Claim submitted for review',
      'INITIAL_SUBMISSION',
    );

    claim.submittedDate = new Date();

    // Auto-asignar ajustador
    claim.adjusterId = 'adj_001';
    claim.adjusterName = 'Auto-assigned Adjuster';

    // Notificar a la aseguradora
    await this.notifyInsurer(claim);

    this.logger.log(`Claim ${claim.claimNumber} submitted`);

    return claim;
  }

  /**
   * Revisa un claim
   */
  async review(id: string, dto: ReviewClaimDto): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.UNDER_REVIEW,
      dto.reviewNotes,
      'STANDARD_REVIEW',
    );

    if (dto.assignTo) {
      claim.adjusterId = dto.assignTo;
    }

    if (dto.priority) {
      claim.priority = dto.priority;
    }

    // Añadir nota
    this.addNote(claim, dto.reviewNotes, 'INTERNAL');

    this.logger.log(`Claim ${claim.claimNumber} under review`);

    return claim;
  }

  /**
   * Solicita documentos adicionales
   */
  async requestDocuments(id: string, documents: string[]): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.PENDING_DOCUMENTS,
      `Requesting documents: ${documents.join(', ')}`,
      'MISSING_DOCUMENTS',
    );

    claim.missingDocuments = documents;

    // Notificar al cliente
    await this.sendDocumentRequest(claim, documents);

    this.logger.log(`Claim ${claim.claimNumber} - documents requested: ${documents.length}`);

    return claim;
  }

  /**
   * Inicia investigación de un claim
   */
  async investigate(id: string, assignTo: string): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.INVESTIGATING,
      'Claim under investigation',
      'INVESTIGATION_STARTED',
    );

    claim.investigatorId = assignTo;

    this.logger.log(`Claim ${claim.claimNumber} under investigation by ${assignTo}`);

    return claim;
  }

  /**
   * Aprueba un claim
   */
  async approve(id: string, dto: ApproveClaimDto): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.APPROVED,
      dto.approvalNotes,
      'WITHIN_POLICY',
    );

    claim.approvedAmount = dto.approvedAmount;
    claim.approvedDate = new Date();

    // Añadir nota
    this.addNote(claim, `Approved: ${dto.approvalNotes}`, 'INTERNAL');

    // Notificar al cliente
    await this.notifyCustomer(claim, `Su siniestro ha sido aprobado por €${dto.approvedAmount}`);

    this.logger.log(`Claim ${claim.claimNumber} approved - Amount: €${dto.approvedAmount}`);

    return claim;
  }

  /**
   * Rechaza un claim
   */
  async reject(id: string, dto: RejectClaimDto): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.REJECTED,
      dto.reason,
      dto.reasonCode,
    );

    claim.rejectedDate = new Date();

    // Añadir nota
    this.addNote(claim, `Rejected: ${dto.reason}`, 'CUSTOMER_VISIBLE');

    // Notificar al cliente
    await this.notifyCustomer(claim, `Su siniestro ha sido rechazado: ${dto.reason}`);

    this.logger.log(`Claim ${claim.claimNumber} rejected - Reason: ${dto.reasonCode}`);

    return claim;
  }

  /**
   * Procesa el pago de un claim aprobado
   */
  async processPayment(id: string, dto: ProcessPaymentDto): Promise<Claim> {
    const claim = await this.findOne(id);

    // Primero mover a PAYMENT_PENDING
    await this.stateMachine.transition(
      claim,
      ClaimState.PAYMENT_PENDING,
      'Processing payment',
      'PAYMENT_INITIATED',
    );

    // Simular procesamiento de pago
    await this.sleep(1000);

    // Luego a PAID
    await this.stateMachine.transition(
      claim,
      ClaimState.PAID,
      `Payment processed: ${dto.paymentMethod}`,
      'PAYMENT_COMPLETED',
    );

    claim.paidAmount = dto.amount;
    claim.paidDate = new Date();

    // Añadir nota
    this.addNote(claim, `Payment processed: €${dto.amount} via ${dto.paymentMethod}`, 'INTERNAL');

    // Notificar
    await this.sendPaymentNotification(claim);

    this.logger.log(`Claim ${claim.claimNumber} paid - Amount: €${dto.amount}`);

    return claim;
  }

  /**
   * Cierra un claim
   */
  async close(id: string, notes: string): Promise<Claim> {
    const claim = await this.findOne(id);

    await this.stateMachine.transition(
      claim,
      ClaimState.CLOSED,
      notes,
      'CLAIM_CLOSURE',
    );

    claim.closedDate = new Date();

    this.addNote(claim, `Claim closed: ${notes}`, 'INTERNAL');

    this.logger.log(`Claim ${claim.claimNumber} closed`);

    return claim;
  }

  /**
   * Reabre un claim cerrado
   */
  async reopen(id: string, reason: string): Promise<Claim> {
    const claim = await this.findOne(id);

    if (claim.state !== ClaimState.CLOSED) {
      throw new BadRequestException('Only closed claims can be reopened');
    }

    await this.stateMachine.transition(
      claim,
      ClaimState.UNDER_REVIEW,
      reason,
      'CLAIM_REOPENED',
    );

    this.addNote(claim, `Claim reopened: ${reason}`, 'INTERNAL');

    this.logger.log(`Claim ${claim.claimNumber} reopened`);

    return claim;
  }

  /**
   * Escala un claim a nivel superior
   */
  async escalate(id: string, reason: string): Promise<Claim> {
    const claim = await this.findOne(id);

    claim.priority = ClaimPriority.URGENT;

    this.addNote(claim, `Claim escalated: ${reason}`, 'INTERNAL');

    this.logger.log(`Claim ${claim.claimNumber} escalated - Reason: ${reason}`);

    return claim;
  }

  // ==================== DOCUMENTOS (8 MÉTODOS) ====================

  /**
   * Sube un documento a un claim
   */
  async uploadDocument(
    claimId: string,
    file: Express.Multer.File,
    type: DocumentType,
  ): Promise<ClaimDocument> {
    const claim = await this.findOne(claimId);

    const document: ClaimDocument = {
      id: this.generateId(),
      claimId,
      filename: `${Date.now()}_${file.originalname}`,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/claims/${claimId}/${Date.now()}_${file.originalname}`,
      type,
      ocrProcessed: false,
      validated: false,
      uploadedAt: new Date(),
      uploadedBy: 'system',
    };

    claim.documents.push(document);

    // Auto-procesar con OCR si es documento de texto
    if (this.shouldProcessWithOCR(type)) {
      await this.processDocument(document.id);
    }

    // Verificar si ya tiene todos los documentos requeridos
    claim.hasRequiredDocuments = this.checkRequiredDocuments(claim);

    this.logger.log(`Document uploaded to claim ${claim.claimNumber}: ${document.filename}`);

    return document;
  }

  /**
   * Procesa un documento con OCR
   */
  async processDocument(documentId: string): Promise<ProcessedDocument> {
    this.logger.log(`Processing document ${documentId} with OCR`);

    // Encontrar documento
    let document: ClaimDocument | undefined;
    let claim: Claim | undefined;

    for (const c of this.claims.values()) {
      const doc = c.documents.find(d => d.id === documentId);
      if (doc) {
        document = doc;
        claim = c;
        break;
      }
    }

    if (!document || !claim) {
      throw new NotFoundException(`Document ${documentId} not found`);
    }

    // Simular carga del archivo
    const fileBuffer = Buffer.from('simulated file content');

    // Procesar con OCR
    const ocrResult = await this.ocrService.processDocument(fileBuffer);

    // Extraer datos según tipo
    let extractedData: Record<string, any> = {};

    switch (document.type) {
      case DocumentType.INVOICE:
        extractedData = await this.ocrService.parseInvoice(fileBuffer);
        break;
      case DocumentType.MEDICAL_REPORT:
        extractedData = await this.ocrService.parseMedicalReport(fileBuffer);
        break;
      case DocumentType.POLICE_REPORT:
        extractedData = await this.ocrService.parsePoliceReport(fileBuffer);
        break;
    }

    // Actualizar documento
    document.ocrProcessed = true;
    document.ocrResult = ocrResult;
    document.extractedData = extractedData;
    document.processedAt = new Date();

    // Validar
    const validation = await this.ocrService.validateDocument(fileBuffer, document.type as any);
    document.validated = validation.valid;
    document.validationErrors = validation.errors;

    this.logger.log(`Document ${documentId} processed - Confidence: ${ocrResult.confidence}`);

    return {
      document,
      ocrResult,
      extractedData,
      validated: validation.valid,
      validationErrors: validation.errors,
    };
  }

  /**
   * Obtiene todos los documentos de un claim
   */
  async getDocuments(claimId: string): Promise<ClaimDocument[]> {
    const claim = await this.findOne(claimId);
    return claim.documents;
  }

  /**
   * Elimina un documento
   */
  async deleteDocument(claimId: string, documentId: string): Promise<void> {
    const claim = await this.findOne(claimId);

    const index = claim.documents.findIndex(d => d.id === documentId);

    if (index === -1) {
      throw new NotFoundException(`Document ${documentId} not found in claim ${claimId}`);
    }

    claim.documents.splice(index, 1);

    this.logger.log(`Document ${documentId} deleted from claim ${claimId}`);
  }

  /**
   * Genera reporte PDF del claim
   */
  async generateClaimReport(claimId: string): Promise<Buffer> {
    const claim = await this.findOne(claimId);

    this.logger.log(`Generating report for claim ${claim.claimNumber}`);

    // En producción, usar librería de PDF como pdfkit o puppeteer
    const reportContent = `
      CLAIM REPORT
      ============

      Claim Number: ${claim.claimNumber}
      Policy: ${claim.policyNumber}
      Customer: ${claim.customerName}
      Type: ${claim.type}
      State: ${claim.state}

      Incident Date: ${claim.incidentDate.toISOString()}
      Reported Date: ${claim.reportedDate.toISOString()}

      Description:
      ${claim.description}

      Amounts:
      - Estimated: €${claim.estimatedAmount}
      - Claimed: €${claim.claimedAmount}
      - Approved: €${claim.approvedAmount || 'N/A'}
      - Paid: €${claim.paidAmount || 'N/A'}

      Documents: ${claim.documents.length}
      Notes: ${claim.notes.length}

      Generated at: ${new Date().toISOString()}
    `;

    return Buffer.from(reportContent);
  }

  /**
   * Procesa OCR de un documento específico
   */
  async ocrDocument(documentId: string): Promise<any> {
    return await this.processDocument(documentId);
  }

  /**
   * Valida todos los documentos de un claim
   */
  async validateDocuments(claimId: string): Promise<any> {
    const claim = await this.findOne(claimId);

    const validations = await Promise.all(
      claim.documents.map(async doc => ({
        documentId: doc.id,
        filename: doc.filename,
        validated: doc.validated,
        errors: doc.validationErrors || [],
      })),
    );

    const allValid = validations.every(v => v.validated);

    return {
      claimId,
      allValid,
      documentCount: validations.length,
      validations,
    };
  }

  /**
   * Descarga todos los documentos como ZIP
   */
  async downloadAllDocuments(claimId: string): Promise<Buffer> {
    const claim = await this.findOne(claimId);

    this.logger.log(`Creating ZIP archive for claim ${claim.claimNumber}`);

    // En producción, usar librería como archiver o jszip
    const zipContent = `[ZIP Archive - ${claim.documents.length} files]`;

    return Buffer.from(zipContent);
  }

  // ==================== COMUNICACIONES (5 MÉTODOS) ====================

  /**
   * Notifica a la aseguradora sobre el claim
   */
  async notifyInsurer(claim: Claim): Promise<void> {
    this.logger.log(`Notifying insurer about claim ${claim.claimNumber}`);

    // En producción: integrar con API de aseguradora
    // await insurerApiClient.notifyClaim(claim);
  }

  /**
   * Notifica al cliente
   */
  async notifyCustomer(claim: Claim, message: string): Promise<void> {
    this.logger.log(`Notifying customer ${claim.customerEmail}: ${message}`);

    // En producción: enviar email/SMS
    // await emailService.send(claim.customerEmail, 'Claim Update', message);
    // await smsService.send(claim.customerPhone, message);
  }

  /**
   * Envía solicitud de documentos al cliente
   */
  async sendDocumentRequest(claim: Claim, documents: string[]): Promise<void> {
    const message = `
      Por favor, envíe los siguientes documentos para su siniestro ${claim.claimNumber}:
      ${documents.map(d => `- ${d}`).join('\n')}
    `;

    await this.notifyCustomer(claim, message);
  }

  /**
   * Envía actualización de estado
   */
  async sendStatusUpdate(claim: Claim): Promise<void> {
    const message = `Su siniestro ${claim.claimNumber} ha cambiado a estado: ${claim.state}`;
    await this.notifyCustomer(claim, message);
  }

  /**
   * Envía notificación de pago
   */
  async sendPaymentNotification(claim: Claim): Promise<void> {
    const message = `
      Pago procesado para su siniestro ${claim.claimNumber}
      Monto: €${claim.paidAmount}
      Fecha: ${claim.paidDate?.toISOString()}
    `;

    await this.notifyCustomer(claim, message);
  }

  // ==================== ANALYTICS (6 MÉTODOS) ====================

  /**
   * Obtiene estadísticas generales de claims
   */
  async getStatistics(filters?: FilterClaimDto): Promise<ClaimStatistics> {
    const result = await this.findAll(filters || {});
    const allClaims = result.data;

    const claimsByState: Record<string, number> = {};
    const claimsByType: Record<string, number> = {};

    let totalApproved = 0;
    let totalPaid = 0;
    let totalProcessingTime = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let highValueCount = 0;

    for (const claim of allClaims) {
      // Por estado
      claimsByState[claim.state] = (claimsByState[claim.state] || 0) + 1;

      // Por tipo
      claimsByType[claim.type] = (claimsByType[claim.type] || 0) + 1;

      // Montos
      if (claim.approvedAmount) {
        totalApproved += claim.approvedAmount;
        approvedCount++;
      }

      if (claim.paidAmount) {
        totalPaid += claim.paidAmount;
      }

      // Alto valor
      if (claim.estimatedAmount > 10000) {
        highValueCount++;
      }

      // Tiempo de procesamiento
      if (claim.closedDate) {
        const processingTime = claim.closedDate.getTime() - claim.createdAt.getTime();
        totalProcessingTime += processingTime;
      }

      // Contadores
      if (claim.state === ClaimState.APPROVED || claim.state === ClaimState.PAID) {
        approvedCount++;
      }

      if (claim.state === ClaimState.REJECTED) {
        rejectedCount++;
      }
    }

    const totalClaims = allClaims.length;
    const averageProcessingTime = totalClaims > 0
      ? totalProcessingTime / totalClaims / (1000 * 60 * 60 * 24) // días
      : 0;

    return {
      totalClaims,
      claimsByState,
      claimsByType,
      averageClaimAmount: totalClaims > 0 ? totalApproved / approvedCount : 0,
      totalApprovedAmount: totalApproved,
      totalPaidAmount: totalPaid,
      averageProcessingTime,
      approvalRate: totalClaims > 0 ? (approvedCount / totalClaims) * 100 : 0,
      rejectionRate: totalClaims > 0 ? (rejectedCount / totalClaims) * 100 : 0,
      pendingReview: claimsByState[ClaimState.UNDER_REVIEW] || 0,
      highValueClaims: highValueCount,
    };
  }

  /**
   * Calcula tiempo promedio de procesamiento
   */
  async getAverageProcessingTime(type?: ClaimType): Promise<number> {
    const filters: FilterClaimDto = type ? { type } : {};
    const result = await this.findAll(filters);

    let totalTime = 0;
    let count = 0;

    for (const claim of result.data) {
      if (claim.closedDate) {
        const time = claim.closedDate.getTime() - claim.createdAt.getTime();
        totalTime += time;
        count++;
      }
    }

    return count > 0 ? totalTime / count / (1000 * 60 * 60 * 24) : 0; // días
  }

  /**
   * Calcula tasa de aprobación
   */
  async getApprovalRate(type?: ClaimType): Promise<number> {
    const filters: FilterClaimDto = type ? { type } : {};
    const result = await this.findAll(filters);

    const total = result.data.length;
    const approved = result.data.filter(
      c => c.state === ClaimState.APPROVED || c.state === ClaimState.PAID,
    ).length;

    return total > 0 ? (approved / total) * 100 : 0;
  }

  /**
   * Obtiene las razones de rechazo más comunes
   */
  async getTopRejectReasons(): Promise<RejectReason[]> {
    const result = await this.findAll({ state: ClaimState.REJECTED });

    const reasonCounts: Record<string, { count: number; description: string }> = {};

    for (const claim of result.data) {
      const history = claim.stateHistory || [];
      const rejectTransition = history.find(h => h.toState === ClaimState.REJECTED);

      if (rejectTransition && rejectTransition.reasonCode) {
        if (!reasonCounts[rejectTransition.reasonCode]) {
          reasonCounts[rejectTransition.reasonCode] = {
            count: 0,
            description: rejectTransition.reason || '',
          };
        }
        reasonCounts[rejectTransition.reasonCode].count++;
      }
    }

    const total = result.total;

    return Object.entries(reasonCounts)
      .map(([code, data]) => ({
        code,
        description: data.description,
        count: data.count,
        percentage: (data.count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Obtiene claims pendientes de revisión
   */
  async getPendingClaims(): Promise<Claim[]> {
    const result = await this.findAll({
      state: ClaimState.UNDER_REVIEW,
    });

    return result.data;
  }

  /**
   * Obtiene claims de alto valor
   */
  async getHighValueClaims(threshold: number = 10000): Promise<Claim[]> {
    const result = await this.findAll({});

    return result.data.filter(c => c.estimatedAmount >= threshold);
  }

  // ==================== FRAUD DETECTION (4 MÉTODOS) ====================

  /**
   * Detecta posible fraude en un claim
   */
  async detectFraud(claim: Claim): Promise<FraudAnalysis> {
    this.logger.log(`Running fraud detection for claim ${claim.id}`);

    let score = 0;
    const flags: any[] = [];
    const reasons: string[] = [];

    // Regla 1: Monto sospechosamente alto
    if (claim.estimatedAmount > 50000) {
      score += 30;
      flags.push({
        type: 'HIGH_AMOUNT',
        severity: 'MEDIUM',
        description: 'Monto del siniestro es inusualmente alto',
      });
      reasons.push('Monto alto');
    }

    // Regla 2: Claim muy reciente después de contratar póliza
    // (simulado - requiere integración con policy service)
    const daysSincePolicy = 180; // simulado
    if (daysSincePolicy < 30) {
      score += 40;
      flags.push({
        type: 'NEW_POLICY',
        severity: 'HIGH',
        description: 'Siniestro reportado poco después de contratar póliza',
      });
      reasons.push('Póliza reciente');
    }

    // Regla 3: Múltiples claims del mismo cliente
    const customerClaims = Array.from(this.claims.values()).filter(
      c => c.customerId === claim.customerId,
    );

    if (customerClaims.length > 3) {
      score += 25;
      flags.push({
        type: 'MULTIPLE_CLAIMS',
        severity: 'MEDIUM',
        description: 'Cliente tiene múltiples siniestros',
      });
      reasons.push('Múltiples siniestros');
    }

    // Regla 4: Documentación incompleta o sospechosa
    if (claim.documents.length === 0) {
      score += 15;
      flags.push({
        type: 'NO_DOCUMENTATION',
        severity: 'LOW',
        description: 'Sin documentación adjunta',
      });
      reasons.push('Sin documentos');
    }

    // Determinar nivel de riesgo
    let riskLevel: string;
    let recommendation: 'APPROVE' | 'REVIEW' | 'REJECT' | 'INVESTIGATE';

    if (score < 20) {
      riskLevel = 'LOW';
      recommendation = 'APPROVE';
    } else if (score < 50) {
      riskLevel = 'MEDIUM';
      recommendation = 'REVIEW';
    } else if (score < 80) {
      riskLevel = 'HIGH';
      recommendation = 'INVESTIGATE';
    } else {
      riskLevel = 'CRITICAL';
      recommendation = 'REJECT';
    }

    const analysis: FraudAnalysis = {
      claimId: claim.id,
      riskLevel,
      score,
      flags,
      recommendation,
      confidence: 0.75,
      reasons,
    };

    this.logger.log(`Fraud analysis complete - Risk: ${riskLevel}, Score: ${score}`);

    return analysis;
  }

  /**
   * Marca un claim como sospechoso
   */
  async flagSuspicious(claimId: string, reason: string): Promise<Claim> {
    const claim = await this.findOne(claimId);

    const flag: FraudFlag = {
      id: this.generateId(),
      claimId,
      type: 'MANUAL_FLAG',
      severity: 'HIGH',
      description: 'Marcado manualmente como sospechoso',
      reason,
      active: true,
      reviewed: false,
      createdAt: new Date(),
      createdBy: 'system',
    };

    claim.fraudFlags = claim.fraudFlags || [];
    claim.fraudFlags.push(flag);
    claim.fraudRiskLevel = FraudRiskLevel.HIGH;

    this.logger.log(`Claim ${claim.claimNumber} flagged as suspicious: ${reason}`);

    return claim;
  }

  /**
   * Revisa las banderas de fraude
   */
  async reviewFraudFlags(claimId: string): Promise<FraudReview> {
    const claim = await this.findOne(claimId);

    const flags = claim.fraudFlags || [];
    const activeFlags = flags.filter(f => f.active && !f.reviewed);
    const resolvedFlags = flags.filter(f => f.reviewed);

    return {
      claimId,
      flags,
      allReviewed: activeFlags.length === 0,
      activeFlags: activeFlags.length,
      resolvedFlags: resolvedFlags.length,
    };
  }

  /**
   * Limpia bandera de fraude
   */
  async clearFraudFlag(claimId: string): Promise<Claim> {
    const claim = await this.findOne(claimId);

    if (claim.fraudFlags) {
      claim.fraudFlags.forEach(f => {
        f.active = false;
        f.reviewed = true;
        f.reviewedAt = new Date();
        f.reviewedBy = 'system';
      });
    }

    claim.fraudRiskLevel = FraudRiskLevel.LOW;

    this.logger.log(`Fraud flags cleared for claim ${claim.claimNumber}`);

    return claim;
  }

  // ==================== HELPERS ====================

  private generateId(): string {
    return `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClaimNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `CLM-${year}-${random}`;
  }

  private addNote(claim: Claim, content: string, type: 'INTERNAL' | 'CUSTOMER_VISIBLE' | 'INSURER_VISIBLE'): void {
    const note: ClaimNote = {
      id: this.generateId(),
      claimId: claim.id,
      content,
      type,
      createdAt: new Date(),
      createdBy: 'system',
      createdByName: 'System',
    };

    claim.notes.push(note);
  }

  private shouldProcessWithOCR(type: DocumentType): boolean {
    return [
      DocumentType.INVOICE,
      DocumentType.MEDICAL_REPORT,
      DocumentType.POLICE_REPORT,
    ].includes(type);
  }

  private checkRequiredDocuments(claim: Claim): boolean {
    // Definir documentos requeridos según tipo de claim
    const requiredDocs: Record<ClaimType, DocumentType[]> = {
      [ClaimType.AUTO_ACCIDENT]: [
        DocumentType.POLICE_REPORT,
        DocumentType.PHOTO_DAMAGE,
        DocumentType.DRIVERS_LICENSE,
      ],
      [ClaimType.PROPERTY_DAMAGE]: [
        DocumentType.PHOTO_DAMAGE,
        DocumentType.REPAIR_ESTIMATE,
      ],
      [ClaimType.HEALTH]: [
        DocumentType.MEDICAL_REPORT,
        DocumentType.INVOICE,
      ],
      [ClaimType.THEFT]: [
        DocumentType.POLICE_REPORT,
      ],
      [ClaimType.FIRE]: [
        DocumentType.POLICE_REPORT,
        DocumentType.PHOTO_DAMAGE,
      ],
      [ClaimType.WATER_DAMAGE]: [
        DocumentType.PHOTO_DAMAGE,
        DocumentType.REPAIR_ESTIMATE,
      ],
      [ClaimType.LIFE]: [],
      [ClaimType.LIABILITY]: [],
      [ClaimType.OTHER]: [],
    };

    const required = requiredDocs[claim.type] || [];
    const uploaded = claim.documents.map(d => d.type);

    return required.every(req => uploaded.includes(req));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
