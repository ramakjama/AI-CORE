import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ClaimService } from '../services/claim.service';
import { ApprovalEngineService } from '../approval/approval-engine.service';
import { ClaimAutomationService } from '../automation/claim-automation.service';
import {
  CreateClaimDto,
  UpdateClaimDto,
  FilterClaimDto,
  ReviewClaimDto,
  ApproveClaimDto,
  RejectClaimDto,
  ProcessPaymentDto,
  RequestDocumentsDto,
} from '../dto/claim.dto';
import { DocumentType } from '../enums/claim-state.enum';

/**
 * Controlador de Claims
 *
 * Endpoints para gestión completa de siniestros
 */
@ApiTags('Claims')
@Controller('claims')
export class ClaimController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly approvalEngine: ApprovalEngineService,
    private readonly automation: ClaimAutomationService,
  ) {}

  // ==================== CRUD ====================

  @Post()
  @ApiOperation({ summary: 'Crear nuevo siniestro' })
  @ApiResponse({ status: 201, description: 'Siniestro creado exitosamente' })
  async create(@Body() dto: CreateClaimDto) {
    return await this.claimService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar siniestros con filtros' })
  @ApiResponse({ status: 200, description: 'Lista de siniestros' })
  async findAll(@Query() filters: FilterClaimDto) {
    return await this.claimService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener siniestro por ID' })
  @ApiParam({ name: 'id', description: 'ID del siniestro' })
  @ApiResponse({ status: 200, description: 'Siniestro encontrado' })
  @ApiResponse({ status: 404, description: 'Siniestro no encontrado' })
  async findOne(@Param('id') id: string) {
    return await this.claimService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar siniestro' })
  @ApiParam({ name: 'id', description: 'ID del siniestro' })
  async update(@Param('id') id: string, @Body() dto: UpdateClaimDto) {
    return await this.claimService.update(id, dto);
  }

  // ==================== WORKFLOW ====================

  @Post(':id/submit')
  @ApiOperation({ summary: 'Enviar siniestro para revisión' })
  @HttpCode(HttpStatus.OK)
  async submit(@Param('id') id: string) {
    return await this.claimService.submit(id);
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Revisar siniestro' })
  @HttpCode(HttpStatus.OK)
  async review(@Param('id') id: string, @Body() dto: ReviewClaimDto) {
    return await this.claimService.review(id, dto);
  }

  @Post(':id/request-documents')
  @ApiOperation({ summary: 'Solicitar documentos adicionales' })
  @HttpCode(HttpStatus.OK)
  async requestDocuments(@Param('id') id: string, @Body() dto: RequestDocumentsDto) {
    return await this.claimService.requestDocuments(id, dto.documents);
  }

  @Post(':id/investigate')
  @ApiOperation({ summary: 'Iniciar investigación' })
  @HttpCode(HttpStatus.OK)
  async investigate(@Param('id') id: string, @Body() body: { assignTo: string }) {
    return await this.claimService.investigate(id, body.assignTo);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Aprobar siniestro' })
  @HttpCode(HttpStatus.OK)
  async approve(@Param('id') id: string, @Body() dto: ApproveClaimDto) {
    return await this.claimService.approve(id, dto);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Rechazar siniestro' })
  @HttpCode(HttpStatus.OK)
  async reject(@Param('id') id: string, @Body() dto: RejectClaimDto) {
    return await this.claimService.reject(id, dto);
  }

  @Post(':id/process-payment')
  @ApiOperation({ summary: 'Procesar pago de siniestro' })
  @HttpCode(HttpStatus.OK)
  async processPayment(@Param('id') id: string, @Body() dto: ProcessPaymentDto) {
    return await this.claimService.processPayment(id, dto);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Cerrar siniestro' })
  @HttpCode(HttpStatus.OK)
  async close(@Param('id') id: string, @Body() body: { notes: string }) {
    return await this.claimService.close(id, body.notes);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reabrir siniestro cerrado' })
  @HttpCode(HttpStatus.OK)
  async reopen(@Param('id') id: string, @Body() body: { reason: string }) {
    return await this.claimService.reopen(id, body.reason);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: 'Escalar siniestro' })
  @HttpCode(HttpStatus.OK)
  async escalate(@Param('id') id: string, @Body() body: { reason: string }) {
    return await this.claimService.escalate(id, body.reason);
  }

  // ==================== DOCUMENTOS ====================

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir documento' })
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: DocumentType,
  ) {
    return await this.claimService.uploadDocument(id, file, type);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos del siniestro' })
  async getDocuments(@Param('id') id: string) {
    return await this.claimService.getDocuments(id);
  }

  @Delete(':id/documents/:documentId')
  @ApiOperation({ summary: 'Eliminar documento' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    await this.claimService.deleteDocument(id, documentId);
  }

  @Post(':id/documents/:documentId/process')
  @ApiOperation({ summary: 'Procesar documento con OCR' })
  @HttpCode(HttpStatus.OK)
  async processDocument(@Param('id') id: string, @Param('documentId') documentId: string) {
    return await this.claimService.processDocument(documentId);
  }

  @Get(':id/documents/validate')
  @ApiOperation({ summary: 'Validar documentos del siniestro' })
  async validateDocuments(@Param('id') id: string) {
    return await this.claimService.validateDocuments(id);
  }

  @Get(':id/documents/download-all')
  @ApiOperation({ summary: 'Descargar todos los documentos como ZIP' })
  async downloadAllDocuments(@Param('id') id: string) {
    return await this.claimService.downloadAllDocuments(id);
  }

  @Get(':id/report')
  @ApiOperation({ summary: 'Generar reporte del siniestro' })
  async generateReport(@Param('id') id: string) {
    return await this.claimService.generateClaimReport(id);
  }

  // ==================== ANALYTICS ====================

  @Get('analytics/statistics')
  @ApiOperation({ summary: 'Obtener estadísticas generales' })
  async getStatistics(@Query() filters: FilterClaimDto) {
    return await this.claimService.getStatistics(filters);
  }

  @Get('analytics/processing-time')
  @ApiOperation({ summary: 'Tiempo promedio de procesamiento' })
  @ApiQuery({ name: 'type', required: false })
  async getAverageProcessingTime(@Query('type') type?: string) {
    return await this.claimService.getAverageProcessingTime(type as any);
  }

  @Get('analytics/approval-rate')
  @ApiOperation({ summary: 'Tasa de aprobación' })
  @ApiQuery({ name: 'type', required: false })
  async getApprovalRate(@Query('type') type?: string) {
    return await this.claimService.getApprovalRate(type as any);
  }

  @Get('analytics/top-reject-reasons')
  @ApiOperation({ summary: 'Razones de rechazo más comunes' })
  async getTopRejectReasons() {
    return await this.claimService.getTopRejectReasons();
  }

  @Get('analytics/pending')
  @ApiOperation({ summary: 'Siniestros pendientes de revisión' })
  async getPendingClaims() {
    return await this.claimService.getPendingClaims();
  }

  @Get('analytics/high-value')
  @ApiOperation({ summary: 'Siniestros de alto valor' })
  @ApiQuery({ name: 'threshold', required: false })
  async getHighValueClaims(@Query('threshold') threshold?: number) {
    return await this.claimService.getHighValueClaims(threshold || 10000);
  }

  // ==================== FRAUDE ====================

  @Post(':id/fraud/detect')
  @ApiOperation({ summary: 'Ejecutar detección de fraude' })
  @HttpCode(HttpStatus.OK)
  async detectFraud(@Param('id') id: string) {
    const claim = await this.claimService.findOne(id);
    return await this.claimService.detectFraud(claim);
  }

  @Post(':id/fraud/flag')
  @ApiOperation({ summary: 'Marcar como sospechoso' })
  @HttpCode(HttpStatus.OK)
  async flagSuspicious(@Param('id') id: string, @Body() body: { reason: string }) {
    return await this.claimService.flagSuspicious(id, body.reason);
  }

  @Get(':id/fraud/review')
  @ApiOperation({ summary: 'Revisar banderas de fraude' })
  async reviewFraudFlags(@Param('id') id: string) {
    return await this.claimService.reviewFraudFlags(id);
  }

  @Delete(':id/fraud/flags')
  @ApiOperation({ summary: 'Limpiar banderas de fraude' })
  @HttpCode(HttpStatus.OK)
  async clearFraudFlags(@Param('id') id: string) {
    return await this.claimService.clearFraudFlag(id);
  }

  // ==================== APROBACIONES ====================

  @Post(':id/approval/request')
  @ApiOperation({ summary: 'Solicitar aprobación' })
  @HttpCode(HttpStatus.OK)
  async requestApproval(@Param('id') id: string, @Body() body: { approver: string }) {
    const claim = await this.claimService.findOne(id);
    return await this.approvalEngine.requestApproval(claim, body.approver);
  }

  @Get(':id/approval/status')
  @ApiOperation({ summary: 'Verificar estado de aprobación' })
  async getApprovalStatus(@Param('id') id: string) {
    const claim = await this.claimService.findOne(id);
    return {
      isFullyApproved: await this.approvalEngine.isFullyApproved(claim),
      pendingApprovers: await this.approvalEngine.getPendingApprovers(claim),
      approvers: claim.approvers,
    };
  }

  @Post('approval/:requestId/approve')
  @ApiOperation({ summary: 'Aprobar solicitud de aprobación' })
  @HttpCode(HttpStatus.OK)
  async approveRequest(
    @Param('requestId') requestId: string,
    @Body() body: { approverId: string; notes: string },
  ) {
    await this.approvalEngine.approve(requestId, body.approverId, body.notes);
    return { success: true };
  }

  @Post('approval/:requestId/reject')
  @ApiOperation({ summary: 'Rechazar solicitud de aprobación' })
  @HttpCode(HttpStatus.OK)
  async rejectRequest(
    @Param('requestId') requestId: string,
    @Body() body: { approverId: string; reason: string },
  ) {
    await this.approvalEngine.reject(requestId, body.approverId, body.reason);
    return { success: true };
  }

  // ==================== AUTOMATIZACIÓN ====================

  @Post(':id/automation/process')
  @ApiOperation({ summary: 'Ejecutar reglas de automatización' })
  @HttpCode(HttpStatus.OK)
  async autoProcess(@Param('id') id: string) {
    const claim = await this.claimService.findOne(id);
    return await this.automation.autoProcess(claim);
  }

  @Get(':id/automation/sla')
  @ApiOperation({ summary: 'Verificar SLA' })
  async checkSLA(@Param('id') id: string) {
    const claim = await this.claimService.findOne(id);
    return await this.automation.checkSLA(claim);
  }
}
