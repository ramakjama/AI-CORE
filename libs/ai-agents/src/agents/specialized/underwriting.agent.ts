// Underwriting Agent - Handles risk evaluation and policy subscription

import { BaseAgent } from '../base.agent';
import type { AgentDefinition, AgentMessage, AgentContext } from '../../types';
import { databaseTools } from '../../tools/database.tools';

const UNDERWRITING_AGENT_DEFINITION: AgentDefinition = {
  id: 'underwriting-agent-v1',
  type: 'UNDERWRITING_AGENT',
  name: 'Agente de Suscripcion SORI',
  description: 'Agente especializado en evaluacion de riesgos, cotizacion tecnica, aprobacion de polizas y analisis de siniestralidad',
  systemPrompt: `Eres SORI, el asistente de Suscripcion de Soriano Mediadores.

Tu objetivo es ayudar en todo el proceso de suscripcion de riesgos:
- Evaluacion y clasificacion de riesgos
- Cotizacion tecnica de primas
- Aprobacion o rechazo de polizas
- Analisis de siniestralidad
- Condiciones especiales y exclusiones

PROCESO DE SUSCRIPCION:

1. EVALUACION DEL RIESGO:
   - Recopilacion de datos del riesgo
   - Analisis de factores de riesgo
   - Scoring automatico
   - Clasificacion del riesgo (A/B/C/D)

2. COTIZACION TECNICA:
   - Calculo de prima pura
   - Recargos tecnicos
   - Gastos de gestion
   - Prima comercial final
   - Comparativa con mercado

3. DECISION DE SUSCRIPCION:
   | Nivel | Autoridad | Limite |
   |-------|-----------|--------|
   | Automatico | Sistema | Prima < 1.000 EUR, Score A |
   | Basico | Suscriptor Jr | Prima < 5.000 EUR |
   | Medio | Suscriptor Sr | Prima < 25.000 EUR |
   | Alto | Jefe Suscripcion | Prima < 100.000 EUR |
   | Especial | Comite | Prima > 100.000 EUR |

4. ANALISIS DE SINIESTRALIDAD:
   - Loss ratio por producto
   - Siniestralidad individual vs cartera
   - Tendencias y proyecciones
   - Alertas de desviacion

CRITERIOS POR RAMO:

**AUTO:**
- Edad conductor, antiguedad carnet
- Tipo vehiculo, potencia
- Uso, kilometraje anual
- Zona de circulacion
- Historial de siniestros

**HOGAR:**
- Tipo de vivienda, m2
- Ano construccion
- Zona geografica
- Medidas de seguridad
- Valor continente/contenido

**VIDA:**
- Edad, sexo
- Estado de salud
- Profesion
- Habitos (tabaco, etc.)
- Capital solicitado

**EMPRESAS:**
- Sector actividad (CNAE)
- Facturacion, empleados
- Ubicacion
- Siniestralidad historica
- Medidas prevencion

REGLAS DE SUSCRIPCION:
1. Todo riesgo debe ser evaluado antes de cotizar
2. Riesgos con score D requieren aprobacion especial
3. Exclusiones deben estar claramente documentadas
4. Condiciones especiales requieren justificacion
5. La siniestralidad > 70% activa revision obligatoria

EXCLUSIONES AUTOMATICAS:
- Riesgos en zonas inundables (sin informe)
- Vehiculos > 15 anos sin inspeccion
- Actividades de alto riesgo sin protocolo
- Clientes en lista de morosidad

TONO: Tecnico, analitico, riguroso pero accesible.`,
  model: 'claude-3-5-sonnet-20241022',
  temperature: 0.3,
  tools: ['get_risk_profile', 'calculate_premium', 'get_loss_ratio', 'approve_policy', 'get_policy', 'search_parties', 'generate_document', 'send_email', 'start_workflow'],
  maxTurns: 25,
  timeout: 300000,
  databases: ['sm_global', 'ss_insurance', 'sm_products', 'sm_underwriting', 'sm_documents', 'sm_workflows'],
  permissions: ['read:risk', 'write:risk', 'read:policy', 'write:policy', 'read:premium', 'write:premium', 'approve:policy', 'generate:report'],
  isActive: true,
};

export class UnderwritingAgent extends BaseAgent {
  constructor() {
    super(UNDERWRITING_AGENT_DEFINITION);
    const toolNames = new Set(this.definition.tools);
    this.registerTools(databaseTools.filter(t => toolNames.has(t.name)));
  }

  protected async think(): Promise<AgentMessage> {
    const lastUserMessage = [...this.messages].reverse().find(m => m.role === 'user');
    const userContent = lastUserMessage?.content ?? '';

    let response: string;

    if (userContent.toLowerCase().includes('evaluar') || userContent.toLowerCase().includes('riesgo') || userContent.toLowerCase().includes('scoring')) {
      response = `Te ayudo con la evaluacion del riesgo.

**Proceso de Evaluacion:**

Para evaluar un riesgo necesito:

**1. Datos del solicitante:**
- NIF/CIF
- Nombre/Razon social
- Historial con la correduria

**2. Datos del riesgo:**
Segun el ramo:

*Auto*: Matricula, conductor, uso
*Hogar*: Direccion, tipo vivienda, m2
*Vida*: Edad, profesion, capital
*Empresas*: CNAE, facturacion, empleados

**Clasificacion de riesgos:**
| Score | Categoria | Decision |
|-------|-----------|----------|
| 80-100 | A - Excelente | Aprobacion automatica |
| 60-79 | B - Bueno | Aprobacion estandar |
| 40-59 | C - Aceptable | Revision requerida |
| 0-39 | D - Alto riesgo | Escalado obligatorio |

**Factores que penalizan:**
- Siniestralidad historica alta
- Zona de riesgo elevado
- Falta de medidas de prevencion
- Historial de impago

Proporciona los datos del riesgo y realizo la evaluacion.`;
    } else if (userContent.toLowerCase().includes('cotizar') || userContent.toLowerCase().includes('prima') || userContent.toLowerCase().includes('precio')) {
      response = `Te ayudo con la cotizacion tecnica.

**Estructura de la prima:**

| Componente | Descripcion |
|------------|-------------|
| Prima pura | Coste esperado del riesgo |
| Recargo seguridad | Margen de fluctuacion |
| Gastos admin | Costes de gestion |
| Gastos adquisicion | Comisiones |
| Beneficio | Margen tecnico |
| Consorcio | Recargos obligatorios |
| Impuestos | IPS (6-8% segun ramo) |

**Para generar cotizacion necesito:**

1. Datos del riesgo evaluado
2. Coberturas solicitadas
3. Capitales/limites
4. Franquicias deseadas
5. Compania(s) objetivo

**Modalidades de cotizacion:**
- **Rapida**: Tarifa estandar, sin ajustes
- **Personalizada**: Ajuste por historial y perfil
- **Competitiva**: Multitarifa para comparar

**Descuentos aplicables:**
- Bonificacion por no siniestralidad
- Agrupacion de polizas
- Antiguedad como cliente
- Pago anual

Dame los datos y preparo la cotizacion tecnica.`;
    } else if (userContent.toLowerCase().includes('siniestralidad') || userContent.toLowerCase().includes('loss ratio') || userContent.toLowerCase().includes('ratio')) {
      response = `Te informo sobre el analisis de siniestralidad.

**KPIs de Siniestralidad:**

| Metrica | Formula | Objetivo |
|---------|---------|----------|
| Loss Ratio | Siniestros / Primas | < 65% |
| Combined Ratio | (Siniestros + Gastos) / Primas | < 95% |
| Frecuencia | Nº siniestros / Polizas | Variable |
| Coste medio | Coste total / Nº siniestros | Variable |

**Analisis disponibles:**

**Por dimensiones:**
- Por producto/ramo
- Por compania
- Por zona geografica
- Por canal de distribucion
- Por antiguedad de poliza

**Por cliente:**
- Historial de siniestros
- Siniestralidad vs prima
- Proyeccion a vencimiento
- Comparativa con cartera

**Alertas activas:**
- Siniestralidad > 70%: Revision a vencimiento
- Siniestralidad > 100%: No renovacion recomendada
- 3+ siniestros/ano: Estudio detallado

**Para consultar siniestralidad indicame:**
- Numero de poliza o cliente, o
- Producto/ramo, o
- Periodo de analisis

Te genero el informe correspondiente.`;
    } else if (userContent.toLowerCase().includes('aprobar') || userContent.toLowerCase().includes('rechazar') || userContent.toLowerCase().includes('decision')) {
      response = `Te ayudo con la decision de suscripcion.

**Estado del riesgo pendiente:**

Para tomar una decision necesito el expediente o referencia del riesgo.

**Criterios de decision:**

**Aprobacion automatica si:**
- Score A (80-100)
- Prima < 1.000 EUR
- Sin exclusiones aplicables
- Cliente sin incidencias

**Requiere revision si:**
- Score B o C
- Prima > 1.000 EUR
- Clausulas especiales solicitadas
- Historial de siniestralidad > 50%

**Escalado obligatorio si:**
- Score D
- Prima > nivel de autoridad
- Exclusiones parciales
- Cliente con incidencias

**Documentacion de decision:**
Toda decision debe incluir:
- Justificacion tecnica
- Condiciones aplicadas
- Exclusiones si procede
- Firma del suscriptor autorizado

**Tipos de decision:**
1. **Aceptacion total**: Riesgo aprobado
2. **Aceptacion con condiciones**: Exclusiones/sobreprimas
3. **Rechazo**: No asegurable

Dame la referencia del expediente para revisar y decidir.`;
    } else if (userContent.toLowerCase().includes('condiciones') || userContent.toLowerCase().includes('exclusiones') || userContent.toLowerCase().includes('especiales')) {
      response = `Te informo sobre condiciones y exclusiones.

**Tipos de condiciones:**

**1. Condiciones Generales:**
- Aplican a todos los contratos del ramo
- Definidas por la compania
- No modificables

**2. Condiciones Particulares:**
- Especificas del riesgo
- Capitales, franquicias, coberturas
- Personalizables segun tarifa

**3. Condiciones Especiales:**
- Modificaciones puntuales
- Requieren aprobacion
- Clausulas adicionales

**Exclusiones habituales:**

| Ramo | Exclusiones tipicas |
|------|---------------------|
| Auto | Conduccion sin carnet, competicion |
| Hogar | Falta mantenimiento, guerra |
| Vida | Suicidio 1er ano, deportes riesgo |
| RC | Danos propios, multas |

**Clausulas especiales frecuentes:**
- Ampliacion de limite
- Reduccion de franquicia
- Inclusion de actividad especifica
- Renuncia a subrogacion
- Designacion de beneficiario

**Para aplicar condiciones especiales:**
1. Identificar la necesidad
2. Justificar tecnicamente
3. Calcular impacto en prima
4. Obtener aprobacion segun nivel
5. Documentar en poliza

¿Que condiciones necesitas consultar o aplicar?`;
    } else {
      response = `Hola! Soy SORI, tu asistente de Suscripcion en Soriano Mediadores.

Puedo ayudarte con:
- **Evaluacion de riesgos**: Scoring y clasificacion
- **Cotizacion tecnica**: Calculo de primas
- **Siniestralidad**: Analisis de loss ratio
- **Decisiones**: Aprobacion/rechazo de polizas
- **Condiciones especiales**: Exclusiones y clausulas

**Niveles de autoridad:**
| Nivel | Limite de prima |
|-------|-----------------|
| Automatico | < 1.000 EUR (Score A) |
| Suscriptor Jr | < 5.000 EUR |
| Suscriptor Sr | < 25.000 EUR |
| Jefe Suscripcion | < 100.000 EUR |
| Comite | > 100.000 EUR |

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

  async getRiskProfile(riskData: Record<string, unknown>): Promise<{ score: number; category: string; factors: string[] }> {
    const riskTool = this.tools.get('get_risk_profile');
    if (!riskTool) throw new Error('Risk profile tool not available');

    return riskTool.handler(
      riskData,
      this.instance?.context ?? {}
    ) as Promise<{ score: number; category: string; factors: string[] }>;
  }

  async calculatePremium(riskId: string, coverages: string[], options?: Record<string, unknown>): Promise<unknown> {
    const premiumTool = this.tools.get('calculate_premium');
    if (!premiumTool) throw new Error('Premium calculation tool not available');

    return premiumTool.handler(
      { riskId, coverages, ...options },
      this.instance?.context ?? {}
    );
  }

  async getLossRatio(params: { policyNumber?: string; product?: string; period?: string }): Promise<unknown> {
    const lossRatioTool = this.tools.get('get_loss_ratio');
    if (!lossRatioTool) throw new Error('Loss ratio tool not available');

    return lossRatioTool.handler(
      params,
      this.instance?.context ?? {}
    );
  }

  async approvePolicy(
    policyRef: string,
    decision: 'APPROVE' | 'APPROVE_WITH_CONDITIONS' | 'REJECT',
    conditions?: Record<string, unknown>
  ): Promise<unknown> {
    // 1. Get current authority level
    const authorityLevel = this.instance?.context?.authorityLevel ?? 'BASIC';

    // 2. Validate authority for the decision
    const policyTool = this.tools.get('get_policy');
    const policy = await policyTool?.handler({ policyRef }, this.instance?.context ?? {});

    // 3. Log the decision
    const approveTool = this.tools.get('approve_policy');
    const result = await approveTool?.handler(
      {
        policyRef,
        decision,
        conditions,
        authorityLevel,
        justification: conditions?.['justification'] ?? 'Decision de suscripcion'
      },
      this.instance?.context ?? {}
    );

    // 4. Start appropriate workflow
    const workflowTool = this.tools.get('start_workflow');
    await workflowTool?.handler(
      {
        workflowCode: decision === 'REJECT' ? 'POLICY_REJECTED' : 'POLICY_APPROVED',
        title: `Decision suscripcion ${policyRef}`,
        entityType: 'policy',
        entityId: policyRef,
        variables: { decision, conditions, policy }
      },
      this.instance?.context ?? {}
    );

    // 5. Notify relevant parties
    const emailTool = this.tools.get('send_email');
    await emailTool?.handler(
      {
        to: 'comercial@sorianoseguros.com',
        templateCode: `UNDERWRITING_${decision}`,
        templateData: { policyRef, decision, conditions }
      },
      this.instance?.context ?? {}
    );

    return result;
  }

  async evaluateRenewal(policyNumber: string): Promise<{
    recommendation: 'RENEW' | 'RENEW_WITH_ADJUSTMENT' | 'CANCEL';
    lossRatio: number;
    adjustmentSuggested?: number;
    reasons: string[];
  }> {
    // Get loss ratio
    const lossRatio = await this.getLossRatio({ policyNumber });
    const ratio = (lossRatio as { ratio?: number })?.ratio ?? 0;

    let recommendation: 'RENEW' | 'RENEW_WITH_ADJUSTMENT' | 'CANCEL';
    let adjustmentSuggested: number | undefined;
    const reasons: string[] = [];

    if (ratio < 50) {
      recommendation = 'RENEW';
      reasons.push('Siniestralidad favorable');
    } else if (ratio < 80) {
      recommendation = 'RENEW_WITH_ADJUSTMENT';
      adjustmentSuggested = Math.round((ratio - 50) * 0.5);
      reasons.push(`Siniestralidad moderada (${ratio}%)`);
      reasons.push(`Ajuste sugerido: +${adjustmentSuggested}%`);
    } else {
      recommendation = 'CANCEL';
      reasons.push(`Siniestralidad elevada (${ratio}%)`);
      reasons.push('Recomendada no renovacion');
    }

    return {
      recommendation,
      lossRatio: ratio,
      adjustmentSuggested,
      reasons
    };
  }
}

export const underwritingAgent = new UnderwritingAgent();
