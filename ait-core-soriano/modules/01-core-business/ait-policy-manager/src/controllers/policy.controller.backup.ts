import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PolicyService } from '../services/policy.service';
import { CreatePolicyDto, UpdatePolicyDto, RenewPolicyDto, EndorsePolicyDto, CancelPolicyDto, PolicyStatus } from '../dto/create-policy.dto';

@ApiTags('Policies')
@ApiBearerAuth()
@Controller('api/v1/policies')
export class PolicyController {
  constructor(private readonly policyService: PolicyService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva póliza' })
  @ApiResponse({ status: 201, description: 'Póliza creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Cliente o producto no encontrado' })
  async create(@Body() createPolicyDto: CreatePolicyDto, @Req() req: any) {
    const userId = req.user?.id || 'system';
    return this.policyService.create(createPolicyDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar pólizas con filtros opcionales' })
  @ApiQuery({ name: 'status', enum: PolicyStatus, required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'clientId', required: false })
  @ApiQuery({ name: 'agentId', required: false })
  @ApiResponse({ status: 200, description: 'Lista de pólizas' })
  async findAll(
    @Query('status') status?: PolicyStatus,
    @Query('type') type?: string,
    @Query('clientId') clientId?: string,
    @Query('agentId') agentId?: string
  ) {
    return this.policyService.findAll({ status, type, clientId, agentId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una póliza' })
  @ApiResponse({ status: 200, description: 'Detalles de la póliza' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.policyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar póliza' })
  @ApiResponse({ status: 200, description: 'Póliza actualizada' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
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
  @ApiOperation({ summary: 'Eliminar póliza (soft delete)' })
  @ApiResponse({ status: 204, description: 'Póliza eliminada' })
  @ApiResponse({ status: 404, description: 'Póliza no encontrada' })
  async remove(@Param('id') id: string) {
    // Implementar soft delete si es necesario
    return { message: 'Not implemented - use cancel instead' };
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renovar póliza' })
  @ApiResponse({ status: 201, description: 'Póliza renovada exitosamente' })
  @ApiResponse({ status: 400, description: 'Póliza no puede ser renovada' })
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
  @ApiResponse({ status: 400, description: 'Póliza no puede ser modificada' })
  async endorse(
    @Param('id') id: string,
    @Body() endorseDto: EndorsePolicyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.endorse(id, endorseDto, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancelar póliza' })
  @ApiResponse({ status: 200, description: 'Póliza cancelada exitosamente' })
  @ApiResponse({ status: 400, description: 'Póliza ya está cancelada' })
  async cancel(
    @Param('id') id: string,
    @Body() cancelDto: CancelPolicyDto,
    @Req() req: any
  ) {
    const userId = req.user?.id || 'system';
    return this.policyService.cancel(id, cancelDto, userId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Obtener historial completo de la póliza' })
  @ApiResponse({ status: 200, description: 'Historial de cambios y endosos' })
  async getHistory(@Param('id') id: string) {
    return this.policyService.getHistory(id);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Listar documentos asociados a la póliza' })
  @ApiResponse({ status: 200, description: 'Lista de documentos' })
  async getDocuments(@Param('id') id: string) {
    // Integración con ait-document-vault
    return { message: 'Integration with ait-document-vault pending' };
  }
}
