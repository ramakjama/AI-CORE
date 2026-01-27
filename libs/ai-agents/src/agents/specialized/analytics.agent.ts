// Analytics Agent - Handles dashboards, KPIs, and predictive analytics

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const ANALYTICS_AGENT_DEFINITION: AgentDefinition = {
  id: 'analytics-agent-v1',
  type: 'ANALYTICS_AGENT',
  name: 'Agente de Analitica SORI',
  description: 'Agente especializado en dashboards, KPIs, analisis de datos, predicciones y business intelligence',
  systemPrompt: `Eres SORI, el asistente de Analitica de Soriano Mediadores.

Tu objetivo es proporcionar insights basados en datos:
- Dashboards interactivos y reportes
- KPIs y metricas de negocio
- Analisis predictivo y tendencias
- Business Intelligence
- Visualizacion de datos

AREAS DE ANALISIS:

1. KPIs DE NEGOCIO:
   **Comerciales:**
   | KPI | Descripcion | Objetivo |
   |-----|-------------|----------|
   | Nueva produccion | Primas de nuevas polizas | +10% YoY |
   | Cartera total | Primas en vigor | +5% YoY |
   | Ratio conversion | Presupuestos a polizas | > 25% |
   | Ticket medio | Prima media por poliza | Variable |
   | Polizas por cliente | Vinculacion | > 1.5 |

   **Retencion:**
   | KPI | Descripcion | Objetivo |
   |-----|-------------|----------|
   | Tasa renovacion | Polizas renovadas | > 90% |
   | Churn rate | Clientes perdidos | < 8% |
   | NPS | Net Promoter Score | > 50 |
   | Lifetime Value | Valor cliente | +5% |

   **Operativos:**
   | KPI | Descripcion | Objetivo |
   |-----|-------------|----------|
   | Tiempo emision | Dias hasta emision | < 2 dias |
   | Tiempo siniestro | Dias resolucion | < 30 dias |
   | FCR | Resolucion primer contacto | > 80% |
   | Productividad | Operaciones/FTE | Variable |

   **Financieros:**
   | KPI | Descripcion | Objetivo |
   |-----|-------------|----------|
   | Ingresos | Comisiones cobradas | Budget |
   | Margen | Comision / Prima | Variable |
   | DSO | Dias cobro pendiente | < 30 dias |
   | Morosidad | Impagos / Cartera | < 2% |

2. DASHBOARDS DISPONIBLES:
   - Dashboard ejecutivo
   - Dashboard comercial
   - Dashboard de operaciones
   - Dashboard financiero
   - Dashboard de calidad
   - Dashboard de RRHH

3. ANALISIS PREDICTIVO:
   - Prediccion de churn
   - Propension a compra
   - Estimacion siniestralidad
   - Proyeccion de cartera
   - Alertas proactivas

4. SEGMENTACION ANALITICA:
   - RFM (Recencia, Frecuencia, Monetario)
   - Clustering de clientes
   - Analisis de comportamiento
   - Scoring predictivo

5. REPORTES:
   **Periodicidad:**
   - Diarios: Actividad, alertas
   - Semanales: Comercial, operaciones
   - Mensuales: Ejecutivo, financiero
   - Trimestrales: Estrategico

   **Formatos:**
   - PDF para direccion
   - Excel para analisis
   - Power BI interactivo
   - API para integraciones

FUENTES DE DATOS:
- CRM (Dynamics)
- Core de seguros
- Sistemas de companias
- Encuestas de satisfaccion
- Call center
- Web/App

HERRAMIENTAS:
- Power BI (dashboards)
- Python (modelos predictivos)
- SQL Server (data warehouse)
- Azure ML (machine learning)

REGLAS:
1. Los datos siempre tienen fecha de actualizacion
2. Comparativas YoY y MoM cuando aplique
3. Destacar desviaciones significativas (>10%)
4. Incluir contexto en las metricas
5. Proteger datos sensibles en reportes

TONO: Analitico, objetivo, orientado a accion.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  tools: ['get_dashboard', 'get_kpi', 'run_prediction', 'generate_report', 'get_segment', 'query_data', 'send_email', 'generate_document'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_analytics', 'sm_datawarehouse', 'ss_insurance', 'sf_finance', 'sm_marketing', 'sm_quality'],
  permissions: ['read:analytics', 'read:dashboard', 'read:kpi', 'run:prediction', 'generate:report', 'query:data', 'send:report'],
  isActive: true,
};

export class AnalyticsAgent extends BaseAgent {
  constructor() {
    super(ANALYTICS_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('dashboard') || userContent.toLowerCase().includes('panel') || userContent.toLowerCase().includes('cuadro mando')) {
      response = `Te muestro la informacion de dashboards.

**Dashboards disponibles:**

| Dashboard | Audiencia | Actualizacion |
|-----------|-----------|---------------|
| Ejecutivo | Direccion | Diaria |
| Comercial | Ventas, Direccion | Tiempo real |
| Operaciones | Operaciones, Direccion | Tiempo real |
| Financiero | Finanzas, Direccion | Diaria |
| Calidad | Calidad, Direccion | Diaria |
| RRHH | RRHH, Direccion | Semanal |

**Dashboard Ejecutivo - Resumen:**

| Indicador | Actual | Objetivo | Tendencia |
|-----------|--------|----------|-----------|
| Cartera total | (dato) | (objetivo) | (tendencia) |
| Nueva produccion MTD | (dato) | (objetivo) | (tendencia) |
| Tasa renovacion | (dato) | > 90% | (tendencia) |
| NPS | (dato) | > 50 | (tendencia) |
| Margen | (dato) | (objetivo) | (tendencia) |

**Alertas activas:**
Se muestran desviaciones > 10% vs objetivo.

**Acceso a dashboards:**
Los dashboards interactivos estan en Power BI.
URL: powerbi.sorianoseguros.com

**Filtros disponibles:**
- Por periodo (dia, semana, mes, trimestre, ano)
- Por producto/ramo
- Por comercial/oficina
- Por compania aseguradora
- Por segmento de cliente

¿Que dashboard quieres consultar en detalle?`;
    } else if (userContent.toLowerCase().includes('kpi') || userContent.toLowerCase().includes('indicador') || userContent.toLowerCase().includes('metrica')) {
      response = `Te informo sobre los KPIs de negocio.

**Selecciona el area de KPIs:**

**1. KPIs Comerciales:**
| KPI | Valor | Objetivo | Estado |
|-----|-------|----------|--------|
| Nueva produccion | (dato) | +10% YoY | (estado) |
| Cartera vigente | (dato) | +5% YoY | (estado) |
| Ratio conversion | (dato) | > 25% | (estado) |
| Ticket medio | (dato) | (objetivo) | (estado) |
| Polizas/cliente | (dato) | > 1.5 | (estado) |

**2. KPIs de Retencion:**
| KPI | Valor | Objetivo | Estado |
|-----|-------|----------|--------|
| Tasa renovacion | (dato) | > 90% | (estado) |
| Churn rate | (dato) | < 8% | (estado) |
| NPS | (dato) | > 50 | (estado) |
| LTV | (dato) | +5% | (estado) |

**3. KPIs Operativos:**
| KPI | Valor | Objetivo | Estado |
|-----|-------|----------|--------|
| Tiempo emision | (dato) | < 2 dias | (estado) |
| Tiempo siniestro | (dato) | < 30 dias | (estado) |
| FCR | (dato) | > 80% | (estado) |
| Productividad | (dato) | (objetivo) | (estado) |

**4. KPIs Financieros:**
| KPI | Valor | Objetivo | Estado |
|-----|-------|----------|--------|
| Ingresos | (dato) | Budget | (estado) |
| Margen medio | (dato) | (objetivo) | (estado) |
| DSO | (dato) | < 30 dias | (estado) |
| Morosidad | (dato) | < 2% | (estado) |

**Consulta KPI especifico:**
Puedo darte detalle por:
- Periodo (dia, semana, mes, YTD)
- Dimension (producto, comercial, oficina)
- Comparativa (vs periodo anterior, vs objetivo)

¿Que KPI quieres analizar en profundidad?`;
    } else if (userContent.toLowerCase().includes('prediccion') || userContent.toLowerCase().includes('predecir') || userContent.toLowerCase().includes('forecast') || userContent.toLowerCase().includes('proyeccion')) {
      response = `Te informo sobre analitica predictiva.

**Modelos predictivos disponibles:**

**1. Prediccion de Churn:**
Identifica clientes con riesgo de baja.
| Segmento | Clientes en riesgo | Churn esperado |
|----------|-------------------|----------------|
| Alto riesgo | (dato) | > 70% |
| Riesgo medio | (dato) | 30-70% |
| Bajo riesgo | (dato) | < 30% |

Variables del modelo:
- Antiguedad, siniestralidad, NPS
- Interacciones recientes
- Incrementos de prima
- Comparativa de precio

**2. Propension a compra:**
Identifica oportunidades de cross/up-selling.
| Producto | Clientes objetivo | Propension media |
|----------|-------------------|------------------|
| Auto | (dato) | (%) |
| Hogar | (dato) | (%) |
| Vida | (dato) | (%) |
| Salud | (dato) | (%) |

**3. Proyeccion de cartera:**
| Escenario | Cartera proyectada | Crecimiento |
|-----------|-------------------|-------------|
| Optimista | (dato) | (%) |
| Base | (dato) | (%) |
| Pesimista | (dato) | (%) |

**4. Estimacion de siniestralidad:**
Proyeccion de siniestros y reservas.

**5. Alertas proactivas:**
- Polizas en riesgo de cancelacion
- Clientes con bajo engagement
- Anomalias en patrones

**Ejecutar prediccion:**
Puedo ejecutar un modelo especifico para:
- Un cliente
- Un segmento
- Toda la cartera

¿Que prediccion necesitas?`;
    } else if (userContent.toLowerCase().includes('reporte') || userContent.toLowerCase().includes('informe') || userContent.toLowerCase().includes('report')) {
      response = `Te ayudo con la generacion de reportes.

**Reportes programados:**

| Reporte | Frecuencia | Destinatarios | Formato |
|---------|------------|---------------|---------|
| Actividad diaria | Diario | Operaciones | Email |
| Flash comercial | Semanal | Ventas | PDF |
| Informe ejecutivo | Mensual | Direccion | PDF |
| Cierre financiero | Mensual | Finanzas | Excel |
| Balanced Scorecard | Trimestral | Direccion | PDF+BI |

**Generar reporte ad-hoc:**

Para crear un reporte personalizado indicame:

1. **Tipo de analisis:**
   - Comercial (produccion, conversion, cartera)
   - Operativo (tiempos, calidad, productividad)
   - Financiero (ingresos, margenes, cobros)
   - Cliente (satisfaccion, comportamiento)

2. **Periodo:**
   - Rango de fechas
   - Comparativa con periodo anterior

3. **Dimensiones:**
   - Por producto/ramo
   - Por comercial/equipo
   - Por oficina/zona
   - Por compania
   - Por segmento

4. **Formato de salida:**
   - PDF (para presentar)
   - Excel (para analizar)
   - Power BI (interactivo)

**Reportes mas solicitados:**
- Top 10 comerciales por produccion
- Analisis de renovaciones mes
- Comparativa de companias
- Evolucion de cartera por producto
- Analisis de siniestralidad

¿Que reporte necesitas generar?`;
    } else if (userContent.toLowerCase().includes('segmento') || userContent.toLowerCase().includes('rfm') || userContent.toLowerCase().includes('cluster') || userContent.toLowerCase().includes('analisis cliente')) {
      response = `Te informo sobre segmentacion analitica.

**Modelos de segmentacion:**

**1. Segmentacion RFM:**
| Segmento | Recencia | Frecuencia | Monetario | Clientes |
|----------|----------|------------|-----------|----------|
| Champions | Alta | Alta | Alto | (n) |
| Leales | Media | Alta | Alto | (n) |
| Potenciales | Alta | Baja | Medio | (n) |
| En riesgo | Baja | Baja | Alto | (n) |
| Perdidos | Baja | Baja | Bajo | (n) |

**2. Segmentacion por valor:**
| Segmento | Cartera | % Clientes | Estrategia |
|----------|---------|------------|------------|
| Premium | > 3.000 EUR | 5% | Retencion VIP |
| Alto valor | 1.500-3.000 EUR | 15% | Cross-sell |
| Standard | 500-1.500 EUR | 50% | Up-sell |
| Basico | < 500 EUR | 30% | Activacion |

**3. Clustering comportamental:**
Agrupacion automatica basada en:
- Patrones de interaccion
- Canales preferidos
- Respuesta a campanas
- Uso de servicios

**4. Scoring predictivo:**
| Tipo de score | Uso | Rango |
|---------------|-----|-------|
| Score de churn | Riesgo de baja | 0-100 |
| Score de propension | Probabilidad compra | 0-100 |
| Score de valor | Potencial economico | 0-100 |
| Score de engagement | Nivel de vinculacion | 0-100 |

**Consultar segmento:**
Puedo mostrarte:
- Composicion del segmento
- Caracteristicas principales
- Comportamiento historico
- Acciones recomendadas

¿Que segmento o analisis necesitas?`;
    } else if (userContent.toLowerCase().includes('tendencia') || userContent.toLowerCase().includes('evolucion') || userContent.toLowerCase().includes('historico')) {
      response = `Te muestro analisis de tendencias.

**Tendencias principales:**

**1. Evolucion de cartera:**
| Periodo | Cartera | Variacion | YoY |
|---------|---------|-----------|-----|
| Ene | (dato) | (%) | (%) |
| Feb | (dato) | (%) | (%) |
| Mar | (dato) | (%) | (%) |
| ... | ... | ... | ... |

**2. Tendencia de produccion:**
- Nueva produccion mensual
- Comparativa YoY
- Estacionalidad
- Proyeccion

**3. Evolucion de renovaciones:**
- Tasa de renovacion por mes
- Por producto
- Por comercial
- Tendencia

**4. Historico de siniestralidad:**
- Loss ratio por periodo
- Por producto
- Frecuencia y coste medio
- Tendencia

**5. Indicadores de calidad:**
- NPS historico
- CSAT por periodo
- FCR evolucion
- Tendencia

**Analisis disponibles:**
- Comparativa MoM (mes vs mes anterior)
- Comparativa YoY (vs mismo mes ano anterior)
- Acumulado YTD (vs objetivo)
- Tendencia (regresion)
- Estacionalidad

**Para ver tendencias indicame:**
1. Indicador o metrica
2. Periodo de analisis
3. Dimension de corte (producto, comercial, etc.)
4. Tipo de comparativa

¿Que tendencia quieres analizar?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Analitica en Soriano Mediadores.

Puedo ayudarte con:
- **Dashboards**: Paneles de control interactivos
- **KPIs**: Indicadores clave de negocio
- **Predicciones**: Modelos de churn, propension, proyecciones
- **Reportes**: Informes personalizados
- **Segmentacion**: Analisis RFM, clustering, scoring

**Resumen ejecutivo:**
| Indicador | Valor | Tendencia |
|-----------|-------|-----------|
| Cartera | (consultar) | (tendencia) |
| Nueva prod. | (consultar) | (tendencia) |
| Renovacion | (consultar) | (tendencia) |
| NPS | (consultar) | (tendencia) |

**Alertas activas:**
(Consultar sistema para desviaciones)

**Acceso directo:**
- Power BI: powerbi.sorianoseguros.com
- Reportes: /reports

**Contacto:**
analitica@sorianoseguros.com

¿Que analisis necesitas?`;
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

  async getDashboard(dashboardId: string, filters?: Record<string, unknown>): Promise<unknown> {
    const dashboardTool = this.tools.get('get_dashboard');
    if (!dashboardTool) throw new Error('Dashboard tool not available');

    return dashboardTool.handler(
      { dashboardId, ...filters },
      this.instance?.context ?? {}
    );
  }

  async getKPI(kpiId: string, params?: {
    period?: string;
    dimension?: string;
    comparison?: 'MoM' | 'YoY' | 'vs_target';
  }): Promise<unknown> {
    const kpiTool = this.tools.get('get_kpi');
    if (!kpiTool) throw new Error('KPI tool not available');

    return kpiTool.handler(
      { kpiId, ...params },
      this.instance?.context ?? {}
    );
  }

  async runPrediction(modelId: string, params: {
    entityType: 'client' | 'segment' | 'portfolio';
    entityId?: string;
    horizon?: number;
  }): Promise<unknown> {
    const predictionTool = this.tools.get('run_prediction');
    if (!predictionTool) throw new Error('Prediction tool not available');

    return predictionTool.handler(
      { modelId, ...params },
      this.instance?.context ?? {}
    );
  }

  async generateReport(reportConfig: {
    type: 'commercial' | 'operational' | 'financial' | 'customer';
    period: { start: Date; end: Date };
    dimensions?: string[];
    format: 'PDF' | 'EXCEL' | 'POWERBI';
    recipients?: string[];
  }): Promise<unknown> {
    // 1. Query data based on report type
    const queryTool = this.tools.get('query_data');
    const data = await queryTool?.handler(
      {
        reportType: reportConfig.type,
        period: reportConfig.period,
        dimensions: reportConfig.dimensions
      },
      this.instance?.context ?? {}
    );

    // 2. Generate the report document
    const docTool = this.tools.get('generate_document');
    const report = await docTool?.handler(
      {
        templateCode: `REPORT_${reportConfig.type.toUpperCase()}`,
        data,
        format: reportConfig.format
      },
      this.instance?.context ?? {}
    );

    // 3. Send to recipients if specified
    if (reportConfig.recipients && reportConfig.recipients.length > 0) {
      const emailTool = this.tools.get('send_email');
      await emailTool?.handler(
        {
          to: reportConfig.recipients,
          templateCode: 'REPORT_DELIVERY',
          templateData: { reportType: reportConfig.type, period: reportConfig.period },
          attachments: [report]
        },
        this.instance?.context ?? {}
      );
    }

    return {
      reportId: (report as { reportId?: string })?.reportId,
      type: reportConfig.type,
      format: reportConfig.format,
      generatedAt: new Date(),
      sentTo: reportConfig.recipients
    };
  }

  async getSegment(segmentType: 'RFM' | 'VALUE' | 'BEHAVIORAL' | 'CUSTOM', segmentId?: string): Promise<unknown> {
    const segmentTool = this.tools.get('get_segment');
    if (!segmentTool) throw new Error('Segment tool not available');

    return segmentTool.handler(
      { segmentType, segmentId },
      this.instance?.context ?? {}
    );
  }

  async getExecutiveSummary(): Promise<{
    portfolio: { value: number; growth: number };
    newProduction: { value: number; target: number };
    renewalRate: { value: number; target: number };
    nps: { value: number; target: number };
    alerts: Array<{ type: string; message: string; severity: string }>;
  }> {
    // TODO: Integrate with real data sources
    return {
      portfolio: { value: 15000000, growth: 5.2 },
      newProduction: { value: 1250000, target: 1500000 },
      renewalRate: { value: 91.5, target: 90 },
      nps: { value: 52, target: 50 },
      alerts: [
        { type: 'production', message: 'Nueva produccion 16% por debajo del objetivo', severity: 'warning' },
        { type: 'quality', message: 'NPS ha mejorado 5 puntos vs mes anterior', severity: 'positive' }
      ]
    };
  }

  async getChurnPrediction(clientId?: string): Promise<{
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
    topRiskClients?: Array<{ clientId: string; score: number; factors: string[] }>;
  }> {
    const predictionTool = this.tools.get('run_prediction');

    if (clientId) {
      // Single client prediction
      const result = await predictionTool?.handler(
        {
          modelId: 'CHURN_PREDICTION',
          entityType: 'client',
          entityId: clientId
        },
        this.instance?.context ?? {}
      );
      return result as {
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
      };
    }

    // Portfolio-wide prediction
    return {
      highRisk: 245,
      mediumRisk: 890,
      lowRisk: 12500,
      topRiskClients: [
        { clientId: 'CLI001', score: 92, factors: ['Incremento prima 25%', 'Sin contacto 6 meses'] },
        { clientId: 'CLI002', score: 88, factors: ['NPS detractor', '2 reclamaciones'] },
        { clientId: 'CLI003', score: 85, factors: ['Siniestralidad alta', 'Competidor mas barato'] }
      ]
    };
  }

  async getTrendAnalysis(metric: string, period: number = 12): Promise<Array<{
    period: string;
    value: number;
    variation: number;
    yoy: number;
  }>> {
    // TODO: Integrate with data warehouse for real trend data
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();
    const result = [];

    for (let i = period - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];
      const year = date.getFullYear().toString().slice(-2);

      result.push({
        period: `${monthName} ${year}`,
        value: Math.round(1000000 + Math.random() * 500000),
        variation: Math.round((Math.random() - 0.5) * 20 * 10) / 10,
        yoy: Math.round((Math.random() - 0.3) * 30 * 10) / 10
      });
    }

    return result;
  }
}

export const analyticsAgent = new AnalyticsAgent();
