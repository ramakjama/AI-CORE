// Customer Service Agent - General customer support

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const CUSTOMER_SERVICE_DEFINITION: AgentDefinition = {
  id: 'customer-service-v1',
  type: 'CUSTOMER_SERVICE',
  name: 'Agente de Atención al Cliente SORI',
  description: 'Agente general de atención al cliente para consultas, dudas y gestiones',
  systemPrompt: `Eres SORI, el asistente virtual de atención al cliente de Soriano Mediadores.

CAPACIDADES:
- Resolver consultas generales sobre pólizas
- Explicar coberturas y condiciones
- Gestionar datos personales
- Enviar documentación
- Programar citas y llamadas
- Dirigir a departamentos especializados

GESTIONES HABITUALES:
1. Consulta de pólizas y coberturas
2. Envío de recibos y justificantes
3. Cambio de datos personales
4. Solicitud de certificados
5. Programación de visitas comerciales
6. Derivación a siniestros/comercial

REGLAS:
1. Identifica siempre al cliente (NIF, email o nº póliza)
2. Verifica los datos antes de realizar cambios
3. Nunca compartas datos sensibles
4. Si no puedes resolver, deriva al departamento correcto
5. Ofrece siempre alternativas de contacto

HORARIOS:
- Lunes a Viernes: 9:00 - 20:00
- Sábados: 10:00 - 14:00
- Festivos: Cerrado (disponible autoservicio online)

CANALES:
- 📞 Teléfono: 900 123 456
- 📧 Email: info@sorianoseguros.com
- 💬 WhatsApp: 612 345 678
- 🌐 Web: www.sorianoseguros.com

TONO: Amable, servicial, profesional.`,
  model: 'claude-3-5-haiku-20241022',
  temperature: 0.7,
  tools: ['get_party', 'search_parties', 'get_policy', 'search_policies', 'get_document', 'search_documents', 'generate_document', 'send_email', 'start_workflow'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'ss_insurance', 'sm_documents', 'sm_communications'],
  permissions: ['read:party', 'read:policy', 'read:document', 'send:email'],
  isActive: true,
};

export class CustomerServiceAgent extends BaseAgent {
  constructor() {
    super(CUSTOMER_SERVICE_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = (lastUserMessage?.content ?? '').toLowerCase();

    let response: string;

    if (userContent.includes('recibo') || userContent.includes('factura')) {
      response = `Para obtener tus recibos o facturas puedo:

1. **Enviártelos por email** - Dime a qué dirección
2. **Descarga directa** - Accede a tu área de cliente

Necesito tu número de póliza o NIF para localizarte. ¿Me lo facilitas?`;
    } else if (userContent.includes('certificado')) {
      response = `Puedo gestionar los siguientes certificados:

📄 **Certificado de seguro en vigor** - Inmediato
📄 **Certificado de no siniestralidad** - 24h
📄 **Certificado de bonificación** - 24h
📄 **Carta verde** (internacional) - 48h

¿Qué certificado necesitas? Te lo envío por email.`;
    } else if (userContent.includes('cambiar') || userContent.includes('modificar')) {
      response = `¿Qué datos necesitas modificar?

👤 **Datos personales**: dirección, teléfono, email
🚗 **Datos del vehículo**: matrícula, conductor
🏠 **Datos del hogar**: cambio de domicilio
💳 **Datos bancarios**: cuenta de domiciliación

Algunos cambios pueden afectar a la prima. Te informo en cada caso.

¿Qué necesitas actualizar?`;
    } else if (userContent.includes('cobertura') || userContent.includes('qué cubre')) {
      response = `Para informarte sobre tus coberturas necesito:

1. Tu número de póliza, o
2. Tu NIF/CIF

Una vez localice tu póliza, te explico:
- ✅ Qué está cubierto
- ❌ Exclusiones principales
- 💰 Capitales y límites
- 📞 Cómo activar cada cobertura

¿Me das el dato para buscar?`;
    } else if (userContent.includes('cita') || userContent.includes('llamar')) {
      response = `Puedo programar:

📞 **Llamada telefónica** - Un asesor te llama
📅 **Cita en oficina** - Reunión presencial
💻 **Videollamada** - Reunión online

¿Qué prefieres? Dime día y hora aproximada que te venga bien.

Nuestros horarios:
- L-V: 9:00 - 20:00
- Sábados: 10:00 - 14:00`;
    } else if (userContent.includes('queja') || userContent.includes('reclamación')) {
      response = `Lamento que hayas tenido una mala experiencia. Tu opinión es muy importante.

Puedo:
1. **Registrar tu queja** formalmente
2. **Derivar al responsable** del departamento
3. **Hacer seguimiento** hasta resolución

¿Me cuentas qué ha pasado? Voy a ayudarte a solucionarlo.`;
    } else {
      response = `¡Hola! Soy SORI, tu asistente de Soriano Mediadores.

¿En qué puedo ayudarte?

📋 Consultar mis pólizas y coberturas
🧾 Obtener recibos y certificados
✏️ Modificar mis datos
📞 Programar una llamada o cita
🔔 Estado de mis gestiones

También puedo derivarte a:
- 🚗 Siniestros
- 💼 Comercial (nuevos seguros)
- 💰 Administración (pagos)

Cuéntame, ¿qué necesitas?`;
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
}

export const customerServiceAgent = new CustomerServiceAgent();
