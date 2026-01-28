import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguroHogar, CreateSeguroHogarDto, TipoVivienda } from '../models/hogar.model';

@Injectable()
export class HogarService {
  constructor(
    @InjectRepository(SeguroHogar)
    private readonly hogarRepository: Repository<SeguroHogar>,
  ) {}

  calcularPrimaAnual(params: {
    valorContinente: number;
    valorContenido: number;
    superficie: number;
    tipoVivienda: TipoVivienda;
    codigoPostal: string;
    medidasSeguridad: any;
    viviendaHabitual: boolean;
  }): number {
    let primaBase = 150; // Base anual

    // Factor valor asegurado
    const valorTotal = params.valorContinente + params.valorContenido;
    primaBase += (valorTotal / 1000) * 0.5;

    // Factor superficie
    primaBase += (params.superficie / 10) * 2;

    // Factor tipo vivienda
    if (params.tipoVivienda === TipoVivienda.CHALET) primaBase *= 1.3;
    else if (params.tipoVivienda === TipoVivienda.ATICO) primaBase *= 1.15;

    // Descuento medidas seguridad
    if (params.medidasSeguridad?.alarma) primaBase *= 0.90;
    if (params.medidasSeguridad?.puerta_blindada) primaBase *= 0.95;

    // Descuento vivienda habitual
    if (params.viviendaHabitual) primaBase *= 0.92;

    // Factor riesgo por zona (simplificado)
    const cp = parseInt(params.codigoPostal.substring(0, 2));
    if (cp === 28 || cp === 8 || cp === 41) primaBase *= 1.1; // Madrid, Barcelona, Sevilla

    return Math.round(primaBase * 100) / 100;
  }

  async create(createDto: CreateSeguroHogarDto): Promise<SeguroHogar> {
    const seguro = this.hogarRepository.create(createDto);
    return await this.hogarRepository.save(seguro);
  }

  async findAll(): Promise<SeguroHogar[]> {
    return await this.hogarRepository.find();
  }

  async findOne(id: string): Promise<SeguroHogar> {
    const seguro = await this.hogarRepository.findOne({ where: { id } });
    if (!seguro) throw new NotFoundException(`Seguro hogar ${id} no encontrado`);
    return seguro;
  }

  async update(id: string, updateDto: Partial<CreateSeguroHogarDto>): Promise<SeguroHogar> {
    await this.hogarRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.hogarRepository.delete(id);
  }

  async generarPresupuesto(datos: any): Promise<any> {
    const primaAnual = this.calcularPrimaAnual(datos);
    return {
      prima_anual: primaAnual,
      prima_mensual: Math.round((primaAnual / 12) * 100) / 100,
      valor_continente: datos.valorContinente,
      valor_contenido: datos.valorContenido,
      coberturas: {
        incendio: datos.valorContinente + datos.valorContenido,
        agua: datos.valorContinente + datos.valorContenido,
        robo: datos.valorContenido,
        rc_familiar: 300000,
        cristales: 3000,
        asistencia_hogar_24h: true
      }
    };
  }
}
