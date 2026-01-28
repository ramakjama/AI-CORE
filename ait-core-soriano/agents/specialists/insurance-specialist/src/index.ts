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

export class InsuranceSpecialist extends SpecialistAgent {
  readonly id = 'insurance-specialist';
  readonly name = 'Insurance Specialist';
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

      // Parse structured analysis from response
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

      // Parse structured recommendations from response
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
      const prompt = `Valida la siguiente propuesta de seguro y identifica problemas, errores o mejoras:

${JSON.stringify(proposal, null, 2)}

Proporciona una validación estructurada con:
1. ¿Es válida la propuesta?
2. Problemas encontrados (campo, severidad, mensaje)
3. Sugerencias de mejora`;

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

      // Parse validation result
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

    return `Realiza un análisis ${depth === 'deep' ? 'profundo' : depth === 'quick' ? 'rápido' : 'estándar'} de la siguiente situación relacionada con seguros:

**Pregunta/Situación:**
${request.question}

**Contexto:**
${JSON.stringify(request.context, null, 2)}

Proporciona un análisis ${format} que incluya:
1. Resumen ejecutivo
2. Hallazgos clave (con nivel de importancia)
3. Insights actuariales
4. Riesgos identificados (con severidad)
5. Oportunidades detectadas (con impacto)

Formato: JSON estructurado`;
  }

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    return `Proporciona recomendaciones expertas para la siguiente situación:

**Situación:**
${request.situation}

**Contexto:**
${JSON.stringify(request.context, null, 2)}

${request.constraints && request.constraints.length > 0 ? `**Restricciones:**\n${request.constraints.join('\n')}` : ''}

${request.objectives && request.objectives.length > 0 ? `**Objetivos:**\n${request.objectives.join('\n')}` : ''}

Proporciona 1-3 recomendaciones estructuradas con:
- Título y descripción
- Justificación técnica
- Confianza (0-1)
- Prioridad
- Pros y contras
- Impacto estimado (financiero, temporal, riesgo)
- Próximos pasos
- Alternativas (si aplican)

Formato: JSON array de recomendaciones`;
  }

  private parseAnalysis(text: string): AnalysisResult {
    // En producción, esto debería parsear JSON estructurado
    // Por ahora, creamos una estructura básica
    return {
      summary: text.substring(0, 500),
      findings: [
        {
          title: 'Análisis completado',
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
    // En producción, esto debería parsear JSON estructurado
    // Por ahora, creamos una estructura básica
    return [
      {
        title: 'Recomendación generada',
        description: text,
        rationale: 'Basado en análisis actuarial',
        confidence: 0.8,
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
    // En producción, esto debería parsear JSON estructurado
    return {
      isValid: true,
      issues: [],
      suggestions: [text]
    };
  }

  private calculateConfidence(analysis: AnalysisResult): number {
    // Lógica simple de confianza basada en la cantidad de datos
    const baseConfidence = 0.7;
    const findingsBonus = Math.min(analysis.findings.length * 0.05, 0.2);
    const insightsBonus = Math.min(analysis.insights.length * 0.02, 0.1);

    return Math.min(baseConfidence + findingsBonus + insightsBonus, 1.0);
  }
}

// Export singleton instance
let instance: InsuranceSpecialist | null = null;

export function getInsuranceSpecialist(apiKey?: string): InsuranceSpecialist {
  if (!instance) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }
    instance = new InsuranceSpecialist(key);
  }
  return instance;
}
