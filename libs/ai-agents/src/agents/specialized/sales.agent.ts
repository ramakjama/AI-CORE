// Sales Agent - Handles commercial processes

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const SALES_AGENT_DEFINITION: AgentDefinition = {
  id: 'sales-agent-v1',
  type: 'SALES_AGENT',
  name: 'Agente Comercial SORI',
  description: 'Agente especializado en ventas, cotizaciones y captación de clientes',
  systemPrompt: `Eres SORI, el asistente comercial de Soriano Mediadores, una correduría de seguros líder en España.

Tu objetivo es ayudar en todo el proceso comercial:
- Atender consultas de clientes potenciales
- Generar cotizaciones personalizadas
- Gestionar leads y oportunidades
- Realizar seguimiento de propuestas
- Cerrar ventas y formalizar pólizas

REGLAS:
1. Siempre identifica las necesidades del cliente antes de ofrecer productos
2. Ofrece productos adecuados al perfil del cliente
3. Explica las coberturas de forma clara y sencilla
4. Menciona siempre las ventajas competitivas de Soriano
5. Si no puedes resolver algo, escala a un comercial humano
6. Registra toda la información relevante en el CRM

PRODUCTOS DISPONIBLES:
- Auto: Terceros, Terceros Ampliado, Todo Riesgo
- Hogar: Básico, Completo, Premium
- Vida: Temporal, Ahorro, Unit Linked
- Salud: Básico, Completo, Dental, Premium
- Decesos: Individual, Familiar
- Empresas: RC, Multirriesgo, D&O, Cyber

TONO: Profesional pero cercano, empático y orientado a soluciones.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  tools: ['search_parties', 'get_party', 'create_quote', 'create_lead', 'qualify_lead', 'send_email', 'start_workflow'],
  maxTurns: 20,
  timeout: 300000,
  databases: ['sm_global', 'ss_insurance', 'sm_leads', 'sm_products', 'sm_communications'],
  permissions: ['read:party', 'write:lead', 'read:policy', 'write:quote', 'send:email'],
  isActive: true,
};

export class SalesAgent extends BaseAgent {
  constructor() {
    super(SALES_AGENT_DEFINITION);
    // Register relevant tools
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    // TODO: Call LLM with context, messages, and tools
    // This is a placeholder implementation

    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    // Simple intent detection for demo
    let response: string;

    if (userContent.toLowerCase().includes('cotización') || userContent.toLowerCase().includes('presupuesto')) {
      response = `¡Perfecto! Estaré encantado de prepararte una cotización personalizada.

Para ofrecerte el mejor precio, necesito algunos datos:

1. ¿Qué tipo de seguro te interesa? (Auto, Hogar, Vida, Salud...)
2. ¿Cuál es tu código postal?
3. ¿Tienes actualmente algún seguro que quieras mejorar?

Cuéntame y te preparo una propuesta a medida.`;
    } else if (userContent.toLowerCase().includes('auto') || userContent.toLowerCase().includes('coche')) {
      response = `El seguro de auto es uno de nuestros productos estrella. Trabajamos con las mejores compañías del mercado.

Tenemos tres modalidades:
- **Terceros**: Cobertura básica obligatoria
- **Terceros Ampliado**: Incluye lunas, robo e incendio
- **Todo Riesgo**: Protección completa con o sin franquicia

Para darte un precio exacto, necesito:
- Matrícula o marca/modelo del vehículo
- Fecha de nacimiento del conductor principal
- Años de carnet
- ¿Has tenido siniestros en los últimos 5 años?

¿Me facilitas estos datos?`;
    } else if (userContent.toLowerCase().includes('hogar') || userContent.toLowerCase().includes('casa')) {
      response = `El seguro de hogar protege tu vivienda y todo lo que hay dentro.

Nuestras opciones:
- **Hogar Básico**: Continente + contenido esencial
- **Hogar Completo**: Añade RC, defensa jurídica, asistencia 24h
- **Hogar Premium**: Todo incluido + joyas, obras de arte, jardín

Para cotizar necesito:
- Tipo de vivienda (piso, casa, adosado...)
- Metros cuadrados
- Año de construcción
- Código postal
- ¿Es primera o segunda vivienda?

¿Me das estos datos?`;
    } else {
      response = `¡Hola! Soy SORI, tu asistente comercial de Soriano Mediadores.

Puedo ayudarte con:
🚗 Seguros de Auto
🏠 Seguros de Hogar
❤️ Seguros de Vida
🏥 Seguros de Salud
⚱️ Seguros de Decesos
🏢 Seguros de Empresas

¿En qué producto estás interesado? Cuéntame qué necesitas y te preparo una propuesta personalizada con las mejores condiciones del mercado.`;
    }

    const assistantMessage: AgentMessage = {
      id: this.generateId(),
      instanceId: this.instance!.id,
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };

    this.messages.push(assistantMessage);
    return assistantMessage;
  }

  async qualifyLead(leadId: string): Promise<{ score: number; qualified: boolean; nextAction: string }> {
    // Use ML scoring from analytics
    // TODO: Integrate with ai-analytics prediction service
    return {
      score: 75,
      qualified: true,
      nextAction: 'schedule_call',
    };
  }

  async generateQuote(partyId: string, productCode: string, riskData: Record<string, unknown>): Promise<unknown> {
    const quoteTool = this.tools.get('create_quote');
    if (!quoteTool) throw new Error('Quote tool not available');

    return quoteTool.handler(
      { partyId, productCode, riskData },
      this.instance?.context ?? {}
    );
  }
}

export const salesAgent = new SalesAgent();
