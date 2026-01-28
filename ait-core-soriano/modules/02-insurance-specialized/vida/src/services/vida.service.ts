import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeguroVida, CreateSeguroVidaDto, TipoSeguroVida } from '../models/vida.model';

@Injectable()
export class VidaService {
  constructor(
    @InjectRepository(SeguroVida)
    private readonly vidaRepository: Repository<SeguroVida>,
  ) {}

  /**
   * Calcula la prima de un seguro de vida según tablas actuariales españolas
   */
  calcularPrima(params: {
    edad: number;
    sexo: string;
    capital: number;
    tipo: TipoSeguroVida;
    duracion: number;
    fumador: boolean;
    profesion_riesgo: boolean;
  }): number {
    // Tabla base de mortalidad española (PERM/F 2000)
    let tasaBase = 0.001; // 0.1% base

    // Factor edad
    if (params.edad < 30) tasaBase *= 0.5;
    else if (params.edad < 40) tasaBase *= 0.8;
    else if (params.edad < 50) tasaBase *= 1.2;
    else if (params.edad < 60) tasaBase *= 2.0;
    else if (params.edad < 70) tasaBase *= 3.5;
    else tasaBase *= 5.0;

    // Factor sexo (mujeres viven más)
    if (params.sexo === 'F') tasaBase *= 0.85;

    // Factor fumador
    if (params.fumador) tasaBase *= 1.5;

    // Factor profesión de riesgo
    if (params.profesion_riesgo) tasaBase *= 1.3;

    // Factor tipo de seguro
    switch (params.tipo) {
      case TipoSeguroVida.VIDA_RIESGO:
        tasaBase *= 0.7; // Más barato, solo riesgo
        break;
      case TipoSeguroVida.VIDA_AHORRO:
        tasaBase *= 1.5; // Más caro, incluye ahorro
        break;
      case TipoSeguroVida.MIXTO:
        tasaBase *= 1.8; // El más completo
        break;
    }

    // Cálculo prima anual
    const primaAnual = params.capital * tasaBase;

    // Recargo por fraccionamiento y gastos
    const recargoGestion = 1.05; // 5% gastos

    return Math.round(primaAnual * recargoGestion * 100) / 100;
  }

  /**
   * Calcula el valor de rescate de una póliza de vida-ahorro
   */
  calcularValorRescate(polizaId: string, fechaRescate: Date): Promise<number> {
    // Implementar cálculo de valor de rescate según provisión matemática
    // y penalizaciones por rescate anticipado (normalmente primeros 2 años)
    return Promise.resolve(0);
  }

  /**
   * Verifica si un asegurado cumple requisitos médicos
   */
  async verificarRequisitosAsegurabilidad(datosAsegurado: any): Promise<{
    aprobado: boolean;
    requiere_cuestionario_medico: boolean;
    requiere_reconocimiento_medico: boolean;
    observaciones: string[];
  }> {
    const edad = datosAsegurado.edad;
    const capital = datosAsegurado.capital;
    const observaciones: string[] = [];

    let requiereCuestionario = false;
    let requiereReconocimiento = false;

    // Límites estándar mercado español
    if (edad > 65 || capital > 300000) {
      requiereCuestionario = true;
      observaciones.push('Requiere cuestionario médico por edad o capital');
    }

    if (capital > 600000 || edad > 70) {
      requiereReconocimiento = true;
      observaciones.push('Requiere reconocimiento médico completo');
    }

    if (datosAsegurado.deportes_riesgo) {
      requiereCuestionario = true;
      observaciones.push('Practica deportes de riesgo - evaluación especial');
    }

    return {
      aprobado: edad <= 75 && edad >= 18,
      requiere_cuestionario_medico: requiereCuestionario,
      requiere_reconocimiento_medico: requiereReconocimiento,
      observaciones
    };
  }

  async create(createDto: CreateSeguroVidaDto): Promise<SeguroVida> {
    const seguro = this.vidaRepository.create(createDto);
    return await this.vidaRepository.save(seguro);
  }

  async findAll(): Promise<SeguroVida[]> {
    return await this.vidaRepository.find();
  }

  async findOne(id: string): Promise<SeguroVida> {
    const seguro = await this.vidaRepository.findOne({ where: { id } });
    if (!seguro) {
      throw new NotFoundException(`Seguro de vida con ID ${id} no encontrado`);
    }
    return seguro;
  }

  async findByAsegurado(aseguradoId: string): Promise<SeguroVida[]> {
    return await this.vidaRepository.find({ where: { aseguradoId } });
  }

  async update(id: string, updateDto: Partial<CreateSeguroVidaDto>): Promise<SeguroVida> {
    await this.vidaRepository.update(id, updateDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const result = await this.vidaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Seguro de vida con ID ${id} no encontrado`);
    }
  }

  /**
   * Genera un presupuesto detallado de seguro de vida
   */
  async generarPresupuesto(datos: any): Promise<any> {
    const primaAnual = this.calcularPrima(datos);
    const asegurabilidad = await this.verificarRequisitosAsegurabilidad(datos);

    return {
      capital_asegurado: datos.capital,
      prima_anual: primaAnual,
      prima_mensual: Math.round((primaAnual / 12) * 1.03 * 100) / 100, // 3% recargo fraccionamiento
      prima_trimestral: Math.round((primaAnual / 4) * 1.02 * 100) / 100,
      prima_semestral: Math.round((primaAnual / 2) * 1.01 * 100) / 100,
      duracion: datos.duracion,
      total_a_pagar: primaAnual * datos.duracion,
      asegurabilidad,
      coberturas_incluidas: {
        fallecimiento: true,
        invalidez_permanente_absoluta: datos.capital,
        invalidez_permanente_total: datos.capital * 0.5,
        asistencia_funeraria: 3000
      },
      observaciones: [
        'Primas calculadas según tarifa 2025',
        'Incluye asistencia telefónica 24h',
        'Adelanto capital en caso de enfermedad terminal',
        'Sin periodo de carencia para accidentes'
      ]
    };
  }
}
