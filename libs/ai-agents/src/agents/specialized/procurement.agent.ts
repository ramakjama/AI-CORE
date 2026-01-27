// Procurement Agent - Handles supplier management and purchasing

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const PROCUREMENT_AGENT_DEFINITION: AgentDefinition = {
  id: 'procurement-agent-v1',
  type: 'PROCUREMENT_AGENT',
  name: 'Agente de Compras SORI',
  description: 'Agente especializado en gestion de proveedores, ordenes de compra, comparativas de precios y contratos',
  systemPrompt: `Eres SORI, el asistente de Compras de Soriano Mediadores.

Tu objetivo es optimizar la gestion de compras y proveedores:
- Gestion del directorio de proveedores
- Creacion y seguimiento de ordenes de compra
- Comparativas de precios y seleccion
- Gestion de contratos con proveedores
- Control de gastos y presupuesto

CATEGORIAS DE COMPRA:

1. TECNOLOGIA:
   - Hardware: Equipos, perifericos
   - Software: Licencias, suscripciones
   - Servicios IT: Mantenimiento, hosting
   - Telecomunicaciones: Lineas, internet

2. SERVICIOS GENERALES:
   - Limpieza y mantenimiento
   - Seguridad
   - Correos y mensajeria
   - Viajes y desplazamientos

3. MATERIAL DE OFICINA:
   - Papeleria
   - Consumibles (toner, etc.)
   - Mobiliario
   - Material promocional

4. SERVICIOS PROFESIONALES:
   - Consultoria
   - Formacion
   - Legal
   - Marketing externo

5. SEGUROS Y FINANCIEROS:
   - Polizas corporativas
   - Servicios bancarios
   - Auditoria

PROCESO DE COMPRA:

| Importe | Proceso | Aprobacion |
|---------|---------|------------|
| < 500 EUR | Compra directa | Responsable area |
| 500-2.000 EUR | 2 presupuestos | Director departamento |
| 2.000-10.000 EUR | 3 presupuestos | Director financiero |
| > 10.000 EUR | Concurso | Comite direccion |

GESTION DE PROVEEDORES:

**Estados del proveedor:**
- Potencial: En evaluacion
- Homologado: Aprobado para compras
- Preferente: Proveedor estrategico
- Suspendido: Incidencias activas
- Baja: Ya no se trabaja

**Criterios de homologacion:**
1. Capacidad tecnica
2. Estabilidad financiera
3. Cumplimiento normativo (ISO, etc.)
4. Referencias
5. Condiciones comerciales
6. RSC y sostenibilidad

ORDENES DE COMPRA:

**Estados:**
- Borrador: En preparacion
- Pendiente aprobacion: Enviada a aprobar
- Aprobada: Lista para enviar
- Enviada: Comunicada al proveedor
- Recibida parcial: Entrega parcial
- Recibida: Completada
- Facturada: Con factura asociada
- Cerrada: Proceso completado

CONTRATOS:

**Tipos:**
- Marco: Condiciones generales para multiples pedidos
- Servicios: Prestacion recurrente
- Suministro: Compras periodicas
- Proyecto: Entrega unica

**Alertas de renovacion:**
- 90 dias antes: Revision condiciones
- 60 dias antes: Negociacion
- 30 dias antes: Decision renovar/cambiar

REGLAS:
1. No fraccionar compras para evitar aprobaciones
2. Preferir proveedores homologados
3. Documentar justificacion en compras urgentes
4. Revisar contratos antes de renovacion automatica
5. Verificar recepcion antes de aprobar factura

PRESUPUESTO:
- Control mensual de gastos vs presupuesto
- Alerta al 80% de consumo
- Aprobacion extra-presupuestaria por Direccion

TONO: Profesional, orientado al ahorro y la calidad.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.4,
  tools: ['get_supplier', 'create_purchase_order', 'compare_prices', 'get_contract', 'search_suppliers', 'send_email', 'start_workflow', 'generate_document'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'sm_procurement', 'sf_finance', 'sm_contracts', 'sm_documents', 'sm_workflows'],
  permissions: ['read:supplier', 'write:supplier', 'read:purchase_order', 'write:purchase_order', 'read:contract', 'write:contract', 'approve:purchase', 'generate:report'],
  isActive: true,
};

export class ProcurementAgent extends BaseAgent {
  constructor() {
    super(PROCUREMENT_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('proveedor') || userContent.toLowerCase().includes('supplier') || userContent.toLowerCase().includes('vendor')) {
      response = `Te ayudo con la gestion de proveedores.

**Directorio de proveedores:**
Para ver los proveedores registrados, consultare el sistema.

**Buscar proveedor:**
Puedo buscar por:
- Nombre o razon social
- CIF
- Categoria de producto/servicio
- Estado (homologado, preferente, etc.)

**Estados de proveedor:**
| Estado | Descripcion | Puede comprar |
|--------|-------------|---------------|
| Potencial | En evaluacion | No |
| Homologado | Aprobado | Si |
| Preferente | Estrategico | Si (prioridad) |
| Suspendido | Incidencias | No |
| Baja | Inactivo | No |

**Registrar nuevo proveedor:**
Para dar de alta un proveedor necesito:
1. Datos fiscales (razon social, CIF, direccion)
2. Datos de contacto
3. Categoria de producto/servicio
4. Condiciones comerciales (forma pago, plazo)
5. Documentacion (CIF, alta IAE, certificados)

**Homologar proveedor:**
Proceso de evaluacion:
1. Revision documental
2. Evaluacion capacidad tecnica
3. Verificacion solvencia
4. Comprobacion referencias
5. Negociacion condiciones
6. Aprobacion por Compras

**Evaluar proveedor existente:**
| Criterio | Peso |
|----------|------|
| Calidad | 30% |
| Precio | 25% |
| Plazo entrega | 20% |
| Servicio post-venta | 15% |
| Flexibilidad | 10% |

¿Que proveedor necesitas consultar o gestionar?`;
    } else if (userContent.toLowerCase().includes('pedido') || userContent.toLowerCase().includes('compra') || userContent.toLowerCase().includes('orden')) {
      response = `Te ayudo a gestionar ordenes de compra.

**Ordenes de compra:**
Para ver las ordenes activas, consultare el sistema.

**Crear nueva orden de compra:**

Para crear una OC necesito:

1. **Datos del pedido:**
   - Proveedor (debe estar homologado)
   - Descripcion del producto/servicio
   - Cantidad
   - Precio unitario
   - Fecha de entrega requerida

2. **Imputacion:**
   - Centro de coste
   - Partida presupuestaria
   - Proyecto (si aplica)

3. **Condiciones:**
   - Forma de pago
   - Lugar de entrega
   - Observaciones

**Proceso segun importe:**
| Importe | Presupuestos | Aprobador |
|---------|--------------|-----------|
| < 500 EUR | 0 | Responsable area |
| 500-2.000 EUR | 2 | Director depto |
| 2.000-10.000 EUR | 3 | Director financiero |
| > 10.000 EUR | Concurso | Comite direccion |

**Estados de la OC:**
- Borrador > Pendiente aprobacion > Aprobada > Enviada > Recibida > Facturada > Cerrada

**Seguimiento de pedidos:**
| OC | Proveedor | Importe | Estado | Entrega |
|----|-----------|---------|--------|---------|
| (Pendiente consulta) | | | | |

¿Que pedido quieres crear o consultar?`;
    } else if (userContent.toLowerCase().includes('comparar') || userContent.toLowerCase().includes('precio') || userContent.toLowerCase().includes('presupuesto')) {
      response = `Te ayudo a comparar precios y ofertas.

**Solicitud de comparativa:**

Para comparar precios necesito:
1. **Producto/servicio a adquirir:**
   - Descripcion detallada
   - Especificaciones tecnicas
   - Cantidad

2. **Proveedores a consultar:**
   - Minimo segun importe estimado
   - Preferiblemente homologados

**Crear solicitud de presupuesto (RFQ):**

El sistema puede enviar automaticamente la solicitud a proveedores indicando:
- Descripcion del requerimiento
- Especificaciones
- Fecha limite de respuesta
- Criterios de evaluacion

**Matriz de comparacion:**
| Criterio | Proveedor A | Proveedor B | Proveedor C |
|----------|-------------|-------------|-------------|
| Precio | | | |
| Plazo entrega | | | |
| Garantia | | | |
| Condiciones pago | | | |
| Valoracion historica | | | |
| **TOTAL** | | | |

**Recomendacion automatica:**
El sistema sugiere el proveedor con mejor puntuacion global.

**Negociacion:**
Una vez recibidos presupuestos, puedo ayudar con:
- Analisis de desviaciones vs historico
- Puntos de negociacion sugeridos
- Preparacion de contraoferta

¿Para que producto/servicio necesitas comparar precios?`;
    } else if (userContent.toLowerCase().includes('contrato') || userContent.toLowerCase().includes('renovacion') || userContent.toLowerCase().includes('acuerdo')) {
      response = `Te informo sobre la gestion de contratos.

**Contratos con proveedores:**
Para ver los contratos activos, consultare el sistema.

**Tipos de contrato:**
| Tipo | Uso | Duracion tipica |
|------|-----|-----------------|
| Marco | Multiples pedidos | 1-3 anos |
| Servicios | Prestacion recurrente | 1 ano |
| Suministro | Compras periodicas | 1 ano |
| Proyecto | Entrega unica | Variable |

**Buscar contrato:**
Puedo buscar por:
- Proveedor
- Categoria
- Fecha vencimiento
- Estado

**Alertas de renovacion:**
| Contrato | Proveedor | Vencimiento | Estado |
|----------|-----------|-------------|--------|
| (Pendiente consulta) | | | |

**Proceso de renovacion:**
1. **90 dias antes**: Revision de condiciones actuales
2. **60 dias antes**: Negociacion nuevas condiciones
3. **30 dias antes**: Decision renovar/cambiar
4. **Vencimiento**: Firma nuevo contrato o prorroga

**Crear nuevo contrato:**
Para formalizar un contrato necesito:
- Proveedor
- Objeto del contrato
- Duracion
- Condiciones economicas
- Clausulas especiales
- Anexos tecnicos

**Tipos de clausulas habituales:**
- Confidencialidad
- Penalizaciones SLA
- Revision de precios
- Terminacion anticipada
- Proteccion de datos

¿Que contrato necesitas consultar o gestionar?`;
    } else if (userContent.toLowerCase().includes('presupuesto') || userContent.toLowerCase().includes('gasto') || userContent.toLowerCase().includes('coste')) {
      response = `Te informo sobre el control de gastos.

**Control presupuestario:**
Para ver el estado del presupuesto, consultare el sistema.

**Consumo por categoria:**
| Categoria | Presupuesto | Gastado | Disponible | % |
|-----------|-------------|---------|------------|---|
| Tecnologia | (dato) | (dato) | (dato) | (%) |
| Servicios generales | (dato) | (dato) | (dato) | (%) |
| Material oficina | (dato) | (dato) | (dato) | (%) |
| Servicios profesionales | (dato) | (dato) | (dato) | (%) |
| Otros | (dato) | (dato) | (dato) | (%) |
| **TOTAL** | (dato) | (dato) | (dato) | (%) |

**Alertas activas:**
- Categorias al > 80% de consumo
- Partidas agotadas
- Desviaciones significativas

**Evolucion mensual:**
| Mes | Presupuesto | Real | Desviacion |
|-----|-------------|------|------------|
| (Pendiente consulta) | | | |

**Solicitar ampliacion:**
Si necesitas presupuesto adicional:
1. Justificar la necesidad
2. Indicar importe solicitado
3. Proponer financiacion
4. Enviar a aprobacion de Direccion

**Informes disponibles:**
- Consumo mensual por categoria
- Comparativa ano anterior
- Top 10 proveedores por volumen
- Ahorro generado vs PVP

¿Que aspecto del presupuesto necesitas consultar?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Compras en Soriano Mediadores.

Puedo ayudarte con:
- **Proveedores**: Alta, homologacion, evaluacion
- **Ordenes de compra**: Creacion y seguimiento
- **Comparativas**: Solicitud de presupuestos
- **Contratos**: Gestion y renovaciones
- **Presupuesto**: Control de gastos

**Proceso de compra:**
| Importe | Requisitos | Aprobador |
|---------|------------|-----------|
| < 500 EUR | Directo | Responsable |
| 500-2K EUR | 2 presupuestos | Director |
| 2K-10K EUR | 3 presupuestos | Dir. Financiero |
| > 10K EUR | Concurso | Comite |

**Contratos proximos a vencer:**
(Consultar sistema)

**Contacto Compras:**
compras@sorianoseguros.com

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

  async getSupplier(supplierId: string): Promise<unknown> {
    const supplierTool = this.tools.get('get_supplier');
    if (!supplierTool) throw new Error('Supplier tool not available');

    return supplierTool.handler(
      { supplierId },
      this.instance?.context ?? {}
    );
  }

  async createPurchaseOrder(orderData: {
    supplierId: string;
    items: Array<{ description: string; quantity: number; unitPrice: number }>;
    deliveryDate: Date;
    costCenter: string;
    budgetCode: string;
    notes?: string;
  }): Promise<unknown> {
    // 1. Validate supplier is approved
    const supplier = await this.getSupplier(orderData.supplierId);
    const supplierStatus = (supplier as { status?: string })?.status;

    if (supplierStatus !== 'HOMOLOGADO' && supplierStatus !== 'PREFERENTE') {
      throw new Error('El proveedor no esta homologado para realizar compras');
    }

    // 2. Calculate total and determine approval level
    const totalAmount = orderData.items.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice), 0
    );

    let approvalLevel: string;
    if (totalAmount < 500) {
      approvalLevel = 'AREA_MANAGER';
    } else if (totalAmount < 2000) {
      approvalLevel = 'DEPARTMENT_DIRECTOR';
    } else if (totalAmount < 10000) {
      approvalLevel = 'FINANCE_DIRECTOR';
    } else {
      approvalLevel = 'MANAGEMENT_COMMITTEE';
    }

    // 3. Create the purchase order
    const orderTool = this.tools.get('create_purchase_order');
    const order = await orderTool?.handler(
      {
        ...orderData,
        totalAmount,
        approvalLevel,
        status: 'PENDING_APPROVAL',
        createdAt: new Date()
      },
      this.instance?.context ?? {}
    );

    // 4. Start approval workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: 'PURCHASE_ORDER_APPROVAL',
        title: `OC ${(order as { orderNumber?: string })?.orderNumber}`,
        entityType: 'purchase_order',
        entityId: (order as { orderId?: string })?.orderId,
        variables: { order, approvalLevel, totalAmount }
      },
      this.instance?.context ?? {}
    );

    return order;
  }

  async comparePrices(request: {
    description: string;
    specifications: string;
    quantity: number;
    supplierIds: string[];
    responseDeadline: Date;
  }): Promise<unknown> {
    // 1. Create RFQ (Request for Quotation)
    const compareTool = this.tools.get('compare_prices');
    const rfq = await compareTool?.handler(
      {
        ...request,
        status: 'OPEN',
        createdAt: new Date()
      },
      this.instance?.context ?? {}
    );

    // 2. Send RFQ to each supplier
    const emailTool = this.tools.get('send_email');
    const docTool = this.tools.get('generate_document');

    for (const supplierId of request.supplierIds) {
      const supplier = await this.getSupplier(supplierId);

      // Generate RFQ document
      const rfqDoc = await docTool?.handler(
        {
          templateCode: 'RFQ_REQUEST',
          data: { rfq, supplier, request },
          format: 'PDF'
        },
        this.instance?.context ?? {}
      );

      // Send to supplier
      await emailTool?.handler(
        {
          to: (supplier as { email?: string })?.email,
          templateCode: 'RFQ_INVITATION',
          templateData: { rfq, request },
          attachments: [rfqDoc]
        },
        this.instance?.context ?? {}
      );
    }

    return {
      rfqId: (rfq as { rfqId?: string })?.rfqId,
      suppliersInvited: request.supplierIds.length,
      responseDeadline: request.responseDeadline,
      status: 'PENDING_RESPONSES'
    };
  }

  async getContract(contractId: string): Promise<unknown> {
    const contractTool = this.tools.get('get_contract');
    if (!contractTool) throw new Error('Contract tool not available');

    return contractTool.handler(
      { contractId },
      this.instance?.context ?? {}
    );
  }

  async getExpiringContracts(daysAhead: number = 90): Promise<unknown> {
    const contractTool = this.tools.get('get_contract');
    if (!contractTool) throw new Error('Contract tool not available');

    return contractTool.handler(
      {
        expiringWithin: daysAhead,
        status: 'ACTIVE'
      },
      this.instance?.context ?? {}
    );
  }

  async evaluateSupplier(supplierId: string, evaluation: {
    quality: number; // 1-5
    price: number; // 1-5
    delivery: number; // 1-5
    service: number; // 1-5
    flexibility: number; // 1-5
    comments?: string;
  }): Promise<{ score: number; recommendation: string }> {
    const weights = {
      quality: 0.30,
      price: 0.25,
      delivery: 0.20,
      service: 0.15,
      flexibility: 0.10
    };

    const score = Object.entries(evaluation)
      .filter(([key]) => key !== 'comments')
      .reduce((total, [key, value]) => {
        return total + ((value as number) * (weights[key as keyof typeof weights] ?? 0));
      }, 0);

    let recommendation: string;
    if (score >= 4.5) {
      recommendation = 'Proveedor excelente - Considerar como preferente';
    } else if (score >= 3.5) {
      recommendation = 'Proveedor satisfactorio - Mantener homologacion';
    } else if (score >= 2.5) {
      recommendation = 'Proveedor mejorable - Solicitar plan de mejora';
    } else {
      recommendation = 'Proveedor insatisfactorio - Considerar suspension';
    }

    // Update supplier record
    const searchTool = this.tools.get('search_suppliers');
    await searchTool?.handler(
      {
        supplierId,
        action: 'UPDATE_EVALUATION',
        evaluation: { ...evaluation, score, date: new Date() }
      },
      this.instance?.context ?? {}
    );

    return { score: Math.round(score * 100) / 100, recommendation };
  }
}

export const procurementAgent = new ProcurementAgent();
