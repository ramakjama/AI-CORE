// Compliance Agent - Handles regulatory compliance and data protection

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const COMPLIANCE_AGENT_DEFINITION: AgentDefinition = {
  id: 'compliance-agent-v1',
  type: 'COMPLIANCE_AGENT',
  name: 'Agente de Cumplimiento SORI',
  description: 'Agente especializado en GDPR/LOPD, IDD, auditorias y gestion de consentimientos',
  systemPrompt: `Eres SORI, el asistente de Cumplimiento Normativo de Soriano Mediadores.

Tu objetivo es ayudar con todas las consultas de cumplimiento regulatorio:
- Consultas sobre GDPR/LOPD (proteccion de datos)
- Verificacion IDD (Insurance Distribution Directive)
- Gestion de auditorias internas y externas
- Control de consentimientos
- Gestion de reclamaciones oficiales (AEPD, DGS)

AREAS DE CUMPLIMIENTO:

1. PROTECCION DE DATOS (GDPR/LOPD-GDD):
   - Derechos ARCO-POL (Acceso, Rectificacion, Cancelacion, Oposicion, Portabilidad, Olvido, Limitacion)
   - Consentimientos y bases de legitimacion
   - Registro de Actividades de Tratamiento (RAT)
   - Evaluaciones de Impacto (EIPD)
   - Brechas de seguridad
   - Transferencias internacionales

2. NORMATIVA DE SEGUROS (IDD/LMSRP):
   - Test de idoneidad y conveniencia
   - Informacion previa al contrato (IPID)
   - Conflictos de interes
   - Formacion continua de mediadores
   - Registro DGS

3. PREVENCION BLANQUEO (PBC-FT):
   - Identificacion de clientes (KYC)
   - Personas Politicamente Expuestas (PEP)
   - Operaciones sospechosas
   - Diligencia debida

4. AUDITORIAS:
   - Auditorias internas programadas
   - Auditorias externas (ISO, DGS)
   - Planes de accion correctiva
   - Seguimiento de no conformidades

5. RECLAMACIONES OFICIALES:
   - AEPD (Agencia Proteccion Datos)
   - DGS (Direccion General de Seguros)
   - Defensor del Cliente

PLAZOS LEGALES CRITICOS:
- Derechos ARCO: 1 mes (prorrogable a 3)
- Notificacion brecha AEPD: 72 horas
- Reclamaciones DGS: 2 meses
- Conservacion datos: Segun finalidad

REGLAS:
1. Toda solicitud de derechos debe quedar registrada
2. Las brechas de seguridad se escalan inmediatamente
3. Verifica siempre la identidad del solicitante
4. Mantén la trazabilidad de todas las acciones
5. En caso de duda, consulta con el DPO

CONTACTOS CLAVE:
- DPO: dpo@sorianoseguros.com
- Compliance: compliance@sorianoseguros.com
- AEPD: www.aepd.es
- DGS: www.dgsfp.mineco.es

TONO: Formal, preciso, orientado a la normativa.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  tools: ['check_consent', 'get_data_subject', 'log_audit', 'get_compliance_status', 'search_documents', 'generate_document', 'send_email', 'start_workflow'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_compliance', 'sm_audit', 'sm_documents', 'sm_communications', 'sm_workflows'],
  permissions: ['read:consent', 'write:consent', 'read:audit', 'write:audit', 'read:compliance', 'write:compliance', 'generate:report'],
  isActive: true,
};

export class ComplianceAgent extends BaseAgent {
  constructor() {
    super(COMPLIANCE_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('gdpr') || userContent.toLowerCase().includes('lopd') || userContent.toLowerCase().includes('proteccion de datos')) {
      response = `Te informo sobre Proteccion de Datos (GDPR/LOPD-GDD).

**Derechos de los interesados (ARCO-POL):**

| Derecho | Plazo | Procedimiento |
|---------|-------|---------------|
| Acceso | 1 mes | Formulario + verificacion identidad |
| Rectificacion | 1 mes | Solicitud + datos correctos |
| Supresion (Olvido) | 1 mes | Solicitud justificada |
| Oposicion | 1 mes | Solicitud + motivo |
| Portabilidad | 1 mes | Formato estructurado |
| Limitacion | 1 mes | Solicitud + motivo |

**Para gestionar una solicitud:**
1. Verificar identidad del solicitante
2. Registrar la solicitud en el sistema
3. Evaluar procedencia del derecho
4. Responder en plazo (max 1 mes)
5. Documentar la resolucion

**Bases de legitimacion vigentes:**
- Ejecucion de contrato (poliza de seguro)
- Obligacion legal (PBC, fiscal)
- Interes legitimo (marketing directo clientes)
- Consentimiento (comunicaciones comerciales)

**Documentacion disponible:**
- Politica de privacidad
- Registro de Actividades de Tratamiento
- Clausulas informativas por canal

¿Que consulta especifica tienes sobre proteccion de datos?`;
    } else if (userContent.toLowerCase().includes('consentimiento') || userContent.toLowerCase().includes('permiso') || userContent.toLowerCase().includes('autorizacion')) {
      response = `Te ayudo con la gestion de consentimientos.

**Tipos de consentimiento gestionados:**

| Tipo | Finalidad | Revocable |
|------|-----------|-----------|
| Marketing propio | Ofertas Soriano | Si |
| Marketing terceros | Ofertas partners | Si |
| Cesion aseguradoras | Gestion poliza | Limitado |
| Perfilado | Personalizacion | Si |
| Geolocalizacion | Servicios ubicacion | Si |

**Consultar consentimiento de un cliente:**
Necesito el NIF/NIE o codigo de cliente para verificar sus consentimientos actuales.

**Registrar nuevo consentimiento:**
1. Identificar al interesado
2. Informar de la finalidad
3. Obtener consentimiento expreso
4. Registrar fecha, canal y evidencia
5. Confirmar al interesado

**Revocar consentimiento:**
1. Verificar identidad
2. Identificar consentimientos a revocar
3. Procesar la revocacion
4. Confirmar al interesado
5. Actualizar sistemas afectados

**Importante:** El consentimiento debe ser libre, especifico, informado e inequivoco.

¿Quieres consultar o gestionar un consentimiento?`;
    } else if (userContent.toLowerCase().includes('idd') || userContent.toLowerCase().includes('distribucion') || userContent.toLowerCase().includes('mediador')) {
      response = `Te informo sobre cumplimiento IDD (Insurance Distribution Directive).

**Obligaciones principales IDD:**

**1. Informacion previa:**
- IPID (Insurance Product Information Document)
- DIP (Documento de Informacion Previa)
- Informacion sobre remuneracion

**2. Test de idoneidad:**
Obligatorio para productos con riesgo de inversion:
- Conocimientos financieros
- Experiencia inversora
- Situacion financiera
- Objetivos de inversion

**3. Test de conveniencia:**
Para productos complejos:
- Conocimiento del producto
- Experiencia en seguros similares

**4. Formacion continua:**
| Perfil | Horas/ano |
|--------|-----------|
| Mediador | 25h |
| Empleado ventas | 15h |
| Renovacion cada 3 anos |

**5. Registro DGS:**
- Mediadores inscritos en registro DGSFP
- Verificacion periodica de requisitos
- Actualizacion de datos

**Estado de cumplimiento:**
Para verificar el estado de un mediador o proceso, necesito el codigo de mediador o referencia.

¿Que aspecto del IDD necesitas consultar?`;
    } else if (userContent.toLowerCase().includes('auditoria') || userContent.toLowerCase().includes('inspeccion') || userContent.toLowerCase().includes('control')) {
      response = `Te informo sobre el programa de auditorias.

**Auditorias programadas 2026:**

| Tipo | Frecuencia | Proxima |
|------|------------|---------|
| ISO 27001 | Anual | (pendiente) |
| LOPD/DPO | Semestral | (pendiente) |
| PBC-FT | Anual | (pendiente) |
| DGS | Trienal | (pendiente) |
| Interna procesos | Trimestral | (pendiente) |

**Documentacion de auditorias:**
- Planes de auditoria
- Informes de hallazgos
- Planes de accion correctiva
- Evidencias de cierre

**Consultar estado de auditoria:**
Necesito el codigo de auditoria (AUD-XXXX) para ver su estado.

**No conformidades abiertas:**
Para ver las no conformidades pendientes de cierre, indicame el area o proceso.

**Registrar hallazgo:**
1. Identificar el hallazgo
2. Clasificar severidad (Critica/Mayor/Menor/Observacion)
3. Asignar responsable
4. Establecer fecha limite
5. Documentar plan de accion

¿Que informacion de auditorias necesitas?`;
    } else if (userContent.toLowerCase().includes('reclamacion') || userContent.toLowerCase().includes('queja') || userContent.toLowerCase().includes('aepd') || userContent.toLowerCase().includes('dgs')) {
      response = `Te ayudo con la gestion de reclamaciones oficiales.

**Tipos de reclamaciones:**

**1. AEPD (Proteccion de Datos):**
- Plazo respuesta: Variable segun procedimiento
- Coordinacion con DPO obligatoria
- Documentacion: Evidencia de cumplimiento

**2. DGS (Seguros):**
- Plazo respuesta: 2 meses
- Documentacion: Expediente completo
- Informe de posicion

**3. Defensor del Cliente:**
- Plazo respuesta: 2 meses
- Resolucion vinculante
- Registro en SAC

**Proceso de gestion:**

1. **Recepcion**: Registrar entrada con fecha
2. **Analisis**: Revisar hechos y documentacion
3. **Investigacion**: Recabar informacion interna
4. **Informe**: Elaborar respuesta fundamentada
5. **Respuesta**: Enviar en plazo
6. **Seguimiento**: Monitorizar resolucion

**Para gestionar una reclamacion:**
Necesito el numero de expediente o datos del reclamante.

**Reclamaciones activas:**
Puedo mostrarte el estado de las reclamaciones abiertas por organismo o estado.

¿Tienes una reclamacion nueva o quieres consultar una existente?`;
    } else if (userContent.toLowerCase().includes('brecha') || userContent.toLowerCase().includes('seguridad') || userContent.toLowerCase().includes('incidente')) {
      response = `**ALERTA: Posible brecha de seguridad**

Si has detectado o sospechas de una brecha de seguridad de datos personales, es URGENTE actuar.

**Pasos inmediatos:**

1. **NO DIFUNDIR** la informacion del incidente
2. **CONTACTAR** inmediatamente con:
   - DPO: dpo@sorianoseguros.com
   - Seguridad IT: seguridad@sorianoseguros.com
   - Telefono emergencias: Ext. 9999

**Plazos legales:**
- Notificacion AEPD: **72 horas** desde deteccion
- Notificacion afectados: Sin dilacion indebida (si alto riesgo)

**Informacion a recopilar:**
- Que ha pasado exactamente
- Cuando se detecto
- Que datos pueden estar afectados
- Cuantos interesados afectados
- Medidas adoptadas

**Clasificacion de severidad:**
| Nivel | Criterio |
|-------|----------|
| CRITICO | Datos sensibles, muchos afectados |
| ALTO | Datos identificativos, riesgo fraude |
| MEDIO | Datos basicos, pocos afectados |
| BAJO | Sin datos personales confirmados |

¿Has detectado una brecha? Describeme la situacion y activo el protocolo.`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Cumplimiento Normativo en Soriano Mediadores.

Puedo ayudarte con:
- **GDPR/LOPD**: Derechos de interesados, consentimientos, privacidad
- **IDD**: Distribucion de seguros, tests, formacion mediadores
- **Consentimientos**: Consulta, registro, revocacion
- **Auditorias**: Estado, hallazgos, planes de accion
- **Reclamaciones**: AEPD, DGS, Defensor del Cliente
- **Brechas de seguridad**: Protocolo de respuesta

**Contactos importantes:**
- DPO: dpo@sorianoseguros.com
- Compliance: compliance@sorianoseguros.com

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

  async checkClientConsent(clientId: string, consentType?: string): Promise<unknown> {
    const consentTool = this.tools.get('check_consent');
    if (!consentTool) throw new Error('Consent tool not available');

    return consentTool.handler(
      { clientId, consentType },
      this.instance?.context ?? {}
    );
  }

  async getDataSubjectInfo(identifier: string): Promise<unknown> {
    const subjectTool = this.tools.get('get_data_subject');
    if (!subjectTool) throw new Error('Data subject tool not available');

    return subjectTool.handler(
      { identifier },
      this.instance?.context ?? {}
    );
  }

  async logAuditEvent(eventData: Record<string, unknown>): Promise<unknown> {
    const auditTool = this.tools.get('log_audit');
    if (!auditTool) throw new Error('Audit tool not available');

    return auditTool.handler(
      {
        ...eventData,
        timestamp: new Date().toISOString(),
        agentId: this.definition.id
      },
      this.instance?.context ?? {}
    );
  }

  async processDataSubjectRequest(
    requestType: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'RESTRICTION' | 'OBJECTION',
    subjectId: string,
    requestData: Record<string, unknown>
  ): Promise<unknown> {
    // 1. Get data subject info
    const subjectTool = this.tools.get('get_data_subject');
    const subject = await subjectTool?.handler({ identifier: subjectId }, this.instance?.context ?? {});

    // 2. Log the request
    await this.logAuditEvent({
      eventType: 'DATA_SUBJECT_REQUEST',
      requestType,
      subjectId,
      details: requestData
    });

    // 3. Start workflow
    const workflowTool = this.tools.get('start_workflow');
    const workflow = await workflowTool?.handler(
      {
        workflowCode: `ARCO_${requestType}`,
        title: `Solicitud ${requestType} - ${subjectId}`,
        entityType: 'data_subject_request',
        entityId: subjectId,
        variables: { requestType, subject, requestData }
      },
      this.instance?.context ?? {}
    );

    // 4. Notify DPO
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: 'dpo@sorianoseguros.com',
        subject: `Nueva solicitud ${requestType}`,
        templateCode: 'ARCO_REQUEST',
        templateData: { requestType, subject, workflow }
      },
      this.instance?.context ?? {}
    );

    return {
      requestId: (workflow as { caseNumber?: string })?.caseNumber,
      status: 'REGISTERED',
      expectedResolutionDate: this.calculateDeadline(requestType),
      message: 'Solicitud registrada correctamente. Recibira confirmacion por email.'
    };
  }

  private calculateDeadline(requestType: string): Date {
    // GDPR standard: 1 month, extendable to 3 months for complex cases
    const deadline = new Date();
    deadline.setMonth(deadline.getMonth() + 1);
    return deadline;
  }

  async reportSecurityBreach(breachData: Record<string, unknown>): Promise<unknown> {
    // 1. Log critical audit event
    await this.logAuditEvent({
      eventType: 'SECURITY_BREACH',
      severity: 'CRITICAL',
      details: breachData
    });

    // 2. Start breach response workflow
    const workflowTool = this.tools.get('start_workflow');
    const workflow = await workflowTool?.handler(
      {
        workflowCode: 'SECURITY_BREACH',
        title: `Brecha de seguridad - ${new Date().toISOString()}`,
        entityType: 'security_breach',
        variables: breachData,
        priority: 'CRITICAL'
      },
      this.instance?.context ?? {}
    );

    // 3. Notify DPO and Security team
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: ['dpo@sorianoseguros.com', 'seguridad@sorianoseguros.com', 'direccion@sorianoseguros.com'],
        subject: 'URGENTE: Brecha de seguridad detectada',
        templateCode: 'SECURITY_BREACH_ALERT',
        templateData: { breach: breachData, workflow }
      },
      this.instance?.context ?? {}
    );

    return {
      breachId: (workflow as { caseNumber?: string })?.caseNumber,
      status: 'REPORTED',
      aepdDeadline: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
      message: 'Brecha registrada. Equipo de respuesta notificado. Plazo AEPD: 72 horas.'
    };
  }
}

export const complianceAgent = new ComplianceAgent();
