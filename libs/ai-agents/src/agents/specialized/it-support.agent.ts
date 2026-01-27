// IT Support Agent - Handles technical support and IT requests

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const IT_SUPPORT_AGENT_DEFINITION: AgentDefinition = {
  id: 'it-support-agent-v1',
  type: 'IT_SUPPORT_AGENT',
  name: 'Agente de Soporte IT SORI',
  description: 'Agente especializado en soporte tecnico, tickets, incidencias y solicitudes de acceso',
  systemPrompt: `Eres SORI, el asistente de Soporte IT de Soriano Mediadores.

Tu objetivo es ayudar a los usuarios con todas sus incidencias y solicitudes tecnicas:
- Creacion y seguimiento de tickets de soporte
- Resolucion de incidencias tecnicas
- Solicitudes de acceso a sistemas
- Problemas de software y aplicaciones
- Gestion de hardware y equipamiento

CATEGORIAS DE SOPORTE:

1. INCIDENCIAS (Prioridad segun impacto):
   - CRITICA: Sistema caido, afecta a toda la empresa
   - ALTA: Usuario bloqueado, no puede trabajar
   - MEDIA: Funcionalidad degradada
   - BAJA: Consulta o mejora menor

2. PROBLEMAS COMUNES:
   - Problemas de acceso/contrasena
   - Errores en aplicaciones
   - Problemas de email
   - Lentitud del sistema
   - Problemas de impresion
   - VPN y acceso remoto

3. SOLICITUDES:
   - Alta de usuario nuevo
   - Solicitud de acceso a sistema
   - Instalacion de software
   - Equipamiento nuevo
   - Cambio de permisos

4. HARDWARE:
   - Portatiles y PCs
   - Monitores y perifericos
   - Telefonos y moviles
   - Impresoras

PROCESO DE RESOLUCION:

1. Identificar el problema
2. Clasificar prioridad
3. Intentar resolucion remota
4. Si no es posible, escalar a tecnico
5. Seguimiento hasta cierre

SOLUCIONES RAPIDAS:
- Reiniciar equipo/aplicacion
- Limpiar cache del navegador
- Verificar conexion a internet
- Comprobar credenciales
- Actualizar aplicacion

SLA (Tiempos de respuesta):
- Critica: 15 minutos
- Alta: 1 hora
- Media: 4 horas
- Baja: 24 horas

REGLAS:
1. Nunca solicites contrasenas por este canal
2. Para accesos criticos, requiere aprobacion del responsable
3. Documenta todos los pasos en el ticket
4. Si es urgente y no puedes resolver, escala inmediatamente
5. Verifica la identidad antes de resetear accesos

TONO: Tecnico pero comprensible, paciente, orientado a soluciones.`,
  model: 'claude-3-5-haiku-20241022',
  temperature: 0.4,
  tools: ['create_ticket', 'get_ticket', 'assign_ticket', 'get_user_devices', 'reset_password', 'send_email', 'send_sms'],
  maxTurns: 30,
  timeout: 300000,
  databases: ['sm_global', 'sm_tickets', 'sm_techteam', 'sm_communications', 'sm_inventory'],
  permissions: ['read:ticket', 'write:ticket', 'read:device', 'write:password_reset', 'send:notification'],
  isActive: true,
};

export class ITSupportAgent extends BaseAgent {
  constructor() {
    super(IT_SUPPORT_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('contrasena') || userContent.toLowerCase().includes('password') || userContent.toLowerCase().includes('acceso')) {
      response = `Entiendo que tienes un problema con tu contrasena o acceso.

**Opciones de autoservicio:**
1. **Portal de autoservicio**: https://id.sorianoseguros.com/reset
   - Resetea tu contrasena con tu email corporativo

2. **App Authenticator**: Si tienes configurado MFA, puedes usarlo

**Si no puedes acceder al autoservicio:**
Para resetear tu contrasena necesito verificar tu identidad:
- Tu numero de empleado
- Responder a la pregunta de seguridad

**Importante:**
- Nunca te pedire tu contrasena actual
- La nueva contrasena sera temporal
- Deberas cambiarla en el primer inicio de sesion

**Politica de contrasenas:**
- Minimo 12 caracteres
- Mayusculas, minusculas, numeros y simbolo
- No repetir las ultimas 5 contrasenas
- Expira cada 90 dias

¿Cual es tu numero de empleado para proceder?`;
    } else if (userContent.toLowerCase().includes('ticket') || userContent.toLowerCase().includes('incidencia') || userContent.toLowerCase().includes('problema')) {
      response = `Te ayudo a gestionar tu ticket de soporte.

**Para crear un nuevo ticket necesito:**
1. Descripcion del problema
2. Desde cuando ocurre
3. ¿Afecta solo a ti o a mas usuarios?
4. ¿Has probado reiniciar?

**Clasificacion de prioridad:**
| Prioridad | Descripcion | SLA |
|-----------|-------------|-----|
| CRITICA | Sistema caido | 15 min |
| ALTA | No puedo trabajar | 1 hora |
| MEDIA | Funciona parcialmente | 4 horas |
| BAJA | Consulta/mejora | 24 horas |

**Consultar ticket existente:**
Si ya tienes un ticket abierto, dame el numero (TKT-XXXXX) para ver su estado.

**Tickets frecuentes:**
- Problemas de email
- VPN no conecta
- Aplicacion da error
- Ordenador lento

¿Quieres abrir un nuevo ticket o consultar uno existente?`;
    } else if (userContent.toLowerCase().includes('software') || userContent.toLowerCase().includes('aplicacion') || userContent.toLowerCase().includes('instalar')) {
      response = `Te ayudo con la solicitud de software.

**Software disponible en autoservicio:**
Desde el Portal de Aplicaciones puedes instalar:
- Microsoft Office 365
- Adobe Reader
- 7-Zip
- Navegadores (Chrome, Firefox)
- Teams

**Software que requiere solicitud:**
Para instalar software no incluido en autoservicio:

1. **Abre un ticket** indicando:
   - Nombre del software
   - Version requerida
   - Justificacion de negocio

2. **Proceso de aprobacion:**
   - Tu responsable aprueba
   - IT valida compatibilidad
   - Se programa instalacion

**Software restringido:**
Algunos programas requieren licencia especifica o estan en lista de software no permitido.

**Tiempos estimados:**
- Autoservicio: Inmediato
- Software standard: 24-48h
- Software especial: 3-5 dias

¿Que software necesitas?`;
    } else if (userContent.toLowerCase().includes('equipo') || userContent.toLowerCase().includes('ordenador') || userContent.toLowerCase().includes('portatil') || userContent.toLowerCase().includes('hardware')) {
      response = `Te ayudo con tu consulta sobre hardware/equipamiento.

**Tu equipamiento asignado:**
Para ver tus dispositivos asignados, necesito tu numero de empleado.

**Solicitar nuevo equipamiento:**
1. **Portatil/PC**: Solicitud via ticket + aprobacion responsable
2. **Monitor adicional**: Solicitud via ticket
3. **Periferico** (raton, teclado): Disponible en almacen IT
4. **Movil corporativo**: Requiere aprobacion de direccion

**Problemas con tu equipo:**
| Problema | Accion |
|----------|--------|
| No enciende | Verificar alimentacion, si persiste abrir ticket |
| Lento | Reiniciar, limpiar archivos temporales |
| Pantalla azul | Reiniciar, si se repite abrir ticket urgente |
| Bateria | Si <2h de autonomia, solicitar cambio |

**Devolucion de equipos:**
- Al causar baja o cambiar de departamento
- Coordinación con IT para transferencia de datos

¿Que necesitas respecto a tu equipamiento?`;
    } else if (userContent.toLowerCase().includes('vpn') || userContent.toLowerCase().includes('remoto') || userContent.toLowerCase().includes('teletrabajo')) {
      response = `Te ayudo con el acceso remoto y VPN.

**Conexion VPN:**

**Requisitos:**
- Cliente VPN instalado (GlobalProtect)
- Usuario de red activo
- Autenticacion MFA configurada

**Pasos para conectar:**
1. Abrir GlobalProtect
2. Servidor: vpn.sorianoseguros.com
3. Usuario: tu email corporativo
4. Contrasena + codigo MFA

**Problemas comunes:**

| Error | Solucion |
|-------|----------|
| "Servidor no encontrado" | Verificar conexion internet |
| "Credenciales incorrectas" | Verificar usuario/contrasena |
| "MFA timeout" | Regenerar codigo authenticator |
| "Conexion lenta" | Cerrar aplicaciones que consuman ancho de banda |

**Si no tienes VPN configurada:**
1. Solicita acceso via ticket
2. Tu responsable debe aprobar
3. IT te enviara instrucciones de instalacion

**Horario de soporte VPN:**
- L-V: 7:00 - 22:00
- Fines de semana: Guardia para criticos

¿Que problema tienes con la VPN?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Soporte IT en Soriano Mediadores.

Puedo ayudarte con:
- **Problemas de acceso**: Contrasenas, bloqueos, permisos
- **Tickets de soporte**: Crear, consultar, seguimiento
- **Software**: Instalaciones, errores, actualizaciones
- **Hardware**: Equipos, perifericos, averias
- **VPN/Acceso remoto**: Conexion, configuracion

**Canales de soporte:**
- Este chat: Consultas y tickets
- Email: soporte@sorianoseguros.com
- Telefono: Ext. 1234 (urgencias)
- Portal: https://soporte.sorianoseguros.com

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

  async createSupportTicket(ticketData: Record<string, unknown>): Promise<unknown> {
    const ticketTool = this.tools.get('create_ticket');
    if (!ticketTool) throw new Error('Ticket tool not available');

    const ticket = await ticketTool.handler(
      ticketData,
      this.instance?.context ?? {}
    );

    // Notify user
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: ticketData['requesterEmail'] as string,
        templateCode: 'TICKET_CREATED',
        templateData: ticket
      },
      this.instance?.context ?? {}
    );

    return ticket;
  }

  async getTicketStatus(ticketId: string): Promise<unknown> {
    const ticketTool = this.tools.get('get_ticket');
    if (!ticketTool) throw new Error('Ticket tool not available');

    return ticketTool.handler(
      { ticketId },
      this.instance?.context ?? {}
    );
  }

  async escalateTicket(ticketId: string, priority: string, reason: string): Promise<unknown> {
    const assignTool = this.tools.get('assign_ticket');
    if (!assignTool) throw new Error('Assign tool not available');

    // Escalate to senior technician based on priority
    const assignee = priority === 'CRITICAL' ? 'IT_MANAGER' : 'SENIOR_TECH';

    const result = await assignTool.handler(
      { ticketId, assignee, priority, escalationReason: reason },
      this.instance?.context ?? {}
    );

    // Send SMS for critical issues
    if (priority === 'CRITICAL') {
      const smsTool = this.tools.get('send_sms');
      await smsTool?.handler(
        { to: '+34600000000', message: `CRITICO: Ticket ${ticketId} escalado. ${reason}` },
        this.instance?.context ?? {}
      );
    }

    return result;
  }

  async getUserDevices(employeeId: string): Promise<unknown> {
    const deviceTool = this.tools.get('get_user_devices');
    if (!deviceTool) throw new Error('Device tool not available');

    return deviceTool.handler(
      { employeeId },
      this.instance?.context ?? {}
    );
  }

  async initiatePasswordReset(employeeId: string, verificationData: Record<string, unknown>): Promise<unknown> {
    // Verify identity first
    // TODO: Implement identity verification logic

    const resetTool = this.tools.get('reset_password');
    if (!resetTool) throw new Error('Password reset tool not available');

    const result = await resetTool.handler(
      { employeeId, ...verificationData },
      this.instance?.context ?? {}
    );

    // Send temporary password via SMS
    const smsTool = this.tools.get('send_sms');
    await smsTool?.handler(
      {
        to: verificationData['phone'] as string,
        message: `Tu contrasena temporal es: [TEMP_PASSWORD]. Deberas cambiarla en el primer inicio de sesion.`
      },
      this.instance?.context ?? {}
    );

    return result;
  }
}

export const itSupportAgent = new ITSupportAgent();
