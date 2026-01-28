import { Injectable, Logger } from '@nestjs/common';
import { DamageAssessment, DamageItem } from '../entities/claim.entity';

/**
 * Resultado de análisis de imagen
 */
export interface ImageAnalysisResult {
  damageDetected: boolean;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS';
  confidence: number;
  damageAreas: DamageArea[];
  suggestedRepairCost: number;
  repairDuration: number; // días
}

/**
 * Área dañada detectada en imagen
 */
export interface DamageArea {
  location: string; // frontal, lateral, trasero, etc.
  type: string; // abolladura, rayadura, rotura, etc.
  severity: number; // 0-100
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Servicio para evaluación de daños usando Computer Vision
 */
@Injectable()
export class DamageAssessmentService {
  private readonly logger = new Logger(DamageAssessmentService.name);

  /**
   * Evalúa daños en vehículo usando imágenes
   */
  async assessVehicleDamage(images: Buffer[]): Promise<DamageAssessment> {
    this.logger.log(`Assessing vehicle damage from ${images.length} images`);

    const analyses: ImageAnalysisResult[] = [];

    // Analizar cada imagen
    for (let i = 0; i < images.length; i++) {
      const analysis = await this.analyzeVehicleImage(images[i]);
      analyses.push(analysis);
    }

    // Consolidar resultados
    const assessment = this.consolidateVehicleAssessment(analyses);

    this.logger.log(
      `Vehicle damage assessed: ${assessment.severity} - Estimated cost: €${assessment.estimatedCost}`,
    );

    return assessment;
  }

  /**
   * Evalúa daños en propiedad
   */
  async assessPropertyDamage(images: Buffer[]): Promise<DamageAssessment> {
    this.logger.log(`Assessing property damage from ${images.length} images`);

    const analyses: ImageAnalysisResult[] = [];

    for (const image of images) {
      const analysis = await this.analyzePropertyImage(image);
      analyses.push(analysis);
    }

    const assessment = this.consolidatePropertyAssessment(analyses);

    this.logger.log(
      `Property damage assessed: ${assessment.severity} - Estimated cost: €${assessment.estimatedCost}`,
    );

    return assessment;
  }

  /**
   * Estima costo de reparación basado en evaluación
   */
  async estimateRepairCost(assessment: DamageAssessment): Promise<number> {
    let totalCost = 0;

    // Sumar costos de items
    for (const item of assessment.items) {
      totalCost += item.totalCost;
    }

    // Aplicar multiplicadores según severidad
    const severityMultipliers = {
      MINOR: 1.0,
      MODERATE: 1.2,
      MAJOR: 1.5,
      TOTAL_LOSS: 2.0,
    };

    const multiplier = severityMultipliers[assessment.severity] || 1.0;
    totalCost *= multiplier;

    // Añadir costos indirectos (10%)
    totalCost *= 1.1;

    this.logger.log(`Estimated repair cost: €${totalCost.toFixed(2)}`);

    return Math.round(totalCost * 100) / 100;
  }

  /**
   * Analiza imagen de vehículo para detectar daños
   */
  private async analyzeVehicleImage(image: Buffer): Promise<ImageAnalysisResult> {
    // En producción, usar servicios como:
    // - Google Cloud Vision API
    // - AWS Rekognition
    // - Azure Computer Vision
    // - Modelos propios de ML

    // Simulación para desarrollo
    return this.simulateVehicleAnalysis(image);
  }

  /**
   * Analiza imagen de propiedad
   */
  private async analyzePropertyImage(image: Buffer): Promise<ImageAnalysisResult> {
    return this.simulatePropertyAnalysis(image);
  }

  /**
   * Consolida múltiples análisis de vehículo en una evaluación final
   */
  private consolidateVehicleAssessment(analyses: ImageAnalysisResult[]): DamageAssessment {
    // Determinar severidad general (la más alta)
    const severities = ['MINOR', 'MODERATE', 'MAJOR', 'TOTAL_LOSS'];
    let maxSeverityIndex = 0;

    for (const analysis of analyses) {
      const index = severities.indexOf(analysis.severity);
      if (index > maxSeverityIndex) {
        maxSeverityIndex = index;
      }
    }

    const overallSeverity = severities[maxSeverityIndex] as any;

    // Consolidar áreas dañadas
    const allDamageAreas: DamageArea[] = [];
    for (const analysis of analyses) {
      allDamageAreas.push(...analysis.damageAreas);
    }

    // Generar items de reparación
    const items = this.generateVehicleRepairItems(allDamageAreas);

    // Calcular costo total
    const estimatedCost = items.reduce((sum, item) => sum + item.totalCost, 0);

    // Estimar duración de reparación
    const repairDuration = this.estimateRepairDuration(overallSeverity, items.length);

    const assessment: DamageAssessment = {
      id: this.generateId(),
      claimId: '', // Se asignará después
      type: 'VEHICLE',
      severity: overallSeverity,
      description: this.generateDamageDescription(allDamageAreas),
      estimatedCost,
      repairDuration,
      items,
      assessedAt: new Date(),
      images: [], // Se asignarán las URLs después
    };

    return assessment;
  }

  /**
   * Consolida análisis de propiedad
   */
  private consolidatePropertyAssessment(analyses: ImageAnalysisResult[]): DamageAssessment {
    const severities = ['MINOR', 'MODERATE', 'MAJOR', 'TOTAL_LOSS'];
    let maxSeverityIndex = 0;

    for (const analysis of analyses) {
      const index = severities.indexOf(analysis.severity);
      if (index > maxSeverityIndex) {
        maxSeverityIndex = index;
      }
    }

    const overallSeverity = severities[maxSeverityIndex] as any;

    const allDamageAreas: DamageArea[] = [];
    for (const analysis of analyses) {
      allDamageAreas.push(...analysis.damageAreas);
    }

    const items = this.generatePropertyRepairItems(allDamageAreas);
    const estimatedCost = items.reduce((sum, item) => sum + item.totalCost, 0);
    const repairDuration = this.estimateRepairDuration(overallSeverity, items.length);

    return {
      id: this.generateId(),
      claimId: '',
      type: 'PROPERTY',
      severity: overallSeverity,
      description: this.generateDamageDescription(allDamageAreas),
      estimatedCost,
      repairDuration,
      items,
      assessedAt: new Date(),
    };
  }

  /**
   * Genera items de reparación para vehículo
   */
  private generateVehicleRepairItems(damageAreas: DamageArea[]): DamageItem[] {
    const items: DamageItem[] = [];
    const seenLocations = new Set<string>();

    for (const area of damageAreas) {
      if (seenLocations.has(area.location)) continue;
      seenLocations.add(area.location);

      // Determinar tipo de reparación y costo
      const repairInfo = this.getVehicleRepairInfo(area);

      items.push({
        id: this.generateId(),
        name: repairInfo.name,
        description: repairInfo.description,
        quantity: 1,
        unitCost: repairInfo.cost,
        totalCost: repairInfo.cost,
        repairOrReplace: repairInfo.repairOrReplace,
      });
    }

    return items;
  }

  /**
   * Genera items de reparación para propiedad
   */
  private generatePropertyRepairItems(damageAreas: DamageArea[]): DamageItem[] {
    const items: DamageItem[] = [];

    for (const area of damageAreas) {
      const repairInfo = this.getPropertyRepairInfo(area);

      items.push({
        id: this.generateId(),
        name: repairInfo.name,
        description: repairInfo.description,
        quantity: 1,
        unitCost: repairInfo.cost,
        totalCost: repairInfo.cost,
        repairOrReplace: repairInfo.repairOrReplace,
      });
    }

    return items;
  }

  /**
   * Obtiene información de reparación para vehículo
   */
  private getVehicleRepairInfo(area: DamageArea): any {
    const repairCosts: Record<string, any> = {
      frontal: {
        name: 'Reparación frontal',
        description: `${area.type} en zona frontal`,
        cost: area.severity > 70 ? 1500 : area.severity > 40 ? 800 : 400,
        repairOrReplace: area.severity > 70 ? 'REPLACE' : 'REPAIR',
      },
      lateral: {
        name: 'Reparación lateral',
        description: `${area.type} en zona lateral`,
        cost: area.severity > 70 ? 1200 : area.severity > 40 ? 600 : 300,
        repairOrReplace: area.severity > 70 ? 'REPLACE' : 'REPAIR',
      },
      trasero: {
        name: 'Reparación trasera',
        description: `${area.type} en zona trasera`,
        cost: area.severity > 70 ? 1300 : area.severity > 40 ? 700 : 350,
        repairOrReplace: area.severity > 70 ? 'REPLACE' : 'REPAIR',
      },
    };

    return repairCosts[area.location] || {
      name: 'Reparación general',
      description: area.type,
      cost: 500,
      repairOrReplace: 'REPAIR',
    };
  }

  /**
   * Obtiene información de reparación para propiedad
   */
  private getPropertyRepairInfo(area: DamageArea): any {
    return {
      name: `Reparación ${area.location}`,
      description: area.type,
      cost: area.severity * 10, // Simplificado
      repairOrReplace: area.severity > 70 ? 'REPLACE' : 'REPAIR',
    };
  }

  /**
   * Estima duración de reparación
   */
  private estimateRepairDuration(severity: string, itemCount: number): number {
    const baseDays: Record<string, number> = {
      MINOR: 2,
      MODERATE: 5,
      MAJOR: 10,
      TOTAL_LOSS: 30,
    };

    const base = baseDays[severity] || 5;
    return base + Math.floor(itemCount / 2); // +1 día cada 2 items adicionales
  }

  /**
   * Genera descripción de daños
   */
  private generateDamageDescription(areas: DamageArea[]): string {
    if (areas.length === 0) {
      return 'No se detectaron daños significativos';
    }

    const descriptions = areas.map(area =>
      `${area.type} en ${area.location} (severidad: ${area.severity}%)`,
    );

    return descriptions.join('; ');
  }

  // ==================== SIMULADORES ====================

  /**
   * Simula análisis de imagen de vehículo
   */
  private simulateVehicleAnalysis(image: Buffer): ImageAnalysisResult {
    // Simular detección de daños basado en tamaño de archivo
    const fileSize = image.length;
    const random = Math.random();

    const damageAreas: DamageArea[] = [];

    // Simular detección de 1-3 áreas dañadas
    const numAreas = Math.floor(Math.random() * 3) + 1;

    const locations = ['frontal', 'lateral', 'trasero'];
    const types = ['abolladura', 'rayadura', 'rotura'];

    for (let i = 0; i < numAreas; i++) {
      damageAreas.push({
        location: locations[Math.floor(Math.random() * locations.length)],
        type: types[Math.floor(Math.random() * types.length)],
        severity: Math.floor(Math.random() * 100),
      });
    }

    // Determinar severidad general
    const maxSeverity = Math.max(...damageAreas.map(a => a.severity));
    let severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS';

    if (maxSeverity < 30) severity = 'MINOR';
    else if (maxSeverity < 60) severity = 'MODERATE';
    else if (maxSeverity < 85) severity = 'MAJOR';
    else severity = 'TOTAL_LOSS';

    // Calcular costo sugerido
    const baseCost = 500;
    const severityMultiplier = maxSeverity / 100;
    const suggestedRepairCost = Math.round(baseCost + (baseCost * severityMultiplier * 3));

    return {
      damageDetected: damageAreas.length > 0,
      severity,
      confidence: 0.75 + Math.random() * 0.2, // 75-95%
      damageAreas,
      suggestedRepairCost,
      repairDuration: severity === 'MINOR' ? 2 : severity === 'MODERATE' ? 5 : severity === 'MAJOR' ? 10 : 30,
    };
  }

  /**
   * Simula análisis de imagen de propiedad
   */
  private simulatePropertyAnalysis(image: Buffer): ImageAnalysisResult {
    const damageAreas: DamageArea[] = [
      {
        location: 'pared',
        type: 'grieta',
        severity: Math.floor(Math.random() * 100),
      },
      {
        location: 'techo',
        type: 'humedad',
        severity: Math.floor(Math.random() * 100),
      },
    ];

    const maxSeverity = Math.max(...damageAreas.map(a => a.severity));
    let severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'TOTAL_LOSS';

    if (maxSeverity < 30) severity = 'MINOR';
    else if (maxSeverity < 60) severity = 'MODERATE';
    else if (maxSeverity < 85) severity = 'MAJOR';
    else severity = 'TOTAL_LOSS';

    return {
      damageDetected: true,
      severity,
      confidence: 0.7 + Math.random() * 0.2,
      damageAreas,
      suggestedRepairCost: Math.floor(Math.random() * 5000) + 1000,
      repairDuration: 7,
    };
  }

  private generateId(): string {
    return `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
