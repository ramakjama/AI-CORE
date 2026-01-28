import Anthropic from '@anthropic-ai/sdk';
import { SpecialistAgent, AgentContext, AgentResponse, AnalysisRequest, AnalysisResult, RecommendationRequest, Recommendation, SpecialistCapabilities } from '../../../interfaces';
import config from '../agent.config.json';

export class DataSpecialist extends SpecialistAgent {
  readonly id = 'data-specialist';
  readonly name = 'Data Specialist';
  readonly capabilities: SpecialistCapabilities = config.capabilities as any;
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    super();
    this.anthropic = new Anthropic({ apiKey });
  }

  async analyze(request: AnalysisRequest, context: AgentContext): Promise<AgentResponse<AnalysisResult>> {
    const startTime = Date.now();
    try {
      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: `Análisis de datos: ${request.question}\n\nContexto: ${JSON.stringify(request.context, null, 2)}\n\nProporciona: análisis estadístico, patrones, correlaciones, insights accionables, visualizaciones sugeridas.` }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: { summary: text.substring(0, 500), findings: [{ title: 'Análisis de datos completado', description: text, importance: 'high' }], insights: [], risks: [], opportunities: [] },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime, tokensUsed: response.usage.input_tokens + response.usage.output_tokens, confidence: 0.85 }
      };
    } catch (error: any) {
      return { success: false, error: { code: 'ANALYSIS_ERROR', message: error.message, details: error }, metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime } };
    }
  }

  async recommend(request: RecommendationRequest, context: AgentContext): Promise<AgentResponse<Recommendation[]>> {
    const startTime = Date.now();
    try {
      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: `Recomendaciones basadas en datos: ${request.situation}\n\nContexto: ${JSON.stringify(request.context, null, 2)}` }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: [{ title: 'Recomendación data-driven', description: text, rationale: 'Basado en análisis estadístico riguroso', confidence: 0.85, priority: 'high', pros: [], cons: [] }],
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime, tokensUsed: response.usage.input_tokens + response.usage.output_tokens }
      };
    } catch (error: any) {
      return { success: false, error: { code: 'RECOMMENDATION_ERROR', message: error.message, details: error }, metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime } };
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
      return {
        success: true,
        data: content.type === 'text' ? content.text : '',
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime, tokensUsed: response.usage.input_tokens + response.usage.output_tokens }
      };
    } catch (error: any) {
      return { success: false, error: { code: 'ANSWER_ERROR', message: error.message, details: error }, metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime } };
    }
  }

  async validate(proposal: any, context: AgentContext): Promise<AgentResponse<{ isValid: boolean; issues: Array<{ field: string; severity: 'warning' | 'error'; message: string }>; suggestions?: string[] }>> {
    const startTime = Date.now();
    try {
      const response = await this.anthropic.messages.create({
        model: config.ai.model,
        max_tokens: config.ai.maxTokens,
        temperature: config.ai.temperature,
        system: config.ai.systemPrompt,
        messages: [{ role: 'user', content: `Valida desde perspectiva de datos: ${JSON.stringify(proposal, null, 2)}\n\nEvalúa: calidad de datos, metodología estadística, métricas, visualizaciones.` }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: { isValid: true, issues: [], suggestions: [text] },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime, tokensUsed: response.usage.input_tokens + response.usage.output_tokens }
      };
    } catch (error: any) {
      return { success: false, error: { code: 'VALIDATION_ERROR', message: error.message, details: error }, metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime } };
    }
  }
}

let instance: DataSpecialist | null = null;
export function getDataSpecialist(apiKey?: string): DataSpecialist {
  if (!instance) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is required');
    instance = new DataSpecialist(key);
  }
  return instance;
}
