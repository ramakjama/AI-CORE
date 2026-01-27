// Quality Agent - Handles quality control and continuous improvement

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const QUALITY_AGENT_DEFINITION: AgentDefinition = {
  id: 'quality-agent-v1',
  type: 'QUALITY_AGENT',
  name: 'Agente de Calidad SORI',
  description: 'Agente especializado en control de calidad, encuestas NPS/CSAT, auditorias de procesos y mejora continua',
  systemPrompt: `Eres SORI, el asistente de Calidad de Soriano Mediadores.

Tu objetivo es asegurar la excelencia en todos los procesos:
- Control de calidad de servicios
- Medicion de satisfaccion (NPS/CSAT)
- Auditorias de procesos internos
- Gestion de incidencias de calidad
- Iniciativas de mejora continua

AREAS DE CALIDAD:

1. METRICAS DE SATISFACCION:
   | Metrica | Descripcion | Objetivo |
   |---------|-------------|----------|
   | NPS | Net Promoter Score (-100 a +100) | > 50 |
   | CSAT | Customer Satisfaction (1-5) | > 4.2 |
   | CES | Customer Effort Score (1-7) | < 3 |
   | FCR | First Contact Resolution | > 80% |

2. PUNTOS DE MEDICION:
   - Post-venta: Despues de contratar poliza
   - Post-siniestro: Al cerrar expediente
   - Post-atencion: Despues de consulta
   - Periodica: Encuesta anual de satisfaccion

3. CONTROL DE CALIDAD:
   **Muestreo de llamadas:**
   - Atencion cliente: 5% aleatorio
   - Comercial: 5% aleatorio
   - Siniestros: 10% aleatorio

   **Criterios de evaluacion:**
   | Aspecto | Peso | Criterios |
   |---------|------|-----------|
   | Saludo/despedida | 10% | Protocolo correcto |
   | Identificacion | 10% | Verificacion cliente |
   | Resolucion | 30% | Solucion efectiva |
   | Comunicacion | 25% | Claridad, empatia |
   | Upselling | 15% | Oportunidad detectada |
   | Registro | 10% | Documentacion completa |

4. AUDITORIAS DE PROCESOS:
   - Auditorias programadas (mensuales)
   - Auditorias sorpresa (aleatorias)
   - Auditorias por incidencia
   - Auditorias de seguimiento

5. GESTION DE INCIDENCIAS:
   | Severidad | Tiempo respuesta | Escalado |
   |-----------|------------------|----------|
   | Critica | 2h | Director |
   | Alta | 24h | Responsable area |
   | Media | 48h | Supervisor |
   | Baja | 5 dias | Gestor calidad |

6. MEJORA CONTINUA:
   - Analisis de causas raiz
   - Planes de accion correctiva
   - Seguimiento de mejoras
   - Benchmarking interno

PROCESOS CLAVE AUDITADOS:
- Emision de polizas
- Gestion de siniestros
- Atencion telefonica
- Tramitacion de renovaciones
- Gestion de cobros
- Documentacion

REGLAS:
1. Toda incidencia debe quedar registrada
2. Las auditorias siguen protocolo estandarizado
3. Los planes de mejora requieren seguimiento
4. Feedback al empleado en 48h tras evaluacion
5. Escalado inmediato de incidencias criticas

NORMATIVAS:
- ISO 9001 (Sistema de gestion de calidad)
- UNE-EN 15838 (Centros de contacto)
- Politica interna de calidad

TONO: Constructivo, orientado a la mejora, basado en datos.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.4,
  tools: ['get_quality_metrics', 'create_survey', 'get_audit', 'report_issue', 'get_employee', 'send_email', 'start_workflow', 'generate_document'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_quality', 'sm_surveys', 'sm_audit', 'sm_hr', 'sm_documents', 'sm_workflows'],
  permissions: ['read:quality', 'write:quality', 'read:survey', 'write:survey', 'read:audit', 'write:audit', 'write:issue', 'generate:report'],
  isActive: true,
};

export class QualityAgent extends BaseAgent {
  constructor() {
    super(QUALITY_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('nps') || userContent.toLowerCase().includes('csat') || userContent.toLowerCase().includes('satisfaccion')) {
      response = `Te informo sobre las metricas de satisfaccion.

**Dashboard de Satisfaccion:**

**NPS - Net Promoter Score:**
Para ver el NPS actual, consultare el sistema.

| Segmento | NPS | Tendencia | Respuestas |
|----------|-----|-----------|------------|
| Global | (dato) | (tendencia) | (n) |
| Auto | (dato) | (tendencia) | (n) |
| Hogar | (dato) | (tendencia) | (n) |
| Salud | (dato) | (tendencia) | (n) |

**Interpretacion NPS:**
| Rango | Clasificacion |
|-------|---------------|
| 70-100 | Excelente |
| 50-69 | Muy bueno |
| 30-49 | Bueno |
| 0-29 | Necesita mejora |
| < 0 | Critico |

**CSAT - Customer Satisfaction:**
| Proceso | CSAT | Objetivo |
|---------|------|----------|
| Contratacion | (dato) | > 4.2 |
| Siniestros | (dato) | > 4.0 |
| Atencion cliente | (dato) | > 4.3 |
| Renovacion | (dato) | > 4.2 |

**Detractores activos:**
Clientes con puntuacion < 7 pendientes de contacto.

**Acciones recomendadas:**
- Contactar detractores en 24h
- Analizar comentarios negativos
- Identificar patrones de insatisfaccion
- Implementar quick wins

¿Que metrica quieres analizar en detalle?`;
    } else if (userContent.toLowerCase().includes('encuesta') || userContent.toLowerCase().includes('survey') || userContent.toLowerCase().includes('feedback')) {
      response = `Te ayudo con la gestion de encuestas.

**Encuestas activas:**
Para ver las encuestas en curso, consultare el sistema.

**Tipos de encuesta disponibles:**

| Tipo | Trigger | Preguntas | Canal |
|------|---------|-----------|-------|
| Post-venta | Nueva poliza | NPS + 3 | Email/SMS |
| Post-siniestro | Cierre expediente | CSAT + 5 | Email |
| Post-atencion | Fin llamada | CES + 2 | SMS |
| Anual | Cumpleanos poliza | 15 preguntas | Email |

**Crear nueva encuesta:**

Para configurar una encuesta necesito:
1. **Tipo de encuesta**: NPS, CSAT, CES, personalizada
2. **Destinatarios**: Segmento o lista
3. **Canal de envio**: Email, SMS, app
4. **Preguntas adicionales**: Opcional
5. **Fecha de envio**: Programada o inmediata

**Plantillas predefinidas:**
- Encuesta satisfaccion general
- Encuesta post-servicio
- Encuesta de producto
- Encuesta de empleados

**Tasa de respuesta objetivo:** > 15%

**Buenas practicas:**
- Enviar en horario laboral
- Maximo 5 preguntas
- Incluir pregunta abierta
- Agradecer participacion
- Cerrar el loop con respuesta

¿Que encuesta quieres crear o consultar?`;
    } else if (userContent.toLowerCase().includes('auditoria') || userContent.toLowerCase().includes('audit') || userContent.toLowerCase().includes('revision')) {
      response = `Te informo sobre las auditorias de calidad.

**Programa de Auditorias:**

**Auditorias programadas:**
Para ver el calendario de auditorias, consultare el sistema.

| Proceso | Frecuencia | Ultima | Proxima |
|---------|------------|--------|---------|
| Emision polizas | Mensual | (fecha) | (fecha) |
| Siniestros | Mensual | (fecha) | (fecha) |
| Atencion cliente | Semanal | (fecha) | (fecha) |
| Renovaciones | Mensual | (fecha) | (fecha) |
| Cobros | Mensual | (fecha) | (fecha) |

**Metodologia de auditoria:**

1. **Preparacion**
   - Definir alcance
   - Seleccionar muestra
   - Preparar checklist

2. **Ejecucion**
   - Revision de expedientes
   - Escucha de llamadas
   - Entrevistas
   - Verificacion documental

3. **Informe**
   - Hallazgos
   - No conformidades
   - Observaciones
   - Buenas practicas

4. **Seguimiento**
   - Plan de accion
   - Responsables
   - Fechas limite
   - Verificacion cierre

**Hallazgos pendientes de cierre:**
Para ver las no conformidades abiertas.

**Indicadores de auditoria:**
| KPI | Valor | Objetivo |
|-----|-------|----------|
| Tasa conformidad | (dato) | > 95% |
| NC cerradas en plazo | (dato) | > 90% |
| Auditorias completadas | (dato) | 100% |

¿Que auditoria quieres consultar o programar?`;
    } else if (userContent.toLowerCase().includes('incidencia') || userContent.toLowerCase().includes('problema') || userContent.toLowerCase().includes('queja')) {
      response = `Te ayudo con la gestion de incidencias de calidad.

**Registro de incidencia:**

Para registrar una incidencia necesito:

1. **Descripcion del problema:**
   - Que ha ocurrido
   - Cuando se detecto
   - Quien lo reporta

2. **Clasificacion:**
   | Tipo | Ejemplos |
   |------|----------|
   | Error proceso | Emision incorrecta, datos erroneos |
   | Servicio | Retraso, falta respuesta |
   | Sistema | Fallo aplicacion, datos perdidos |
   | Comunicacion | Informacion incorrecta |
   | Documentacion | Falta documento, error |

3. **Severidad:**
   | Nivel | Impacto | Tiempo respuesta |
   |-------|---------|------------------|
   | Critica | Cliente muy afectado | 2h |
   | Alta | Cliente afectado | 24h |
   | Media | Proceso afectado | 48h |
   | Baja | Mejora detectada | 5 dias |

4. **Cliente/Expediente afectado:**
   - Numero de poliza
   - Numero de expediente
   - Datos del cliente

**Incidencias abiertas:**
Para ver las incidencias pendientes de resolucion.

**Flujo de resolucion:**
1. Registro y clasificacion
2. Asignacion a responsable
3. Analisis de causa
4. Resolucion
5. Verificacion y cierre
6. Feedback al cliente

¿Quieres reportar una incidencia o consultar el estado de una existente?`;
    } else if (userContent.toLowerCase().includes('mejora') || userContent.toLowerCase().includes('optimizar') || userContent.toLowerCase().includes('proceso')) {
      response = `Te informo sobre iniciativas de mejora continua.

**Proyectos de Mejora Activos:**
Para ver los proyectos en curso, consultare el sistema.

**Metodologia de Mejora:**

**1. Identificacion de oportunidades:**
- Analisis de incidencias recurrentes
- Feedback de encuestas
- Hallazgos de auditorias
- Sugerencias de empleados
- Benchmarking

**2. Analisis de causas (5 Por ques / Ishikawa):**
- Personas
- Procesos
- Sistemas
- Politicas
- Entorno

**3. Plan de accion:**
| Elemento | Descripcion |
|----------|-------------|
| Objetivo | Que queremos lograr |
| Acciones | Pasos a seguir |
| Responsable | Quien lo ejecuta |
| Fecha | Cuando debe estar |
| Recursos | Que necesitamos |
| Indicador | Como medimos exito |

**4. Implementacion:**
- Piloto controlado
- Despliegue gradual
- Formacion afectados
- Documentacion

**5. Verificacion:**
- Medicion de resultados
- Comparativa antes/despues
- Ajustes si necesario
- Estandarizacion

**Sugerencias de mejora:**
¿Tienes una idea para mejorar algun proceso?
Registrala y la evaluaremos.

**Quick Wins implementados este mes:**
(Pendiente consulta)

¿Que proceso quieres mejorar o que proyecto quieres consultar?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Calidad en Soriano Mediadores.

Puedo ayudarte con:
- **Metricas de satisfaccion**: NPS, CSAT, CES
- **Encuestas**: Crear y analizar encuestas
- **Auditorias**: Programadas y de seguimiento
- **Incidencias**: Registro y gestion
- **Mejora continua**: Proyectos y quick wins

**Dashboard rapido:**
| KPI | Valor actual | Objetivo |
|-----|--------------|----------|
| NPS | (consultar) | > 50 |
| CSAT | (consultar) | > 4.2 |
| Conformidad auditorias | (consultar) | > 95% |
| Incidencias abiertas | (consultar) | < 10 |

**Contacto Calidad:**
calidad@sorianoseguros.com

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

  async getQualityMetrics(params?: { metric?: string; period?: string; segment?: string }): Promise<unknown> {
    const metricsTool = this.tools.get('get_quality_metrics');
    if (!metricsTool) throw new Error('Quality metrics tool not available');

    return metricsTool.handler(
      params ?? {},
      this.instance?.context ?? {}
    );
  }

  async createSurvey(surveyData: {
    type: 'NPS' | 'CSAT' | 'CES' | 'CUSTOM';
    name: string;
    segmentId?: string;
    recipients?: string[];
    questions?: Array<{ text: string; type: string }>;
    channel: 'email' | 'sms' | 'app';
    scheduledDate?: Date;
  }): Promise<unknown> {
    // 1. Create the survey
    const surveyTool = this.tools.get('create_survey');
    const survey = await surveyTool?.handler(
      {
        ...surveyData,
        status: surveyData.scheduledDate ? 'SCHEDULED' : 'DRAFT',
        createdAt: new Date()
      },
      this.instance?.context ?? {}
    );

    // 2. Generate survey document if needed
    if (surveyData.channel === 'email') {
      const docTool = this.tools.get('generate_document');
      await docTool?.handler(
        {
          templateCode: `SURVEY_${surveyData.type}`,
          data: surveyData,
          format: 'HTML'
        },
        this.instance?.context ?? {}
      );
    }

    return survey;
  }

  async getAudit(auditId: string): Promise<unknown> {
    const auditTool = this.tools.get('get_audit');
    if (!auditTool) throw new Error('Audit tool not available');

    return auditTool.handler(
      { auditId },
      this.instance?.context ?? {}
    );
  }

  async reportIssue(issueData: {
    title: string;
    description: string;
    type: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    affectedEntity?: { type: string; id: string };
    reportedBy: string;
  }): Promise<unknown> {
    // 1. Create the issue
    const issueTool = this.tools.get('report_issue');
    const issue = await issueTool?.handler(
      {
        ...issueData,
        status: 'OPEN',
        reportedAt: new Date()
      },
      this.instance?.context ?? {}
    );

    // 2. Start workflow based on severity
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: issueData.severity === 'CRITICAL' ? 'CRITICAL_ISSUE' : 'QUALITY_ISSUE',
        title: `Incidencia: ${issueData.title}`,
        entityType: 'quality_issue',
        entityId: (issue as { issueId?: string })?.issueId,
        priority: issueData.severity,
        variables: issueData
      },
      this.instance?.context ?? {}
    );

    // 3. Notify relevant parties
    const emailTool = this.tools.get('send_email');
    const recipients = issueData.severity === 'CRITICAL'
      ? ['calidad@sorianoseguros.com', 'direccion@sorianoseguros.com']
      : ['calidad@sorianoseguros.com'];

    await emailTool?.handler(
      {
        to: recipients,
        templateCode: 'QUALITY_ISSUE_REPORTED',
        templateData: issue
      },
      this.instance?.context ?? {}
    );

    return issue;
  }

  async evaluateCallQuality(callId: string, evaluatorId: string): Promise<{
    score: number;
    breakdown: Record<string, number>;
    feedback: string[];
    passed: boolean;
  }> {
    // TODO: Integrate with call recording system
    // This is a placeholder implementation
    const breakdown = {
      greeting: 90,
      identification: 100,
      resolution: 85,
      communication: 80,
      upselling: 70,
      documentation: 95
    };

    const weights = {
      greeting: 0.10,
      identification: 0.10,
      resolution: 0.30,
      communication: 0.25,
      upselling: 0.15,
      documentation: 0.10
    };

    const score = Object.entries(breakdown).reduce(
      (total, [key, value]) => total + (value * (weights[key as keyof typeof weights] ?? 0)),
      0
    );

    const feedback: string[] = [];
    if (breakdown.upselling < 80) {
      feedback.push('Mejorar deteccion de oportunidades de venta cruzada');
    }
    if (breakdown.communication < 85) {
      feedback.push('Reforzar tecnicas de comunicacion empatica');
    }

    return {
      score: Math.round(score),
      breakdown,
      feedback,
      passed: score >= 70
    };
  }

  async getNPSTrend(months: number = 6): Promise<Array<{ month: string; nps: number; responses: number }>> {
    // TODO: Integrate with analytics for real data
    return [
      { month: '2024-01', nps: 45, responses: 250 },
      { month: '2024-02', nps: 48, responses: 280 },
      { month: '2024-03', nps: 52, responses: 310 },
      { month: '2024-04', nps: 50, responses: 290 },
      { month: '2024-05', nps: 55, responses: 320 },
      { month: '2024-06', nps: 58, responses: 350 }
    ];
  }
}

export const qualityAgent = new QualityAgent();
