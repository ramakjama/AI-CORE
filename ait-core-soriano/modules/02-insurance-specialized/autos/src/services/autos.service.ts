import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguroAutos, CreateSeguroAutosDto, TipoCobertura } from '../models/autos.model';

@Injectable()
export class AutosService {
  constructor(
    @InjectRepository(SeguroAutos)
    private readonly autosRepository: Repository<SeguroAutos>,
  ) {}

  calcularPrimaAnual(params: {
    edadConductor: number;
    antiguedadCarnet: number;
    valorVehiculo: number;
    tipoCobertura: TipoCobertura;
    codigoPostal: string;
    bonusMalus: number;
    parking: boolean;
    kmAnuales: number;
  }): number {
    let primaBase = 400; // Base anual

    // Factor edad conductor
    if (params.edadConductor < 25) primaBase *= 1.8;
    else if (params.edadConductor < 30) primaBase *= 1.3;
    else if (params.edadConductor > 65) primaBase *= 1.2;

    // Factor antigüedad carnet
    if (params.antiguedadCarnet < 2) primaBase *= 1.5;
    else if (params.antiguedadCarnet < 5) primaBase *= 1.2;

    // Factor tipo cobertura
    switch (params.tipoCobertura) {
      case TipoCobertura.TERCEROS:
        primaBase *= 0.5;
        break;
      case TipoCobertura.TERCEROS_AMPLIADO:
        primaBase *= 0.7;
        break;
      case TipoCobertura.TODO_RIESGO_FRANQUICIA:
        primaBase *= 1.3;
        break;
      case TipoCobertura.TODO_RIESGO:
        primaBase *= 1.5;
        break;
    }

    // Factor valor vehículo
    primaBase += (params.valorVehiculo / 1000) * 3;

    // Bonus/Malus (cada año sin siniestro -5%, con siniestro +25%)
    const factorBonus = 1 - (params.bonusMalus * 0.05);
    primaBase *= Math.max(factorBonus, 0.4); // Mínimo 40% de descuento

    // Descuento parking
    if (params.parking) primaBase *= 0.95;

    // Factor km anuales
    if (params.kmAnuales > 30000) primaBase *= 1.2;
    else if (params.kmAnuales < 10000) primaBase *= 0.9;

    return Math.round(primaBase * 100) / 100;
  }

  async create(createDto: CreateSeguroAutosDto): Promise<SeguroAutos> {
    const seguro = this.autosRepository.create(createDto);
    return await this.autosRepository.save(seguro);
  }

  async findAll(): Promise<SeguroAutos[]> {
    return await this.autosRepository.find();
  }

  async findOne(id: string): Promise<SeguroAutos> {
    const seguro = await this.autosRepository.findOne({ where: { id } });
    if (!seguro) throw new NotFoundException(`Seguro autos ${id} no encontrado`);
    return seguro;
  }

  async findByMatricula(matricula: string): Promise<SeguroAutos[]> {
    return await this.autosRepository.find({ where: { matricula } });
  }

  async update(id: string, updateDto: Partial<CreateSeguroAutosDto>): Promise<SeguroAutos> {
    await this.autosRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.autosRepository.delete(id);
  }

  async generarPresupuesto(datos: any): Promise<any> {
    const primaAnual = this.calcularPrimaAnual(datos);
    return {
      prima_anual: primaAnual,
      prima_mensual: Math.round((primaAnual / 12) * 1.03 * 100) / 100,
      bonus_malus: datos.bonusMalus,
      descuento_aplicado: datos.bonusMalus * 5,
      coberturas_incluidas: this.getCoberturasSegunTipo(datos.tipoCobertura),
      franquicia: datos.tipoCobertura === TipoCobertura.TODO_RIESGO_FRANQUICIA ? 300 : 0
    };
  }

  private getCoberturasSegunTipo(tipo: TipoCobertura): any {
    const base = {
      rc_ilimitada: true,
      asistencia_viaje_nacional: true,
      defensa_juridica: true
    };

    if (tipo === TipoCobertura.TODO_RIESGO || tipo === TipoCobertura.TODO_RIESGO_FRANQUICIA) {
      return {
        ...base,
        lunas: true,
        robo: true,
        incendio: true,
        daños_propios: true,
        vehiculo_sustitucion: true,
        conductor_novel: true
      };
    }

    if (tipo === TipoCobertura.TERCEROS_AMPLIADO) {
      return { ...base, lunas: true, robo: true, incendio: true };
    }

    return base;
  }
}
