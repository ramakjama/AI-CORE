import { LLMService } from '@ai-core/ai-llm';

export interface SalesAgentTask {
  type: 'qualify_lead' | 'generate_proposal' | 'predict_close' | 'recommend_upsell';
  leadId?: string;
  clientId?: string;
  context?: any;
}

export class SalesAgent {
  private llm: LLMService;
  private agentId = 'sales-agent';

  constructor() {
    this.llm = new LLMService();
  }

  async execute(task: SalesAgentTask): Promise<any> {
    console.log(`[SalesAgent] Executing task: ${task.type}`);

    switch (task.type) {
      case 'qualify_lead':
        return this.qualifyLead(task);
      case 'generate_proposal':
        return this.generateProposal(task);
      case 'predict_close':
        return this.predictClose(task);
      case 'recommend_upsell':
        return this.recommendUpsell(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async qualifyLead(task: SalesAgentTask) {
    const prompt = `
Eres un experto en calificación de leads para seguros.

Analiza el siguiente lead y proporciona:
1. Score de calificación (0-100)
2. Probabilidad de conversión
3. Productos recomendados
4. Próximos pasos
5. Prioridad (Alta/Media/Baja)

Lead ID: ${task.leadId}
Contexto: ${JSON.stringify(task.context, null, 2)}

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un asistente experto en ventas de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'qualify_lead',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async generateProposal(task: SalesAgentTask) {
    const prompt = `
Genera una propuesta comercial personalizada para el cliente.

Cliente ID: ${task.clientId}
Contexto: ${JSON.stringify(task.context, null, 2)}

La propuesta debe incluir:
1. Resumen ejecutivo
2. Productos recomendados con precios
3. Beneficios clave
4. Comparativa con competencia
5. Términos y condiciones
6. Call to action

Formato profesional y persuasivo.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un experto en redacción de propuestas comerciales.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'generate_proposal',
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  private async predictClose(task: SalesAgentTask) {
    const prompt = `
Predice la probabilidad de cierre de esta oportunidad.

Contexto: ${JSON.stringify(task.context, null, 2)}

Analiza:
1. Probabilidad de cierre (%)
2. Fecha estimada de cierre
3. Valor estimado del deal
4. Factores de riesgo
5. Acciones recomendadas para aumentar probabilidad

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un analista predictivo de ventas.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'predict_close',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async recommendUpsell(task: SalesAgentTask) {
    const prompt = `
Recomienda oportunidades de upsell/cross-sell para el cliente.

Cliente ID: ${task.clientId}
Contexto: ${JSON.stringify(task.context, null, 2)}

Proporciona:
1. Productos adicionales recomendados
2. Justificación de cada recomendación
3. Valor adicional estimado
4. Mejor momento para oferta
5. Script de venta sugerido

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un especialista en estrategias de upselling.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'recommend_upsell',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private parseResponse(response: string): any {
    try {
      // Intentar parsear como JSON
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
