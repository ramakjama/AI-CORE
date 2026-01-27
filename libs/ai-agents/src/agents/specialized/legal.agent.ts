// Legal Agent - Handles legal queries and contract management

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const LEGAL_AGENT_DEFINITION: AgentDefinition = {
  id: 'legal-agent-v1',
  type: 'LEGAL_AGENT',
  name: 'Agente Legal SORI',
  description: 'Agente especializado en consultas de contratos, reclamaciones judiciales y asesoramiento legal',
  systemPrompt: `Eres SORI, el asistente del Departamento Legal de Soriano Mediadores.

Tu objetivo es ayudar con consultas legales y gestion documental juridica:
- Consultas sobre contratos de mediacion
- Reclamaciones judiciales y extrajudiciales
- Asesoramiento legal basico
- Gestion documental legal
- Coordinacion con asesores externos

AREAS DE COMPETENCIA:

1. CONTRATOS:
   - Contratos de mediacion con aseguradoras
   - Contratos con clientes (carta de encargo)
   - Contratos laborales
   - Contratos de servicios
   - Acuerdos de confidencialidad (NDA)
   - Contratos de colaboracion

2. RECLAMACIONES:
   - Reclamaciones de clientes
   - Reclamaciones a aseguradoras
   - Procedimientos judiciales
   - Arbitraje y mediacion
   - Defensa juridica de la empresa

3. GESTION SOCIETARIA:
   - Documentacion corporativa
   - Poderes y representaciones
   - Actas de organos sociales
   - Modificaciones estatutarias

4. COMPLIANCE LEGAL:
   - Revision de clausulas contractuales
   - Adecuacion a normativa
   - Due diligence
   - Informes legales

TIPOS DE DOCUMENTOS LEGALES:
- Contratos y anexos
- Poderes notariales
- Escrituras
- Demandas y contestaciones
- Actas de conciliacion
- Laudos arbitrales
- Sentencias

PLAZOS IMPORTANTES:
- Prescripcion acciones contrato seguro: 2 anos
- Prescripcion acciones civiles: 5 anos
- Caducidad accion anulabilidad: 4 anos
- Recurso contra sentencia: Segun procedimiento

REGLAS:
1. No emitas opiniones legales vinculantes - deriva a abogado
2. Los plazos procesales son criticos - alerta siempre
3. La informacion legal es confidencial privilegiada
4. Documenta todas las consultas relevantes
5. Escala inmediatamente demandas o requerimientos judiciales

LIMITACIONES:
- Este asistente proporciona informacion general
- No sustituye el asesoramiento de un abogado
- Para casos complejos, derivar a Asesoria Juridica

CONTACTOS:
- Asesoria Juridica: legal@sorianoseguros.com
- Despacho externo: [nombre del despacho]
- Urgencias legales: Ext. 5555

TONO: Formal, preciso, juridico pero comprensible.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  tools: ['get_contract', 'search_legal_docs', 'create_legal_case', 'search_documents', 'generate_document', 'send_email', 'start_workflow'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_legal', 'sm_documents', 'sm_communications', 'sm_workflows'],
  permissions: ['read:contract', 'read:legal_doc', 'write:legal_case', 'read:document', 'write:document', 'generate:report'],
  isActive: true,
};

export class LegalAgent extends BaseAgent {
  constructor() {
    super(LEGAL_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('contrato') || userContent.toLowerCase().includes('acuerdo') || userContent.toLowerCase().includes('clausula')) {
      response = `Te ayudo con la consulta sobre contratos.

**Tipos de contratos gestionados:**

| Tipo | Descripcion | Vigencia tipica |
|------|-------------|-----------------|
| Mediacion | Con aseguradoras | Anual renovable |
| Carta encargo | Con clientes | Por operacion |
| Colaboracion | Con otros mediadores | Variable |
| Servicios | Proveedores | Anual |
| NDA | Confidencialidad | 2-5 anos |
| Laboral | Empleados | Indefinido/temporal |

**Para consultar un contrato necesito:**
- Numero de contrato, o
- Nombre de la contraparte, o
- Tipo de contrato y fecha aproximada

**Informacion disponible:**
- Texto completo del contrato
- Anexos y modificaciones
- Estado (vigente/vencido/rescindido)
- Condiciones economicas
- Plazos y vencimientos

**Servicios disponibles:**
- Consulta de contratos existentes
- Solicitud de nuevo contrato
- Revision de clausulas
- Renovaciones y prorrogas
- Rescisiones

¿Que contrato necesitas consultar o que gestion necesitas?`;
    } else if (userContent.toLowerCase().includes('reclamacion') || userContent.toLowerCase().includes('demanda') || userContent.toLowerCase().includes('juicio') || userContent.toLowerCase().includes('judicial')) {
      response = `Te informo sobre reclamaciones y procedimientos judiciales.

**IMPORTANTE:** Si has recibido una demanda o requerimiento judicial, contacta INMEDIATAMENTE con el departamento legal (Ext. 5555).

**Tipos de procedimientos:**

**1. Reclamaciones extrajudiciales:**
- Reclamacion previa obligatoria
- Burofax con acuse
- Mediacion
- Plazo respuesta: 15-30 dias

**2. Procedimientos judiciales:**
- Juicio verbal (hasta 6.000 EUR)
- Juicio ordinario (mas de 6.000 EUR)
- Monitorio (reclamacion deuda)
- Cambiario (letras/pagares)

**Plazos criticos:**
| Actuacion | Plazo |
|-----------|-------|
| Contestar demanda | 20 dias habiles |
| Recurso reposicion | 5 dias |
| Recurso apelacion | 20 dias |
| Ejecucion sentencia | 5 anos |

**Para gestionar un caso necesito:**
- Numero de expediente judicial (si existe)
- Datos de la contraparte
- Documentacion relacionada

**Estado de casos activos:**
Puedo consultar el estado de procedimientos abiertos si me indicas el numero de caso interno.

¿Tienes un caso nuevo o quieres consultar uno existente?`;
    } else if (userContent.toLowerCase().includes('poder') || userContent.toLowerCase().includes('representacion') || userContent.toLowerCase().includes('firma')) {
      response = `Te informo sobre poderes y representaciones.

**Tipos de poderes vigentes:**

| Tipo | Alcance | Otorgante |
|------|---------|-----------|
| General | Todas las actuaciones | Consejo |
| Especial | Acto concreto | Director General |
| Procesal | Pleitos | Consejo |
| Bancario | Operaciones bancarias | Director General |

**Personas autorizadas:**
Para consultar quien puede firmar un determinado tipo de documento, necesito:
- Tipo de documento/operacion
- Importe (si aplica)

**Limites de firma:**
| Importe | Autorizacion requerida |
|---------|------------------------|
| Hasta 5.000 EUR | Director Area |
| 5.001 - 25.000 EUR | Director General |
| 25.001 - 100.000 EUR | Consejero Delegado |
| Mas de 100.000 EUR | Consejo de Administracion |

**Solicitar nuevo poder:**
1. Justificar necesidad
2. Definir alcance y duracion
3. Aprobacion del Consejo
4. Otorgamiento notarial

**Registro de poderes:**
Todos los poderes estan registrados en el Libro de Poderes.

¿Que necesitas sobre poderes o autorizaciones?`;
    } else if (userContent.toLowerCase().includes('documento') || userContent.toLowerCase().includes('escritura') || userContent.toLowerCase().includes('acta')) {
      response = `Te ayudo con la gestion documental legal.

**Archivo documental legal:**

**Documentacion corporativa:**
- Escrituras de constitucion y modificaciones
- Estatutos sociales vigentes
- Actas de Junta General
- Actas de Consejo de Administracion
- Certificados de cargos

**Documentacion contractual:**
- Contratos vigentes y historicos
- Anexos y adendas
- Cartas de resolucion

**Documentacion procesal:**
- Demandas y contestaciones
- Escritos procesales
- Sentencias y autos
- Laudos arbitrales

**Para buscar documentacion:**
- Por tipo de documento
- Por contraparte
- Por fecha o rango de fechas
- Por contenido (busqueda de texto)

**Solicitar copia:**
- Copia simple: Inmediata
- Copia compulsada: 24-48h
- Copia notarial: Segun notaria

**Generar documento:**
Puedo ayudarte a generar borradores de:
- Cartas legales
- Requerimientos
- Contestaciones tipo
- Informes legales

¿Que documento necesitas?`;
    } else if (userContent.toLowerCase().includes('aseguradora') || userContent.toLowerCase().includes('comision') || userContent.toLowerCase().includes('mediacion')) {
      response = `Te informo sobre contratos con aseguradoras.

**Contratos de agencia/mediacion vigentes:**

Para consultar el detalle de un contrato especifico, necesito el nombre de la aseguradora.

**Informacion disponible por aseguradora:**
- Fecha de inicio y vencimiento
- Condiciones de comisiones
- Rappels y objetivos
- Exclusividad (si aplica)
- Condiciones de rescision

**Aspectos clave de los contratos:**

| Aspecto | Condicion habitual |
|---------|-------------------|
| Duracion | Anual, renovacion automatica |
| Preaviso rescision | 2-3 meses |
| Liquidacion comisiones | Mensual |
| Cartera | Propiedad mediador |
| Exclusividad | Generalmente no |

**Reclamacion de comisiones:**
1. Verificar liquidacion recibida
2. Identificar discrepancias
3. Reclamar por escrito
4. Plazo: 1 ano desde devengo

**Negociacion de condiciones:**
Las modificaciones de condiciones comerciales se coordinan con:
- Direccion Comercial
- Direccion General
- Asesoria Juridica (revision clausulas)

¿Que necesitas sobre contratos con aseguradoras?`;
    } else {
      response = `Hola! Soy SORI, tu asistente del Departamento Legal de Soriano Mediadores.

Puedo ayudarte con:
- **Contratos**: Consulta, revision, clausulas, vencimientos
- **Reclamaciones**: Judiciales, extrajudiciales, arbitraje
- **Poderes**: Autorizaciones, firmas, representaciones
- **Documentacion legal**: Busqueda, generacion, archivo
- **Aseguradoras**: Contratos de mediacion, comisiones

**Importante:**
Este asistente proporciona informacion general. Para asesoramiento legal especifico, contacta con:
- Asesoria Juridica: legal@sorianoseguros.com
- Urgencias: Ext. 5555

**Avisos criticos:**
Si has recibido una demanda, requerimiento judicial o notificacion urgente, contacta INMEDIATAMENTE con el departamento legal.

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

  async getContractDetails(contractId: string): Promise<unknown> {
    const contractTool = this.tools.get('get_contract');
    if (!contractTool) throw new Error('Contract tool not available');

    return contractTool.handler(
      { contractId },
      this.instance?.context ?? {}
    );
  }

  async searchLegalDocuments(searchCriteria: Record<string, unknown>): Promise<unknown> {
    const searchTool = this.tools.get('search_legal_docs');
    if (!searchTool) throw new Error('Legal search tool not available');

    return searchTool.handler(
      searchCriteria,
      this.instance?.context ?? {}
    );
  }

  async createLegalCase(caseData: Record<string, unknown>): Promise<unknown> {
    // 1. Create the legal case
    const caseTool = this.tools.get('create_legal_case');
    if (!caseTool) throw new Error('Legal case tool not available');

    const legalCase = await caseTool.handler(
      caseData,
      this.instance?.context ?? {}
    );

    // 2. Start workflow based on case type
    const workflowTool = this.tools.get('start_workflow');
    const caseType = caseData['caseType'] as string;

    await workflowTool?.handler(
      {
        workflowCode: `LEGAL_${caseType?.toUpperCase() || 'GENERAL'}`,
        title: `Caso legal - ${(legalCase as { caseNumber?: string })?.caseNumber}`,
        entityType: 'legal_case',
        entityId: (legalCase as { caseId?: string })?.caseId,
        variables: caseData
      },
      this.instance?.context ?? {}
    );

    // 3. Notify legal team
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: 'legal@sorianoseguros.com',
        subject: `Nuevo caso legal: ${(legalCase as { caseNumber?: string })?.caseNumber}`,
        templateCode: 'LEGAL_CASE_CREATED',
        templateData: legalCase
      },
      this.instance?.context ?? {}
    );

    return legalCase;
  }

  async generateLegalDocument(documentType: string, data: Record<string, unknown>): Promise<unknown> {
    const docTool = this.tools.get('generate_document');
    if (!docTool) throw new Error('Document generation tool not available');

    // Validate document type
    const allowedTypes = [
      'CARTA_RECLAMACION',
      'REQUERIMIENTO_PAGO',
      'CONTESTACION_DEMANDA',
      'PODER_ESPECIAL',
      'NDA',
      'INFORME_LEGAL'
    ];

    if (!allowedTypes.includes(documentType)) {
      throw new Error(`Tipo de documento no soportado: ${documentType}`);
    }

    return docTool.handler(
      {
        templateCode: `LEGAL_${documentType}`,
        data,
        format: 'PDF'
      },
      this.instance?.context ?? {}
    );
  }

  async getContractAlerts(): Promise<Array<{ contractId: string; alert: string; daysRemaining: number }>> {
    // TODO: Implement actual contract monitoring
    // This would check for:
    // - Contracts expiring in next 60 days
    // - Contracts with renewal decisions pending
    // - Contracts with unresolved issues

    return [
      { contractId: 'CTR-001', alert: 'Vencimiento proximo', daysRemaining: 30 },
      { contractId: 'CTR-002', alert: 'Renovacion pendiente decision', daysRemaining: 45 },
    ];
  }

  async checkPrescriptionStatus(caseId: string): Promise<{ status: string; prescriptionDate: Date; daysRemaining: number }> {
    // TODO: Implement prescription tracking
    // Check prescription/limitation periods for legal actions

    const prescriptionDate = new Date();
    prescriptionDate.setFullYear(prescriptionDate.getFullYear() + 2); // 2 years default

    const today = new Date();
    const daysRemaining = Math.floor((prescriptionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return {
      status: daysRemaining > 180 ? 'OK' : daysRemaining > 60 ? 'WARNING' : 'URGENT',
      prescriptionDate,
      daysRemaining
    };
  }
}

export const legalAgent = new LegalAgent();
