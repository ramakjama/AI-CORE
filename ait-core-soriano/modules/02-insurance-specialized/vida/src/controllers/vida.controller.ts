import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { VidaService } from '../services/vida.service';
import { CreateSeguroVidaDto } from '../models/vida.model';

@Controller('api/seguros/vida')
export class VidaController {
  constructor(private readonly vidaService: VidaService) {}

  /**
   * POST /api/seguros/vida
   * Crear nueva póliza de vida
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSeguroVidaDto) {
    return await this.vidaService.create(createDto);
  }

  /**
   * GET /api/seguros/vida
   * Listar todas las pólizas de vida
   */
  @Get()
  async findAll() {
    return await this.vidaService.findAll();
  }

  /**
   * GET /api/seguros/vida/:id
   * Obtener póliza por ID
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.vidaService.findOne(id);
  }

  /**
   * GET /api/seguros/vida/asegurado/:aseguradoId
   * Obtener pólizas de un asegurado
   */
  @Get('asegurado/:aseguradoId')
  async findByAsegurado(@Param('aseguradoId') aseguradoId: string) {
    return await this.vidaService.findByAsegurado(aseguradoId);
  }

  /**
   * PUT /api/seguros/vida/:id
   * Actualizar póliza
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateSeguroVidaDto>) {
    return await this.vidaService.update(id, updateDto);
  }

  /**
   * DELETE /api/seguros/vida/:id
   * Eliminar póliza
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.vidaService.remove(id);
  }

  /**
   * POST /api/seguros/vida/calcular-prima
   * Calcular prima de seguro de vida
   */
  @Post('calcular-prima')
  async calcularPrima(@Body() params: any) {
    return {
      prima_anual: this.vidaService.calcularPrima(params),
      parametros: params
    };
  }

  /**
   * POST /api/seguros/vida/presupuesto
   * Generar presupuesto completo
   */
  @Post('presupuesto')
  async generarPresupuesto(@Body() datos: any) {
    return await this.vidaService.generarPresupuesto(datos);
  }

  /**
   * POST /api/seguros/vida/verificar-asegurabilidad
   * Verificar si cumple requisitos de asegurabilidad
   */
  @Post('verificar-asegurabilidad')
  async verificarAsegurabilidad(@Body() datosAsegurado: any) {
    return await this.vidaService.verificarRequisitosAsegurabilidad(datosAsegurado);
  }

  /**
   * GET /api/seguros/vida/:id/valor-rescate
   * Calcular valor de rescate
   */
  @Get(':id/valor-rescate')
  async calcularValorRescate(@Param('id') id: string, @Query('fecha') fecha?: string) {
    const fechaRescate = fecha ? new Date(fecha) : new Date();
    return {
      valor_rescate: await this.vidaService.calcularValorRescate(id, fechaRescate),
      fecha_calculo: fechaRescate
    };
  }
}
