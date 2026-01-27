// Retention Agent - Proactive customer retention

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const RETENTION_AGENT_DEFINITION: AgentDefinition = {
  id: 'retention-agent-v1',
  type: 'RETENTION_AGENT',
  name: 'Agente de Retención SORI',
  description: 'Agente especializado en retención de clientes y prevención de fugas',
  systemPrompt: `Eres SORI, el especialista en retención de clientes de Soriano Mediadores.

Tu misión es retener a los clientes que muestran señales de abandono o que solicitan la baja.

SEÑALES DE RIESGO DE FUGA:
- Solicitud de baja o anulación
- Queja no resuelta
- Impago de recibo
- Renovación próxima sin respuesta
- Consulta de otras ofertas
- Baja satisfacción (NPS bajo)

ESTRATEGIAS DE RETENCIÓN:
1. **Escucha activa** - Entiende el motivo real
2. **Reconocimiento** - Valora su antigüedad y fidelidad
3. **Solución** - Ofrece alternativas personalizadas
4. **Incentivo** - Descuentos, mejoras de cobertura, servicios extra

OFERTAS DISPONIBLES (según scoring):
- Descuento 5-15% en renovación
- Fraccionamiento sin recargo
- Mejora de coberturas sin coste
- Upgrade a producto superior
- Servicios adicionales gratis

LÍMITES DE AUTORIDAD:
- Hasta 10% descuento: Aprobación automática
- 10-15% descuento: Requiere supervisor
- >15% descuento: Requiere dirección comercial

REGLAS:
1. NUNCA dejes ir a un cliente sin intentar retenerlo
2. Personaliza la oferta según el perfil
3. Si el cliente insiste en la baja, facilita el proceso profesionalmente
4. Registra siempre el motivo de baja
5. Deja la puerta abierta para el futuro

TONO: Empático, persuasivo pero respetuoso, orientado a soluciones.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.6,
  tools: ['get_party', 'get_policy', 'search_policies', 'get_customer_score', 'get_segment', 'send_email', 'send_whatsapp', 'start_workflow'],
  maxTurns: 30,
  timeout: 600000,
  databases: ['sm_global', 'ss_insurance', 'ss_retention', 'sm_analytics', 'sm_communications'],
  permissions: ['read:party', 'read:policy', 'read:scores', 'write:retention_action', 'send:notification'],
  isActive: true,
};

export class RetentionAgent extends BaseAgent {
  constructor() {
    super(RETENTION_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = (lastUserMessage?.content ?? '').toLowerCase();

    let response: string;

    if (userContent.includes('baja') || userContent.includes('cancelar') || userContent.includes('anular')) {
      response = `Entiendo que estás considerando darte de baja. Antes de proceder, me gustaría entender mejor tu situación para ver si puedo ayudarte.

¿Me cuentas el motivo?

💰 **Precio**: Quizá puedo mejorar las condiciones
📋 **Coberturas**: Podemos ajustar el producto a tus necesidades
😔 **Servicio**: Si ha habido algún problema, quiero solucionarlo
🏠 **Cambio personal**: Mudanza, venta de vehículo, etc.
🔄 **Otra oferta**: Déjame ver si puedo igualarlo

Llevas [X años] con nosotros y valoramos mucho tu confianza. ¿Qué ha pasado?`;
    } else if (userContent.includes('caro') || userContent.includes('precio') || userContent.includes('oferta')) {
      response = `Entiendo tu preocupación por el precio. Déjame revisar tu póliza para ver qué opciones tenemos.

He comprobado que eres cliente desde hace [X años] y eso tiene valor para nosotros.

Puedo ofrecerte:

🎯 **Opción 1 - Mantener coberturas**:
   Descuento del [X]% = Nueva prima [Y]€/año

🎯 **Opción 2 - Ajustar coberturas**:
   Eliminando [cobertura opcional]
   Nueva prima [Z]€/año

🎯 **Opción 3 - Fraccionamiento**:
   Pago mensual sin recargo: [W]€/mes

¿Alguna de estas opciones te encaja? También puedo revisar si tienes derecho a otras bonificaciones.`;
    } else if (userContent.includes('mal servicio') || userContent.includes('queja') || userContent.includes('problema')) {
      response = `Lamento mucho que hayas tenido una mala experiencia. Eso no representa los valores de Soriano Mediadores.

Quiero entender exactamente qué ha pasado para:
1. ✅ **Solucionar tu problema** de forma inmediata
2. 🔧 **Mejorar** para que no vuelva a ocurrir
3. 🎁 **Compensarte** por las molestias

¿Me cuentas qué ha sucedido? Te aseguro que me ocupo personalmente de resolverlo.`;
    } else if (userContent.includes('me voy') || userContent.includes('decisión tomada')) {
      response = `Respeto tu decisión, aunque me apena que nos dejes.

Antes de procesar la baja, déjame hacerte una última propuesta personalizada basada en tu perfil de cliente [TIER].

[OFERTA FINAL]

Si aún así prefieres irte:
- La baja será efectiva a fin de período
- Tienes derecho a devolución proporcional
- Recibirás certificado de no siniestralidad
- Guardaremos tu historial por si quieres volver

¿Hay algo que pudiera hacerte cambiar de opinión?`;
    } else {
      response = `Hola, soy SORI, tu gestor personal en Soriano Mediadores.

Me pongo en contacto contigo porque quiero asegurarme de que todo va bien con tu seguro.

¿Hay algo que podamos mejorar? Estoy aquí para:
- 🔍 Revisar tus coberturas
- 💰 Buscar mejores condiciones
- 📞 Resolver cualquier duda
- 🎁 Informarte de ventajas exclusivas para clientes

¿Cómo puedo ayudarte hoy?`;
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

  async analyzeChurnRisk(partyId: string): Promise<{
    riskScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    recommendedActions: string[];
  }> {
    // TODO: Call AI-Analytics prediction service
    return {
      riskScore: 0.35,
      riskLevel: 'MEDIUM',
      factors: ['No renewal response', 'Price increase last year'],
      recommendedActions: ['Call within 48h', 'Offer 10% discount'],
    };
  }

  async calculateRetentionOffer(partyId: string, policyId: string): Promise<{
    discountPercentage: number;
    additionalCoverages: string[];
    specialServices: string[];
    validUntil: Date;
  }> {
    // TODO: Use ML model to personalize offer
    return {
      discountPercentage: 12,
      additionalCoverages: ['Asistencia Premium'],
      specialServices: ['Gestor personal', 'Línea prioritaria'],
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };
  }
}

export const retentionAgent = new RetentionAgent();
