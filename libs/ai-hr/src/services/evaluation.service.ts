/**
 * Evaluation Service - Performance evaluations, goals and competency assessments
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Evaluation,
  EvaluationStatus,
  Goal,
  Competency,
  CompetencyScore,
  PeerReview,
  DevelopmentAction,
  Feedback360Summary,
  PerformanceScoreResult,
  Employee,
  OperationResult
} from '../types';

/**
 * Evaluation creation data
 */
export interface CreateEvaluationData {
  employeeId: string;
  evaluatorId: string;
  periodStart: Date;
  periodEnd: Date;
  type?: 'ANNUAL' | 'SEMESTRAL' | 'QUARTERLY' | 'PROBATION' | 'PROJECT';
  is360?: boolean;
}

/**
 * Goal data
 */
export interface GoalData {
  title: string;
  description: string;
  category: 'BUSINESS' | 'DEVELOPMENT' | 'TEAM' | 'PERSONAL';
  weight: number;
  targetValue?: number;
  unit?: string;
  dueDate: Date;
}

/**
 * Competency score data
 */
export interface CompetencyScoreData {
  competencyId: string;
  currentLevel: number;
  comments?: string;
  evidences?: string[];
}

/**
 * Peer review request data
 */
export interface PeerReviewRequestData {
  reviewerId: string;
  relationship: 'PEER' | 'SUBORDINATE' | 'SUPERVISOR' | 'EXTERNAL';
  isAnonymous?: boolean;
}

/**
 * Evaluation Service implementation
 */
export class EvaluationService {
  private evaluations: Map<string, Evaluation> = new Map();
  private competencies: Map<string, Competency> = new Map();
  private employees: Map<string, Employee> = new Map();
  private _peerReviewRequests: Map<string, PeerReviewRequestData[]> = new Map();

  constructor() {
    // Initialize with default competencies
    this.initializeDefaultCompetencies();
  }

  getPeerReviewRequests(): Map<string, PeerReviewRequestData[]> {
    return this._peerReviewRequests;
  }

  /**
   * Create a new performance evaluation
   */
  async createEvaluation(data: CreateEvaluationData): Promise<OperationResult<Evaluation>> {
    try {
      const employee = this.employees.get(data.employeeId);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      const evaluator = this.employees.get(data.evaluatorId);
      if (!evaluator) {
        return {
          success: false,
          error: 'Evaluador no encontrado',
          code: 'EVALUATOR_NOT_FOUND'
        };
      }

      // Check for existing evaluation in the same period
      const existingEval = Array.from(this.evaluations.values()).find(e =>
        e.employeeId === data.employeeId &&
        e.periodStart.getTime() === data.periodStart.getTime() &&
        e.periodEnd.getTime() === data.periodEnd.getTime() &&
        e.status !== EvaluationStatus.CANCELLED
      );

      if (existingEval) {
        return {
          success: false,
          error: 'Ya existe una evaluación para este período',
          code: 'EVALUATION_EXISTS'
        };
      }

      // Get required competencies for the position
      const positionCompetencies = this.getPositionCompetencies(employee.positionId);

      const evaluation: Evaluation = {
        id: uuidv4(),
        employeeId: data.employeeId,
        evaluatorId: data.evaluatorId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        type: data.type || 'ANNUAL',
        goals: [],
        competencies: positionCompetencies.map(c => ({
          competencyId: c.id,
          competencyName: c.name,
          expectedLevel: 3, // Default expected level
          currentLevel: 0,
          score: 0
        })),
        status: EvaluationStatus.DRAFT,
        createdAt: new Date(),
        is360: data.is360 || false
      };

      this.evaluations.set(evaluation.id, evaluation);

      return {
        success: true,
        data: evaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear evaluación: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CREATE_ERROR'
      };
    }
  }

  /**
   * Set goals for an evaluation
   */
  async setGoals(evaluationId: string, goalsData: GoalData[]): Promise<OperationResult<Evaluation>> {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      if (!evaluation) {
        return {
          success: false,
          error: 'Evaluación no encontrada',
          code: 'EVALUATION_NOT_FOUND'
        };
      }

      if (evaluation.status !== EvaluationStatus.DRAFT && evaluation.status !== EvaluationStatus.IN_PROGRESS) {
        return {
          success: false,
          error: 'No se pueden modificar los objetivos en este estado',
          code: 'INVALID_STATUS'
        };
      }

      // Validate total weight equals 100%
      const totalWeight = goalsData.reduce((sum, g) => sum + g.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        return {
          success: false,
          error: 'Los pesos de los objetivos deben sumar 100%',
          code: 'INVALID_WEIGHTS'
        };
      }

      const goals: Goal[] = goalsData.map(g => ({
        id: uuidv4(),
        title: g.title,
        description: g.description,
        category: g.category,
        weight: g.weight,
        targetValue: g.targetValue,
        unit: g.unit,
        dueDate: g.dueDate,
        status: 'NOT_STARTED',
        completionPercentage: 0
      }));

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        goals,
        status: EvaluationStatus.IN_PROGRESS
      };

      this.evaluations.set(evaluationId, updatedEvaluation);

      return {
        success: true,
        data: updatedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al establecer objetivos: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SET_GOALS_ERROR'
      };
    }
  }

  /**
   * Evaluate competencies for an evaluation
   */
  async evaluateCompetencies(
    evaluationId: string,
    scores: CompetencyScoreData[]
  ): Promise<OperationResult<Evaluation>> {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      if (!evaluation) {
        return {
          success: false,
          error: 'Evaluación no encontrada',
          code: 'EVALUATION_NOT_FOUND'
        };
      }

      if (evaluation.status !== EvaluationStatus.IN_PROGRESS) {
        return {
          success: false,
          error: 'La evaluación debe estar en progreso para evaluar competencias',
          code: 'INVALID_STATUS'
        };
      }

      // Update competency scores
      const updatedCompetencies = evaluation.competencies.map(comp => {
        const scoreData = scores.find(s => s.competencyId === comp.competencyId);
        if (scoreData) {
          // Score is based on gap between current and expected level
          const score = this.calculateCompetencyScore(comp.expectedLevel, scoreData.currentLevel);
          return {
            ...comp,
            currentLevel: scoreData.currentLevel,
            score,
            comments: scoreData.comments,
            evidences: scoreData.evidences
          };
        }
        return comp;
      });

      // Calculate average competency score
      const competencyScore = updatedCompetencies.length > 0
        ? updatedCompetencies.reduce((sum, c) => sum + c.score, 0) / updatedCompetencies.length
        : 0;

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        competencies: updatedCompetencies,
        competencyScore: Math.round(competencyScore * 100) / 100
      };

      this.evaluations.set(evaluationId, updatedEvaluation);

      return {
        success: true,
        data: updatedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al evaluar competencias: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'EVALUATE_ERROR'
      };
    }
  }

  /**
   * Submit evaluation for review
   */
  async submitEvaluation(evaluationId: string): Promise<OperationResult<Evaluation>> {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      if (!evaluation) {
        return {
          success: false,
          error: 'Evaluación no encontrada',
          code: 'EVALUATION_NOT_FOUND'
        };
      }

      if (evaluation.status !== EvaluationStatus.IN_PROGRESS) {
        return {
          success: false,
          error: 'Solo se pueden enviar evaluaciones en progreso',
          code: 'INVALID_STATUS'
        };
      }

      // Validate goals are evaluated
      const evaluatedGoals = evaluation.goals.filter(g => g.score !== undefined);
      if (evaluatedGoals.length !== evaluation.goals.length) {
        return {
          success: false,
          error: 'Todos los objetivos deben ser evaluados antes de enviar',
          code: 'INCOMPLETE_GOALS'
        };
      }

      // Validate competencies are evaluated
      const evaluatedComps = evaluation.competencies.filter(c => c.currentLevel > 0);
      if (evaluatedComps.length !== evaluation.competencies.length) {
        return {
          success: false,
          error: 'Todas las competencias deben ser evaluadas antes de enviar',
          code: 'INCOMPLETE_COMPETENCIES'
        };
      }

      // Calculate goal score
      const goalScore = evaluation.goals.reduce((sum, g) => {
        return sum + ((g.score || 0) * g.weight / 100);
      }, 0);

      // Calculate overall score (typically 60% goals, 40% competencies)
      const overallScore = (goalScore * 0.6) + ((evaluation.competencyScore || 0) * 0.4);

      // Determine rating
      const rating = this.determineRating(overallScore);

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        goalScore: Math.round(goalScore * 100) / 100,
        overallScore: Math.round(overallScore * 100) / 100,
        rating,
        status: EvaluationStatus.PENDING_REVIEW,
        submittedAt: new Date()
      };

      this.evaluations.set(evaluationId, updatedEvaluation);

      return {
        success: true,
        data: updatedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al enviar evaluación: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SUBMIT_ERROR'
      };
    }
  }

  /**
   * Get all evaluations for an employee
   */
  async getEmployeeEvaluations(employeeId: string): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values())
      .filter(e => e.employeeId === employeeId)
      .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime());
  }

  /**
   * Get 360 feedback summary for an employee
   */
  async get360Feedback(employeeId: string): Promise<OperationResult<Feedback360Summary>> {
    try {
      // Find the latest 360 evaluation
      const evaluation = Array.from(this.evaluations.values())
        .filter(e =>
          e.employeeId === employeeId &&
          e.is360 &&
          e.status === EvaluationStatus.COMPLETED
        )
        .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];

      if (!evaluation) {
        return {
          success: false,
          error: 'No se encontró evaluación 360 completada',
          code: 'NO_360_FOUND'
        };
      }

      // Aggregate peer reviews by relationship
      const supervisorReviews = evaluation.peerReviews?.filter(r => r.reviewerRelationship === 'SUPERVISOR') || [];
      const peerReviews = evaluation.peerReviews?.filter(r => r.reviewerRelationship === 'PEER') || [];
      const subordinateReviews = evaluation.peerReviews?.filter(r => r.reviewerRelationship === 'SUBORDINATE') || [];

      // Calculate averages for each competency
      const competencyIds = evaluation.competencies.map(c => c.competencyId);

      const selfAssessment = evaluation.competencies;
      const supervisorAssessment = this.aggregateCompetencyScores(supervisorReviews, competencyIds);
      const peerAverage = this.aggregateCompetencyScores(peerReviews, competencyIds);
      const subordinateAverage = subordinateReviews.length > 0
        ? this.aggregateCompetencyScores(subordinateReviews, competencyIds)
        : undefined;

      // Calculate overall average
      const allReviews = [...supervisorReviews, ...peerReviews, ...subordinateReviews];
      const overallAverage = this.aggregateCompetencyScores(allReviews, competencyIds);

      // Identify strengths and development areas
      const strengthsIdentified = overallAverage
        .filter(c => c.score >= 4)
        .map(c => c.competencyName);

      const developmentAreas = overallAverage
        .filter(c => c.score < 3)
        .map(c => c.competencyName);

      const summary: Feedback360Summary = {
        employeeId,
        evaluationPeriod: {
          start: evaluation.periodStart,
          end: evaluation.periodEnd
        },
        selfAssessment,
        supervisorAssessment,
        peerAverage,
        subordinateAverage,
        overallAverage,
        strengthsIdentified,
        developmentAreas
      };

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener feedback 360: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'FEEDBACK_ERROR'
      };
    }
  }

  /**
   * Calculate overall performance score for an employee
   */
  async calculatePerformanceScore(employeeId: string): Promise<OperationResult<PerformanceScoreResult>> {
    try {
      // Get last two evaluations for trend analysis
      const evaluations = await this.getEmployeeEvaluations(employeeId);
      const completedEvals = evaluations.filter(e => e.status === EvaluationStatus.COMPLETED);

      if (completedEvals.length === 0) {
        return {
          success: false,
          error: 'No hay evaluaciones completadas',
          code: 'NO_EVALUATIONS'
        };
      }

      const latestEval = completedEvals[0];
      const previousEval = completedEvals[1];

      // Determine trend
      let trend: 'IMPROVING' | 'STABLE' | 'DECLINING' = 'STABLE';
      if (previousEval) {
        const scoreDiff = (latestEval.overallScore || 0) - (previousEval.overallScore || 0);
        if (scoreDiff > 0.3) trend = 'IMPROVING';
        else if (scoreDiff < -0.3) trend = 'DECLINING';
      }

      const result: PerformanceScoreResult = {
        employeeId,
        period: {
          start: latestEval.periodStart,
          end: latestEval.periodEnd
        },
        goalScore: latestEval.goalScore || 0,
        goalWeight: 60,
        competencyScore: latestEval.competencyScore || 0,
        competencyWeight: 40,
        overallScore: latestEval.overallScore || 0,
        rating: latestEval.rating || 'DEVELOPING',
        trend,
        previousScore: previousEval?.overallScore
      };

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al calcular puntuación: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CALCULATION_ERROR'
      };
    }
  }

  /**
   * Add a development action to an evaluation
   */
  async addDevelopmentAction(
    evaluationId: string,
    action: Omit<DevelopmentAction, 'id' | 'status' | 'completedAt'>
  ): Promise<OperationResult<Evaluation>> {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      if (!evaluation) {
        return {
          success: false,
          error: 'Evaluación no encontrada',
          code: 'EVALUATION_NOT_FOUND'
        };
      }

      const developmentAction: DevelopmentAction = {
        id: uuidv4(),
        ...action,
        status: 'PENDING'
      };

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        developmentPlan: [...(evaluation.developmentPlan || []), developmentAction]
      };

      this.evaluations.set(evaluationId, updatedEvaluation);

      return {
        success: true,
        data: updatedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al añadir acción de desarrollo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'ADD_ACTION_ERROR'
      };
    }
  }

  /**
   * Update goal progress
   */
  async updateGoalProgress(
    evaluationId: string,
    goalId: string,
    progress: { completionPercentage: number; actualValue?: number; status?: Goal['status']; score?: number }
  ): Promise<OperationResult<Evaluation>> {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      if (!evaluation) {
        return {
          success: false,
          error: 'Evaluación no encontrada',
          code: 'EVALUATION_NOT_FOUND'
        };
      }

      const goalIndex = evaluation.goals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) {
        return {
          success: false,
          error: 'Objetivo no encontrado',
          code: 'GOAL_NOT_FOUND'
        };
      }

      const updatedGoals = [...evaluation.goals];
      updatedGoals[goalIndex] = {
        ...updatedGoals[goalIndex],
        ...progress
      };

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        goals: updatedGoals
      };

      this.evaluations.set(evaluationId, updatedEvaluation);

      return {
        success: true,
        data: updatedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al actualizar progreso: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'UPDATE_PROGRESS_ERROR'
      };
    }
  }

  /**
   * Complete evaluation (employee acknowledgment)
   */
  async completeEvaluation(
    evaluationId: string,
    employeeComments?: string
  ): Promise<OperationResult<Evaluation>> {
    try {
      const evaluation = this.evaluations.get(evaluationId);
      if (!evaluation) {
        return {
          success: false,
          error: 'Evaluación no encontrada',
          code: 'EVALUATION_NOT_FOUND'
        };
      }

      if (evaluation.status !== EvaluationStatus.PENDING_EMPLOYEE_ACK) {
        return {
          success: false,
          error: 'La evaluación no está pendiente de reconocimiento',
          code: 'INVALID_STATUS'
        };
      }

      const updatedEvaluation: Evaluation = {
        ...evaluation,
        status: EvaluationStatus.COMPLETED,
        employeeComments,
        acknowledgedAt: new Date()
      };

      this.evaluations.set(evaluationId, updatedEvaluation);

      return {
        success: true,
        data: updatedEvaluation
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al completar evaluación: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'COMPLETE_ERROR'
      };
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Set employee data (for service initialization)
   */
  setEmployee(employee: Employee): void {
    this.employees.set(employee.id, employee);
  }

  /**
   * Add or update a competency
   */
  setCompetency(competency: Competency): void {
    this.competencies.set(competency.id, competency);
  }

  /**
   * Get competency by ID
   */
  getCompetency(id: string): Competency | undefined {
    return this.competencies.get(id);
  }

  /**
   * Initialize default competencies
   */
  private initializeDefaultCompetencies(): void {
    const defaultCompetencies: Competency[] = [
      {
        id: 'comp-communication',
        code: 'COMM',
        name: 'Comunicación',
        description: 'Capacidad de comunicarse efectivamente de forma oral y escrita',
        category: 'CORE',
        levels: [
          { level: 1, name: 'Básico', description: 'Comunicación básica', behaviors: ['Transmite información simple'] },
          { level: 2, name: 'En desarrollo', description: 'Comunicación clara', behaviors: ['Comunica con claridad'] },
          { level: 3, name: 'Competente', description: 'Comunicación efectiva', behaviors: ['Adapta el mensaje al interlocutor'] },
          { level: 4, name: 'Avanzado', description: 'Comunicación estratégica', behaviors: ['Influye a través de la comunicación'] },
          { level: 5, name: 'Experto', description: 'Comunicación de impacto', behaviors: ['Referente en comunicación'] }
        ],
        isActive: true
      },
      {
        id: 'comp-teamwork',
        code: 'TEAM',
        name: 'Trabajo en equipo',
        description: 'Capacidad de colaborar efectivamente con otros',
        category: 'CORE',
        levels: [
          { level: 1, name: 'Básico', description: 'Participa en equipo', behaviors: ['Participa cuando se le solicita'] },
          { level: 2, name: 'En desarrollo', description: 'Colabora activamente', behaviors: ['Comparte información'] },
          { level: 3, name: 'Competente', description: 'Contribuye al equipo', behaviors: ['Apoya a los compañeros'] },
          { level: 4, name: 'Avanzado', description: 'Potencia al equipo', behaviors: ['Facilita la colaboración'] },
          { level: 5, name: 'Experto', description: 'Construye equipos', behaviors: ['Crea cultura de equipo'] }
        ],
        isActive: true
      },
      {
        id: 'comp-results',
        code: 'RSLT',
        name: 'Orientación a resultados',
        description: 'Capacidad de lograr objetivos y entregar resultados',
        category: 'CORE',
        levels: [
          { level: 1, name: 'Básico', description: 'Cumple tareas', behaviors: ['Completa tareas asignadas'] },
          { level: 2, name: 'En desarrollo', description: 'Busca cumplir objetivos', behaviors: ['Trabaja hacia metas'] },
          { level: 3, name: 'Competente', description: 'Logra objetivos', behaviors: ['Cumple consistentemente'] },
          { level: 4, name: 'Avanzado', description: 'Supera objetivos', behaviors: ['Va más allá de lo esperado'] },
          { level: 5, name: 'Experto', description: 'Excelencia', behaviors: ['Referente en resultados'] }
        ],
        isActive: true
      },
      {
        id: 'comp-leadership',
        code: 'LEAD',
        name: 'Liderazgo',
        description: 'Capacidad de guiar y desarrollar a otros',
        category: 'LEADERSHIP',
        levels: [
          { level: 1, name: 'Básico', description: 'Influencia limitada', behaviors: ['Guía cuando se le pide'] },
          { level: 2, name: 'En desarrollo', description: 'Influencia local', behaviors: ['Motiva a su entorno'] },
          { level: 3, name: 'Competente', description: 'Lidera equipos', behaviors: ['Dirige equipos pequeños'] },
          { level: 4, name: 'Avanzado', description: 'Liderazgo estratégico', behaviors: ['Desarrolla líderes'] },
          { level: 5, name: 'Experto', description: 'Liderazgo transformador', behaviors: ['Transforma organizaciones'] }
        ],
        isActive: true
      },
      {
        id: 'comp-innovation',
        code: 'INNV',
        name: 'Innovación',
        description: 'Capacidad de generar ideas y mejorar procesos',
        category: 'FUNCTIONAL',
        levels: [
          { level: 1, name: 'Básico', description: 'Acepta cambios', behaviors: ['Se adapta a cambios'] },
          { level: 2, name: 'En desarrollo', description: 'Propone mejoras', behaviors: ['Sugiere mejoras'] },
          { level: 3, name: 'Competente', description: 'Implementa mejoras', behaviors: ['Ejecuta mejoras'] },
          { level: 4, name: 'Avanzado', description: 'Lidera innovación', behaviors: ['Impulsa la innovación'] },
          { level: 5, name: 'Experto', description: 'Crea cultura innovadora', behaviors: ['Transforma con innovación'] }
        ],
        isActive: true
      }
    ];

    defaultCompetencies.forEach(c => this.competencies.set(c.id, c));
  }

  /**
   * Get competencies for a position
   */
  private getPositionCompetencies(_positionId: string): Competency[] {
    // In production, this would fetch from position configuration
    // For now, return all active competencies
    return Array.from(this.competencies.values()).filter(c => c.isActive);
  }

  /**
   * Calculate competency score based on expected vs current level
   */
  private calculateCompetencyScore(expectedLevel: number, currentLevel: number): number {
    // Score from 1-5:
    // 5: Exceeds expected level
    // 4: Meets expected level
    // 3: Slightly below expected
    // 2: Below expected
    // 1: Significantly below expected

    const gap = currentLevel - expectedLevel;

    if (gap >= 1) return 5;
    if (gap >= 0) return 4;
    if (gap >= -1) return 3;
    if (gap >= -2) return 2;
    return 1;
  }

  /**
   * Determine rating based on overall score
   */
  private determineRating(score: number): 'EXCEEDS' | 'MEETS' | 'DEVELOPING' | 'BELOW' {
    if (score >= 4.5) return 'EXCEEDS';
    if (score >= 3.5) return 'MEETS';
    if (score >= 2.5) return 'DEVELOPING';
    return 'BELOW';
  }

  /**
   * Aggregate competency scores from multiple reviews
   */
  private aggregateCompetencyScores(
    reviews: PeerReview[],
    competencyIds: string[]
  ): CompetencyScore[] {
    if (reviews.length === 0) {
      return competencyIds.map(id => ({
        competencyId: id,
        competencyName: this.competencies.get(id)?.name || 'Unknown',
        expectedLevel: 3,
        currentLevel: 0,
        score: 0
      }));
    }

    return competencyIds.map(compId => {
      const scores = reviews
        .flatMap(r => r.competencyScores)
        .filter(s => s.competencyId === compId);

      const avgScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : 0;

      const avgLevel = scores.length > 0
        ? scores.reduce((sum, s) => sum + s.currentLevel, 0) / scores.length
        : 0;

      return {
        competencyId: compId,
        competencyName: this.competencies.get(compId)?.name || 'Unknown',
        expectedLevel: 3,
        currentLevel: Math.round(avgLevel * 10) / 10,
        score: Math.round(avgScore * 10) / 10
      };
    });
  }
}
