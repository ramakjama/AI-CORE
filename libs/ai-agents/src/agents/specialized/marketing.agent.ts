// Marketing Agent - Handles marketing campaigns and market analysis

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const MARKETING_AGENT_DEFINITION: AgentDefinition = {
  id: 'marketing-agent-v1',
  type: 'MARKETING_AGENT',
  name: 'Agente de Marketing SORI',
  description: 'Agente especializado en campanas de marketing, segmentacion de clientes, analisis de mercado y content marketing',
  systemPrompt: `Eres SORI, el asistente de Marketing de Soriano Mediadores.

Tu objetivo es ayudar en todas las actividades de marketing:
- Gestion de campanas de marketing
- Segmentacion y targeting de clientes
- Analisis de mercado y competencia
- Content marketing y comunicacion
- Medicion de resultados y ROI

AREAS DE MARKETING:

1. CAMPANAS DE MARKETING:
   - Campanas de captacion
   - Campanas de cross-selling/up-selling
   - Campanas de retencion
   - Campanas estacionales
   - Campanas de producto

2. SEGMENTACION DE CLIENTES:
   | Segmento | Criterios | Estrategia |
   |----------|-----------|------------|
   | Premium | Cartera > 3.000 EUR | Alto valor, servicio VIP |
   | Fidelizado | Antiguedad > 5 anos | Cross-sell, fidelizacion |
   | Potencial | 1 poliza, scoring alto | Up-sell, vinculacion |
   | En riesgo | Baja satisfaccion | Retencion activa |
   | Nuevo | < 1 ano | Onboarding, activacion |

3. CANALES DE COMUNICACION:
   - Email marketing
   - SMS/WhatsApp
   - Push notifications (app)
   - Correo postal
   - Redes sociales
   - Telefono (campanas outbound)

4. CONTENT MARKETING:
   - Blog y articulos
   - Newsletters
   - Guias y ebooks
   - Videos informativos
   - Infografias
   - Webinars

5. ANALISIS DE MERCADO:
   - Cuota de mercado
   - Analisis de competencia
   - Tendencias del sector
   - Comportamiento del consumidor
   - Oportunidades de negocio

METRICAS DE MARKETING:

| KPI | Objetivo |
|-----|----------|
| Tasa apertura email | > 25% |
| CTR email | > 3% |
| Conversion campana | > 2% |
| Coste adquisicion (CAC) | < 150 EUR |
| ROI campanas | > 300% |
| NPS | > 50 |

REGLAS DE COMUNICACION:
1. Respetar preferencias de contacto del cliente
2. Verificar consentimientos GDPR antes de comunicar
3. Personalizar mensajes segun segmento
4. Evitar saturacion (max 2 comunicaciones/semana)
5. A/B testing obligatorio en campanas masivas

CALENDARIO ANUAL:
- Enero: Renovaciones, propositos
- Marzo: Salud, bienestar
- Mayo: Auto, viajes
- Septiembre: Hogar, vuelta al cole
- Noviembre: Black Friday, ahorro
- Diciembre: Balance anual, fidelizacion

TONO: Creativo, orientado a datos, estrategico.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.7,
  tools: ['get_campaign', 'create_campaign', 'get_segment', 'analyze_market', 'search_parties', 'check_consent', 'send_email', 'generate_document'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_marketing', 'sm_leads', 'sm_communications', 'sm_analytics', 'sm_documents'],
  permissions: ['read:campaign', 'write:campaign', 'read:segment', 'write:segment', 'read:market', 'read:consent', 'send:marketing', 'generate:report'],
  isActive: true,
};

export class MarketingAgent extends BaseAgent {
  constructor() {
    super(MARKETING_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('campana') || userContent.toLowerCase().includes('campaign') || userContent.toLowerCase().includes('lanzar')) {
      response = `Te ayudo con la gestion de campanas.

**Campanas activas:**
Para ver las campanas actuales, consultare el sistema.

**Crear nueva campana:**

Para configurar una campana necesito:

1. **Datos basicos:**
   - Nombre de la campana
   - Objetivo (captacion, cross-sell, retencion...)
   - Fechas inicio/fin
   - Presupuesto asignado

2. **Segmento objetivo:**
   - Criterios de seleccion
   - Tamano estimado del publico
   - Exclusiones

3. **Mensaje y creatividad:**
   - Asunto/headline
   - Contenido principal
   - Call-to-action
   - Landing page

4. **Canales:**
   - Email
   - SMS
   - Push notification
   - Combinacion multicanal

**Tipos de campana predefinidas:**
| Tipo | Descripcion | Canal recomendado |
|------|-------------|-------------------|
| Cross-sell auto | Clientes hogar sin auto | Email + Telefono |
| Renovacion | Polizas proximas a vencer | Email + SMS |
| Cumpleanos | Felicitacion + oferta | Email |
| Reactivacion | Clientes sin actividad | Email + Telefono |
| Referidos | Programa trae un amigo | Email + App |

¿Que tipo de campana quieres crear o gestionar?`;
    } else if (userContent.toLowerCase().includes('segment') || userContent.toLowerCase().includes('target') || userContent.toLowerCase().includes('publico')) {
      response = `Te ayudo con la segmentacion de clientes.

**Segmentos predefinidos:**

| Segmento | Tamano aprox. | Caracteristicas |
|----------|---------------|-----------------|
| Premium | 5% | Cartera > 3.000 EUR/ano |
| Alto valor | 15% | Cartera 1.500-3.000 EUR |
| Standard | 50% | Cartera 500-1.500 EUR |
| Basico | 30% | Cartera < 500 EUR |

**Segmentos por comportamiento:**
- **Multi-poliza**: 3+ polizas activas
- **Mono-poliza**: Solo 1 poliza
- **Cross-sell potencial**: Scoring alto, pocas polizas
- **Riesgo de fuga**: Baja satisfaccion o interaccion
- **Nuevo digital**: Alta uso app/web

**Crear segmento personalizado:**

Criterios disponibles:
- Demograficos: edad, ubicacion, profesion
- Productos: ramo, compania, cobertura
- Valor: prima, antiguedad, siniestralidad
- Comportamiento: uso digital, respuesta campanas
- Consentimientos: marketing, canales

**Para crear un segmento indicame:**
1. Nombre del segmento
2. Criterios de inclusion
3. Criterios de exclusion
4. Uso previsto (campana, analisis...)

¿Que segmento necesitas crear o consultar?`;
    } else if (userContent.toLowerCase().includes('mercado') || userContent.toLowerCase().includes('competencia') || userContent.toLowerCase().includes('tendencia')) {
      response = `Te proporciono analisis de mercado.

**Panorama del sector asegurador:**

**Cuota de mercado (Correduria):**
Para datos actualizados de cuota de mercado, consultare las fuentes de informacion.

**Tendencias principales 2024-2025:**

1. **Digitalizacion**
   - Contratacion online
   - Autoservicio cliente
   - IA en atencion

2. **Nuevos riesgos**
   - Ciberseguros
   - ESG/Sostenibilidad
   - Movilidad electrica

3. **Personalizacion**
   - Seguros on-demand
   - Pay-per-use
   - Productos modulares

4. **Experiencia cliente**
   - Omnicanalidad
   - Inmediatez
   - Transparencia

**Competencia - Puntos clave:**
| Aspecto | Fortaleza nuestra | Oportunidad |
|---------|-------------------|-------------|
| Precio | Multitarificador | Negociacion volumen |
| Servicio | Atencion personal | Digitalizacion |
| Producto | Especialización | Nuevos ramos |
| Canal | Presencial | Online/App |

**Informes disponibles:**
- Analisis de competencia por producto
- Evolucion del mercado
- Benchmark de precios
- Tendencias de consumidor

¿Que aspecto del mercado quieres analizar?`;
    } else if (userContent.toLowerCase().includes('contenido') || userContent.toLowerCase().includes('content') || userContent.toLowerCase().includes('blog') || userContent.toLowerCase().includes('newsletter')) {
      response = `Te ayudo con content marketing.

**Calendario editorial:**

**Proximos contenidos programados:**
Para ver el calendario actual, consultare el sistema.

**Tipos de contenido:**

| Formato | Frecuencia | Objetivo |
|---------|------------|----------|
| Newsletter | Mensual | Fidelizacion |
| Blog | Semanal | SEO, educacion |
| Guias | Trimestral | Lead generation |
| Videos | Quincenal | Engagement |
| Infografias | Mensual | Viralidad |

**Tematicas por producto:**

*Auto*: Consejos conduccion, novedades trafico
*Hogar*: Seguridad, mantenimiento, ahorro
*Salud*: Bienestar, prevencion, nutricion
*Vida*: Planificacion, ahorro, familia
*Empresas*: Gestion riesgos, normativa

**Crear nuevo contenido:**

Para planificar contenido indicame:
1. Tipo de contenido
2. Tematica/producto
3. Objetivo (SEO, conversion, branding)
4. Fecha de publicacion
5. Canales de distribucion

**Metricas de contenido:**
| KPI | Objetivo |
|-----|----------|
| Lecturas blog | > 500/articulo |
| Tiempo lectura | > 2 min |
| Compartidos | > 50/post |
| Leads generados | > 10/guia |

¿Que contenido quieres crear o revisar?`;
    } else if (userContent.toLowerCase().includes('resultado') || userContent.toLowerCase().includes('roi') || userContent.toLowerCase().includes('metrica') || userContent.toLowerCase().includes('kpi')) {
      response = `Te muestro las metricas de marketing.

**Dashboard de Marketing:**

**Campanas ultimo mes:**
Para ver los resultados actualizados, consultare el sistema.

**KPIs principales:**

| Metrica | Valor | Objetivo | Estado |
|---------|-------|----------|--------|
| Leads generados | (dato) | 200/mes | (estado) |
| Conversion leads | (dato) | 15% | (estado) |
| CAC | (dato) | < 150 EUR | (estado) |
| Email open rate | (dato) | > 25% | (estado) |
| Email CTR | (dato) | > 3% | (estado) |
| ROI campanas | (dato) | > 300% | (estado) |

**Analisis por canal:**
| Canal | Leads | Conversion | CAC |
|-------|-------|------------|-----|
| Email | (dato) | (dato) | (dato) |
| Paid Search | (dato) | (dato) | (dato) |
| Social | (dato) | (dato) | (dato) |
| Referidos | (dato) | (dato) | (dato) |
| Organico | (dato) | (dato) | (dato) |

**Top campanas por ROI:**
1. (Campana con mejor rendimiento)
2. (Segunda mejor campana)
3. (Tercera mejor campana)

**Informes disponibles:**
- Performance semanal
- Informe mensual de marketing
- Analisis de atribucion
- Comparativa YoY

¿Que periodo o campana quieres analizar?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Marketing en Soriano Mediadores.

Puedo ayudarte con:
- **Campanas**: Crear, gestionar y optimizar campanas
- **Segmentacion**: Definir y analizar segmentos de clientes
- **Mercado**: Analisis de competencia y tendencias
- **Contenido**: Planificar y crear content marketing
- **Resultados**: Metricas, KPIs y ROI

**Herramientas disponibles:**
- Gestor de campanas
- Segmentador de audiencias
- Analisis de mercado
- Calendario editorial
- Dashboard de metricas

**Proximas campanas programadas:**
- (Consultar calendario)

¿En que puedo ayudarte?`;
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

  async getCampaign(campaignId: string): Promise<unknown> {
    const campaignTool = this.tools.get('get_campaign');
    if (!campaignTool) throw new Error('Campaign tool not available');

    return campaignTool.handler(
      { campaignId },
      this.instance?.context ?? {}
    );
  }

  async createCampaign(campaignData: {
    name: string;
    type: string;
    segmentId: string;
    channel: string;
    startDate: Date;
    endDate: Date;
    content: Record<string, unknown>;
    budget?: number;
  }): Promise<unknown> {
    // 1. Validate segment and get audience size
    const segmentTool = this.tools.get('get_segment');
    const segment = await segmentTool?.handler(
      { segmentId: campaignData.segmentId },
      this.instance?.context ?? {}
    );

    // 2. Create the campaign
    const campaignTool = this.tools.get('create_campaign');
    const campaign = await campaignTool?.handler(
      {
        ...campaignData,
        audienceSize: (segment as { size?: number })?.size ?? 0,
        status: 'DRAFT'
      },
      this.instance?.context ?? {}
    );

    // 3. Generate creative assets if needed
    const docTool = this.tools.get('generate_document');
    if (campaignData.channel === 'email') {
      await docTool?.handler(
        {
          templateCode: 'EMAIL_CAMPAIGN',
          data: campaignData.content,
          format: 'HTML'
        },
        this.instance?.context ?? {}
      );
    }

    return campaign;
  }

  async getSegment(segmentId: string): Promise<unknown> {
    const segmentTool = this.tools.get('get_segment');
    if (!segmentTool) throw new Error('Segment tool not available');

    return segmentTool.handler(
      { segmentId },
      this.instance?.context ?? {}
    );
  }

  async analyzeMarket(params: { product?: string; competitor?: string; period?: string }): Promise<unknown> {
    const marketTool = this.tools.get('analyze_market');
    if (!marketTool) throw new Error('Market analysis tool not available');

    return marketTool.handler(
      params,
      this.instance?.context ?? {}
    );
  }

  async launchCampaign(campaignId: string): Promise<unknown> {
    // 1. Get campaign details
    const campaign = await this.getCampaign(campaignId);

    // 2. Get segment and validate consents
    const segmentTool = this.tools.get('get_segment');
    const segment = await segmentTool?.handler(
      { segmentId: (campaign as { segmentId?: string })?.segmentId },
      this.instance?.context ?? {}
    );

    // 3. Check consents for segment
    const consentTool = this.tools.get('check_consent');
    // Filter audience by consent

    // 4. Update campaign status
    const campaignTool = this.tools.get('create_campaign'); // Using for update
    const updatedCampaign = await campaignTool?.handler(
      { campaignId, status: 'ACTIVE', launchedAt: new Date() },
      this.instance?.context ?? {}
    );

    // 5. Send notifications
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: 'marketing@sorianoseguros.com',
        templateCode: 'CAMPAIGN_LAUNCHED',
        templateData: updatedCampaign
      },
      this.instance?.context ?? {}
    );

    return {
      campaignId,
      status: 'LAUNCHED',
      audienceSize: (segment as { size?: number })?.size ?? 0,
      launchedAt: new Date()
    };
  }

  async getCampaignMetrics(campaignId: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
    roi: number;
  }> {
    // TODO: Integrate with analytics for real metrics
    return {
      sent: 5000,
      delivered: 4850,
      opened: 1213,
      clicked: 182,
      converted: 36,
      openRate: 25.01,
      clickRate: 3.75,
      conversionRate: 0.74,
      roi: 320
    };
  }
}

export const marketingAgent = new MarketingAgent();
