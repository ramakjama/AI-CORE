import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguroSalud, CreateSeguroSaludDto, ModalidadSalud, TipoCoberturaSalud } from '../models/salud.model';

@Injectable()
export class SaludService {
  constructor(
    @InjectRepository(SeguroSalud)
    private readonly saludRepository: Repository<SeguroSalud>,
  ) {}

  /**
   * Calcula la prima mensual de seguro de salud
   */
  calcularPrimaMensual(params: {
    edad: number;
    modalidad: ModalidadSalud;
    tipoCobertura: TipoCoberturaSalud;
    cuadroMedico: string;
  }): number {
    let primaBase = 50; // Base 50€

    // Factor edad
    if (params.edad < 25) primaBase *= 0.8;
    else if (params.edad < 35) primaBase *= 1.0;
    else if (params.edad < 45) primaBase *= 1.3;
    else if (params.edad < 55) primaBase *= 1.8;
    else if (params.edad < 65) primaBase *= 2.5;
    else primaBase *= 3.5;

    // Factor modalidad
    switch (params.modalidad) {
      case ModalidadSalud.CON_COPAGOS:
        primaBase *= 0.7; // 30% descuento con copagos
        break;
      case ModalidadSalud.REEMBOLSO:
        primaBase *= 1.4; // Prima más alta
        break;
      case ModalidadSalud.MIXTO:
        primaBase *= 1.2;
        break;
    }

    // Factor tipo cobertura
    switch (params.tipoCobertura) {
      case TipoCoberturaSalud.BASICA:
        primaBase *= 0.6;
        break;
      case TipoCoberturaSalud.PREMIUM:
        primaBase *= 1.5;
        break;
      case TipoCoberturaSalud.DENTAL:
        primaBase *= 0.3;
        break;
    }

    // Factor cuadro médico
    if (params.cuadroMedico === 'Nacional') primaBase *= 1.2;
    else if (params.cuadroMedico === 'Provincial') primaBase *= 1.0;
    else if (params.cuadroMedico === 'Local') primaBase *= 0.85;

    return Math.round(primaBase * 100) / 100;
  }

  /**
   * Verifica disponibilidad de autorizaciones
   */
  async verificarAutorizacion(polizaId: string, tipoPrestacion: string): Promise<{
    autorizado: boolean;
    requiere_autorizacion: boolean;
    periodo_carencia_cumplido: boolean;
    observaciones: string[];
  }> {
    const poliza = await this.findOne(polizaId);
    const observaciones: string[] = [];

    // Verificar periodo de carencia
    const mesesTranscurridos = this.calcularMesesDesdeInicio(poliza.fechaInicio);
    const carenciaCumplida = mesesTranscurridos >= poliza.periodoCarenciaMeses;

    if (!carenciaCumplida) {
      observaciones.push(`Periodo de carencia: ${poliza.periodoCarenciaMeses - mesesTranscurridos} meses restantes`);
    }

    // Prestaciones que requieren autorización previa
    const requiereAutorizacion = [
      'cirugia',
      'hospitalizacion',
      'pruebas_especializadas',
      'resonancia',
      'tac'
    ].includes(tipoPrestacion);

    return {
      autorizado: carenciaCumplida,
      requiere_autorizacion: requiereAutorizacion,
      periodo_carencia_cumplido: carenciaCumplida,
      observaciones
    };
  }

  private calcularMesesDesdeInicio(fechaInicio: Date): number {
    const ahora = new Date();
    const diffTime = Math.abs(ahora.getTime() - new Date(fechaInicio).getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
  }

  async create(createDto: CreateSeguroSaludDto): Promise<SeguroSalud> {
    const seguro = this.saludRepository.create(createDto);
    return await this.saludRepository.save(seguro);
  }

  async findAll(): Promise<SeguroSalud[]> {
    return await this.saludRepository.find();
  }

  async findOne(id: string): Promise<SeguroSalud> {
    const seguro = await this.saludRepository.findOne({ where: { id } });
    if (!seguro) {
      throw new NotFoundException(`Seguro de salud con ID ${id} no encontrado`);
    }
    return seguro;
  }

  async update(id: string, updateDto: Partial<CreateSeguroSaludDto>): Promise<SeguroSalud> {
    await this.saludRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.saludRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Seguro de salud con ID ${id} no encontrado`);
    }
  }

  async generarPresupuesto(datos: any): Promise<any> {
    const primaMensual = this.calcularPrimaMensual(datos);

    return {
      prima_mensual: primaMensual,
      prima_anual: primaMensual * 12,
      modalidad: datos.modalidad,
      tipo_cobertura: datos.tipoCobertura,
      cuadro_medico: datos.cuadroMedico,
      periodo_carencia: 6,
      copagos: datos.modalidad === ModalidadSalud.CON_COPAGOS ? {
        consulta_especialista: 10,
        pruebas_diagnosticas: 15,
        urgencias: 25,
        fisioterapia: 8
      } : null,
      coberturas_incluidas: this.getCoberturasSegunTipo(datos.tipoCobertura)
    };
  }

  private getCoberturasSegunTipo(tipo: TipoCoberturaSalud): any {
    const coberturasBase = {
      medicina_general: true,
      especialistas: true,
      urgencias: true,
      pruebas_diagnosticas: true,
      hospitalizacion: true
    };

    if (tipo === TipoCoberturaSalud.PREMIUM) {
      return {
        ...coberturasBase,
        cirugia: true,
        maternidad: true,
        dental: true,
        fisioterapia: true,
        psicologia: true,
        segunda_opinion_medica: true
      };
    }

    return coberturasBase;
  }
}
