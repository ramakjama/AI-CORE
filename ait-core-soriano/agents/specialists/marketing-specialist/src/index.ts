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

export class MarketingSpecialist extends SpecialistAgent {
  readonly id = 'marketing-specialist';
  readonly name = 'Marketing Specialist';
  readonly capabilities: SpecialistCapabilities = config.capabilities as any;
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    super();
    this.anthropic = new Anthropic({ apiKey });
  }

  async analyze(request: AnalysisRequest, context: AgentContext): Promise<AgentResponse<AnalysisResult>> {
    const startTime = Date.now();
    try {
      const prompt = `Análisis de marketing ${request.options?.depth || 'estándar'}:

**Situación:** ${request.question}
**Contexto:** ${JSON.stringify(request.context, null, 2)}

Proporciona:
1. Análisis de mercado y competencia
2. Oportunidades de marketing (canales, audiencias, mensajes)
3. Métricas clave (CAC, LTV, ROI estimado)
4. Estrategias recomendadas
5. Quick wins y acciones tácticas

Formato: JSON estructurado`;

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      const analysisText = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: {
          summary: analysisText.substring(0, 500),
          findings: [{ title: 'Análisis de marketing completado', description: analysisText, importance: 'medium' }],
          insights: [],
          risks: [],
          opportunities: []
        },
        metadata: {
          agentId: this.id,
          agentType: 'specialist',
          processingTime: Date.now() - startTime,
          tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
          confidence: 0.85
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

  async recommend(request: RecommendationRequest, context: AgentContext): Promise<AgentResponse<Recommendation[]>> {
    const startTime = Date.now();
    try {
      const prompt = `Recomendaciones de marketing para:

**Situación:** ${request.situation}
**Contexto:** ${JSON.stringify(request.context, null, 2)}

Proporciona 1-3 estrategias con:
- Canales y tácticas específicas
- Audiencia objetivo
- Presupuesto estimado
- KPIs y métricas de éxito
- Timeline de implementación

Formato: JSON array`;

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: [{
          title: 'Estrategia de marketing recomendada',
          description: text,
          rationale: 'Basado en análisis de mercado y mejores prácticas',
          confidence: 0.80,
          priority: 'high',
          pros: [],
          cons: []
        }],
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

  async validate(proposal: any, context: AgentContext): Promise<AgentResponse<{
    isValid: boolean;
    issues: Array<{ field: string; severity: 'warning' | 'error'; message: string }>;
    suggestions?: string[];
  }>> {
    const startTime = Date.now();
    try {
      const prompt = `Valida la siguiente estrategia de marketing:

${JSON.stringify(proposal, null, 2)}

Evalúa:
1. Coherencia estratégica
2. Realismo de objetivos y métricas
3. Presupuesto y ROI esperado
4. Canales y audiencias seleccionadas
5. Sugerencias de optimización`;

      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: { isValid: true, issues: [], suggestions: [text] },
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
}

let instance: MarketingSpecialist | null = null;

export function getMarketingSpecialist(apiKey?: string): MarketingSpecialist {
  if (!instance) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is required');
    instance = new MarketingSpecialist(key);
  }
  return instance;
}
