// Claims Agent - Handles claims intake and processing

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const CLAIMS_AGENT_DEFINITION: AgentDefinition = {
  id: 'claims-agent-v1',
  type: 'CLAIMS_PROCESSOR',
  name: 'Agente de Siniestros SORI',
  description: 'Agente especializado en apertura, seguimiento y gestión de siniestros',
  systemPrompt: `Eres SORI, el asistente de siniestros de Soriano Mediadores.

Tu objetivo es ayudar a los clientes con sus siniestros:
- Apertura de nuevos siniestros
- Seguimiento del estado de siniestros existentes
- Recopilación de documentación necesaria
- Coordinación con peritos y talleres
- Información sobre coberturas y exclusiones
- Gestión de reclamaciones

PROCESO DE APERTURA DE SINIESTRO:
1. Verificar que el cliente tiene póliza vigente
2. Recopilar datos del siniestro:
   - Fecha y hora del incidente
   - Lugar exacto
   - Descripción detallada
   - Daños sufridos
   - Terceros implicados
   - Testigos
3. Informar de la documentación necesaria
4. Crear el expediente en el sistema
5. Asignar gestor y comunicar próximos pasos

DOCUMENTACIÓN HABITUAL:
- Auto: Parte amistoso, fotos, denuncia (si procede)
- Hogar: Fotos, facturas de bienes dañados, denuncia (si robo)
- Salud: Informes médicos, facturas, recetas

TIEMPOS ORIENTATIVOS:
- Apertura: Inmediata
- Asignación perito: 24-48h
- Resolución: Según complejidad (7-30 días)

REGLAS:
1. Muestra empatía - el cliente está en una situación difícil
2. Sé claro con los pasos a seguir
3. No prometas coberturas sin verificar la póliza
4. Si hay dudas sobre cobertura, escala a tramitador
5. Registra todo en el expediente

TONO: Empático, profesional, tranquilizador.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.5,
  tools: ['get_party', 'get_policy', 'get_claim', 'create_claim', 'update_claim_status', 'search_documents', 'generate_document', 'send_email', 'send_sms', 'start_workflow'],
  maxTurns: 30,
  timeout: 600000,
  databases: ['sm_global', 'ss_insurance', 'sm_documents', 'sm_communications', 'sm_workflows'],
  permissions: ['read:party', 'read:policy', 'write:claim', 'read:document', 'write:document', 'send:notification'],
  isActive: true,
};

export class ClaimsAgent extends BaseAgent {
  constructor() {
    super(CLAIMS_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('abrir') || userContent.toLowerCase().includes('nuevo siniestro')) {
      response = `Lamento que hayas tenido un incidente. Voy a ayudarte a abrir el siniestro.

Para tramitarlo correctamente necesito que me indiques:

1. **Número de póliza** (lo encuentras en tu carnet o app)
2. **Fecha y hora** del incidente
3. **Lugar** donde ocurrió
4. **Descripción** de lo sucedido
5. **Daños** que has sufrido

¿Empezamos? Dame el número de póliza y te verifico la cobertura.`;
    } else if (userContent.toLowerCase().includes('estado') || userContent.toLowerCase().includes('cómo va')) {
      response = `Para consultar el estado de tu siniestro necesito:
- El número de expediente (SIN-XXXX-XXXXX), o
- El número de póliza

¿Me lo facilitas?

También puedes consultar el estado en tiempo real desde:
- La app de Soriano Seguros
- Tu área de cliente en www.sorianoseguros.com`;
    } else if (userContent.toLowerCase().includes('documento') || userContent.toLowerCase().includes('foto')) {
      response = `Para adjuntar documentación a tu siniestro tienes varias opciones:

📱 **Por WhatsApp**: Envía las fotos/documentos a este número
📧 **Por email**: siniestros@sorianoseguros.com (indica nº expediente)
💻 **Área cliente**: Sube los archivos directamente

**Documentación habitual necesaria:**

🚗 *Siniestro de Auto*:
- Parte amistoso firmado
- Fotos de los daños
- Denuncia policial (si hay heridos o discrepancia)

🏠 *Siniestro de Hogar*:
- Fotos de los daños
- Facturas de bienes dañados
- Denuncia (en caso de robo)

¿Qué documentación necesitas enviar?`;
    } else if (userContent.toLowerCase().includes('perito') || userContent.toLowerCase().includes('taller')) {
      response = `Sobre la gestión de peritos y talleres:

🔍 **Peritaje**:
- El perito contactará contigo en 24-48h laborables
- Puedes solicitar cita en horario que te convenga
- El informe suele estar en 3-5 días

🔧 **Talleres concertados**:
Trabajamos con una red de talleres de confianza. Ventajas:
- Sin adelantar dinero
- Garantía de reparación
- Vehículo de sustitución (según póliza)

¿Necesitas que te asigne un perito o busque un taller cercano?`;
    } else {
      response = `¡Hola! Soy SORI, tu asistente de siniestros de Soriano Mediadores.

Puedo ayudarte con:
📝 Abrir un nuevo siniestro
🔍 Consultar el estado de un siniestro
📎 Enviar documentación
🔧 Información sobre peritos y talleres
❓ Dudas sobre coberturas

¿En qué puedo ayudarte?`;
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

  async openClaim(policyNumber: string, incidentData: Record<string, unknown>): Promise<unknown> {
    // 1. Verify policy is active
    const policyTool = this.tools.get('get_policy');
    const policy = await policyTool?.handler({ policyNumber }, this.instance?.context ?? {});

    // 2. Create claim
    const claimTool = this.tools.get('create_claim');
    const claim = await claimTool?.handler(
      { policyNumber, ...incidentData },
      this.instance?.context ?? {}
    );

    // 3. Start workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      { workflowCode: 'SINIESTRO', title: `Siniestro ${policyNumber}`, entityType: 'claim', entityId: (claim as { claimNumber?: string })?.claimNumber },
      this.instance?.context ?? {}
    );

    // 4. Notify client
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      { to: 'client@email.com', templateCode: 'CLAIM_OPENED', templateData: claim },
      this.instance?.context ?? {}
    );

    return claim;
  }

  async checkFraudScore(claimId: string): Promise<{ score: number; flags: string[] }> {
    // TODO: Integrate with AI-Analytics fraud detection
    return {
      score: 0.12,
      flags: [],
    };
  }
}

export const claimsAgent = new ClaimsAgent();
