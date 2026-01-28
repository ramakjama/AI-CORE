import { Controller, Get, Post, Put, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { AutosService } from '../services/autos.service';
import { CreateSeguroAutosDto } from '../models/autos.model';

@Controller('api/seguros/autos')
export class AutosController {
  constructor(private readonly autosService: AutosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateSeguroAutosDto) {
    return await this.autosService.create(createDto);
  }

  @Get()
  async findAll() {
    return await this.autosService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.autosService.findOne(id);
  }

  @Get('matricula/:matricula')
  async findByMatricula(@Param('matricula') matricula: string) {
    return await this.autosService.findByMatricula(matricula);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateDto: Partial<CreateSeguroAutosDto>) {
    return await this.autosService.update(id, updateDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.autosService.remove(id);
  }

  @Post('calcular-prima')
  async calcularPrima(@Body() params: any) {
    return { prima_anual: this.autosService.calcularPrimaAnual(params) };
  }

  @Post('presupuesto')
  async generarPresupuesto(@Body() datos: any) {
    return await this.autosService.generarPresupuesto(datos);
  }
}
