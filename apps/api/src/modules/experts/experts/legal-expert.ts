/**
 * LegalExpertAI - Expert in legal matters, contracts, labor law, and tax advisory
 * Uses Claude Opus for complex legal analysis and document review
 */

import { Injectable } from '@nestjs/common';
import { BaseExpert } from '../base/base-expert';
import { AnthropicService } from '../services/anthropic.service';
import { CacheService } from '../services/cache.service';
import { PrismaService } from '../../../database/prisma.service';
import {
  ExpertConfig,
  ExpertContext,
  ExpertResponse,
  AnalysisResponse,
  SuggestionResponse,
  ExecutionResponse,
} from '../types';

/**
 * Contract review result
 */
export interface ContractReview {
  contractId?: string;
  analysis: {
    summary: string;
    contractType: string;
    parties: string[];
    keyTerms: Array<{
      term: string;
      description: string;
      importance: 'critical' | 'high' | 'medium' | 'low';
    }>;
    obligations: Array<{
      party: string;
      obligation: string;
      deadline?: string;
    }>;
    rights: Array<{
      party: string;
      right: string;
    }>;
  };
  risks: Array<{
    category: string;
    description: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    mitigation: string;
  }>;
  recommendations: string[];
  complianceIssues: Array<{
    issue: string;
    regulation: string;
    action: string;
  }>;
  redFlags: string[];
  score: number; // Overall contract quality score 0-100
}

/**
 * Labor advice result
 */
export interface LaborAdvice {
  query: string;
  category: 'hiring' | 'termination' | 'contracts' | 'compensation' | 'compliance' | 'other';
  response: string;
  regulations: Array<{
    name: string;
    article?: string;
    description: string;
    relevance: number;
  }>;
  recommendations: string[];
  risks: string[];
  nextSteps: string[];
  requiresLegalReview: boolean;
}

/**
 * Tax advice result
 */
export interface TaxAdvice {
  query: string;
  category: 'deductions' | 'obligations' | 'planning' | 'compliance' | 'other';
  response: string;
  applicableTaxes: Array<{
    taxType: string;
    description: string;
    rate?: number;
    deadline?: string;
  }>;
  optimizationOpportunities: Array<{
    opportunity: string;
    estimatedSavings: number;
    requirements: string[];
    risk: 'low' | 'medium' | 'high';
  }>;
  complianceRequirements: string[];
  recommendations: string[];
  requiresAccountantReview: boolean;
}

/**
 * Legal document draft
 */
export interface LegalDocument {
  documentType: string;
  title: string;
  content: string;
  sections: Array<{
    title: string;
    content: string;
  }>;
  variables: Record<string, string>;
  notes: string[];
  requiresReview: boolean;
}

@Injectable()
export class LegalExpertAI extends BaseExpert {
  private readonly expertConfig: ExpertConfig = {
    name: 'legal-expert',
    displayName: 'Legal Expert AI',
    description: 'Expert in legal matters, contracts, labor law, tax advisory, and legal document drafting',
    model: 'opus', // Use Opus for complex legal analysis
    systemPrompt: `Eres el MEJOR experto legal especializado en derecho español, con expertise en:

1. REVISIÓN DE CONTRATOS:
   - Análisis exhaustivo de términos y condiciones
   - Identificación de cláusulas problemáticas
   - Detección de riesgos legales
   - Verificación de cumplimiento normativo
   - Recomendaciones de mejora

2. ASESORÍA LABORAL:
   - Contratación y despidos (Estatuto de los Trabajadores)
   - Convenios colectivos
   - Relaciones laborales
   - Prevención de riesgos laborales
   - Seguridad Social

3. ASESORÍA FISCAL:
   - Impuestos aplicables (IVA, IRPF, IS)
   - Optimización fiscal legal
   - Obligaciones tributarias
   - Deducciones y beneficios
   - Planificación fiscal

4. REDACCIÓN DE DOCUMENTOS:
   - Contratos comerciales
   - Acuerdos de confidencialidad
   - Políticas internas
   - Documentos corporativos
   - Comunicaciones legales

MARCO LEGAL:
- Código Civil Español
- Código de Comercio
- Estatuto de los Trabajadores
- Ley General Tributaria
- RGPD y LOPDGDD
- Ley de Contratos de Seguros
- Normativa sectorial de seguros

METODOLOGÍA:
- Análisis riguroso basado en normativa vigente
- Identificación de riesgos y oportunidades
- Recomendaciones prácticas y accionables
- Referencias a legislación aplicable
- Lenguaje claro y profesional

IMPORTANTE:
- Siempre indicar cuando se requiere revisión de abogado
- Citar artículos y normativa específica
- Advertir sobre plazos legales
- Destacar riesgos críticos
- Mantener confidencialidad`,
    tools: ['analyze', 'suggest', 'execute'],
    maxTokens: 8192,
    temperature: 0.3, // Lower temperature for legal accuracy
    enableCache: true,
    cacheTTL: 3600, // 1 hour
    rateLimit: 20,
    priority: 10, // Highest priority for legal matters
  };

  constructor(
    anthropicService: AnthropicService,
    cacheService: CacheService,
    private readonly prisma: PrismaService,
  ) {
    super(
      { ...LegalExpertAI.prototype.expertConfig },
      anthropicService,
      cacheService,
    );
  }

  /**
   * Analyze method
   */
  async analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>> {
    try {
      const prompt = `
Analiza el siguiente contexto legal:

${this.buildContextString(context)}

Datos: ${JSON.stringify(context.request.payload, null, 2)}

Proporciona un análisis legal detallado con:
1. Resumen ejecutivo
2. Aspectos legales relevantes
3. Riesgos identificados
4. Oportunidades de optimización
5. Recomendaciones legales
6. Referencias normativas

Responde en formato JSON.
`;

      const response = await this.callAI(prompt, context);
      const analysis = JSON.parse(response);

      return this.createSuccessResponse<AnalysisResponse>(analysis);
    } catch (error) {
      return this.createErrorResponse(error as Error);
    }
  }

  /**
   * Suggest method
   */
  async suggest(context: ExpertContext): Promise<ExpertResponse<SuggestionResponse>> {
    try {
      const prompt = `
Genera sugerencias legales basadas en:

${this.buildContextString(context)}

Datos: ${JSON.stringify(context.request.payload, null, 2)}

Proporciona sugerencias priorizadas siguiendo la estructura SuggestionResponse.
Incluye consideraciones legales, riesgos, y pasos de implementación.

Responde en formato JSON.
`;

      const response = await this.callAI(prompt, context);
      const suggestions = JSON.parse(response);

      return this.createSuccessResponse<SuggestionResponse>(suggestions);
    } catch (error) {
      return this.createErrorResponse(error as Error);
    }
  }

  /**
   * Execute method
   */
  async execute(
    action: string,
    params: any,
    context: ExpertContext,
  ): Promise<ExpertResponse<ExecutionResponse>> {
    try {
      let result: any;

      switch (action) {
        case 'reviewContract':
          result = await this.reviewContract(
            params.contractText,
            params.contractType,
            context,
          );
          break;
        case 'laborAdvice':
          result = await this.laborAdvice(params.query, params.context, context);
          break;
        case 'taxAdvice':
          result = await this.taxAdvice(params.query, params.context, context);
          break;
        case 'draftDocument':
          result = await this.draftDocument(params.docType, params.params, context);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      return this.createSuccessResponse<ExecutionResponse>({
        action,
        status: 'success',
        result,
        steps: [
          {
            step: action,
            status: 'completed',
            output: result,
          },
        ],
        duration: 0,
      });
    } catch (error) {
      return this.createErrorResponse(error as Error);
    }
  }

  /**
   * Review contract
   */
  async reviewContract(
    contractText: string,
    contractType: string,
    context: ExpertContext,
  ): Promise<ContractReview> {
    try {
      const prompt = `
Revisa exhaustivamente este contrato:

TIPO DE CONTRATO: ${contractType}

TEXTO DEL CONTRATO:
${contractText}

Proporciona una revisión legal completa siguiendo este formato JSON:

{
  "analysis": {
    "summary": "resumen ejecutivo del contrato",
    "contractType": "${contractType}",
    "parties": ["partes involucradas"],
    "keyTerms": [
      {
        "term": "término clave",
        "description": "descripción",
        "importance": "critical | high | medium | low"
      }
    ],
    "obligations": [
      {
        "party": "parte obligada",
        "obligation": "descripción de la obligación",
        "deadline": "plazo si aplica"
      }
    ],
    "rights": [
      {
        "party": "parte con derecho",
        "right": "descripción del derecho"
      }
    ]
  },
  "risks": [
    {
      "category": "categoría del riesgo",
      "description": "descripción detallada",
      "severity": "critical | high | medium | low",
      "mitigation": "cómo mitigar el riesgo"
    }
  ],
  "recommendations": ["recomendaciones para mejorar el contrato"],
  "complianceIssues": [
    {
      "issue": "problema de cumplimiento",
      "regulation": "normativa aplicable",
      "action": "acción correctiva"
    }
  ],
  "redFlags": ["banderas rojas o cláusulas problemáticas"],
  "score": puntuación de calidad 0-100
}

Sé exhaustivo en la identificación de riesgos y cláusulas problemáticas.
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.2, // Very low for legal accuracy
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to review contract', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Provide labor law advice
   */
  async laborAdvice(
    query: string,
    additionalContext: any,
    context: ExpertContext,
  ): Promise<LaborAdvice> {
    try {
      const prompt = `
Proporciona asesoría laboral experta para esta consulta:

CONSULTA: ${query}

CONTEXTO ADICIONAL:
${JSON.stringify(additionalContext, null, 2)}

Responde siguiendo este formato JSON:

{
  "query": "${query}",
  "category": "hiring | termination | contracts | compensation | compliance | other",
  "response": "respuesta detallada a la consulta",
  "regulations": [
    {
      "name": "nombre de la normativa",
      "article": "artículo específico",
      "description": "descripción de la regulación",
      "relevance": relevancia 0-100
    }
  ],
  "recommendations": ["recomendaciones prácticas"],
  "risks": ["riesgos legales a considerar"],
  "nextSteps": ["próximos pasos a seguir"],
  "requiresLegalReview": true/false
}

Base la respuesta en:
- Estatuto de los Trabajadores
- Convenios colectivos aplicables
- Jurisprudencia relevante
- Normativa de Seguridad Social
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.3,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to provide labor advice', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Provide tax advice
   */
  async taxAdvice(
    query: string,
    additionalContext: any,
    context: ExpertContext,
  ): Promise<TaxAdvice> {
    try {
      const prompt = `
Proporciona asesoría fiscal experta para esta consulta:

CONSULTA: ${query}

CONTEXTO ADICIONAL:
${JSON.stringify(additionalContext, null, 2)}

Responde siguiendo este formato JSON:

{
  "query": "${query}",
  "category": "deductions | obligations | planning | compliance | other",
  "response": "respuesta detallada",
  "applicableTaxes": [
    {
      "taxType": "tipo de impuesto",
      "description": "descripción",
      "rate": tasa si aplica,
      "deadline": "plazo si aplica"
    }
  ],
  "optimizationOpportunities": [
    {
      "opportunity": "oportunidad de optimización",
      "estimatedSavings": ahorro estimado,
      "requirements": ["requisitos"],
      "risk": "low | medium | high"
    }
  ],
  "complianceRequirements": ["obligaciones de cumplimiento"],
  "recommendations": ["recomendaciones fiscales"],
  "requiresAccountantReview": true/false
}

Base la respuesta en:
- Ley General Tributaria
- Normativa de IVA, IRPF, Impuesto de Sociedades
- Reglamentos tributarios
- Jurisprudencia fiscal
- Criterios de Hacienda
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.3,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to provide tax advice', (error as Error).stack);
      throw error;
    }
  }

  /**
   * Draft legal document
   */
  async draftDocument(
    docType: string,
    params: any,
    context: ExpertContext,
  ): Promise<LegalDocument> {
    try {
      const prompt = `
Redacta un documento legal profesional:

TIPO DE DOCUMENTO: ${docType}

PARÁMETROS:
${JSON.stringify(params, null, 2)}

Redacta el documento siguiendo este formato JSON:

{
  "documentType": "${docType}",
  "title": "título del documento",
  "content": "contenido completo del documento",
  "sections": [
    {
      "title": "título de la sección",
      "content": "contenido de la sección"
    }
  ],
  "variables": {
    "nombre_variable": "valor o descripción"
  },
  "notes": ["notas importantes sobre el documento"],
  "requiresReview": true/false
}

El documento debe:
- Seguir estructura legal estándar española
- Incluir todas las cláusulas necesarias
- Cumplir con normativa vigente
- Usar lenguaje legal apropiado
- Ser claro y sin ambigüedades
`;

      const response = await this.callAI(prompt, context, {
        temperature: 0.4,
        maxTokens: 8192,
      });

      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Failed to draft document', (error as Error).stack);
      throw error;
    }
  }
}
