import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { HogarService } from '../services/hogar.service';
import { CreateSeguroHogarDto } from '../models/hogar.model';

@Controller('api/seguros/hogar')
export class HogarController {
  constructor(private readonly hogarService: HogarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSeguroHogarDto) {
    return await this.hogarService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.hogarService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.hogarService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateSeguroHogarDto>) {
    return await this.hogarService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.hogarService.remove(id);
  }

  @Post('calcular-prima')
  async calcularPrima(@Body() params: any) {
    return { prima_anual: this.hogarService.calcularPrimaAnual(params) };
  }

  @Post('presupuesto')
  async generarPresupuesto(@Body() datos: any) {
    return await this.hogarService.generarPresupuesto(datos);
  }
}
