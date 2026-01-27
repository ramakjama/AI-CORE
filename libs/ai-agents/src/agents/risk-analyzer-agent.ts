import { LLMService } from '@ai-core/ai-llm';

export interface RiskAnalyzerTask {
  type: 'assess_risk' | 'predict_claims' | 'fraud_detection' | 'portfolio_analysis';
  clientId?: string;
  policyId?: string;
  data?: any;
  context?: any;
}

export class RiskAnalyzerAgent {
  private llm: LLMService;
  private agentId = 'risk-analyzer-agent';

  constructor() {
    this.llm = new LLMService();
  }

  async execute(task: RiskAnalyzerTask): Promise<any> {
    console.log(`[RiskAnalyzerAgent] Executing task: ${task.type}`);

    switch (task.type) {
      case 'assess_risk':
        return this.assessRisk(task);
      case 'predict_claims':
        return this.predictClaims(task);
      case 'fraud_detection':
        return this.detectFraud(task);
      case 'portfolio_analysis':
        return this.analyzePortfolio(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async assessRisk(task: RiskAnalyzerTask) {
    const prompt = `
Evalúa el riesgo del siguiente cliente/póliza.

Cliente ID: ${task.clientId}
Póliza ID: ${task.policyId}
Datos: ${JSON.stringify(task.data, null, 2)}

Analiza:
1. Perfil de riesgo (Bajo/Medio/Alto/Muy Alto)
2. Score de riesgo (0-100)
3. Factores de riesgo identificados
4. Probabilidad de siniestro (%)
5. Prima recomendada
6. Medidas de mitigación
7. Restricciones o exclusiones sugeridas

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un actuario experto en evaluación de riesgos de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'assess_risk',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async predictClaims(task: RiskAnalyzerTask) {
    const prompt = `
Predice la probabilidad y severidad de futuros siniestros.

Datos históricos: ${JSON.stringify(task.data, null, 2)}
Contexto: ${JSON.stringify(task.context, null, 2)}

Proporciona:
1. Probabilidad de siniestro próximos 12 meses (%)
2. Severidad esperada (Baja/Media/Alta)
3. Costo estimado de siniestros
4. Tendencias identificadas
5. Factores de riesgo emergentes
6. Recomendaciones preventivas

Responde en formato JSON con análisis detallado.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un analista predictivo especializado en siniestros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'predict_claims',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async detectFraud(task: RiskAnalyzerTask) {
    const prompt = `
Analiza posibles indicadores de fraude.

Datos del caso: ${JSON.stringify(task.data, null, 2)}
Contexto: ${JSON.stringify(task.context, null, 2)}

Evalúa:
1. Score de fraude (0-100)
2. Indicadores de alerta (red flags)
3. Patrones sospechosos
4. Comparación con casos similares
5. Nivel de urgencia de investigación
6. Acciones recomendadas
7. Evidencia a recopilar

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un investigador forense especializado en fraude de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'fraud_detection',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async analyzePortfolio(task: RiskAnalyzerTask) {
    const prompt = `
Analiza el portafolio de pólizas y riesgos.

Datos del portafolio: ${JSON.stringify(task.data, null, 2)}

Proporciona:
1. Distribución de riesgos por categoría
2. Concentración de riesgos
3. Exposición total
4. Ratio siniestralidad
5. Rentabilidad por segmento
6. Riesgos emergentes
7. Oportunidades de optimización
8. Recomendaciones estratégicas

Responde en formato JSON con análisis completo.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un analista de portafolios de seguros con visión estratégica.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'portfolio_analysis',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private parseResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return { raw: response };
    } catch (error) {
      return { raw: response };
    }
  }
}
