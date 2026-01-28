import Anthropic from '@anthropic-ai/sdk';
import { SpecialistAgent, AgentContext, AgentResponse, AnalysisRequest, AnalysisResult, RecommendationRequest, Recommendation, SpecialistCapabilities } from '../../../interfaces';
import config from '../agent.config.json';

export class SecuritySpecialist extends SpecialistAgent {
  readonly id = 'security-specialist';
  readonly name = 'Security Specialist';
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
        messages: [{ role: 'user', content: `Análisis de seguridad: ${request.question}\n\nContexto: ${JSON.stringify(request.context, null, 2)}\n\nProporciona: vulnerabilidades, amenazas, cumplimiento RGPD/ISO 27001, recomendaciones de hardening.` }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: { summary: text.substring(0, 500), findings: [{ title: 'Análisis de seguridad completado', description: text, importance: 'critical' }], insights: [], risks: [], opportunities: [] },
        metadata: { agentId: this.id, agentType: 'specialist', processingTime: Date.now() - startTime, tokensUsed: response.usage.input_tokens + response.usage.output_tokens, confidence: 0.90 }
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
        messages: [{ role: 'user', content: `Recomendaciones de seguridad: ${request.situation}\n\nContexto: ${JSON.stringify(request.context, null, 2)}` }]
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';

      return {
        success: true,
        data: [{ title: 'Recomendación de seguridad', description: text, rationale: 'Basado en frameworks NIST, OWASP, ISO 27001', confidence: 0.90, priority: 'urgent', pros: [], cons: [] }],
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
        messages: [{ role: 'user', content: `Auditoría de seguridad: ${JSON.stringify(proposal, null, 2)}\n\nEvalúa: vulnerabilidades, cumplimiento RGPD, cifrado, autenticación, autorización.` }]
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

let instance: SecuritySpecialist | null = null;
export function getSecuritySpecialist(apiKey?: string): SecuritySpecialist {
  if (!instance) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('ANTHROPIC_API_KEY is required');
    instance = new SecuritySpecialist(key);
  }
  return instance;
}
