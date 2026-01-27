import { LLMService } from '@ai-core/ai-llm';

export interface SupportAgentTask {
  type: 'answer_query' | 'resolve_issue' | 'escalate' | 'sentiment_analysis';
  query?: string;
  ticketId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  context?: any;
}

export class CustomerSupportAgent {
  private llm: LLMService;
  private agentId = 'customer-support-agent';
  private knowledgeBase: Map<string, string>;

  constructor() {
    this.llm = new LLMService();
    this.knowledgeBase = this.initializeKnowledgeBase();
  }

  async execute(task: SupportAgentTask): Promise<any> {
    console.log(`[CustomerSupportAgent] Executing task: ${task.type}`);

    switch (task.type) {
      case 'answer_query':
        return this.answerQuery(task);
      case 'resolve_issue':
        return this.resolveIssue(task);
      case 'escalate':
        return this.escalateToHuman(task);
      case 'sentiment_analysis':
        return this.analyzeSentiment(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async answerQuery(task: SupportAgentTask) {
    const relevantKnowledge = this.searchKnowledgeBase(task.query || '');
    
    const prompt = `
Eres un asistente de atención al cliente experto en seguros.

Consulta del cliente: ${task.query}

Información relevante de la base de conocimiento:
${relevantKnowledge}

Historial de conversación:
${JSON.stringify(task.conversationHistory || [], null, 2)}

Proporciona una respuesta:
1. Clara y concisa
2. Empática y profesional
3. Con pasos accionables si aplica
4. Menciona si necesita escalación

Responde en formato JSON con: { answer, needsEscalation, suggestedActions }
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un asistente de atención al cliente profesional y empático.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'answer_query',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async resolveIssue(task: SupportAgentTask) {
    const prompt = `
Analiza y resuelve el siguiente problema del cliente.

Ticket ID: ${task.ticketId}
Contexto: ${JSON.stringify(task.context, null, 2)}

Proporciona:
1. Diagnóstico del problema
2. Solución paso a paso
3. Tiempo estimado de resolución
4. Acciones preventivas
5. ¿Requiere escalación? (Sí/No)

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un experto en resolución de problemas de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'resolve_issue',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async escalateToHuman(task: SupportAgentTask) {
    const prompt = `
Prepara un resumen de escalación para un agente humano.

Ticket ID: ${task.ticketId}
Contexto: ${JSON.stringify(task.context, null, 2)}
Historial: ${JSON.stringify(task.conversationHistory || [], null, 2)}

Incluye:
1. Resumen del problema
2. Acciones ya tomadas
3. Razón de escalación
4. Prioridad (Alta/Media/Baja)
5. Información relevante del cliente
6. Próximos pasos sugeridos

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un coordinador de escalaciones de soporte.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'escalate',
      result: this.parseResponse(response),
      escalated: true,
      timestamp: new Date().toISOString()
    };
  }

  private async analyzeSentiment(task: SupportAgentTask) {
    const prompt = `
Analiza el sentimiento del cliente en esta conversación.

Conversación: ${JSON.stringify(task.conversationHistory || [], null, 2)}

Proporciona:
1. Sentimiento general (Positivo/Neutral/Negativo)
2. Score de satisfacción (0-100)
3. Emociones detectadas
4. Nivel de urgencia
5. Riesgo de churn
6. Recomendaciones de acción

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un analista de sentimientos experto.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'sentiment_analysis',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private initializeKnowledgeBase(): Map<string, string> {
    const kb = new Map<string, string>();
    
    // Base de conocimiento básica
    kb.set('poliza', 'Una póliza es un contrato de seguro que establece los términos y condiciones de cobertura.');
    kb.set('siniestro', 'Un siniestro es un evento cubierto por la póliza que da derecho a indemnización.');
    kb.set('prima', 'La prima es el pago periódico que realiza el asegurado para mantener la cobertura.');
    kb.set('franquicia', 'La franquicia es la cantidad que el asegurado debe pagar antes de que el seguro cubra el resto.');
    kb.set('cobertura', 'La cobertura define qué riesgos y eventos están protegidos por la póliza.');
    kb.set('renovacion', 'La renovación es el proceso de extender la vigencia de una póliza existente.');
    kb.set('cancelacion', 'La cancelación es la terminación anticipada de una póliza de seguro.');
    
    return kb;
  }

  private searchKnowledgeBase(query: string): string {
    const queryLower = query.toLowerCase();
    const results: string[] = [];
    
    for (const [key, value] of this.knowledgeBase.entries()) {
      if (queryLower.includes(key)) {
        results.push(`${key}: ${value}`);
      }
    }
    
    return results.length > 0 ? results.join('\n') : 'No se encontró información específica en la base de conocimiento.';
  }

  private parseResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: response };
    } catch (error) {
      return { raw: response };
    }
  }
}
