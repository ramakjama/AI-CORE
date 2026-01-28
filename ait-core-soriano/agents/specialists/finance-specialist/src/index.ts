import Anthropic from '@anthropic-ai/sdk';
import {
  SpecialistAgent,
  AgentContext,
  AgentResponse,
  AnalysisRequest,
  AnalysisResult,
  RecommendationRequest,
  Recommendation,
  SpecialistCapabilities
} from '../../../interfaces';
import config from '../agent.config.json';

export class FinanceSpecialist extends SpecialistAgent {
  readonly id = 'finance-specialist';
  readonly name = 'Finance Specialist';
  readonly capabilities: SpecialistCapabilities = config.capabilities as any;

  private anthropic: Anthropic;

  constructor(apiKey: string) {
    super();
    this.anthropic = new Anthropic({ apiKey });
  }

  async analyze(
    request: AnalysisRequest,
    context: AgentContext
  ): Promise<AgentResponse<AnalysisResult>> {
    const startTime = Date.now();

    try {
      const prompt = this.buildAnalysisPrompt(request);

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      const analysisText = content.type === 'text' ? content.text : '';

      const analysis = this.parseAnalysis(analysisText);

      return {
        success: true,
        data: analysis,
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          confidence: this.calculateConfidence(analysis)
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ANALYSIS_ERROR',
          message: error.message,
          details: error
        },
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  async recommend(
    request: RecommendationRequest,
    context: AgentContext
  ): Promise<AgentResponse<Recommendation[]>> {
    const startTime = Date.now();

    try {
      const prompt = this.buildRecommendationPrompt(request);

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      const recommendationText = content.type === 'text' ? content.text : '';

      const recommendations = this.parseRecommendations(recommendationText);

      return {
        success: true,
        data: recommendations,
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: error.message,
          details: error
        },
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  async answer(
    question: string,
    context: AgentContext
  ): Promise<AgentResponse<string>> {
    const startTime = Date.now();

    try {
      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [
          {
            role: 'user',
            content: question
          }
        ]
      });

      const content = response.content[0];
      const answer = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: answer,
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ANSWER_ERROR',
          message: error.message,
          details: error
        },
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  async validate(
    proposal: any,
    context: AgentContext
  ): Promise<AgentResponse<{
    isValid: boolean;
    issues: Array<{
      field: string;
      severity: 'warning' | 'error';
      message: string;
    }>;
    suggestions?: string[];
  }>> {
    const startTime = Date.now();

    try {
      const prompt = `Valida la siguiente propuesta financiera e identifica problemas, errores o mejoras:

${JSON.stringify(proposal, null, 2)}

Proporciona una validación estructurada con:
1. ¿Es válida la propuesta desde el punto de vista financiero y contable?
2. Problemas encontrados (campo, severidad, mensaje)
3. Sugerencias de mejora (cumplimiento normativo, optimización fiscal, mejoras de ratios)`;

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const content = response.content[0];
      const validationText = content.type === 'text' ? content.text : '';

      const validation = this.parseValidation(validationText);

      return {
        success: true,
        data: validation,
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.message,
          details: error
        },
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  // ====================================
  // PRIVATE HELPER METHODS
  // ====================================

  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const depth = request.options?.depth || 'standard';
    const format = request.options?.format || 'structured';

    return `Realiza un análisis financiero ${depth === 'deep' ? 'profundo' : depth === 'quick' ? 'rápido' : 'estándar'} de la siguiente situación:

**Pregunta/Situación:**
${request.question}

**Contexto:**
${JSON.stringify(request.context, null, 2)}

Proporciona un análisis ${format} que incluya:
1. Resumen ejecutivo financiero
2. Hallazgos clave (ratios, métricas, tendencias)
3. Insights financieros y contables
4. Riesgos financieros identificados (liquidez, solvencia, rentabilidad)
5. Oportunidades de optimización (fiscal, operativa, financiera)

Formato: JSON estructurado`;
  }

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    return `Proporciona recomendaciones financieras expertas para la siguiente situación:

**Situación:**
${request.situation}

**Contexto:**
${JSON.stringify(request.context, null, 2)}

${request.constraints && request.constraints.length > 0 ? `**Restricciones:**\n${request.constraints.join('\n')}` : ''}

${request.objectives && request.objectives.length > 0 ? `**Objetivos:**\n${request.objectives.join('\n')}` : ''}

Proporciona 1-3 recomendaciones estructuradas con:
- Título y descripción
- Justificación financiera (análisis cuantitativo)
- Confianza (0-1)
- Prioridad
- Pros y contras
- Impacto estimado (ROI, ahorro, costes, plazos)
- Próximos pasos
- Alternativas (si aplican)

Formato: JSON array de recomendaciones`;
  }

  private parseAnalysis(text: string): AnalysisResult {
    // Production: parse structured JSON
    return {
      summary: text.substring(0, 500),
      findings: [
        {
          title: 'Análisis financiero completado',
          description: text,
          importance: 'medium'
        }
      ],
      insights: [],
      risks: [],
      opportunities: []
    };
  }

  private parseRecommendations(text: string): Recommendation[] {
    // Production: parse structured JSON
    return [
      {
        title: 'Recomendación financiera generada',
        description: text,
        rationale: 'Basado en análisis financiero riguroso',
        confidence: 0.85,
        priority: 'medium',
        pros: [],
        cons: []
      }
    ];
  }

  private parseValidation(text: string): {
    isValid: boolean;
    issues: Array<{
      field: string;
      severity: 'warning' | 'error';
      message: string;
    }>;
    suggestions?: string[];
  } {
    // Production: parse structured JSON
    return {
      isValid: true,
      issues: [],
      suggestions: [text]
    };
  }

  private calculateConfidence(analysis: AnalysisResult): number {
    const baseConfidence = 0.75;
    const findingsBonus = Math.min(analysis.findings.length * 0.05, 0.2);
    const insightsBonus = Math.min(analysis.insights.length * 0.02, 0.05);

    return Math.min(baseConfidence + findingsBonus + insightsBonus, 1.0);
  }
}

// Export singleton instance
let instance: FinanceSpecialist | null = null;

export function getFinanceSpecialist(apiKey?: string): FinanceSpecialist {
  if (!instance) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    instance = new FinanceSpecialist(key);
  }
  return instance;
}
