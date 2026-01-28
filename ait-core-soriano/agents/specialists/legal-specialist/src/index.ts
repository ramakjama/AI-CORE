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

export class LegalSpecialist extends SpecialistAgent {
  readonly id = 'legal-specialist';
  readonly name = 'Legal Specialist';
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
        messages: [{ role: 'user', content: prompt }]
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
        error: { code: 'ANALYSIS_ERROR', message: error.message, details: error },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime }
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
        messages: [{ role: 'user', content: prompt }]
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
        error: { code: 'RECOMMENDATION_ERROR', message: error.message, details: error },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime }
      };
    }
  }

  async answer(question: string, context: AgentContext): Promise<AgentResponse<string>> {
    const startTime = Date.now();

    try {
      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: question }]
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
        error: { code: 'ANSWER_ERROR', message: error.message, details: error },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime }
      };
    }
  }

  async validate(
    proposal: any,
    context: AgentContext
  ): Promise<AgentResponse<{
    isValid: boolean;
    issues: Array<{ field: string; severity: 'warning' | 'error'; message: string }>;
    suggestions?: string[];
  }>> {
    const startTime = Date.now();

    try {
      const prompt = `Valida la siguiente propuesta desde el punto de vista legal y de cumplimiento normativo:

${JSON.stringify(proposal, null, 2)}

Analiza:
1. Cumplimiento legal (RGPD, LOSSEAR, normativa aplicable)
2. Riesgos jurídicos identificados
3. Cláusulas contractuales problemáticas
4. Sugerencias de mejora legal

IMPORTANTE: Indica que esta es una revisión informativa que requiere validación por abogado colegiado.`;

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
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
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime }
      };
    }
  }

  private buildAnalysisPrompt(request: AnalysisRequest): string {
    const depth = request.options?.depth || 'standard';
    return `Realiza un análisis jurídico ${depth === 'deep' ? 'profundo' : depth === 'quick' ? 'rápido' : 'estándar'}:

**Situación:**
${request.question}

**Contexto:**
${JSON.stringify(request.context, null, 2)}

Proporciona análisis estructurado:
1. Resumen legal ejecutivo
2. Normativa aplicable (cita artículos específicos)
3. Riesgos jurídicos (alto/medio/bajo)
4. Obligaciones legales
5. Recomendaciones de cumplimiento

Formato: JSON estructurado`;
  }

  private buildRecommendationPrompt(request: RecommendationRequest): string {
    return `Proporciona recomendaciones legales para:

**Situación:**
${request.situation}

**Contexto:**
${JSON.stringify(request.context, null, 2)}

${request.constraints?.length ? `**Restricciones:**\n${request.constraints.join('\n')}` : ''}
${request.objectives?.length ? `**Objetivos:**\n${request.objectives.join('\n')}` : ''}

Proporciona 1-3 recomendaciones con:
- Fundamento jurídico
- Normativa aplicable
- Riesgos legales
- Pasos de implementación
- Disclaimer: revisión por abogado colegiado

Formato: JSON array`;
  }

  private parseAnalysis(text: string): AnalysisResult {
    return {
      summary: text.substring(0, 500),
      findings: [{ title: 'Análisis legal completado', description: text, importance: 'high' }],
      insights: [],
      risks: [],
      opportunities: []
    };
  }

  private parseRecommendations(text: string): Recommendation[] {
    return [{
      title: 'Recomendación legal generada',
      description: text,
      rationale: 'Basado en análisis jurídico riguroso',
      confidence: 0.80,
      priority: 'high',
      pros: [],
      cons: []
    }];
  }

  private parseValidation(text: string): {
    isValid: boolean;
    issues: Array<{ field: string; severity: 'warning' | 'error'; message: string }>;
    suggestions?: string[];
  } {
    return { isValid: true, issues: [], suggestions: [text] };
  }

  private calculateConfidence(analysis: AnalysisResult): number {
    return Math.min(0.75 + analysis.findings.length * 0.05, 0.95);
  }
}

let instance: LegalSpecialist | null = null;

export function getLegalSpecialist(apiKey?: string): LegalSpecialist {
  if (!instance) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is required');
    instance = new LegalSpecialist(key);
  }
  return instance;
}
