import { LLMService } from '@ai-core/ai-llm';

export interface DocumentProcessorTask {
  type: 'extract_data' | 'classify' | 'validate' | 'summarize' | 'detect_fraud';
  documentUrl?: string;
  documentText?: string;
  documentType?: string;
  context?: any;
}

export class DocumentProcessorAgent {
  private llm: LLMService;
  private agentId = 'document-processor-agent';

  constructor() {
    this.llm = new LLMService();
  }

  async execute(task: DocumentProcessorTask): Promise<any> {
    console.log(`[DocumentProcessorAgent] Executing task: ${task.type}`);

    switch (task.type) {
      case 'extract_data':
        return this.extractData(task);
      case 'classify':
        return this.classifyDocument(task);
      case 'validate':
        return this.validateDocument(task);
      case 'summarize':
        return this.summarizeDocument(task);
      case 'detect_fraud':
        return this.detectFraud(task);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async extractData(task: DocumentProcessorTask) {
    const prompt = `
Extrae información estructurada del siguiente documento.

Tipo de documento: ${task.documentType || 'Desconocido'}
Contenido: ${task.documentText}

Extrae:
1. Datos personales (nombre, DNI, dirección, etc.)
2. Datos de póliza (número, tipo, vigencia, prima)
3. Fechas relevantes
4. Importes y montos
5. Firmas y autorizaciones

Responde en formato JSON estructurado.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un experto en extracción de datos de documentos de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'extract_data',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async classifyDocument(task: DocumentProcessorTask) {
    const prompt = `
Clasifica el siguiente documento.

Contenido: ${task.documentText}

Determina:
1. Tipo de documento (Póliza, Siniestro, Factura, Contrato, etc.)
2. Categoría (Auto, Hogar, Vida, Salud, etc.)
3. Nivel de confianza (0-100)
4. Idioma
5. Formato (PDF, Word, Imagen, etc.)
6. Requiere procesamiento adicional (Sí/No)

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un clasificador experto de documentos de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'classify',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async validateDocument(task: DocumentProcessorTask) {
    const prompt = `
Valida la integridad y completitud del siguiente documento.

Tipo: ${task.documentType}
Contenido: ${task.documentText}

Verifica:
1. Campos obligatorios presentes
2. Formato correcto de datos
3. Coherencia de información
4. Firmas y autorizaciones
5. Fechas válidas
6. Errores o inconsistencias

Proporciona:
- isValid: boolean
- errors: array de errores encontrados
- warnings: array de advertencias
- completeness: porcentaje de completitud (0-100)

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un validador experto de documentos legales y de seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'validate',
      result: this.parseResponse(response),
      timestamp: new Date().toISOString()
    };
  }

  private async summarizeDocument(task: DocumentProcessorTask) {
    const prompt = `
Genera un resumen ejecutivo del siguiente documento.

Tipo: ${task.documentType}
Contenido: ${task.documentText}

El resumen debe incluir:
1. Puntos clave (3-5 bullets)
2. Partes involucradas
3. Importes principales
4. Fechas importantes
5. Acciones requeridas
6. Nivel de urgencia

Máximo 200 palabras, claro y conciso.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un experto en síntesis de documentos complejos.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'summarize',
      result: response,
      timestamp: new Date().toISOString()
    };
  }

  private async detectFraud(task: DocumentProcessorTask) {
    const prompt = `
Analiza el documento en busca de posibles indicadores de fraude.

Tipo: ${task.documentType}
Contenido: ${task.documentText}
Contexto: ${JSON.stringify(task.context, null, 2)}

Busca:
1. Inconsistencias en datos
2. Patrones sospechosos
3. Información contradictoria
4. Firmas o sellos irregulares
5. Fechas anómalas
6. Importes inusuales

Proporciona:
- riskScore: 0-100 (0=sin riesgo, 100=alto riesgo)
- indicators: array de indicadores encontrados
- recommendation: acción recomendada
- requiresInvestigation: boolean

Responde en formato JSON.
`;

    const response = await this.llm.chat([
      { role: 'system', content: 'Eres un analista forense especializado en detección de fraude en seguros.' },
      { role: 'user', content: prompt }
    ]);

    return {
      agentId: this.agentId,
      task: 'detect_fraud',
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
