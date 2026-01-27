/**
 * Training Service - Manages courses, enrollments, certifications and training needs
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Training,
  TrainingStatus,
  TrainingEnrollment,
  EnrollmentStatus,
  Certification,
  TrainingPlan,
  TrainingPlanItem,
  TrainingNeeds,
  CompetencyGap,
  RecommendedTraining,
  TrainingPriorityMatrix,
  Employee,
  Competency,
  Evaluation,
  OperationResult
} from '../types';

/**
 * Course creation data
 */
export interface CreateCourseData {
  code: string;
  title: string;
  description: string;
  category: Training['category'];
  format: Training['format'];
  provider: Training['provider'];
  providerName?: string;
  durationHours: number;
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  prerequisites?: string[];
  targetPositions?: string[];
  targetDepartments?: string[];
  isMandatory: boolean;
  hasExam: boolean;
  passingScore?: number;
  grantsCertification: boolean;
  certificationName?: string;
  certificationValidity?: number;
  costPerParticipant?: number;
  linkedCompetencies?: string[];
}

/**
 * Enrollment completion data
 */
export interface CompletionData {
  attendancePercentage: number;
  examScore?: number;
  passed: boolean;
  rating?: number;
  feedback?: string;
}

/**
 * Training Service implementation
 */
export class TrainingService {
  private trainings: Map<string, Training> = new Map();
  private enrollments: Map<string, TrainingEnrollment> = new Map();
  private certifications: Map<string, Certification> = new Map();
  private trainingPlans: Map<string, TrainingPlan> = new Map();
  private employees: Map<string, Employee> = new Map();
  private competencies: Map<string, Competency> = new Map();
  private evaluations: Map<string, Evaluation> = new Map();

  constructor() {
    // Initialize - in production, inject repositories
  }

  /**
   * Create a new training course
   */
  async createCourse(data: CreateCourseData): Promise<OperationResult<Training>> {
    try {
      // Check for duplicate code
      const existingCourse = Array.from(this.trainings.values())
        .find(t => t.code === data.code);

      if (existingCourse) {
        return {
          success: false,
          error: 'Ya existe un curso con este código',
          code: 'DUPLICATE_CODE'
        };
      }

      // Validate dates
      if (data.startDate && data.endDate && data.startDate > data.endDate) {
        return {
          success: false,
          error: 'La fecha de inicio no puede ser posterior a la fecha de fin',
          code: 'INVALID_DATES'
        };
      }

      // Validate exam configuration
      if (data.hasExam && !data.passingScore) {
        return {
          success: false,
          error: 'Se debe especificar una puntuación mínima para aprobar el examen',
          code: 'MISSING_PASSING_SCORE'
        };
      }

      const training: Training = {
        id: uuidv4(),
        code: data.code,
        title: data.title,
        description: data.description,
        category: data.category,
        format: data.format,
        provider: data.provider,
        providerName: data.providerName,
        durationHours: data.durationHours,
        startDate: data.startDate,
        endDate: data.endDate,
        maxParticipants: data.maxParticipants,
        currentEnrollments: 0,
        prerequisites: data.prerequisites,
        targetPositions: data.targetPositions,
        targetDepartments: data.targetDepartments,
        isMandatory: data.isMandatory,
        hasExam: data.hasExam,
        passingScore: data.passingScore,
        grantsCertification: data.grantsCertification,
        certificationName: data.certificationName,
        certificationValidity: data.certificationValidity,
        costPerParticipant: data.costPerParticipant,
        linkedCompetencies: data.linkedCompetencies,
        status: data.startDate ? TrainingStatus.SCHEDULED : TrainingStatus.IN_PROGRESS,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.trainings.set(training.id, training);

      return {
        success: true,
        data: training
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear curso: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CREATE_ERROR'
      };
    }
  }

  /**
   * Enroll an employee in a training course
   */
  async enrollEmployee(
    employeeId: string,
    courseId: string,
    reason?: string
  ): Promise<OperationResult<TrainingEnrollment>> {
    try {
      const employee = this.employees.get(employeeId);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      const training = this.trainings.get(courseId);
      if (!training) {
        return {
          success: false,
          error: 'Curso no encontrado',
          code: 'COURSE_NOT_FOUND'
        };
      }

      // Check if training is available
      if (training.status === TrainingStatus.CANCELLED) {
        return {
          success: false,
          error: 'El curso ha sido cancelado',
          code: 'COURSE_CANCELLED'
        };
      }

      if (training.status === TrainingStatus.COMPLETED) {
        return {
          success: false,
          error: 'El curso ya ha finalizado',
          code: 'COURSE_COMPLETED'
        };
      }

      // Check capacity
      if (training.maxParticipants && training.currentEnrollments >= training.maxParticipants) {
        return {
          success: false,
          error: 'El curso está completo',
          code: 'COURSE_FULL'
        };
      }

      // Check for existing enrollment
      const existingEnrollment = Array.from(this.enrollments.values())
        .find(e =>
          e.employeeId === employeeId &&
          e.trainingId === courseId &&
          e.status !== EnrollmentStatus.WITHDRAWN
        );

      if (existingEnrollment) {
        return {
          success: false,
          error: 'El empleado ya está inscrito en este curso',
          code: 'ALREADY_ENROLLED'
        };
      }

      // Check prerequisites
      if (training.prerequisites && training.prerequisites.length > 0) {
        const completedCourses = Array.from(this.enrollments.values())
          .filter(e =>
            e.employeeId === employeeId &&
            e.status === EnrollmentStatus.COMPLETED &&
            e.passed
          )
          .map(e => this.trainings.get(e.trainingId)?.code);

        const missingPrereqs = training.prerequisites.filter(
          p => !completedCourses.includes(p)
        );

        if (missingPrereqs.length > 0) {
          return {
            success: false,
            error: `Faltan prerrequisitos: ${missingPrereqs.join(', ')}`,
            code: 'MISSING_PREREQUISITES'
          };
        }
      }

      const enrollment: TrainingEnrollment = {
        id: uuidv4(),
        employeeId,
        trainingId: courseId,
        enrolledAt: new Date(),
        enrolledBy: 'system', // In production, this would be the current user
        reason,
        status: EnrollmentStatus.ENROLLED
      };

      this.enrollments.set(enrollment.id, enrollment);

      // Update training enrollment count
      training.currentEnrollments++;
      this.trainings.set(courseId, training);

      return {
        success: true,
        data: enrollment
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al inscribir: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'ENROLL_ERROR'
      };
    }
  }

  /**
   * Record training completion
   */
  async recordCompletion(
    enrollmentId: string,
    completionData: CompletionData
  ): Promise<OperationResult<TrainingEnrollment>> {
    try {
      const enrollment = this.enrollments.get(enrollmentId);
      if (!enrollment) {
        return {
          success: false,
          error: 'Inscripción no encontrada',
          code: 'ENROLLMENT_NOT_FOUND'
        };
      }

      if (enrollment.status === EnrollmentStatus.COMPLETED) {
        return {
          success: false,
          error: 'La formación ya ha sido completada',
          code: 'ALREADY_COMPLETED'
        };
      }

      const training = this.trainings.get(enrollment.trainingId);
      if (!training) {
        return {
          success: false,
          error: 'Curso no encontrado',
          code: 'COURSE_NOT_FOUND'
        };
      }

      // Validate exam score if required
      if (training.hasExam && completionData.examScore === undefined) {
        return {
          success: false,
          error: 'Se requiere puntuación del examen',
          code: 'EXAM_SCORE_REQUIRED'
        };
      }

      // Determine if passed
      let passed = completionData.passed;
      if (training.hasExam && training.passingScore && completionData.examScore !== undefined) {
        passed = completionData.examScore >= training.passingScore;
      }

      const updatedEnrollment: TrainingEnrollment = {
        ...enrollment,
        status: passed ? EnrollmentStatus.COMPLETED : EnrollmentStatus.FAILED,
        completedAt: new Date(),
        attendancePercentage: completionData.attendancePercentage,
        examScore: completionData.examScore,
        passed,
        rating: completionData.rating,
        feedback: completionData.feedback
      };

      this.enrollments.set(enrollmentId, updatedEnrollment);

      // Create certification if applicable
      if (passed && training.grantsCertification) {
        const certification = await this.createCertification(enrollment, training);
        if (certification) {
          updatedEnrollment.certificationId = certification.id;
          updatedEnrollment.certificationExpiresAt = certification.expirationDate;
          this.enrollments.set(enrollmentId, updatedEnrollment);
        }
      }

      return {
        success: true,
        data: updatedEnrollment
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al registrar finalización: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'COMPLETION_ERROR'
      };
    }
  }

  /**
   * Get training plan for an employee
   */
  async getTrainingPlan(employeeId: string): Promise<OperationResult<TrainingPlan>> {
    try {
      const employee = this.employees.get(employeeId);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      const year = new Date().getFullYear();
      const planKey = `${employeeId}-${year}`;

      let plan = this.trainingPlans.get(planKey);

      if (!plan) {
        // Generate training plan
        plan = await this.generateTrainingPlan(employee, year);
        this.trainingPlans.set(planKey, plan);
      }

      // Update plan with current enrollment status
      plan = this.updatePlanWithEnrollments(plan, employeeId);

      return {
        success: true,
        data: plan
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener plan de formación: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'PLAN_ERROR'
      };
    }
  }

  /**
   * Get certifications for an employee
   */
  async getCertifications(employeeId: string): Promise<Certification[]> {
    return Array.from(this.certifications.values())
      .filter(c => c.employeeId === employeeId)
      .sort((a, b) => b.issueDate.getTime() - a.issueDate.getTime());
  }

  /**
   * Get training needs analysis for a department
   */
  async getTrainingNeeds(departmentId: string): Promise<OperationResult<TrainingNeeds>> {
    try {
      const deptEmployees = Array.from(this.employees.values())
        .filter(e => e.departmentId === departmentId);

      if (deptEmployees.length === 0) {
        return {
          success: false,
          error: 'No hay empleados en este departamento',
          code: 'NO_EMPLOYEES'
        };
      }

      // Analyze competency gaps from evaluations
      const competencyGaps = await this.analyzeCompetencyGaps(deptEmployees);

      // Get recommended trainings based on gaps
      const recommendedTrainings = this.getRecommendedTrainings(competencyGaps);

      // Build priority matrix
      const priorityMatrix = this.buildPriorityMatrix(competencyGaps, recommendedTrainings);

      // Calculate estimated budget and hours
      const estimatedBudget = recommendedTrainings.reduce(
        (sum, t) => sum + t.estimatedCost, 0
      );

      const estimatedHours = recommendedTrainings.reduce((sum, t) => {
        const training = Array.from(this.trainings.values())
          .find(tr => tr.id === t.trainingId);
        return sum + (training?.durationHours || 0) * t.suggestedParticipants.length;
      }, 0);

      const trainingNeeds: TrainingNeeds = {
        departmentId,
        departmentName: 'Unknown', // In production, fetch from department service
        analysisDate: new Date(),
        competencyGaps,
        recommendedTrainings,
        priorityMatrix,
        estimatedBudget,
        estimatedHours
      };

      return {
        success: true,
        data: trainingNeeds
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al analizar necesidades: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'ANALYSIS_ERROR'
      };
    }
  }

  /**
   * Get available courses
   */
  async getAvailableCourses(filters?: {
    category?: Training['category'];
    format?: Training['format'];
    status?: TrainingStatus;
  }): Promise<Training[]> {
    let courses = Array.from(this.trainings.values());

    if (filters?.category) {
      courses = courses.filter(c => c.category === filters.category);
    }

    if (filters?.format) {
      courses = courses.filter(c => c.format === filters.format);
    }

    if (filters?.status) {
      courses = courses.filter(c => c.status === filters.status);
    }

    return courses;
  }

  /**
   * Get employee training history
   */
  async getTrainingHistory(employeeId: string): Promise<{
    enrollment: TrainingEnrollment;
    training: Training;
  }[]> {
    const enrollments = Array.from(this.enrollments.values())
      .filter(e => e.employeeId === employeeId);

    return enrollments.map(enrollment => ({
      enrollment,
      training: this.trainings.get(enrollment.trainingId)!
    })).filter(item => item.training !== undefined);
  }

  /**
   * Withdraw employee from course
   */
  async withdrawEnrollment(enrollmentId: string): Promise<OperationResult<TrainingEnrollment>> {
    try {
      const enrollment = this.enrollments.get(enrollmentId);
      if (!enrollment) {
        return {
          success: false,
          error: 'Inscripción no encontrada',
          code: 'ENROLLMENT_NOT_FOUND'
        };
      }

      if (enrollment.status !== EnrollmentStatus.ENROLLED) {
        return {
          success: false,
          error: 'Solo se pueden cancelar inscripciones pendientes',
          code: 'INVALID_STATUS'
        };
      }

      const updatedEnrollment: TrainingEnrollment = {
        ...enrollment,
        status: EnrollmentStatus.WITHDRAWN
      };

      this.enrollments.set(enrollmentId, updatedEnrollment);

      // Update training count
      const training = this.trainings.get(enrollment.trainingId);
      if (training) {
        training.currentEnrollments = Math.max(0, training.currentEnrollments - 1);
        this.trainings.set(training.id, training);
      }

      return {
        success: true,
        data: updatedEnrollment
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al cancelar inscripción: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'WITHDRAW_ERROR'
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
   * Set competency data (for service initialization)
   */
  setCompetency(competency: Competency): void {
    this.competencies.set(competency.id, competency);
  }

  /**
   * Set evaluation data (for service initialization)
   */
  setEvaluation(evaluation: Evaluation): void {
    this.evaluations.set(evaluation.id, evaluation);
  }

  /**
   * Create certification for completed training
   */
  private async createCertification(
    enrollment: TrainingEnrollment,
    training: Training
  ): Promise<Certification | null> {
    if (!training.grantsCertification) return null;

    const expirationDate = training.certificationValidity
      ? new Date(Date.now() + training.certificationValidity * 30 * 24 * 60 * 60 * 1000)
      : undefined;

    const certification: Certification = {
      id: uuidv4(),
      employeeId: enrollment.employeeId,
      trainingId: training.id,
      name: training.certificationName || training.title,
      issuingOrganization: training.providerName || 'Internal',
      issueDate: new Date(),
      expirationDate,
      isActive: true
    };

    this.certifications.set(certification.id, certification);

    return certification;
  }

  /**
   * Generate training plan for an employee
   */
  private async generateTrainingPlan(employee: Employee, year: number): Promise<TrainingPlan> {
    const mandatoryTrainings: TrainingPlanItem[] = [];
    const recommendedTrainings: TrainingPlanItem[] = [];
    const developmentTrainings: TrainingPlanItem[] = [];

    // Get mandatory trainings for employee's position/department
    const mandatory = Array.from(this.trainings.values())
      .filter(t =>
        t.isMandatory &&
        t.status !== TrainingStatus.CANCELLED &&
        (!t.targetDepartments || t.targetDepartments.includes(employee.departmentId)) &&
        (!t.targetPositions || t.targetPositions.includes(employee.positionId))
      );

    for (const training of mandatory) {
      // Check if already completed
      const completed = Array.from(this.enrollments.values())
        .find(e =>
          e.employeeId === employee.id &&
          e.trainingId === training.id &&
          e.status === EnrollmentStatus.COMPLETED &&
          e.passed
        );

      if (!completed) {
        mandatoryTrainings.push({
          trainingId: training.id,
          trainingTitle: training.title,
          priority: 'HIGH',
          targetQuarter: 1,
          status: 'PLANNED',
          linkedCompetencies: training.linkedCompetencies
        });
      }
    }

    // Get recommended trainings based on competency gaps
    const latestEval = Array.from(this.evaluations.values())
      .filter(e => e.employeeId === employee.id)
      .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];

    if (latestEval) {
      const gaps = latestEval.competencies
        .filter(c => c.currentLevel < c.expectedLevel);

      for (const gap of gaps) {
        const relatedTrainings = Array.from(this.trainings.values())
          .filter(t =>
            t.linkedCompetencies?.includes(gap.competencyId) &&
            t.status !== TrainingStatus.CANCELLED
          );

        for (const training of relatedTrainings.slice(0, 2)) {
          recommendedTrainings.push({
            trainingId: training.id,
            trainingTitle: training.title,
            priority: gap.expectedLevel - gap.currentLevel > 1 ? 'HIGH' : 'MEDIUM',
            targetQuarter: 2,
            status: 'PLANNED',
            linkedCompetencies: [gap.competencyId]
          });
        }
      }
    }

    // Calculate totals
    const allItems = [...mandatoryTrainings, ...recommendedTrainings, ...developmentTrainings];
    const totalPlannedHours = allItems.reduce((sum, item) => {
      const training = this.trainings.get(item.trainingId);
      return sum + (training?.durationHours || 0);
    }, 0);

    const completedHours = 0; // Calculate based on completed enrollments

    const budget = allItems.reduce((sum, item) => {
      const training = this.trainings.get(item.trainingId);
      return sum + (training?.costPerParticipant || 0);
    }, 0);

    return {
      employeeId: employee.id,
      year,
      mandatoryTrainings,
      recommendedTrainings,
      developmentTrainings,
      totalPlannedHours,
      completedHours,
      budget,
      usedBudget: 0
    };
  }

  /**
   * Update training plan with current enrollment status
   */
  private updatePlanWithEnrollments(plan: TrainingPlan, employeeId: string): TrainingPlan {
    const enrollments = Array.from(this.enrollments.values())
      .filter(e => e.employeeId === employeeId);

    const updateItems = (items: TrainingPlanItem[]): TrainingPlanItem[] => {
      return items.map(item => {
        const enrollment = enrollments.find(e => e.trainingId === item.trainingId);
        if (enrollment) {
          if (enrollment.status === EnrollmentStatus.COMPLETED && enrollment.passed) {
            return { ...item, status: 'COMPLETED' as const };
          }
          if (enrollment.status === EnrollmentStatus.ENROLLED || enrollment.status === EnrollmentStatus.IN_PROGRESS) {
            return { ...item, status: 'ENROLLED' as const };
          }
        }
        return item;
      });
    };

    return {
      ...plan,
      mandatoryTrainings: updateItems(plan.mandatoryTrainings),
      recommendedTrainings: updateItems(plan.recommendedTrainings),
      developmentTrainings: updateItems(plan.developmentTrainings)
    };
  }

  /**
   * Analyze competency gaps for a group of employees
   */
  private async analyzeCompetencyGaps(employees: Employee[]): Promise<CompetencyGap[]> {
    const gapMap = new Map<string, {
      competencyId: string;
      competencyName: string;
      totalGap: number;
      count: number;
      affectedEmployees: number;
      requiredLevel: number;
    }>();

    for (const employee of employees) {
      const latestEval = Array.from(this.evaluations.values())
        .filter(e => e.employeeId === employee.id)
        .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];

      if (latestEval) {
        for (const comp of latestEval.competencies) {
          const gap = comp.expectedLevel - comp.currentLevel;
          if (gap > 0) {
            const existing = gapMap.get(comp.competencyId) || {
              competencyId: comp.competencyId,
              competencyName: comp.competencyName,
              totalGap: 0,
              count: 0,
              affectedEmployees: 0,
              requiredLevel: comp.expectedLevel
            };

            existing.totalGap += gap;
            existing.count++;
            existing.affectedEmployees++;
            gapMap.set(comp.competencyId, existing);
          }
        }
      }
    }

    return Array.from(gapMap.values()).map(g => {
      const averageGap = g.count > 0 ? g.totalGap / g.count : 0;
      let priority: CompetencyGap['priority'];

      if (averageGap >= 2 || g.affectedEmployees > employees.length * 0.5) {
        priority = 'CRITICAL';
      } else if (averageGap >= 1.5 || g.affectedEmployees > employees.length * 0.3) {
        priority = 'HIGH';
      } else if (averageGap >= 1) {
        priority = 'MEDIUM';
      } else {
        priority = 'LOW';
      }

      return {
        competencyId: g.competencyId,
        competencyName: g.competencyName,
        currentAverageLevel: g.requiredLevel - (g.totalGap / g.count),
        requiredLevel: g.requiredLevel,
        gap: averageGap,
        affectedEmployees: g.affectedEmployees,
        priority
      };
    }).sort((a, b) => {
      const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Get recommended trainings based on competency gaps
   */
  private getRecommendedTrainings(gaps: CompetencyGap[]): RecommendedTraining[] {
    const recommendations: RecommendedTraining[] = [];

    for (const gap of gaps) {
      // Find trainings that address this competency
      const trainings = Array.from(this.trainings.values())
        .filter(t =>
          t.linkedCompetencies?.includes(gap.competencyId) &&
          t.status !== TrainingStatus.CANCELLED
        );

      for (const training of trainings) {
        const suggestedParticipants: string[] = [];

        // Find employees with this gap
        for (const employee of this.employees.values()) {
          const latestEval = Array.from(this.evaluations.values())
            .filter(e => e.employeeId === employee.id)
            .sort((a, b) => b.periodEnd.getTime() - a.periodEnd.getTime())[0];

          if (latestEval) {
            const competency = latestEval.competencies.find(c => c.competencyId === gap.competencyId);
            if (competency && competency.currentLevel < competency.expectedLevel) {
              suggestedParticipants.push(employee.id);
            }
          }
        }

        recommendations.push({
          trainingId: training.id,
          title: training.title,
          addressesCompetencies: [gap.competencyId],
          suggestedParticipants,
          estimatedCost: (training.costPerParticipant || 0) * suggestedParticipants.length,
          priority: gap.priority === 'CRITICAL' || gap.priority === 'HIGH' ? 'HIGH' : 'MEDIUM'
        });
      }
    }

    return recommendations;
  }

  /**
   * Build priority matrix for training recommendations
   */
  private buildPriorityMatrix(
    _gaps: CompetencyGap[],
    recommendations: RecommendedTraining[]
  ): TrainingPriorityMatrix {
    const urgent: string[] = [];
    const planned: string[] = [];
    const nice_to_have: string[] = [];

    for (const rec of recommendations) {
      if (rec.priority === 'HIGH') {
        urgent.push(rec.title);
      } else if (rec.priority === 'MEDIUM') {
        planned.push(rec.title);
      } else {
        nice_to_have.push(rec.title);
      }
    }

    return {
      urgent: [...new Set(urgent)],
      planned: [...new Set(planned)],
      nice_to_have: [...new Set(nice_to_have)]
    };
  }
}
