/**
 * AIT-CORE AGENTS - Interfaces TypeScript
 * Sistema de agentes AI de dos capas
 */

// ====================================
// TYPES COMUNES
// ====================================

export interface AgentContext {
  userId: string;
  sessionId: string;
  requestId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    agentId: string;
    agentType: 'specialist' | 'executor';
    processingTime: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

// ====================================
// SPECIALIST AGENT INTERFACES
// ====================================

export interface AnalysisRequest {
  question: string;
  context: Record<string, any>;
  options?: {
    depth?: 'quick' | 'standard' | 'deep';
    format?: 'text' | 'structured' | 'detailed';
    includeReferences?: boolean;
  };
}

export interface AnalysisResult {
  summary: string;
  findings: Array<{
    title: string;
    description: string;
    importance: 'low' | 'medium' | 'high' | 'critical';
    data?: any;
  }>;
  insights: string[];
  risks?: Array<{
    description: string;
    severity: 'low' | 'medium' | 'high';
    mitigation?: string;
  }>;
  opportunities?: Array<{
    description: string;
    impact: 'low' | 'medium' | 'high';
    effort?: string;
  }>;
}

export interface RecommendationRequest {
  situation: string;
  context: Record<string, any>;
  constraints?: string[];
  objectives?: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  rationale: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'urgent';
  pros: string[];
  cons: string[];
  estimatedImpact?: {
    financial?: number;
    time?: string;
    risk?: 'low' | 'medium' | 'high';
  };
  nextSteps?: string[];
  alternatives?: Array<{
    title: string;
    description: string;
    tradeoffs: string;
  }>;
}

export interface SpecialistCapabilities {
  domain: string;
  expertise: string[];
  languages: string[];
  certifications?: string[];
  limitations?: string[];
}

/**
 * Interfaz base para todos los agentes ESPECIALISTAS
 */
export abstract class SpecialistAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: SpecialistCapabilities;

  /**
   * Analiza una situación y proporciona hallazgos
   */
  abstract analyze(
    request: AnalysisRequest,
    context: AgentContext
  ): Promise<AgentResponse<AnalysisResult>>;

  /**
   * Proporciona recomendaciones basadas en análisis
   */
  abstract recommend(
    request: RecommendationRequest,
    context: AgentContext
  ): Promise<AgentResponse<Recommendation[]>>;

  /**
   * Responde preguntas específicas del dominio
   */
  abstract answer(
    question: string,
    context: AgentContext
  ): Promise<AgentResponse<string>>;

  /**
   * Valida una propuesta desde la perspectiva del especialista
   */
  abstract validate(
    proposal: any,
    context: AgentContext
  ): Promise<AgentResponse<{
    isValid: boolean;
    issues: Array<{
      field: string;
      severity: 'warning' | 'error';
      message: string;
    }>;
    suggestions?: string[];
  }>>;

  /**
   * Obtiene las capacidades del agente
   */
  getCapabilities(): SpecialistCapabilities {
    return this.capabilities;
  }

  /**
   * Health check del agente
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      // Test básico de conectividad con Claude API
      await this.answer('test', {
        userId: 'system',
        sessionId: 'health-check',
        requestId: 'health-check',
        timestamp: new Date()
      });
      return { healthy: true, latency: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency: Date.now() - start };
    }
  }
}

// ====================================
// EXECUTOR AGENT INTERFACES
// ====================================

export interface ExecutionTask {
  taskType: string;
  description: string;
  params: Record<string, any>;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  deadline?: Date;
  dependencies?: string[];
}

export interface ExecutionResult {
  taskId: string;
  status: 'completed' | 'failed' | 'partial';
  output: any;
  actions: Array<{
    action: string;
    timestamp: Date;
    result: 'success' | 'failure';
    details?: any;
  }>;
  errors?: Array<{
    code: string;
    message: string;
    timestamp: Date;
  }>;
}

export interface DecisionRequest {
  situation: string;
  options: Array<{
    id: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedImpact?: any;
  }>;
  context: Record<string, any>;
  constraints?: string[];
  stakeholders?: string[];
}

export interface Decision {
  selectedOption: string;
  rationale: string;
  confidence: number; // 0-1
  specialistConsultations: Array<{
    specialistId: string;
    recommendation: string;
    weight: number;
  }>;
  risks: Array<{
    description: string;
    mitigation: string;
  }>;
  nextActions: string[];
}

export interface CoordinationRequest {
  goal: string;
  involvedAgents: string[];
  resources?: Record<string, any>;
  timeline?: {
    start: Date;
    end: Date;
  };
}

export interface CoordinationResult {
  plan: Array<{
    step: number;
    agentId: string;
    action: string;
    dependencies: number[];
    estimatedDuration: string;
  }>;
  risks: string[];
  criticalPath: number[];
}

export interface ExecutorCapabilities {
  role: string;
  responsibilities: string[];
  authorizedActions: string[];
  specialists: string[]; // IDs de especialistas que puede consultar
  decisionAuthority: {
    financial?: {
      maxAmount: number;
      requiresApproval: boolean;
    };
    operational?: {
      scope: string[];
      restrictions: string[];
    };
  };
}

/**
 * Interfaz base para todos los agentes EJECUTORES
 */
export abstract class ExecutorAgent {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly capabilities: ExecutorCapabilities;

  // Referencias a especialistas disponibles
  protected specialists: Map<string, SpecialistAgent> = new Map();

  /**
   * Ejecuta una tarea empresarial
   */
  abstract execute(
    task: ExecutionTask,
    context: AgentContext
  ): Promise<AgentResponse<ExecutionResult>>;

  /**
   * Toma una decisión basada en análisis de especialistas
   */
  abstract decide(
    request: DecisionRequest,
    context: AgentContext
  ): Promise<AgentResponse<Decision>>;

  /**
   * Coordina múltiples agentes para lograr un objetivo
   */
  abstract coordinate(
    request: CoordinationRequest,
    context: AgentContext
  ): Promise<AgentResponse<CoordinationResult>>;

  /**
   * Gestiona un proceso empresarial complejo
   */
  abstract manageProcess(
    processType: string,
    params: Record<string, any>,
    context: AgentContext
  ): Promise<AgentResponse<{
    processId: string;
    status: 'initiated' | 'in_progress' | 'completed' | 'failed';
    steps: Array<{
      name: string;
      status: string;
      completedAt?: Date;
    }>;
  }>>;

  /**
   * Consulta a un especialista
   */
  protected async consultSpecialist(
    specialistId: string,
    request: AnalysisRequest | RecommendationRequest,
    context: AgentContext
  ): Promise<any> {
    const specialist = this.specialists.get(specialistId);
    if (!specialist) {
      throw new Error(`Specialist ${specialistId} not found`);
    }

    if ('question' in request) {
      return await specialist.analyze(request, context);
    } else {
      return await specialist.recommend(request, context);
    }
  }

  /**
   * Registra un especialista disponible
   */
  registerSpecialist(specialist: SpecialistAgent): void {
    this.specialists.set(specialist.id, specialist);
  }

  /**
   * Obtiene las capacidades del agente
   */
  getCapabilities(): ExecutorCapabilities {
    return this.capabilities;
  }

  /**
   * Health check del agente
   */
  async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      // Verificar conectividad con todos los especialistas
      const specialistChecks = Array.from(this.specialists.values()).map(s =>
        s.healthCheck()
      );
      await Promise.all(specialistChecks);
      return { healthy: true, latency: Date.now() - start };
    } catch (error) {
      return { healthy: false, latency: Date.now() - start };
    }
  }
}

// ====================================
// AGENT REGISTRY
// ====================================

export interface AgentRegistryEntry {
  id: string;
  type: 'specialist' | 'executor';
  name: string;
  category: string;
  status: 'active' | 'inactive' | 'maintenance';
  version: string;
  endpoint: string;
}

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AgentRegistryEntry> = new Map();

  private constructor() {}

  static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  register(entry: AgentRegistryEntry): void {
    this.agents.set(entry.id, entry);
  }

  get(id: string): AgentRegistryEntry | undefined {
    return this.agents.get(id);
  }

  getAll(): AgentRegistryEntry[] {
    return Array.from(this.agents.values());
  }

  getByType(type: 'specialist' | 'executor'): AgentRegistryEntry[] {
    return this.getAll().filter(a => a.type === type);
  }

  getByCategory(category: string): AgentRegistryEntry[] {
    return this.getAll().filter(a => a.category === category);
  }
}

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Crea un contexto de agente desde una request HTTP
 */
export function createAgentContext(
  req: any,
  metadata?: Record<string, any>
): AgentContext {
  return {
    userId: req.user?.id || 'anonymous',
    sessionId: req.session?.id || 'no-session',
    requestId: req.id || generateRequestId(),
    timestamp: new Date(),
    metadata
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calcula la confianza agregada de múltiples recomendaciones
 */
export function aggregateConfidence(confidences: number[]): number {
  if (confidences.length === 0) return 0;
  const sum = confidences.reduce((a, b) => a + b, 0);
  return sum / confidences.length;
}

/**
 * Combina múltiples análisis de especialistas
 */
export function combineAnalyses(analyses: AnalysisResult[]): AnalysisResult {
  return {
    summary: analyses.map(a => a.summary).join('\n\n'),
    findings: analyses.flatMap(a => a.findings),
    insights: [...new Set(analyses.flatMap(a => a.insights))],
    risks: analyses.flatMap(a => a.risks || []),
    opportunities: analyses.flatMap(a => a.opportunities || [])
  };
}
