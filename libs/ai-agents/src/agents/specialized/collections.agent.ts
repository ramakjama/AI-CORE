// Collections Agent - Handles debt collection and payment management

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const COLLECTIONS_AGENT_DEFINITION: AgentDefinition = {
  id: 'collections-agent-v1',
  type: 'COLLECTIONS_AGENT',
  name: 'Agente de Cobros SORI',
  description: 'Agente especializado en gestion de impagos, reclamacion de deudas, planes de pago y morosidad',
  systemPrompt: `Eres SORI, el asistente de Cobros de Soriano Mediadores.

Tu objetivo es gestionar eficientemente los cobros pendientes:
- Gestion de recibos impagados
- Recordatorios y reclamaciones
- Planes de pago personalizados
- Control de morosidad
- Coordinacion con departamento legal

CICLO DE COBRO:

1. COBRO EN PERIODO VOLUNTARIO:
   | Dia | Accion |
   |-----|--------|
   | -7 | Recordatorio previo vencimiento |
   | 0 | Cargo en cuenta / Intento cobro |
   | +3 | Segundo intento si fallo |
   | +5 | Aviso de recibo pendiente |

2. GESTION DE IMPAGO:
   | Fase | Dias | Acciones |
   |------|------|----------|
   | 1 - Recordatorio | 1-15 | Email + SMS automatico |
   | 2 - Reclamacion | 16-30 | Llamada + carta |
   | 3 - Intensiva | 31-60 | Llamadas multiples + carta certificada |
   | 4 - Pre-legal | 61-90 | Burofax + propuesta plan pago |
   | 5 - Suspension | 90+ | Suspension poliza + escalado legal |

3. TIPOS DE IMPAGO:
   - Devolucion bancaria (falta saldo)
   - Cuenta cerrada
   - Impago voluntario
   - Incidencia de datos bancarios
   - Disputa/reclamacion

4. OPCIONES DE REGULARIZACION:
   **Pago inmediato:**
   - Transferencia bancaria
   - Tarjeta de credito
   - Bizum
   - Domiciliacion nueva cuenta

   **Plan de pago:**
   | Deuda | Plazo maximo | Cuotas |
   |-------|--------------|--------|
   | < 500 EUR | 3 meses | 3 |
   | 500-1000 EUR | 6 meses | 6 |
   | > 1000 EUR | 12 meses | 12 |

5. INDICADORES DE MOROSIDAD:
   | KPI | Objetivo |
   |-----|----------|
   | Tasa de cobro | > 98% |
   | DSO (Days Sales Outstanding) | < 30 dias |
   | Morosidad > 90 dias | < 1% |
   | Recovery rate | > 85% |

COMUNICACIONES:
- Tono firme pero respetuoso
- Ofrecer siempre solucion
- Documentar cada contacto
- Respetar horarios legales (9-21h)
- No amenazar, informar de consecuencias

REGLAS:
1. Verificar identidad antes de hablar de deudas
2. No contactar mas de 2 veces/dia
3. Respetar solicitudes de no contacto por canal
4. Registrar compromisos de pago
5. Escalar a legal segun protocolo
6. No ofrecer descuentos sin autorizacion

CONSIDERACIONES LEGALES:
- Ley de proteccion al consumidor
- LOPD en comunicaciones
- Recargos e intereses segun contrato
- Prescripcion de deudas: 5 anos

ESCALADO A LEGAL:
- Deuda > 90 dias sin gestion
- Deuda > 1.000 EUR sin acuerdo
- Incumplimiento de plan de pago
- Negativa explicita al pago

TONO: Profesional, firme, orientado a solucion.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.4,
  tools: ['get_overdue_receipts', 'send_reminder', 'create_payment_plan', 'escalate_collection', 'get_party', 'get_policy', 'send_email', 'send_sms', 'start_workflow', 'log_activity'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_collections', 'ss_insurance', 'sf_finance', 'sm_communications', 'sm_workflows'],
  permissions: ['read:receipt', 'write:receipt', 'read:payment_plan', 'write:payment_plan', 'read:party', 'read:policy', 'send:collection', 'escalate:legal'],
  isActive: true,
};

export class CollectionsAgent extends BaseAgent {
  constructor() {
    super(COLLECTIONS_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('impagado') || userContent.toLowerCase().includes('pendiente') || userContent.toLowerCase().includes('recibo')) {
      response = `Te ayudo con la gestion de recibos impagados.

**Recibos pendientes de cobro:**
Para ver los recibos impagados, consultare el sistema.

**Resumen de cartera impagada:**
| Antigüedad | Importe | Recibos | % Total |
|------------|---------|---------|---------|
| 1-15 dias | (dato) | (n) | (%) |
| 16-30 dias | (dato) | (n) | (%) |
| 31-60 dias | (dato) | (n) | (%) |
| 61-90 dias | (dato) | (n) | (%) |
| > 90 dias | (dato) | (n) | (%) |

**Buscar recibo especifico:**
Puedo buscar por:
- Numero de recibo
- Numero de poliza
- NIF/NIE del cliente
- Rango de fechas

**Acciones disponibles:**
1. Ver detalle del recibo
2. Enviar recordatorio
3. Registrar contacto
4. Crear plan de pago
5. Escalar a fase siguiente

**Filtros rapidos:**
- Recibos en fase 1 (recordatorio)
- Recibos en fase 2-3 (reclamacion)
- Recibos pre-legal
- Por compania aseguradora
- Por producto

¿Que recibos necesitas consultar o gestionar?`;
    } else if (userContent.toLowerCase().includes('recordatorio') || userContent.toLowerCase().includes('avisar') || userContent.toLowerCase().includes('enviar')) {
      response = `Te ayudo a enviar recordatorios de pago.

**Tipos de recordatorio:**

| Tipo | Canal | Cuando usar |
|------|-------|-------------|
| Preventivo | Email | 7 dias antes vencimiento |
| Primer aviso | Email + SMS | 5 dias tras impago |
| Segundo aviso | Email + Llamada | 15 dias tras impago |
| Reclamacion | Carta + Llamada | 30 dias tras impago |
| Urgente | Carta certificada | 60 dias tras impago |

**Para enviar recordatorio necesito:**
1. Numero de recibo o lista de recibos
2. Tipo de recordatorio
3. Canal preferido (si aplica)

**Plantillas disponibles:**
- Recordatorio amigable
- Reclamacion formal
- Ultima oportunidad
- Pre-suspension poliza
- Aviso legal

**Envio masivo:**
Puedo enviar recordatorios a:
- Todos los recibos de una fase
- Recibos de un tramo de antiguedad
- Lista personalizada

**Historico de contactos:**
Antes de enviar, verifico los contactos previos para no saturar al cliente.

**Canales disponibles:**
- Email
- SMS
- WhatsApp (si consentimiento)
- Llamada telefonica
- Carta postal
- Burofax

¿A quien quieres enviar el recordatorio?`;
    } else if (userContent.toLowerCase().includes('plan') || userContent.toLowerCase().includes('fraccionar') || userContent.toLowerCase().includes('cuotas')) {
      response = `Te ayudo a crear un plan de pago.

**Configurar plan de pago:**

**Requisitos para plan de pago:**
- Cliente identificado y contactado
- Compromiso explicito de pago
- Datos bancarios actualizados
- Primera cuota al formalizar

**Opciones segun importe:**

| Deuda total | Plazo max | Cuotas | Entrada minima |
|-------------|-----------|--------|----------------|
| < 300 EUR | 2 meses | 2 | 50% |
| 300-500 EUR | 3 meses | 3 | 33% |
| 500-1000 EUR | 6 meses | 6 | 20% |
| > 1000 EUR | 12 meses | 12 | 10% |

**Para crear el plan necesito:**

1. **Datos del deudor:**
   - Numero de cliente/poliza
   - Recibos a incluir

2. **Condiciones del plan:**
   - Numero de cuotas
   - Fecha primera cuota
   - Forma de pago

3. **Compromiso:**
   - Confirmacion verbal o escrita
   - Cuenta bancaria para domiciliacion

**Tipos de plan:**
- **Estandar**: Cuotas iguales mensuales
- **Escalonado**: Cuotas crecientes
- **Personalizado**: Fechas a medida

**Seguimiento del plan:**
- Recordatorio 3 dias antes de cada cuota
- Alerta si cuota impagada
- Cancelacion automatica tras 2 impagos

¿Para que cliente quieres crear el plan de pago?`;
    } else if (userContent.toLowerCase().includes('escalar') || userContent.toLowerCase().includes('legal') || userContent.toLowerCase().includes('abogado')) {
      response = `Te informo sobre el escalado a reclamacion legal.

**Criterios de escalado:**

| Criterio | Umbral |
|----------|--------|
| Antiguedad | > 90 dias |
| Importe | > 1.000 EUR |
| Intentos | > 10 sin respuesta |
| Plan incumplido | 2+ cuotas |
| Negativa | Rechazo explicito |

**Proceso de escalado:**

1. **Verificacion previa:**
   - Datos actualizados del deudor
   - Historico de gestiones completo
   - Documentacion de la deuda
   - Sin reclamacion activa del cliente

2. **Documentacion necesaria:**
   - Poliza y condiciones
   - Recibos impagados
   - Historial de comunicaciones
   - Compromiso incumplido (si aplica)

3. **Ultimo contacto:**
   - Burofax con requerimiento de pago
   - Plazo final: 10 dias
   - Aviso de accion legal

4. **Transferencia a legal:**
   - Informe completo del caso
   - Valoracion de recuperabilidad
   - Propuesta de accion legal

**Acciones legales posibles:**
- Reclamacion judicial < 2.000 EUR: Juicio verbal
- Reclamacion judicial > 2.000 EUR: Juicio ordinario
- Monitorio europeo (deudores UE)
- Inclusion en ficheros de morosidad

**Costes legales:**
Los costes de reclamacion se repercuten al deudor segun contrato.

¿Que caso quieres escalar o consultar?`;
    } else if (userContent.toLowerCase().includes('morosidad') || userContent.toLowerCase().includes('kpi') || userContent.toLowerCase().includes('indicador')) {
      response = `Te muestro los indicadores de morosidad.

**Dashboard de Cobros:**

**KPIs principales:**
| Indicador | Actual | Objetivo | Tendencia |
|-----------|--------|----------|-----------|
| Tasa de cobro | (dato) | > 98% | (tendencia) |
| DSO | (dato) | < 30 dias | (tendencia) |
| Morosidad > 90d | (dato) | < 1% | (tendencia) |
| Recovery rate | (dato) | > 85% | (tendencia) |

**Cartera impagada por antigüedad:**
| Tramo | Importe | % Cartera |
|-------|---------|-----------|
| Corriente | (dato) | (%) |
| 1-30 dias | (dato) | (%) |
| 31-60 dias | (dato) | (%) |
| 61-90 dias | (dato) | (%) |
| > 90 dias | (dato) | (%) |

**Por tipo de producto:**
| Producto | Tasa impago | Importe |
|----------|-------------|---------|
| Auto | (dato) | (dato) |
| Hogar | (dato) | (dato) |
| Salud | (dato) | (dato) |
| Vida | (dato) | (dato) |

**Eficiencia de gestion:**
| Metrica | Valor |
|---------|-------|
| Contactos/dia | (dato) |
| Compromisos obtenidos | (dato) |
| Planes activos | (dato) |
| Cobros del mes | (dato) |

**Alertas activas:**
- Recibos proximos a prescripcion
- Planes con cuota impagada
- Casos pendientes de escalado

¿Que indicador quieres analizar en detalle?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Cobros en Soriano Mediadores.

Puedo ayudarte con:
- **Recibos impagados**: Consulta y gestion
- **Recordatorios**: Envio de avisos de pago
- **Planes de pago**: Fraccionamiento de deudas
- **Escalado legal**: Reclamacion judicial
- **Indicadores**: KPIs de morosidad

**Resumen rapido:**
| Concepto | Valor |
|----------|-------|
| Recibos pendientes | (consultar) |
| Importe total | (consultar) |
| En fase legal | (consultar) |
| Planes activos | (consultar) |

**Herramientas disponibles:**
- Gestor de recibos
- Generador de recordatorios
- Configurador de planes de pago
- Escalado automatico

**Contacto:**
cobros@sorianoseguros.com
Tel: (pendiente)

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

  async getOverdueReceipts(params?: {
    agingDays?: number;
    minAmount?: number;
    phase?: number;
    policyNumber?: string;
    clientId?: string;
  }): Promise<unknown> {
    const receiptsTool = this.tools.get('get_overdue_receipts');
    if (!receiptsTool) throw new Error('Overdue receipts tool not available');

    return receiptsTool.handler(
      params ?? {},
      this.instance?.context ?? {}
    );
  }

  async sendReminder(
    receiptIds: string[],
    reminderType: 'FRIENDLY' | 'FORMAL' | 'URGENT' | 'FINAL' | 'LEGAL',
    channels: Array<'email' | 'sms' | 'letter'>
  ): Promise<unknown> {
    const results = [];

    for (const receiptId of receiptIds) {
      // 1. Get receipt and client info
      const partyTool = this.tools.get('get_party');
      // Assuming receipt has partyId

      // 2. Send via each channel
      for (const channel of channels) {
        let sendResult;

        if (channel === 'email') {
          const emailTool = this.tools.get('send_email');
          sendResult = await emailTool?.handler(
            {
              templateCode: `COLLECTION_${reminderType}`,
              templateData: { receiptId },
              channel: 'email'
            },
            this.instance?.context ?? {}
          );
        } else if (channel === 'sms') {
          const smsTool = this.tools.get('send_sms');
          sendResult = await smsTool?.handler(
            {
              templateCode: `COLLECTION_${reminderType}_SMS`,
              templateData: { receiptId }
            },
            this.instance?.context ?? {}
          );
        }

        results.push({ receiptId, channel, result: sendResult });
      }

      // 3. Log activity
      const logTool = this.tools.get('log_activity');
      await logTool?.handler(
        {
          entityType: 'receipt',
          entityId: receiptId,
          activityType: 'REMINDER_SENT',
          details: { reminderType, channels }
        },
        this.instance?.context ?? {}
      );
    }

    return {
      sent: results.length,
      results
    };
  }

  async createPaymentPlan(planData: {
    clientId: string;
    receiptIds: string[];
    installments: number;
    firstPaymentDate: Date;
    paymentMethod: 'DIRECT_DEBIT' | 'CARD' | 'TRANSFER';
    bankAccount?: string;
  }): Promise<unknown> {
    // 1. Calculate total debt and validate
    const receiptsTool = this.tools.get('get_overdue_receipts');
    const receipts = await receiptsTool?.handler(
      { receiptIds: planData.receiptIds },
      this.instance?.context ?? {}
    );

    const totalDebt = (receipts as Array<{ amount: number }>)?.reduce(
      (sum, r) => sum + r.amount, 0
    ) ?? 0;

    // 2. Validate installments based on amount
    const maxInstallments = totalDebt < 300 ? 2 :
      totalDebt < 500 ? 3 :
      totalDebt < 1000 ? 6 : 12;

    if (planData.installments > maxInstallments) {
      throw new Error(`Maximo ${maxInstallments} cuotas para deuda de ${totalDebt} EUR`);
    }

    // 3. Create the plan
    const planTool = this.tools.get('create_payment_plan');
    const plan = await planTool?.handler(
      {
        ...planData,
        totalAmount: totalDebt,
        installmentAmount: Math.ceil(totalDebt / planData.installments * 100) / 100,
        status: 'ACTIVE',
        createdAt: new Date()
      },
      this.instance?.context ?? {}
    );

    // 4. Start monitoring workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: 'PAYMENT_PLAN_MONITORING',
        title: `Plan de pago ${planData.clientId}`,
        entityType: 'payment_plan',
        entityId: (plan as { planId?: string })?.planId,
        variables: planData
      },
      this.instance?.context ?? {}
    );

    // 5. Send confirmation
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        templateCode: 'PAYMENT_PLAN_CREATED',
        templateData: plan
      },
      this.instance?.context ?? {}
    );

    return plan;
  }

  async escalateCollection(
    receiptId: string,
    reason: 'AGING' | 'AMOUNT' | 'NO_RESPONSE' | 'PLAN_DEFAULT' | 'REFUSAL'
  ): Promise<unknown> {
    // 1. Get receipt and history
    const receiptsTool = this.tools.get('get_overdue_receipts');
    const receipt = await receiptsTool?.handler(
      { receiptId },
      this.instance?.context ?? {}
    );

    // 2. Get client info
    const partyTool = this.tools.get('get_party');
    const party = await partyTool?.handler(
      { partyId: (receipt as { partyId?: string })?.partyId },
      this.instance?.context ?? {}
    );

    // 3. Create escalation
    const escalateTool = this.tools.get('escalate_collection');
    const escalation = await escalateTool?.handler(
      {
        receiptId,
        reason,
        receipt,
        party,
        escalatedAt: new Date()
      },
      this.instance?.context ?? {}
    );

    // 4. Start legal workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: 'LEGAL_COLLECTION',
        title: `Reclamacion legal - Recibo ${receiptId}`,
        entityType: 'collection_escalation',
        entityId: (escalation as { escalationId?: string })?.escalationId,
        priority: 'HIGH',
        variables: { receipt, party, reason }
      },
      this.instance?.context ?? {}
    );

    // 5. Notify legal department
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: 'legal@sorianoseguros.com',
        templateCode: 'COLLECTION_ESCALATED',
        templateData: escalation
      },
      this.instance?.context ?? {}
    );

    return escalation;
  }

  async getCollectionMetrics(): Promise<{
    collectionRate: number;
    dso: number;
    overdueAmount: number;
    over90DaysRate: number;
    recoveryRate: number;
    activePlans: number;
  }> {
    // TODO: Integrate with analytics for real data
    return {
      collectionRate: 97.5,
      dso: 28,
      overdueAmount: 125000,
      over90DaysRate: 0.8,
      recoveryRate: 87,
      activePlans: 45
    };
  }
}

export const collectionsAgent = new CollectionsAgent();
