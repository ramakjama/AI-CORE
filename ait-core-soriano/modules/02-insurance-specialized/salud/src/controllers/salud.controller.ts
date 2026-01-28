import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { SaludService } from '../services/salud.service';
import { CreateSeguroSaludDto } from '../models/salud.model';

@Controller('api/seguros/salud')
export class SaludController {
  constructor(private readonly saludService: SaludService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSeguroSaludDto) {
    return await this.saludService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.saludService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.saludService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateSeguroSaludDto>) {
    return await this.saludService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.saludService.remove(id);
  }

  @Post('calcular-prima')
  async calcularPrima(@Body() params: any) {
    return {
      prima_mensual: this.saludService.calcularPrimaMensual(params),
      parametros: params
    };
  }

  @Post('presupuesto')
  async generarPresupuesto(@Body() datos: any) {
    return await this.saludService.generarPresupuesto(datos);
  }

  @Post(':id/verificar-autorizacion')
  async verificarAutorizacion(@Param('id') id: string, @Body() body: { tipoPrestacion: string }) {
    return await this.saludService.verificarAutorizacion(id, body.tipoPrestacion);
  }
}
