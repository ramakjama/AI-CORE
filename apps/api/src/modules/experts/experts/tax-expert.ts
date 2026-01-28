/**
 * TaxExpertAI - Expert in tax calculations, VAT reporting, and tax optimization
 * Uses Claude Opus for complex tax scenarios
 */

import { Injectable } from '@nestjs/common';
import { BaseExpert } from '../base/base-expert';
import { AnthropicService } from '../services/anthropic.service';
import { CacheService } from '../services/cache.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  ExpertConfig,
  ExpertContext,
  ExpertResponse,
  AnalysisResponse,
  SuggestionResponse,
  ExecutionResponse,
} from '../types';

/**
 * VAT Report (Modelo 303)
 */
export interface VATReport {
  period: {
    quarter: number;
    year: number;
    from: Date;
    to: Date;
  };
  taxableBase: {
    generalRate: number; // 21%
    reducedRate: number; // 10%
    superReducedRate: number; // 4%
    total: number;
  };
  outputVAT: {
    generalRate: number;
    reducedRate: number;
    superReducedRate: number;
    total: number;
  };
  inputVAT: {
    currentAssets: number;
    investmentGoods: number;
    total: number;
  };
  result: {
    toPayOrRefund: number;
    type: 'to_pay' | 'to_refund';
  };
  details: Array<{
    boxNumber: string;
    description: string;
    value: number;
  }>;
  warnings: string[];
  recommendations: string[];
}

/**
 * Tax optimization scenario
 */
export interface TaxOptimization {
  scenario: string;
  currentSituation: {
    taxableIncome: number;
    totalTax: number;
    effectiveRate: number;
  };
  optimizations: Array<{
    strategy: string;
    description: string;
    estimatedSavings: number;
    requirements: string[];
    risks: string[];
    legalBasis: string;
    priority: 'high' | 'medium' | 'low';
    complexity: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
  projectedSituation: {
    taxableIncome: number;
    totalTax: number;
    effectiveRate: number;
    savings: number;
    savingsPercent: number;
  };
  implementation: {
    steps: string[];
    deadline: Date;
    requiredDocuments: string[];
  };
  risks: string[];
  recommendations: string[];
}

/**
 * Tax calculation result
 */
export interface TaxCalculation {
  transactionType: string;
  baseAmount: number;
  taxes: Array<{
    taxType: 'IVA' | 'IRPF' | 'IS' | 'IAE' | 'other';
    description: string;
    rate: number;
    amount: number;
    deductible: boolean;
  }>;
  totalTax: number;
  netAmount: number;
  breakdown: {
    gross: number;
    taxes: number;
    net: number;
  };
  notes: string[];
}

@Injectable()
export class TaxExpertAI extends BaseExpert {
  private readonly expertConfig: ExpertConfig = {
    name: 'tax-expert',
    displayName: 'Tax Expert AI',
    description: 'Expert in tax calculations, VAT reporting, tax optimization, and tax compliance',
    model: 'opus',
    systemPrompt: `Eres el MEJOR experto en fiscalidad española, especializado en:

1. IMPUESTOS PRINCIPALES:
   - IVA (Modelo 303, 390): Tipos 21%, 10%, 4%
   - IRPF (Modelo 100, 130): Retenciones y pagos fraccionados
   - Impuesto de Sociedades (Modelo 200)
   - IAE (Impuesto de Actividades Económicas)

2. MODELOS TRIBUTARIOS:
   - Modelo 303: IVA trimestral
   - Modelo 390: Resumen anual IVA
   - Modelo 111: Retenciones IRPF
   - Modelo 115: Retenciones alquileres
   - Modelo 130: Pago fraccionado IRPF
   - Modelo 200: Impuesto Sociedades
   - Modelo 347: Operaciones con terceros

3. OPTIMIZACIÓN FISCAL:
   - Deducciones aplicables
   - Incentivos fiscales
   - Amortizaciones
   - Provisiones
   - Diferimientos
   - Estructuras eficientes

4. CUMPLIMIENTO:
   - Plazos de presentación
   - Obligaciones formales
   - Sanciones y recargos
   - Procedimientos tributarios
   - Inspección

MARCO LEGAL:
- Ley General Tributaria
- Ley del IVA
- Ley del IRPF
- Ley del Impuesto de Sociedades
- Reglamentos de desarrollo
- Consultas vinculantes DGT

METODOLOGÍA:
- Cálculos precisos según normativa
- Optimización dentro de la legalidad
- Identificación de deducciones
- Alertas de plazos
- Minimización de riesgos

IMPORTANTE:
- Todos los cálculos con 2 decimales
- Fechas en formato ISO
- Referencias a normativa específica
- Advertencias sobre riesgos fiscales`,
    tools: ['analyze', 'suggest', 'execute'],
    maxTokens: 6144,
    temperature: 0.2, // Very low for tax accuracy
    enableCache: true,
    cacheTTL: 3600,
    rateLimit: 30,
    priority: 9,
  };

  constructor(
    anthropicService: AnthropicService,
    cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {
    super(
      { ...TaxExpertAI.prototype.expertConfig },
      anthropicService,
      cacheService,
    );
  }

  async analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>> {
    try {
      const prompt = `
Analiza la situación fiscal:

${this.buildContextString(context)}

Datos: ${JSON.stringify(context.request.payload, null, 2)}

Proporciona análisis fiscal completo en formato JSON.
`;

      const response = await this.callAI(prompt, context);
      return this.createSuccessResponse<AnalysisResponse>(JSON.parse(response));
    } catch (error) {
      return this.createErrorResponse(error as Error);
    }
  }

  async suggest(context: ExpertContext): Promise<ExpertResponse<SuggestionResponse>> {
    try {
      const prompt = `
Genera sugerencias fiscales:

${this.buildContextString(context)}

Datos: ${JSON.stringify(context.request.payload, null, 2)}

Proporciona sugerencias siguiendo estructura SuggestionResponse.
`;

      const response = await this.callAI(prompt, context);
      return this.createSuccessResponse<SuggestionResponse>(JSON.parse(response));
    } catch (error) {
      return this.createErrorResponse(error as Error);
    }
  }

  async execute(
    action: string,
    params: any,
    context: ExpertContext,
  ): Promise<ExpertResponse<ExecutionResponse>> {
    try {
      let result: any;

      switch (action) {
        case 'generateVATReport':
          result = await this.generateVATReport(params.period, context);
          break;
        case 'taxOptimization':
          result = await this.taxOptimization(params.scenario, context);
          break;
        case 'calculateTax':
          result = await this.calculateTax(params.transaction, context);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return this.createSuccessResponse<ExecutionResponse>({
        action,
        status: 'success',
        result,
        steps: [{ step: action, status: 'completed', output: result }],
        duration: 0,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error);
    }
  }

  /**
   * Generate VAT Report (Modelo 303)
   */
  async generateVATReport(period: any, context: ExpertContext): Promise<VATReport> {
    try {
      // Fetch transactions for the period
      // In real implementation, query database for transactions

      const prompt = `
Genera el Modelo 303 de IVA para este período:

PERÍODO: ${JSON.stringify(period, null, 2)}

TRANSACCIONES: [En implementación real, pasar transacciones del período]

Genera el modelo 303 completo siguiendo este formato JSON:

{
  "period": {
    "quarter": trimestre (1-4),
    "year": año,
    "from": "fecha inicio ISO",
    "to": "fecha fin ISO"
  },
  "taxableBase": {
    "generalRate": base al 21%,
    "reducedRate": base al 10%,
    "superReducedRate": base al 4%,
    "total": total bases
  },
  "outputVAT": {
    "generalRate": IVA repercutido al 21%,
    "reducedRate": IVA repercutido al 10%,
    "superReducedRate": IVA repercutido al 4%,
    "total": total IVA repercutido
  },
  "inputVAT": {
    "currentAssets": IVA soportado bienes corrientes,
    "investmentGoods": IVA soportado bienes inversión,
    "total": total IVA soportado
  },
  "result": {
    "toPayOrRefund": importe a pagar/devolver,
    "type": "to_pay | to_refund"
  },
  "details": [
    {
      "boxNumber": "número de casilla",
      "description": "descripción",
      "value": valor
    }
  ],
  "warnings": ["advertencias"],
  "recommendations": ["recomendaciones"]
}

Incluye todas las casillas del modelo 303.
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.1,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to generate VAT report', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Tax optimization analysis
   */
  async taxOptimization(scenario: any, context: ExpertContext): Promise<TaxOptimization> {
    try {
      const prompt = `
Analiza oportunidades de optimización fiscal para este escenario:

ESCENARIO:
${JSON.stringify(scenario, null, 2)}

Proporciona análisis de optimización siguiendo este formato JSON:

{
  "scenario": "descripción del escenario",
  "currentSituation": {
    "taxableIncome": base imponible,
    "totalTax": impuestos totales,
    "effectiveRate": tipo efectivo
  },
  "optimizations": [
    {
      "strategy": "nombre de la estrategia",
      "description": "descripción detallada",
      "estimatedSavings": ahorro estimado,
      "requirements": ["requisitos"],
      "risks": ["riesgos"],
      "legalBasis": "base legal",
      "priority": "high | medium | low",
      "complexity": "low | medium | high",
      "timeline": "plazo de implementación"
    }
  ],
  "projectedSituation": {
    "taxableIncome": base imponible proyectada,
    "totalTax": impuestos proyectados,
    "effectiveRate": tipo efectivo proyectado,
    "savings": ahorro total,
    "savingsPercent": porcentaje de ahorro
  },
  "implementation": {
    "steps": ["pasos"],
    "deadline": "fecha límite ISO",
    "requiredDocuments": ["documentos necesarios"]
  },
  "risks": ["riesgos"],
  "recommendations": ["recomendaciones"]
}

IMPORTANTE: Todas las estrategias deben ser LEGALES y estar dentro de la normativa.
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.3,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to optimize taxes', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Calculate taxes for a transaction
   */
  async calculateTax(transaction: any, context: ExpertContext): Promise<TaxCalculation> {
    try {
      const prompt = `
Calcula los impuestos aplicables a esta transacción:

TRANSACCIÓN:
${JSON.stringify(transaction, null, 2)}

Calcula impuestos siguiendo este formato JSON:

{
  "transactionType": "tipo de transacción",
  "baseAmount": importe base,
  "taxes": [
    {
      "taxType": "IVA | IRPF | IS | IAE | other",
      "description": "descripción",
      "rate": tipo aplicable,
      "amount": importe,
      "deductible": true/false
    }
  ],
  "totalTax": total impuestos,
  "netAmount": importe neto,
  "breakdown": {
    "gross": bruto,
    "taxes": impuestos,
    "net": neto
  },
  "notes": ["notas aclaratorias"]
}

Aplica tipos correctos según normativa vigente.
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.1,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to calculate tax', (error as Error).stack);
      throw error;
    }
  }
}
