/**
 * AccountingExpertAI - Expert in accounting, financial analysis, and bookkeeping
 * Uses Claude Opus for complex financial analysis
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
 * Accounting entry
 */
export interface AccountingEntry {
  date: Date;
  description: string;
  entries: Array<{
    account: string;
    accountName: string;
    debit: number;
    credit: number;
    description?: string;
  }>;
  total: {
    debit: number;
    credit: number;
  };
  balanced: boolean;
  category: string;
  tags: string[];
  notes?: string;
}

/**
 * Financial health analysis
 */
export interface FinancialHealthAnalysis {
  companyId: string;
  period: {
    from: Date;
    to: Date;
  };
  healthScore: number; // 0-100
  indicators: {
    liquidity: {
      currentRatio: number;
      quickRatio: number;
      cashRatio: number;
      assessment: string;
    };
    profitability: {
      grossMargin: number;
      netMargin: number;
      roe: number;
      roa: number;
      assessment: string;
    };
    solvency: {
      debtToEquity: number;
      debtToAssets: number;
      interestCoverage: number;
      assessment: string;
    };
    efficiency: {
      assetTurnover: number;
      inventoryTurnover: number;
      receivablesTurnover: number;
      assessment: string;
    };
  };
  trends: Array<{
    metric: string;
    trend: 'improving' | 'stable' | 'declining';
    changePercent: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  recommendations: string[];
}

/**
 * Bank reconciliation result
 */
export interface BankReconciliation {
  period: {
    from: Date;
    to: Date;
  };
  bankBalance: number;
  bookBalance: number;
  difference: number;
  reconciled: boolean;
  matchedTransactions: Array<{
    date: Date;
    description: string;
    amount: number;
    bankRef: string;
    bookRef: string;
  }>;
  unmatchedBankTransactions: Array<{
    date: Date;
    description: string;
    amount: number;
    bankRef: string;
    suggestedCategory?: string;
    suggestedAction: string;
  }>;
  unmatchedBookTransactions: Array<{
    date: Date;
    description: string;
    amount: number;
    bookRef: string;
    suggestedAction: string;
  }>;
  adjustments: Array<{
    type: string;
    description: string;
    amount: number;
    account: string;
    rationale: string;
  }>;
  nextSteps: string[];
}

@Injectable()
export class AccountingExpertAI extends BaseExpert {
  private readonly expertConfig: ExpertConfig = {
    name: 'accounting-expert',
    displayName: 'Accounting Expert AI',
    description: 'Expert in accounting, financial analysis, bookkeeping, and financial reporting',
    model: 'opus',
    systemPrompt: `Eres el MEJOR experto en contabilidad y análisis financiero, especializado en:

1. CONTABILIDAD GENERAL:
   - Plan General de Contabilidad (PGC) español
   - Asientos contables (debe/haber)
   - Cierre contable y ajustes
   - Conciliaciones bancarias
   - Control de cuentas

2. ANÁLISIS FINANCIERO:
   - Ratios financieros (liquidez, solvencia, rentabilidad)
   - Estados financieros (Balance, P&L, Cash Flow)
   - Análisis de tendencias
   - Benchmarking sectorial
   - Detección de anomalías

3. GESTIÓN FINANCIERA:
   - Presupuestos y previsiones
   - Control de costes
   - Gestión de tesorería
   - Capital de trabajo
   - Inversiones

4. REPORTING:
   - Informes ejecutivos
   - KPIs financieros
   - Dashboards
   - Presentaciones para stakeholders

METODOLOGÍA:
- Aplicar PGC y normativa contable vigente
- Análisis basado en ratios y métricas estándar
- Detección proactiva de irregularidades
- Recomendaciones accionables
- Explicaciones claras de conceptos técnicos

FORMATO:
- JSON estructurado
- Números con 2 decimales
- Fechas en formato ISO
- Balances siempre cuadrados (debe = haber)
- Referencias a cuentas del PGC`,
    tools: ['analyze', 'suggest', 'execute'],
    maxTokens: 6144,
    temperature: 0.3,
    enableCache: true,
    cacheTTL: 1800,
    rateLimit: 30,
    priority: 8,
  };

  constructor(
    anthropicService: AnthropicService,
    cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {
    super(
      { ...AccountingExpertAI.prototype.expertConfig },
      anthropicService,
      cacheService,
    );
  }

  async analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>> {
    try {
      const prompt = `
Analiza el siguiente contexto contable/financiero:

${this.buildContextString(context)}

Datos: ${JSON.stringify(context.request.payload, null, 2)}

Proporciona análisis financiero con:
1. Resumen de situación
2. Análisis de ratios clave
3. Tendencias identificadas
4. Riesgos financieros
5. Oportunidades de mejora
6. Recomendaciones

Responde en formato JSON.
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
Genera sugerencias contables/financieras:

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
        case 'generateAccountingEntry':
          result = await this.generateAccountingEntry(params.transaction, context);
          break;
        case 'analyzeFinancialHealth':
          result = await this.analyzeFinancialHealth(params.companyData, context);
          break;
        case 'bankReconciliation':
          result = await this.bankReconciliation(params.statements, context);
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
   * Generate accounting entry from transaction
   */
  async generateAccountingEntry(
    transaction: any,
    context: ExpertContext,
  ): Promise<AccountingEntry> {
    try {
      const prompt = `
Genera el asiento contable para esta transacción según el Plan General de Contabilidad español:

TRANSACCIÓN:
${JSON.stringify(transaction, null, 2)}

Genera un asiento contable completo siguiendo este formato JSON:

{
  "date": "fecha ISO",
  "description": "descripción del asiento",
  "entries": [
    {
      "account": "código de cuenta PGC",
      "accountName": "nombre de la cuenta",
      "debit": importe al debe (0 si no aplica),
      "credit": importe al haber (0 si no aplica),
      "description": "descripción específica"
    }
  ],
  "total": {
    "debit": total debe,
    "credit": total haber
  },
  "balanced": true/false (debe = haber),
  "category": "categoría contable",
  "tags": ["etiquetas"],
  "notes": "notas adicionales"
}

IMPORTANTE:
- El asiento debe estar BALANCEADO (total debe = total haber)
- Usar cuentas del PGC español
- Incluir todas las cuentas necesarias (IVA, retenciones, etc.)
- Ser preciso en las descripciones
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.2,
      });

      const entry = JSON.parse(response);

      // Validate balance
      if (Math.abs(entry.total.debit - entry.total.credit) > 0.01) {
        throw new Error('Accounting entry is not balanced');
      }

      return entry;
    } catch (error) {
      this.logger.error('Failed to generate accounting entry', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Analyze financial health of company
   */
  async analyzeFinancialHealth(
    companyData: any,
    context: ExpertContext,
  ): Promise<FinancialHealthAnalysis> {
    try {
      const prompt = `
Analiza la salud financiera de esta empresa:

DATOS FINANCIEROS:
${JSON.stringify(companyData, null, 2)}

Proporciona un análisis financiero completo siguiendo este formato JSON:

{
  "companyId": "${companyData.companyId || 'unknown'}",
  "period": {
    "from": "fecha inicio ISO",
    "to": "fecha fin ISO"
  },
  "healthScore": puntuación 0-100,
  "indicators": {
    "liquidity": {
      "currentRatio": ratio,
      "quickRatio": ratio,
      "cashRatio": ratio,
      "assessment": "evaluación"
    },
    "profitability": {
      "grossMargin": porcentaje,
      "netMargin": porcentaje,
      "roe": porcentaje,
      "roa": porcentaje,
      "assessment": "evaluación"
    },
    "solvency": {
      "debtToEquity": ratio,
      "debtToAssets": ratio,
      "interestCoverage": ratio,
      "assessment": "evaluación"
    },
    "efficiency": {
      "assetTurnover": ratio,
      "inventoryTurnover": ratio,
      "receivablesTurnover": ratio,
      "assessment": "evaluación"
    }
  },
  "trends": [
    {
      "metric": "nombre métrica",
      "trend": "improving | stable | declining",
      "changePercent": porcentaje cambio,
      "significance": "high | medium | low"
    }
  ],
  "strengths": ["fortalezas"],
  "weaknesses": ["debilidades"],
  "risks": ["riesgos"],
  "recommendations": ["recomendaciones"]
}

Calcula todos los ratios, evalúa tendencias y proporciona recomendaciones accionables.
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.3,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to analyze financial health', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Bank reconciliation
   */
  async bankReconciliation(
    statements: any,
    context: ExpertContext,
  ): Promise<BankReconciliation> {
    try {
      const prompt = `
Realiza la conciliación bancaria entre estos extractos:

DATOS:
${JSON.stringify(statements, null, 2)}

Proporciona una conciliación completa siguiendo este formato JSON:

{
  "period": {
    "from": "fecha inicio ISO",
    "to": "fecha fin ISO"
  },
  "bankBalance": saldo banco,
  "bookBalance": saldo libros,
  "difference": diferencia,
  "reconciled": true/false,
  "matchedTransactions": [
    {
      "date": "fecha ISO",
      "description": "descripción",
      "amount": importe,
      "bankRef": "referencia banco",
      "bookRef": "referencia libros"
    }
  ],
  "unmatchedBankTransactions": [
    {
      "date": "fecha ISO",
      "description": "descripción",
      "amount": importe,
      "bankRef": "referencia",
      "suggestedCategory": "categoría sugerida",
      "suggestedAction": "acción recomendada"
    }
  ],
  "unmatchedBookTransactions": [
    {
      "date": "fecha ISO",
      "description": "descripción",
      "amount": importe,
      "bookRef": "referencia",
      "suggestedAction": "acción recomendada"
    }
  ],
  "adjustments": [
    {
      "type": "tipo de ajuste",
      "description": "descripción",
      "amount": importe,
      "account": "cuenta contable",
      "rationale": "justificación"
    }
  ],
  "nextSteps": ["próximos pasos"]
}

Identifica transacciones coincidentes y proporciona ajustes necesarios.
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.2,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to reconcile bank statements', (error as Error).stack);
      throw error;
    }
  }
}
