import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  Res,
  StreamableFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { PolicyService } from '../services/policy.service';
import { PolicyRulesService } from '../services/policy-rules.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
  RenewPolicyDto,
  EndorsePolicyDto,
  CancelPolicyDto,
  PolicyStatus,
  PolicySearchDto,
  CreateCoverageDto,
  UpdateCoverageDto,
  PolicyQuoteDto,
  AddBeneficiaryDto,
  UploadDocumentDto
} from '../dto';

@ApiTags('Policies')
@ApiBearerAuth()
@Controller('api/v1/policies')
export class PolicyController {
  constructor(
    private readonly policyService: PolicyService,
    private readonly rulesService: PolicyRulesService
  ) {}

  // ==================== CRUD BÁSICO ====================

  @Post()
  @ApiOperation({ summary: 'Crear nueva póliza' })
  @ApiResponse({ status: 201, description: 'Póliza creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente o producto no encontrado' })
  @ApiResponse({ status: 409, description: 'Conflicto - cliente ya tiene póliza activa del mismo tipo' })
  async create(@Body() createPolicyDto: CreatePolicyDto, @Req() req: any) {
    const userId = req.user?.id || 'system';
    return this.policyService.create(createPolicyDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar y buscar pólizas con filtros avanzados' })
  @ApiResponse({ status: 200, description: 'Lista paginada de pólizas' })
  async findAll(@Query() filters: PolicySearchDto) {
    return this.policyService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles completos de una póliza' })
  @ApiResponse({ status: 200, description: 'Detalles de la póliza con coberturas, claims y endosos' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar póliza existente' })
  @ApiResponse({ status: 200, description: 'Póliza actualizada exitosamente' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos de actualización inválidos' })
  async update(
    @Param('id') id: string,
    @Body() updatePolicyDto: UpdatePolicyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.update(id, updatePolicyDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar póliza (soft delete - use cancel instead)' })
  @ApiResponse({ status: 204, description: 'Póliza eliminada' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async remove(@Param('id') id: string) {
    // Soft delete no recomendado - usar cancel
    return { message: 'Not implemented - use POST /policies/:id/cancel instead' };
  }

  // ==================== OPERACIONES DE PÓLIZA ====================

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renovar póliza para un nuevo periodo' })
  @ApiResponse({ status: 201, description: 'Póliza renovada - nueva póliza creada' })
  @ApiResponse({ status: 400, description: 'Póliza no puede ser renovada' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async renew(
    @Param('id') id: string,
    @Body() renewDto: RenewPolicyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.renew(id, renewDto, userId);
  }

  @Post(':id/endorse')
  @ApiOperation({ summary: 'Crear endoso (modificación mid-term)' })
  @ApiResponse({ status: 201, description: 'Endoso creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Póliza no puede ser modificada o validación falló' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async endorse(
    @Param('id') id: string,
    @Body() endorseDto: EndorsePolicyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.endorse(id, endorseDto, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar póliza con cálculo de reembolso' })
  @ApiResponse({ status: 200, description: 'Póliza cancelada exitosamente' })
  @ApiResponse({ status: 400, description: 'Póliza ya está cancelada o tiene claims activos' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelPolicyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.cancel(id, cancelDto, userId);
  }

  @Post(':id/suspend')
  @ApiOperation({ summary: 'Suspender póliza temporalmente' })
  @ApiResponse({ status: 200, description: 'Póliza suspendida' })
  @ApiResponse({ status: 400, description: 'Solo se pueden suspender pólizas activas' })
  async suspend(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.suspend(id, body.reason, userId);
  }

  @Post(':id/reactivate')
  @ApiOperation({ summary: 'Reactivar póliza suspendida' })
  @ApiResponse({ status: 200, description: 'Póliza reactivada' })
  @ApiResponse({ status: 400, description: 'Solo se pueden reactivar pólizas suspendidas' })
  async reactivate(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 'system';
    return this.policyService.reactivate(id, userId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activar póliza desde estado draft o quoted' })
  @ApiResponse({ status: 200, description: 'Póliza activada' })
  async activate(@Param('id') id: string, @Req() req: any) {
    const userId = req.user?.id || 'system';
    return this.policyService.update(id, { status: PolicyStatus.ACTIVE }, userId);
  }

  // ==================== GESTIÓN DE COBERTURAS ====================

  @Post(':id/coverages')
  @ApiOperation({ summary: 'Añadir cobertura a póliza existente' })
  @ApiResponse({ status: 201, description: 'Cobertura añadida' })
  @ApiResponse({ status: 400, description: 'No se puede añadir cobertura a póliza inactiva' })
  async addCoverage(
    @Param('id') id: string,
    @Body() coverageDto: CreateCoverageDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.addCoverage(id, coverageDto, userId);
  }

  @Get(':id/coverages')
  @ApiOperation({ summary: 'Listar todas las coberturas de una póliza' })
  @ApiResponse({ status: 200, description: 'Lista de coberturas' })
  async getCoverages(@Param('id') id: string) {
    const policy = await this.policyService.findOne(id);
    return policy.coverages;
  }

  @Put(':id/coverages/:coverageId')
  @ApiOperation({ summary: 'Actualizar cobertura específica' })
  @ApiResponse({ status: 200, description: 'Cobertura actualizada' })
  @ApiResponse({ status: 404, description: 'Cobertura no encontrada' })
  async updateCoverage(
    @Param('id') policyId: string,
    @Param('coverageId') coverageId: string,
    @Body() coverageDto: UpdateCoverageDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.updateCoverage(policyId, coverageId, coverageDto, userId);
  }

  @Delete(':id/coverages/:coverageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar cobertura de la póliza' })
  @ApiResponse({ status: 204, description: 'Cobertura eliminada' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar cobertura obligatoria' })
  async removeCoverage(
    @Param('id') policyId: string,
    @Param('coverageId') coverageId: string,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    await this.policyService.removeCoverage(policyId, coverageId, userId);
  }

  // ==================== HISTORIAL Y AUDITORÍA ====================

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtener historial completo de cambios' })
  @ApiResponse({ status: 200, description: 'Historial de cambios, endosos y eventos' })
  async getHistory(@Param('id') id: string) {
    return this.policyService.getPolicyHistory(id);
  }

  @Get(':id/endorsements')
  @ApiOperation({ summary: 'Listar todos los endosos de la póliza' })
  @ApiResponse({ status: 200, description: 'Lista de endosos' })
  async getEndorsements(@Param('id') id: string) {
    const policy = await this.policyService.findOne(id);
    return policy.endorsements || [];
  }

  @Get(':id/claims')
  @ApiOperation({ summary: 'Listar claims asociados a la póliza' })
  @ApiResponse({ status: 200, description: 'Lista de claims' })
  async getClaims(@Param('id') id: string) {
    const policy = await this.policyService.findOne(id);
    return policy.claims || [];
  }

  // ==================== DOCUMENTOS ====================

  @Post(':id/documents')
  @ApiOperation({ summary: 'Subir documento asociado a la póliza' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
        description: { type: 'string' }
      }
    }
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Documento subido exitosamente' })
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.uploadDocument(id, file, dto.type, userId);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos asociados a la póliza' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  async getDocuments(@Param('id') id: string) {
    return this.policyService.getDocuments(id);
  }

  @Delete(':id/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar documento de la póliza' })
  @ApiResponse({ status: 204, description: 'Documento eliminado' })
  async deleteDocument(
    @Param('id') policyId: string,
    @Param('documentId') documentId: string,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    await this.policyService.deleteDocument(policyId, documentId, userId);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Generar y descargar certificado de póliza (PDF)' })
  @ApiResponse({ status: 200, description: 'Certificado PDF generado' })
  async generateCertificate(@Param('id') id: string, @Res({ passthrough: true }) res: Response) {
    const pdfBuffer = await this.policyService.generateCertificate(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="policy-certificate-${id}.pdf"`
    });
    return new StreamableFile(pdfBuffer);
  }

  // ==================== COTIZACIONES ====================

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calcular cotización de prima para nueva póliza' })
  @ApiResponse({ status: 200, description: 'Cotización calculada con desglose' })
  @ApiResponse({ status: 400, description: 'Datos de cotización inválidos' })
  async calculateQuote(@Body() quoteDto: PolicyQuoteDto) {
    return this.policyService.calculatePremium(quoteDto);
  }

  @Post('quote/:quoteId/accept')
  @ApiOperation({ summary: 'Aceptar cotización y crear póliza' })
  @ApiResponse({ status: 201, description: 'Póliza creada desde cotización' })
  async acceptQuote(@Param('quoteId') quoteId: string, @Req() req: any) {
    // Implementar lógica de aceptar cotización
    return { message: 'Quote acceptance logic to be implemented' };
  }

  // ==================== ESTADÍSTICAS Y REPORTES ====================

  @Get('statistics/global')
  @ApiOperation({ summary: 'Obtener estadísticas globales de pólizas' })
  @ApiResponse({ status: 200, description: 'Estadísticas agregadas' })
  async getGlobalStatistics() {
    return this.policyService.getStatistics();
  }

  @Get('statistics/customer/:customerId')
  @ApiOperation({ summary: 'Obtener estadísticas de pólizas de un cliente específico' })
  @ApiResponse({ status: 200, description: 'Estadísticas del cliente' })
  async getCustomerStatistics(@Param('customerId') customerId: string) {
    return this.policyService.getStatistics(customerId);
  }

  @Get('expiring/:days')
  @ApiOperation({ summary: 'Listar pólizas que expiran en los próximos N días' })
  @ApiResponse({ status: 200, description: 'Lista de pólizas próximas a expirar' })
  async getExpiringPolicies(@Param('days') days: number) {
    return this.policyService.getExpiringPolicies(days);
  }

  @Get('customer/:customerId/active')
  @ApiOperation({ summary: 'Listar pólizas activas de un cliente' })
  @ApiResponse({ status: 200, description: 'Pólizas activas del cliente' })
  async getCustomerActivePolicies(@Param('customerId') customerId: string) {
    return this.policyService.getActivePolicies(customerId);
  }

  @Get('customer/:customerId/total-premium')
  @ApiOperation({ summary: 'Calcular prima total anual de un cliente' })
  @ApiResponse({ status: 200, description: 'Prima total' })
  async getCustomerTotalPremium(@Param('customerId') customerId: string) {
    const total = await this.policyService.getTotalPremium(customerId);
    return { customerId, totalAnnualPremium: total };
  }

  // ==================== RENOVACIONES AUTOMÁTICAS ====================

  @Get('renewals/pending')
  @ApiOperation({ summary: 'Listar pólizas pendientes de renovación' })
  @ApiResponse({ status: 200, description: 'Pólizas elegibles para renovación automática' })
  async getPendingRenewals() {
    return this.policyService.checkRenewals();
  }

  @Post('renewals/process')
  @ApiOperation({ summary: 'Procesar renovaciones automáticas en batch' })
  @ApiResponse({ status: 200, description: 'Resultado del procesamiento batch' })
  async processRenewals(@Req() req: any) {
    const userId = req.user?.id || 'system';
    const policies = await this.policyService.checkRenewals();

    const results = {
      total: policies.length,
      successful: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const policy of policies) {
      try {
        await this.policyService.processRenewal(policy, userId);
        await this.policyService.notifyRenewal(policy);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          policyId: policy.id,
          policyNumber: policy.policyNumber,
          error: error.message
        });
      }
    }

    return results;
  }

  // ==================== VALIDACIONES ====================

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar datos de póliza sin crearla' })
  @ApiResponse({ status: 200, description: 'Resultado de validación con errores y warnings' })
  async validatePolicy(@Body() policyDto: CreatePolicyDto) {
    return this.policyService.validatePolicy(policyDto);
  }

  @Post(':id/validate-endorsement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar endoso antes de aplicarlo' })
  @ApiResponse({ status: 200, description: 'Resultado de validación' })
  async validateEndorsement(
    @Param('id') id: string,
    @Body() endorseDto: EndorsePolicyDto
  ) {
    return this.policyService.validateEndorsement(id, endorseDto);
  }

  @Get(':id/can-cancel')
  @ApiOperation({ summary: 'Verificar si una póliza puede ser cancelada' })
  @ApiResponse({ status: 200, description: 'Indica si puede cancelarse y razones' })
  async canCancel(@Param('id') id: string) {
    const canCancel = await this.policyService.canCancel(id);
    return {
      policyId: id,
      canCancel,
      reason: canCancel ? 'Policy can be cancelled' : 'Policy has active claims or pending payments'
    };
  }

  @Get(':id/overlaps')
  @ApiOperation({ summary: 'Verificar solapamientos con otras pólizas del cliente' })
  @ApiResponse({ status: 200, description: 'Indica si hay solapamientos' })
  async checkOverlaps(@Param('id') id: string) {
    const policy = await this.policyService.findOne(id);
    const hasOverlap = await this.policyService.checkOverlappingPolicies(
      policy.partyId,
      policy.type,
      policy.effectiveDate
    );
    return {
      policyId: id,
      hasOverlap,
      message: hasOverlap ? 'Customer has overlapping policies' : 'No overlaps detected'
    };
  }

  // ==================== BENEFICIARIOS ====================

  @Post(':id/beneficiaries')
  @ApiOperation({ summary: 'Añadir beneficiario a la póliza' })
  @ApiResponse({ status: 201, description: 'Beneficiario añadido' })
  async addBeneficiary(
    @Param('id') id: string,
    @Body() beneficiaryDto: AddBeneficiaryDto,
    @Req() req: any
  ) {
    // Integración con módulo de beneficiarios
    return { message: 'Beneficiary management to be implemented' };
  }

  @Get(':id/beneficiaries')
  @ApiOperation({ summary: 'Listar beneficiarios de la póliza' })
  @ApiResponse({ status: 200, description: 'Lista de beneficiarios' })
  async getBeneficiaries(@Param('id') id: string) {
    // Integración con módulo de beneficiarios
    return [];
  }

  // ==================== BÚSQUEDA Y FILTROS ESPECIALIZADOS ====================

  @Get('search/by-number/:policyNumber')
  @ApiOperation({ summary: 'Buscar póliza por número' })
  @ApiResponse({ status: 200, description: 'Póliza encontrada' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async findByPolicyNumber(@Param('policyNumber') policyNumber: string) {
    // Implementar búsqueda por número
    return { message: 'Search by policy number to be implemented' };
  }

  @Get('search/by-plate/:plate')
  @ApiOperation({ summary: 'Buscar póliza de auto por matrícula' })
  @ApiResponse({ status: 200, description: 'Póliza encontrada' })
  async findByPlate(@Param('plate') plate: string) {
    // Implementar búsqueda por matrícula
    return { message: 'Search by plate to be implemented' };
  }
}
