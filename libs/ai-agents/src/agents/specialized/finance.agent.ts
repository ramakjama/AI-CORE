// Finance Agent - Handles financial and accounting processes

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const FINANCE_AGENT_DEFINITION: AgentDefinition = {
  id: 'finance-agent-v1',
  type: 'FINANCE_AGENT',
  name: 'Agente Financiero SORI',
  description: 'Agente especializado en consultas contables, tesoreria, facturacion y reporting financiero',
  systemPrompt: `Eres SORI, el asistente financiero de Soriano Mediadores.

Tu objetivo es ayudar con todas las consultas financieras y contables:
- Consultas contables y de cuentas
- Gestion de tesoreria y flujos de caja
- Facturacion a clientes y proveedores
- Conciliacion bancaria
- Reporting financiero y presupuestario

AREAS DE RESPONSABILIDAD:

1. CONTABILIDAD:
   - Consulta de cuentas contables
   - Asientos y movimientos
   - Cierres mensuales y anuales
   - Balance y cuenta de resultados

2. TESORERIA:
   - Posicion de tesoreria diaria
   - Previsiones de cobros y pagos
   - Gestion de lineas de credito
   - Transferencias y pagos

3. FACTURACION:
   - Facturas emitidas y recibidas
   - Vencimientos de cobro
   - Facturas pendientes de pago
   - Rectificativas y abonos

4. CONCILIACION BANCARIA:
   - Estado de conciliaciones
   - Movimientos pendientes de cuadrar
   - Discrepancias detectadas

5. REPORTING:
   - Informes de cierre mensual
   - KPIs financieros
   - Presupuesto vs real
   - Analisis de desviaciones

REGLAS:
1. Toda informacion financiera es confidencial
2. Verifica permisos antes de dar datos sensibles
3. No autorices pagos sin verificacion dual
4. Mantén trazabilidad de todas las consultas
5. Escala a Direccion Financiera temas de mas de 50.000 EUR

NORMATIVA:
- Plan General Contable (PGC)
- Normativa fiscal vigente
- Politica de tesoreria interna
- Limites de autorizacion de pagos

TONO: Profesional, preciso, orientado a datos.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  tools: ['get_account', 'get_balance', 'get_invoice', 'create_payment', 'get_cash_flow', 'generate_document', 'send_email'],
  maxTurns: 20,
  timeout: 300000,
  databases: ['sm_global', 'sm_accounting', 'sf_finance', 'sm_documents', 'sm_communications'],
  permissions: ['read:account', 'read:balance', 'read:invoice', 'write:payment', 'read:cashflow', 'generate:report'],
  isActive: true,
};

export class FinanceAgent extends BaseAgent {
  constructor() {
    super(FINANCE_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('cuenta') || userContent.toLowerCase().includes('contable') || userContent.toLowerCase().includes('asiento')) {
      response = `Te ayudo con la consulta contable.

**Informacion de cuentas disponible:**

Para consultar una cuenta necesito:
- Codigo de cuenta (ej: 4300 - Clientes)
- Periodo de consulta (mes/ano)

**Cuentas mas consultadas:**
| Codigo | Descripcion |
|--------|-------------|
| 4300 | Clientes |
| 4000 | Proveedores |
| 5720 | Bancos |
| 6290 | Gastos generales |
| 7050 | Ingresos por servicios |

**Puedo ayudarte con:**
- Saldo de una cuenta
- Movimientos del periodo
- Mayor de una cuenta
- Asientos relacionados

¿Que cuenta quieres consultar y de que periodo?`;
    } else if (userContent.toLowerCase().includes('tesoreria') || userContent.toLowerCase().includes('caja') || userContent.toLowerCase().includes('liquidez')) {
      response = `Te muestro la situacion de tesoreria.

**Posicion de Tesoreria (Hoy):**

Para ver los datos actualizados necesito acceso al sistema.

**Informacion disponible:**
- Saldo disponible en cuentas
- Previsiones de cobro proximos 7/15/30 dias
- Previsiones de pago proximos 7/15/30 dias
- Lineas de credito disponibles

**Cuentas bancarias:**
- Cuenta operativa principal
- Cuenta de comisiones
- Cuenta de pagos a aseguradoras
- Linea de credito ICO

**Alertas de tesoreria:**
- Pagos urgentes pendientes
- Cobros vencidos no recibidos
- Posiciones por debajo del minimo

¿Que aspecto de la tesoreria necesitas consultar?`;
    } else if (userContent.toLowerCase().includes('factura') || userContent.toLowerCase().includes('cobro') || userContent.toLowerCase().includes('pago')) {
      response = `Te ayudo con la gestion de facturas.

**Consultas de facturacion:**

**Facturas emitidas (clientes):**
- Facturas pendientes de cobro
- Facturas vencidas
- Historico de facturacion
- Generar factura

**Facturas recibidas (proveedores):**
- Facturas pendientes de pago
- Vencimientos proximos
- Historico de pagos
- Registrar factura

**Para buscar una factura necesito:**
- Numero de factura, o
- NIF del cliente/proveedor, o
- Rango de fechas

**Resumen del mes actual:**
- Total facturado: (pendiente consulta)
- Cobros realizados: (pendiente consulta)
- Facturas pendientes: (pendiente consulta)

¿Que tipo de consulta necesitas?`;
    } else if (userContent.toLowerCase().includes('conciliacion') || userContent.toLowerCase().includes('banco') || userContent.toLowerCase().includes('cuadre')) {
      response = `Te informo sobre el estado de las conciliaciones bancarias.

**Conciliacion Bancaria:**

**Estado actual de conciliaciones:**
Para ver el estado actualizado necesito el acceso al sistema.

**Por cuenta:**
| Cuenta | Ultimo cierre | Estado |
|--------|--------------|--------|
| Principal | (fecha) | (estado) |
| Comisiones | (fecha) | (estado) |
| Operativa | (fecha) | (estado) |

**Posibles discrepancias:**
- Movimientos sin identificar
- Cobros pendientes de aplicar
- Pagos no conciliados
- Comisiones bancarias pendientes

**Proceso de conciliacion:**
1. Importar extracto bancario
2. Matching automatico
3. Revision manual de pendientes
4. Cierre de conciliacion

¿Que cuenta necesitas conciliar o revisar?`;
    } else if (userContent.toLowerCase().includes('informe') || userContent.toLowerCase().includes('report') || userContent.toLowerCase().includes('cierre')) {
      response = `Te ayudo con los informes financieros.

**Informes disponibles:**

**Informes mensuales:**
- Balance de situacion
- Cuenta de perdidas y ganancias
- Estado de tesoreria
- Informe de comisiones

**Informes de gestion:**
- Presupuesto vs Real
- Analisis de desviaciones
- KPIs financieros
- Dashboard ejecutivo

**Informes regulatorios:**
- Modelo 303 (IVA)
- Modelo 111 (Retenciones)
- Modelo 115 (Alquileres)
- Modelo 347 (Operaciones terceros)

**Para generar un informe:**
- Selecciona el tipo de informe
- Indica el periodo (mes/trimestre/ano)
- Formato de salida (PDF/Excel)

¿Que informe necesitas generar?`;
    } else {
      response = `Hola! Soy SORI, tu asistente financiero en Soriano Mediadores.

Puedo ayudarte con:
- **Contabilidad**: Consultas de cuentas, asientos, balances
- **Tesoreria**: Posicion de caja, previsiones, liquidez
- **Facturacion**: Facturas emitidas y recibidas, cobros y pagos
- **Conciliacion bancaria**: Estado de cuadres, movimientos pendientes
- **Reporting**: Informes de cierre, KPIs, presupuestos

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

  async getAccountBalance(accountCode: string, period?: string): Promise<unknown> {
    const accountTool = this.tools.get('get_account');
    if (!accountTool) throw new Error('Account tool not available');

    return accountTool.handler(
      { accountCode, period },
      this.instance?.context ?? {}
    );
  }

  async getCashFlowForecast(days: number = 30): Promise<unknown> {
    const cashFlowTool = this.tools.get('get_cash_flow');
    if (!cashFlowTool) throw new Error('Cash flow tool not available');

    return cashFlowTool.handler(
      { forecastDays: days },
      this.instance?.context ?? {}
    );
  }

  async createPaymentOrder(paymentData: Record<string, unknown>): Promise<unknown> {
    // 1. Validate payment
    if ((paymentData['amount'] as number) > 50000) {
      throw new Error('Pagos superiores a 50.000 EUR requieren aprobacion de Direccion Financiera');
    }

    // 2. Create payment
    const paymentTool = this.tools.get('create_payment');
    const payment = await paymentTool?.handler(
      paymentData,
      this.instance?.context ?? {}
    );

    // 3. Send notification
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      { to: 'finance@sorianoseguros.com', templateCode: 'PAYMENT_CREATED', templateData: payment },
      this.instance?.context ?? {}
    );

    return payment;
  }

  async generateFinancialReport(reportType: string, period: string): Promise<unknown> {
    const docTool = this.tools.get('generate_document');
    if (!docTool) throw new Error('Document generation tool not available');

    return docTool.handler(
      {
        templateCode: `FINANCE_${reportType.toUpperCase()}`,
        data: { period },
        format: 'PDF'
      },
      this.instance?.context ?? {}
    );
  }
}

export const financeAgent = new FinanceAgent();
