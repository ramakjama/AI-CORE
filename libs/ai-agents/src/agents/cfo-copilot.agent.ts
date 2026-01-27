import { llmService, LLMMessage } from '@ai-core/ai-llm';

/**
 * AI-CORE - CFO Copilot Agent (IMPLEMENTACIÓN REAL)
 * 
 * Agente IA autónomo que actúa como CFO virtual:
 * - Analiza flujos de caja
 * - Genera forecasts financieros
 * - Detecta anomalías
 * - Recomienda optimizaciones
 * - Automatiza reportes
 */

export interface FinancialData {
  revenue: number[];
  expenses: number[];
  cashFlow: number[];
  period: string;
  currency: string;
}

export interface CashFlowAnalysis {
  summary: string;
  trends: {
    revenue: 'increasing' | 'decreasing' | 'stable';
    expenses: 'increasing' | 'decreasing' | 'stable';
    cashFlow: 'positive' | 'negative' | 'neutral';
  };
  insights: string[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  forecast: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}

export interface BudgetOptimization {
  currentBudget: Record<string, number>;
  optimizedBudget: Record<string, number>;
  savings: number;
  recommendations: Array<{
    category: string;
    action: string;
    impact: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export interface FinancialAnomaly {
  type: 'revenue_drop' | 'expense_spike' | 'cash_flow_issue' | 'unusual_pattern';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  detectedAt: Date;
  affectedMetrics: string[];
  suggestedActions: string[];
}

export class CFOCopilotAgent {
  private systemPrompt = `Eres el CFO Copilot de AI-CORE, un asistente financiero experto con IA.

Tu rol es:
- Analizar datos financieros con precisión
- Generar insights accionables
- Detectar anomalías y riesgos
- Recomendar optimizaciones
- Crear forecasts precisos

Características:
- Respondes en español
- Usas terminología financiera profesional
- Proporcionas números específicos y métricas
- Siempre incluyes recomendaciones accionables
- Detectas patrones y tendencias
- Eres conservador en forecasts (mejor subestimar que sobrestimar)

Formato de respuesta:
- Claro y estructurado
- Con bullets para facilitar lectura
- Incluye siempre: análisis, insights, recomendaciones
- Usa emojis ocasionalmente para destacar puntos clave`;

  /**
   * Analizar flujo de caja
   */
  async analyzeCashFlow(data: FinancialData): Promise<CashFlowAnalysis> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Analiza este flujo de caja y proporciona insights detallados:

Período: ${data.period}
Moneda: ${data.currency}

Ingresos (últimos meses): ${data.revenue.join(', ')}
Gastos (últimos meses): ${data.expenses.join(', ')}
Flujo de caja neto: ${data.cashFlow.join(', ')}

Proporciona:
1. Resumen ejecutivo (2-3 líneas)
2. Análisis de tendencias (ingresos, gastos, cash flow)
3. 3-5 insights clave
4. 3-5 recomendaciones accionables
5. Riesgos identificados
6. Oportunidades de mejora
7. Forecast para próximo mes y trimestre (con nivel de confianza)

Responde en formato JSON con esta estructura:
{
  "summary": "...",
  "trends": {
    "revenue": "increasing|decreasing|stable",
    "expenses": "increasing|decreasing|stable",
    "cashFlow": "positive|negative|neutral"
  },
  "insights": ["...", "..."],
  "recommendations": ["...", "..."],
  "risks": ["...", "..."],
  "opportunities": ["...", "..."],
  "forecast": {
    "nextMonth": 0,
    "nextQuarter": 0,
    "confidence": 0.85
  }
}`,
      },
    ];

    const response = await llmService.complete(messages, {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.3, // Más conservador para análisis financiero
      systemPrompt: this.systemPrompt,
    });

    // Parsear respuesta JSON
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta del agente');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Optimizar presupuesto
   */
  async optimizeBudget(
    currentBudget: Record<string, number>,
    constraints?: {
      maxReduction?: number;
      protectedCategories?: string[];
      targetSavings?: number;
    }
  ): Promise<BudgetOptimization> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Analiza este presupuesto y proporciona optimizaciones:

Presupuesto actual:
${Object.entries(currentBudget)
  .map(([cat, amount]) => `- ${cat}: €${amount.toLocaleString()}`)
  .join('\n')}

Restricciones:
- Reducción máxima: ${constraints?.maxReduction || 20}%
- Categorías protegidas: ${constraints?.protectedCategories?.join(', ') || 'Ninguna'}
- Ahorro objetivo: €${constraints?.targetSavings?.toLocaleString() || 'No especificado'}

Proporciona:
1. Presupuesto optimizado por categoría
2. Ahorro total estimado
3. Recomendaciones específicas por categoría (acción, impacto, prioridad)

Responde en formato JSON:
{
  "currentBudget": {...},
  "optimizedBudget": {...},
  "savings": 0,
  "recommendations": [
    {
      "category": "...",
      "action": "...",
      "impact": 0,
      "priority": "high|medium|low"
    }
  ]
}`,
      },
    ];

    const response = await llmService.complete(messages, {
      provider: 'anthropic',
      model: 'claude-3-opus-20240229',
      temperature: 0.2,
      systemPrompt: this.systemPrompt,
    });

    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No se pudo parsear la respuesta del agente');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Detectar anomalías financieras
   */
  async detectAnomalies(
    historicalData: FinancialData,
    currentData: FinancialData
  ): Promise<FinancialAnomaly[]> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Compara estos datos históricos con los actuales y detecta anomalías:

DATOS HISTÓRICOS (${historicalData.period}):
Ingresos: ${historicalData.revenue.join(', ')}
Gastos: ${historicalData.expenses.join(', ')}
Cash Flow: ${historicalData.cashFlow.join(', ')}

DATOS ACTUALES (${currentData.period}):
Ingresos: ${currentData.revenue.join(', ')}
Gastos: ${currentData.expenses.join(', ')}
Cash Flow: ${currentData.cashFlow.join(', ')}

Detecta:
1. Caídas significativas en ingresos
2. Picos inusuales en gastos
3. Problemas de flujo de caja
4. Patrones anormales

Para cada anomalía, proporciona:
- Tipo
- Severidad (critical, high, medium, low)
- Descripción detallada
- Métricas afectadas
- Acciones sugeridas

Responde en formato JSON array:
[
  {
    "type": "revenue_drop|expense_spike|cash_flow_issue|unusual_pattern",
    "severity": "critical|high|medium|low",
    "description": "...",
    "affectedMetrics": ["...", "..."],
    "suggestedActions": ["...", "..."]
  }
]`,
      },
    ];

    const response = await llmService.complete(messages, {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      temperature: 0.1, // Muy conservador para detección de anomalías
      systemPrompt: this.systemPrompt,
    });

    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }

    const anomalies = JSON.parse(jsonMatch[0]);
    return anomalies.map((a: any) => ({
      ...a,
      detectedAt: new Date(),
    }));
  }

  /**
   * Generar reporte ejecutivo
   */
  async generateExecutiveReport(
    data: FinancialData,
    period: string
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'user',
        content: `Genera un reporte ejecutivo financiero para ${period}:

Datos:
Ingresos: ${data.revenue.join(', ')}
Gastos: ${data.expenses.join(', ')}
Cash Flow: ${data.cashFlow.join(', ')}

El reporte debe incluir:
1. Resumen ejecutivo (3-4 líneas)
2. Métricas clave (KPIs)
3. Análisis de tendencias
4. Highlights positivos
5. Áreas de preocupación
6. Recomendaciones estratégicas
7. Outlook para próximo período

Formato: Profesional, conciso, accionable.
Longitud: 300-400 palabras.`,
      },
    ];

    const response = await llmService.complete(messages, {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.4,
      systemPrompt: this.systemPrompt,
    });

    return response.content;
  }

  /**
   * Chat interactivo con el CFO Copilot
   */
  async chat(
    message: string,
    context?: {
      financialData?: FinancialData;
      conversationHistory?: LLMMessage[];
    }
  ): Promise<string> {
    const messages: LLMMessage[] = context?.conversationHistory || [];

    // Agregar contexto financiero si está disponible
    if (context?.financialData) {
      messages.push({
        role: 'system',
        content: `Contexto financiero actual:
Ingresos recientes: ${context.financialData.revenue.slice(-3).join(', ')}
Gastos recientes: ${context.financialData.expenses.slice(-3).join(', ')}
Cash Flow: ${context.financialData.cashFlow.slice(-3).join(', ')}`,
      });
    }

    messages.push({
      role: 'user',
      content: message,
    });

    const response = await llmService.complete(messages, {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      systemPrompt: this.systemPrompt,
    });

    return response.content;
  }

  /**
   * Chat con streaming (para UI en tiempo real)
   */
  async *chatStream(
    message: string,
    context?: {
      financialData?: FinancialData;
      conversationHistory?: LLMMessage[];
    }
  ): AsyncGenerator<string> {
    const messages: LLMMessage[] = context?.conversationHistory || [];

    if (context?.financialData) {
      messages.push({
        role: 'system',
        content: `Contexto financiero actual:
Ingresos recientes: ${context.financialData.revenue.slice(-3).join(', ')}
Gastos recientes: ${context.financialData.expenses.slice(-3).join(', ')}
Cash Flow: ${context.financialData.cashFlow.slice(-3).join(', ')}`,
      });
    }

    messages.push({
      role: 'user',
      content: message,
    });

    yield* llmService.stream(messages, {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      temperature: 0.7,
      systemPrompt: this.systemPrompt,
    });
  }

  /**
   * Calcular métricas financieras clave
   */
  private calculateMetrics(data: FinancialData) {
    const totalRevenue = data.revenue.reduce((a, b) => a + b, 0);
    const totalExpenses = data.expenses.reduce((a, b) => a + b, 0);
    const avgRevenue = totalRevenue / data.revenue.length;
    const avgExpenses = totalExpenses / data.expenses.length;
    const profitMargin = ((totalRevenue - totalExpenses) / totalRevenue) * 100;

    return {
      totalRevenue,
      totalExpenses,
      avgRevenue,
      avgExpenses,
      profitMargin,
      netIncome: totalRevenue - totalExpenses,
    };
  }
}

// Singleton instance
export const cfoAgent = new CFOCopilotAgent();
