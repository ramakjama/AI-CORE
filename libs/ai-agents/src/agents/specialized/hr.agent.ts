// HR Agent - Handles human resources processes

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const HR_AGENT_DEFINITION: AgentDefinition = {
  id: 'hr-agent-v1',
  type: 'HR_AGENT',
  name: 'Agente de Recursos Humanos SORI',
  description: 'Agente especializado en gestion de empleados, nominas, vacaciones y evaluaciones',
  systemPrompt: `Eres SORI, el asistente de Recursos Humanos de Soriano Mediadores.

Tu objetivo es ayudar a los empleados con todas sus consultas de RRHH:
- Gestion de empleados y datos personales
- Consultas de nomina y retribuciones
- Solicitudes de vacaciones y permisos
- Evaluaciones de desempeno
- Onboarding de nuevos empleados
- Informacion sobre beneficios y politicas

PROCESOS PRINCIPALES:

1. CONSULTAS DE NOMINA:
   - Acceso a recibos de nomina
   - Desglose de conceptos salariales
   - Certificados de retenciones
   - Anticipos y prestamos

2. SOLICITUD DE VACACIONES:
   - Verificar dias disponibles
   - Comprobar calendario de equipo
   - Tramitar solicitud
   - Informar al responsable

3. EVALUACION DE DESEMPENO:
   - Consultar objetivos del periodo
   - Estado de evaluaciones
   - Feedback recibido
   - Plan de desarrollo

4. ONBOARDING:
   - Checklist de incorporacion
   - Documentacion necesaria
   - Formaciones obligatorias
   - Contactos clave

5. BENEFICIOS:
   - Seguro medico
   - Plan de pensiones
   - Tickets restaurante
   - Formacion

REGLAS:
1. Verifica siempre la identidad del empleado antes de dar informacion sensible
2. La informacion de nomina es confidencial - solo para el propio empleado
3. Respeta la jerarquia de aprobaciones
4. Si hay dudas legales o laborales complejas, escala a RRHH
5. Mantén un registro de todas las solicitudes

DATOS SENSIBLES:
- Nunca compartas informacion de un empleado con otro
- Los datos salariales son estrictamente confidenciales
- Las evaluaciones solo son visibles por el empleado y su responsable

TONO: Profesional, cercano, respetuoso con la confidencialidad.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.5,
  tools: ['get_employee', 'search_employees', 'get_payslip', 'request_leave', 'get_benefits', 'send_email', 'start_workflow'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_hr', 'sm_communications', 'sm_workflows', 'sm_documents'],
  permissions: ['read:employee', 'read:payslip', 'write:leave_request', 'read:benefits', 'send:notification'],
  isActive: true,
};

export class HRAgent extends BaseAgent {
  constructor() {
    super(HR_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('nomina') || userContent.toLowerCase().includes('sueldo') || userContent.toLowerCase().includes('salario')) {
      response = `Entiendo que tienes una consulta sobre tu nomina.

Para ayudarte necesito verificar tu identidad:
- Por favor, confirma tu numero de empleado
- O tu email corporativo

Una vez verificado, puedo ayudarte con:
- Ver tu ultimo recibo de nomina
- Consultar el desglose de conceptos
- Obtener certificado de retenciones
- Historial de nominas anteriores

¿Que informacion necesitas exactamente?`;
    } else if (userContent.toLowerCase().includes('vacaciones') || userContent.toLowerCase().includes('dias libres') || userContent.toLowerCase().includes('permiso')) {
      response = `Perfecto, te ayudo con tu solicitud de vacaciones o permiso.

**Tu situacion actual:**
Para ver tus dias disponibles, necesito tu numero de empleado.

**Tipos de ausencias disponibles:**
- **Vacaciones**: Dias de vacaciones anuales
- **Asuntos propios**: Dias de libre disposicion
- **Permiso retribuido**: Matrimonio, nacimiento, fallecimiento familiar, etc.
- **Permiso no retribuido**: Previa aprobacion

**Proceso de solicitud:**
1. Verifico tus dias disponibles
2. Compruebo el calendario del equipo
3. Creo la solicitud
4. Se envia a tu responsable para aprobacion
5. Recibes confirmacion por email

¿Quieres solicitar vacaciones o consultar tu saldo de dias?`;
    } else if (userContent.toLowerCase().includes('evaluacion') || userContent.toLowerCase().includes('desempeno') || userContent.toLowerCase().includes('objetivos')) {
      response = `Te ayudo con tu evaluacion de desempeno.

**Evaluacion del periodo actual:**

Para acceder a tu evaluacion necesito verificar tu identidad.

Una vez verificado, podras:
- Ver tus objetivos del periodo
- Consultar el estado de tu evaluacion
- Ver el feedback de tu responsable
- Acceder a tu plan de desarrollo

**Calendario de evaluaciones:**
- **Evaluacion semestral**: Junio y Diciembre
- **Revision de objetivos**: Trimestral
- **Feedback 360**: Anual

¿Que aspecto de tu evaluacion quieres consultar?`;
    } else if (userContent.toLowerCase().includes('nuevo') || userContent.toLowerCase().includes('incorporacion') || userContent.toLowerCase().includes('onboarding')) {
      response = `Bienvenido/a a Soriano Mediadores! Te ayudo con tu proceso de incorporacion.

**Checklist de Onboarding:**

1. **Documentacion** (Entregar a RRHH):
   - DNI/NIE (copia)
   - Numero de Seguridad Social
   - Cuenta bancaria para nomina
   - Foto para credencial

2. **Formaciones obligatorias**:
   - Prevencion de Riesgos Laborales
   - Proteccion de Datos (GDPR)
   - Codigo Etico
   - Seguridad de la Informacion

3. **Accesos y equipamiento**:
   - Email corporativo
   - Acceso a sistemas
   - Equipamiento informatico
   - Tarjeta de acceso

4. **Contactos clave**:
   - Tu responsable directo
   - RRHH: rrhh@sorianoseguros.com
   - IT: soporte@sorianoseguros.com
   - Tu buddy/mentor asignado

¿En que parte del proceso estas? ¿Necesitas ayuda con algo especifico?`;
    } else if (userContent.toLowerCase().includes('beneficio') || userContent.toLowerCase().includes('seguro medico') || userContent.toLowerCase().includes('ticket')) {
      response = `Te informo sobre los beneficios disponibles para empleados de Soriano Mediadores.

**Beneficios incluidos:**

**Seguro Medico**
- Cobertura completa para ti
- Posibilidad de incluir familiares
- Cuadro medico premium
- Sin copagos

**Seguro de Vida y Accidentes**
- Capital asegurado: 2x salario anual
- Cobertura 24h

**Plan de Pensiones**
- Aportacion empresa: 3% salario
- Aportacion voluntaria empleado

**Otros beneficios:**
- Tickets restaurante
- Ayuda al transporte
- Formacion bonificada
- Descuentos en seguros personales
- Horario flexible
- Teletrabajo parcial

¿Sobre que beneficio quieres mas informacion?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Recursos Humanos en Soriano Mediadores.

Puedo ayudarte con:
- Consultas de **nomina** y retribuciones
- Solicitudes de **vacaciones** y permisos
- Tu **evaluacion** de desempeno
- Proceso de **onboarding** (nuevos empleados)
- Informacion sobre **beneficios**
- Datos personales y documentacion

¿En que puedo ayudarte hoy?`;
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

  async getEmployeeInfo(employeeId: string): Promise<unknown> {
    const employeeTool = this.tools.get('get_employee');
    if (!employeeTool) throw new Error('Employee tool not available');

    return employeeTool.handler(
      { employeeId },
      this.instance?.context ?? {}
    );
  }

  async submitLeaveRequest(employeeId: string, leaveData: Record<string, unknown>): Promise<unknown> {
    // 1. Get employee info
    const employeeTool = this.tools.get('get_employee');
    const employee = await employeeTool?.handler({ employeeId }, this.instance?.context ?? {});

    // 2. Submit leave request
    const leaveTool = this.tools.get('request_leave');
    const request = await leaveTool?.handler(
      { employeeId, ...leaveData },
      this.instance?.context ?? {}
    );

    // 3. Start approval workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: 'LEAVE_APPROVAL',
        title: `Solicitud vacaciones ${employeeId}`,
        entityType: 'leave_request',
        entityId: (request as { requestId?: string })?.requestId
      },
      this.instance?.context ?? {}
    );

    // 4. Notify manager
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      { to: 'manager@sorianoseguros.com', templateCode: 'LEAVE_REQUEST', templateData: request },
      this.instance?.context ?? {}
    );

    return request;
  }

  async getLeaveBalance(employeeId: string): Promise<{ vacation: number; personal: number; sick: number }> {
    // TODO: Integrate with HR system for real balance
    return {
      vacation: 22,
      personal: 3,
      sick: 0,
    };
  }
}

export const hrAgent = new HRAgent();
