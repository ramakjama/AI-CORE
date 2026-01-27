/**
 * Leave Service - Manages leave requests, absences and calendars
 */

import { v4 as uuidv4 } from 'uuid';
import {
  LeaveRequest,
  LeaveType,
  LeaveBalance,
  LeaveTypeBalance,
  Absence,
  TeamCalendarEntry,
  AbsenceReport,
  AbsenceByType,
  AbsenceByDepartment,
  BradfordFactorResult,
  Employee,
  OperationResult,
  Period,
  DateRange
} from '../types';

/**
 * Leave request creation data
 */
export interface CreateLeaveRequestData {
  employeeId: string;
  type: LeaveType;
  startDate: Date;
  endDate: Date;
  startHalfDay?: boolean;
  endHalfDay?: boolean;
  reason?: string;
  attachmentUrls?: string[];
}

/**
 * Spanish public holidays (national level - 2024)
 * Each autonomous community may have additional holidays
 */
const SPANISH_NATIONAL_HOLIDAYS_2024 = [
  new Date(2024, 0, 1),   // Año Nuevo
  new Date(2024, 0, 6),   // Reyes
  new Date(2024, 2, 29),  // Viernes Santo
  new Date(2024, 4, 1),   // Día del Trabajo
  new Date(2024, 7, 15),  // Asunción de la Virgen
  new Date(2024, 9, 12),  // Fiesta Nacional
  new Date(2024, 10, 1),  // Todos los Santos
  new Date(2024, 11, 6),  // Día de la Constitución
  new Date(2024, 11, 25), // Navidad
];

/**
 * Leave entitlements by type (in days, according to Spanish law)
 */
const LEAVE_ENTITLEMENTS: Record<LeaveType, number | null> = {
  [LeaveType.VACACIONES]: 22,                          // 22 working days minimum
  [LeaveType.BAJA_ENFERMEDAD]: null,                   // Medical certificate required
  [LeaveType.BAJA_ACCIDENTE_LABORAL]: null,            // Medical certificate required
  [LeaveType.MATERNIDAD]: 112,                         // 16 weeks = 112 days
  [LeaveType.PATERNIDAD]: 112,                         // 16 weeks = 112 days (equal since 2021)
  [LeaveType.MATRIMONIO]: 15,                          // 15 calendar days
  [LeaveType.FALLECIMIENTO_FAMILIAR]: 4,               // 2-4 days depending on travel
  [LeaveType.HOSPITALIZACION_FAMILIAR]: 5,             // 5 days (new law 2024)
  [LeaveType.MUDANZA]: 1,                              // 1 day
  [LeaveType.DEBER_INEXCUSABLE]: null,                 // Time necessary
  [LeaveType.EXAMEN]: null,                            // Time necessary
  [LeaveType.LACTANCIA]: null,                         // 1 hour/day or accumulation
  [LeaveType.ASUNTOS_PROPIOS]: 0,                      // Depends on collective agreement
  [LeaveType.PERMISO_SIN_SUELDO]: null,                // Unpaid, needs approval
  [LeaveType.EXCEDENCIA]: null,                        // Leave of absence
  [LeaveType.REDUCCION_JORNADA]: null,                 // Reduced hours
  [LeaveType.FORMACION]: null                          // Training leave (20h/year right)
};

/**
 * Leave Service implementation
 */
export class LeaveService {
  private leaveRequests: Map<string, LeaveRequest> = new Map();
  private leaveBalances: Map<string, LeaveBalance> = new Map();
  private absences: Map<string, Absence> = new Map();
  private employees: Map<string, Employee> = new Map();
  private holidays: Date[] = [...SPANISH_NATIONAL_HOLIDAYS_2024];

  constructor() {
    // Initialize - in production, inject repositories
  }

  /**
   * Request leave for an employee
   */
  async requestLeave(data: CreateLeaveRequestData): Promise<OperationResult<LeaveRequest>> {
    try {
      const employee = this.employees.get(data.employeeId);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      // Validate dates
      if (data.startDate > data.endDate) {
        return {
          success: false,
          error: 'La fecha de inicio no puede ser posterior a la fecha de fin',
          code: 'INVALID_DATES'
        };
      }

      // Calculate working days
      const workingDays = this.calculateWorkingDays(data.startDate, data.endDate);
      const calendarDays = this.calculateCalendarDays(data.startDate, data.endDate);

      // Check balance for vacation
      if (data.type === LeaveType.VACACIONES) {
        const balance = await this.getLeaveBalance(data.employeeId);
        if (balance.success && balance.data) {
          const vacationBalance = balance.data.balances.find(
            b => b.type === LeaveType.VACACIONES
          );
          if (vacationBalance && vacationBalance.remaining < workingDays) {
            return {
              success: false,
              error: `Saldo insuficiente. Disponible: ${vacationBalance.remaining} días, Solicitado: ${workingDays} días`,
              code: 'INSUFFICIENT_BALANCE'
            };
          }
        }
      }

      // Check for overlapping requests
      const hasOverlap = await this.checkOverlappingRequests(
        data.employeeId,
        data.startDate,
        data.endDate
      );
      if (hasOverlap) {
        return {
          success: false,
          error: 'Ya existe una solicitud para estas fechas',
          code: 'OVERLAPPING_REQUEST'
        };
      }

      const leaveRequest: LeaveRequest = {
        id: uuidv4(),
        employeeId: data.employeeId,
        type: data.type,
        startDate: data.startDate,
        endDate: data.endDate,
        startHalfDay: data.startHalfDay,
        endHalfDay: data.endHalfDay,
        workingDays: data.startHalfDay || data.endHalfDay
          ? workingDays - 0.5
          : workingDays,
        calendarDays,
        reason: data.reason,
        attachmentUrls: data.attachmentUrls,
        status: 'PENDING',
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.leaveRequests.set(leaveRequest.id, leaveRequest);

      // Update pending balance
      await this.updatePendingBalance(data.employeeId, data.type, leaveRequest.workingDays);

      return {
        success: true,
        data: leaveRequest
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear solicitud: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'REQUEST_ERROR'
      };
    }
  }

  /**
   * Approve a leave request
   */
  async approveLeave(requestId: string, approverId: string): Promise<OperationResult<LeaveRequest>> {
    try {
      const request = this.leaveRequests.get(requestId);
      if (!request) {
        return {
          success: false,
          error: 'Solicitud no encontrada',
          code: 'REQUEST_NOT_FOUND'
        };
      }

      if (request.status !== 'PENDING') {
        return {
          success: false,
          error: `No se puede aprobar una solicitud en estado ${request.status}`,
          code: 'INVALID_STATUS'
        };
      }

      // Validate approver is manager or HR
      const approver = this.employees.get(approverId);
      const employee = this.employees.get(request.employeeId);
      if (!approver || !employee) {
        return {
          success: false,
          error: 'Aprobador o empleado no encontrado',
          code: 'USER_NOT_FOUND'
        };
      }

      // Check if approver is the employee's manager
      if (employee.managerId !== approverId) {
        // TODO: Check if approver has HR role
      }

      const updatedRequest: LeaveRequest = {
        ...request,
        status: 'APPROVED',
        approverId,
        approvedAt: new Date(),
        updatedAt: new Date()
      };

      this.leaveRequests.set(requestId, updatedRequest);

      // Create absence records
      await this.createAbsenceRecords(updatedRequest);

      // Update balance (move from pending to taken)
      await this.confirmLeaveBalance(request.employeeId, request.type, request.workingDays);

      return {
        success: true,
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al aprobar solicitud: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'APPROVE_ERROR'
      };
    }
  }

  /**
   * Reject a leave request
   */
  async rejectLeave(requestId: string, reason: string): Promise<OperationResult<LeaveRequest>> {
    try {
      const request = this.leaveRequests.get(requestId);
      if (!request) {
        return {
          success: false,
          error: 'Solicitud no encontrada',
          code: 'REQUEST_NOT_FOUND'
        };
      }

      if (request.status !== 'PENDING') {
        return {
          success: false,
          error: `No se puede rechazar una solicitud en estado ${request.status}`,
          code: 'INVALID_STATUS'
        };
      }

      const updatedRequest: LeaveRequest = {
        ...request,
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedAt: new Date()
      };

      this.leaveRequests.set(requestId, updatedRequest);

      // Restore pending balance
      await this.restorePendingBalance(request.employeeId, request.type, request.workingDays);

      return {
        success: true,
        data: updatedRequest
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al rechazar solicitud: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'REJECT_ERROR'
      };
    }
  }

  /**
   * Get leave balance for an employee
   */
  async getLeaveBalance(employeeId: string): Promise<OperationResult<LeaveBalance>> {
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
      const balanceKey = `${employeeId}-${year}`;

      let balance = this.leaveBalances.get(balanceKey);

      if (!balance) {
        // Calculate initial balance based on hire date and entitlements
        balance = this.calculateInitialBalance(employee, year);
        this.leaveBalances.set(balanceKey, balance);
      }

      return {
        success: true,
        data: balance
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener saldo: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'BALANCE_ERROR'
      };
    }
  }

  /**
   * Calculate working days between two dates
   */
  calculateWorkingDays(startDate: Date, endDate: Date): number {
    let workingDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();

      // Skip weekends
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Skip holidays
        if (!this.isHoliday(current)) {
          workingDays++;
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Get team calendar for a specific month
   */
  async getTeamCalendar(teamId: string, month: Period): Promise<TeamCalendarEntry[]> {
    // Get team members (employees in the same department or under same manager)
    const teamMembers = Array.from(this.employees.values())
      .filter(e => e.departmentId === teamId || e.managerId === teamId);

    const entries: TeamCalendarEntry[] = [];
    const monthStart = new Date(month.year, month.month - 1, 1);
    const monthEnd = new Date(month.year, month.month, 0);

    for (const employee of teamMembers) {
      // Get approved and pending leave requests for this employee in this month
      const requests = Array.from(this.leaveRequests.values())
        .filter(r =>
          r.employeeId === employee.id &&
          (r.status === 'APPROVED' || r.status === 'PENDING') &&
          r.startDate <= monthEnd &&
          r.endDate >= monthStart
        );

      for (const request of requests) {
        const current = new Date(Math.max(request.startDate.getTime(), monthStart.getTime()));
        const end = new Date(Math.min(request.endDate.getTime(), monthEnd.getTime()));

        while (current <= end) {
          const dayOfWeek = current.getDay();

          // Only include working days
          if (dayOfWeek !== 0 && dayOfWeek !== 6 && !this.isHoliday(current)) {
            const isHalfDay =
              (current.getTime() === request.startDate.getTime() && request.startHalfDay) ||
              (current.getTime() === request.endDate.getTime() && request.endHalfDay);

            entries.push({
              employeeId: employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              date: new Date(current),
              type: request.type,
              status: request.status as 'APPROVED' | 'PENDING',
              isHalfDay: isHalfDay || false
            });
          }

          current.setDate(current.getDate() + 1);
        }
      }
    }

    return entries.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Get absence report for a period
   */
  async getAbsenceReport(period: DateRange): Promise<AbsenceReport> {
    const absences = Array.from(this.absences.values())
      .filter(a =>
        a.date >= period.startDate &&
        a.date <= period.endDate
      );

    // Calculate totals by type
    const byTypeMap = new Map<LeaveType, { days: number; occurrences: Set<string> }>();

    for (const absence of absences) {
      const typeData = byTypeMap.get(absence.type) || {
        days: 0,
        occurrences: new Set<string>()
      };
      typeData.days += absence.hours / 8; // Convert hours to days
      typeData.occurrences.add(`${absence.employeeId}-${absence.leaveRequestId}`);
      byTypeMap.set(absence.type, typeData);
    }

    const totalAbsenceDays = absences.reduce((sum, a) => sum + a.hours / 8, 0);

    const byType: AbsenceByType[] = Array.from(byTypeMap.entries()).map(([type, data]) => ({
      type,
      days: data.days,
      occurrences: data.occurrences.size,
      percentage: totalAbsenceDays > 0 ? (data.days / totalAbsenceDays) * 100 : 0
    }));

    // Calculate by department
    const byDepartmentMap = new Map<string, {
      departmentName: string;
      totalDays: number;
      employees: Set<string>;
    }>();

    for (const absence of absences) {
      const employee = this.employees.get(absence.employeeId);
      if (employee) {
        const deptData = byDepartmentMap.get(employee.departmentId) || {
          departmentName: 'Unknown',
          totalDays: 0,
          employees: new Set<string>()
        };
        deptData.totalDays += absence.hours / 8;
        deptData.employees.add(absence.employeeId);
        byDepartmentMap.set(employee.departmentId, deptData);
      }
    }

    const byDepartment: AbsenceByDepartment[] = Array.from(byDepartmentMap.entries())
      .map(([deptId, data]) => ({
        departmentId: deptId,
        departmentName: data.departmentName,
        totalDays: data.totalDays,
        averagePerEmployee: data.employees.size > 0 ? data.totalDays / data.employees.size : 0,
        absenteeismRate: this.calculateAbsenteeismRate(deptId, period, data.totalDays)
      }));

    // Calculate Bradford Factor
    const bradfordFactor = this.calculateBradfordFactors(period);

    // Calculate overall absenteeism rate
    const totalEmployees = this.employees.size;
    const totalWorkingDays = this.calculateWorkingDays(period.startDate, period.endDate);
    const absenteeismRate = totalEmployees > 0 && totalWorkingDays > 0
      ? (totalAbsenceDays / (totalEmployees * totalWorkingDays)) * 100
      : 0;

    return {
      period,
      totalAbsenceDays,
      byType,
      byDepartment,
      absenteeismRate,
      bradfordFactor
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Set employee data (for service initialization)
   */
  setEmployee(employee: Employee): void {
    this.employees.set(employee.id, employee);
  }

  /**
   * Add holidays to the calendar
   */
  addHolidays(holidays: Date[]): void {
    this.holidays.push(...holidays);
  }

  /**
   * Check if a date is a holiday
   */
  private isHoliday(date: Date): boolean {
    return this.holidays.some(h =>
      h.getFullYear() === date.getFullYear() &&
      h.getMonth() === date.getMonth() &&
      h.getDate() === date.getDate()
    );
  }

  /**
   * Calculate calendar days between two dates
   */
  private calculateCalendarDays(startDate: Date, endDate: Date): number {
    const diffTime = endDate.getTime() - startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }

  /**
   * Check for overlapping leave requests
   */
  private async checkOverlappingRequests(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<boolean> {
    const existingRequests = Array.from(this.leaveRequests.values())
      .filter(r =>
        r.employeeId === employeeId &&
        r.status !== 'REJECTED' &&
        r.status !== 'CANCELLED'
      );

    for (const request of existingRequests) {
      // Check if dates overlap
      if (startDate <= request.endDate && endDate >= request.startDate) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate initial leave balance for an employee
   */
  private calculateInitialBalance(employee: Employee, year: number): LeaveBalance {
    const balances: LeaveTypeBalance[] = [];

    // Calculate vacation entitlement (prorated if hired mid-year)
    const hireDate = employee.hireDate;

    let vacationEntitlement = LEAVE_ENTITLEMENTS[LeaveType.VACACIONES] || 22;

    if (hireDate.getFullYear() === year) {
      // Prorate for first year
      const monthsWorked = 12 - hireDate.getMonth();
      vacationEntitlement = Math.round((vacationEntitlement * monthsWorked) / 12);
    }

    balances.push({
      type: LeaveType.VACACIONES,
      entitled: vacationEntitlement,
      taken: 0,
      pending: 0,
      remaining: vacationEntitlement
    });

    // Add other leave types with their entitlements
    for (const [type, entitlement] of Object.entries(LEAVE_ENTITLEMENTS)) {
      if (type !== LeaveType.VACACIONES && entitlement !== null) {
        balances.push({
          type: type as LeaveType,
          entitled: entitlement,
          taken: 0,
          pending: 0,
          remaining: entitlement
        });
      }
    }

    // Add asuntos propios based on collective agreement (default: 0)
    balances.push({
      type: LeaveType.ASUNTOS_PROPIOS,
      entitled: 0, // Should come from collective agreement
      taken: 0,
      pending: 0,
      remaining: 0
    });

    return {
      employeeId: employee.id,
      year,
      balances,
      lastUpdated: new Date()
    };
  }

  /**
   * Update pending balance when leave is requested
   */
  private async updatePendingBalance(
    employeeId: string,
    type: LeaveType,
    days: number
  ): Promise<void> {
    const year = new Date().getFullYear();
    const balanceKey = `${employeeId}-${year}`;
    const balance = this.leaveBalances.get(balanceKey);

    if (balance) {
      const typeBalance = balance.balances.find(b => b.type === type);
      if (typeBalance) {
        typeBalance.pending += days;
        typeBalance.remaining = typeBalance.entitled - typeBalance.taken - typeBalance.pending;
      }
      balance.lastUpdated = new Date();
      this.leaveBalances.set(balanceKey, balance);
    }
  }

  /**
   * Confirm leave balance when approved
   */
  private async confirmLeaveBalance(
    employeeId: string,
    type: LeaveType,
    days: number
  ): Promise<void> {
    const year = new Date().getFullYear();
    const balanceKey = `${employeeId}-${year}`;
    const balance = this.leaveBalances.get(balanceKey);

    if (balance) {
      const typeBalance = balance.balances.find(b => b.type === type);
      if (typeBalance) {
        typeBalance.pending = Math.max(0, typeBalance.pending - days);
        typeBalance.taken += days;
        typeBalance.remaining = typeBalance.entitled - typeBalance.taken - typeBalance.pending;
      }
      balance.lastUpdated = new Date();
      this.leaveBalances.set(balanceKey, balance);
    }
  }

  /**
   * Restore pending balance when rejected
   */
  private async restorePendingBalance(
    employeeId: string,
    type: LeaveType,
    days: number
  ): Promise<void> {
    const year = new Date().getFullYear();
    const balanceKey = `${employeeId}-${year}`;
    const balance = this.leaveBalances.get(balanceKey);

    if (balance) {
      const typeBalance = balance.balances.find(b => b.type === type);
      if (typeBalance) {
        typeBalance.pending = Math.max(0, typeBalance.pending - days);
        typeBalance.remaining = typeBalance.entitled - typeBalance.taken - typeBalance.pending;
      }
      balance.lastUpdated = new Date();
      this.leaveBalances.set(balanceKey, balance);
    }
  }

  /**
   * Create absence records for approved leave
   */
  private async createAbsenceRecords(request: LeaveRequest): Promise<void> {
    const current = new Date(request.startDate);

    while (current <= request.endDate) {
      const dayOfWeek = current.getDay();

      // Only create for working days
      if (dayOfWeek !== 0 && dayOfWeek !== 6 && !this.isHoliday(current)) {
        let hours = 8;

        // Half days
        if (
          (current.getTime() === request.startDate.getTime() && request.startHalfDay) ||
          (current.getTime() === request.endDate.getTime() && request.endHalfDay)
        ) {
          hours = 4;
        }

        const isPaid = this.isLeaveTypePaid(request.type);

        const absence: Absence = {
          id: uuidv4(),
          employeeId: request.employeeId,
          leaveRequestId: request.id,
          type: request.type,
          date: new Date(current),
          hours,
          isPaid,
          affectsVacation: false
        };

        this.absences.set(absence.id, absence);
      }

      current.setDate(current.getDate() + 1);
    }
  }

  /**
   * Check if a leave type is paid
   */
  private isLeaveTypePaid(type: LeaveType): boolean {
    const unpaidTypes = [
      LeaveType.PERMISO_SIN_SUELDO,
      LeaveType.EXCEDENCIA
    ];
    return !unpaidTypes.includes(type);
  }

  /**
   * Calculate absenteeism rate for a department
   */
  private calculateAbsenteeismRate(
    departmentId: string,
    period: DateRange,
    totalAbsenceDays: number
  ): number {
    const deptEmployees = Array.from(this.employees.values())
      .filter(e => e.departmentId === departmentId);

    const workingDays = this.calculateWorkingDays(period.startDate, period.endDate);
    const totalPossibleDays = deptEmployees.length * workingDays;

    return totalPossibleDays > 0
      ? (totalAbsenceDays / totalPossibleDays) * 100
      : 0;
  }

  /**
   * Calculate Bradford Factors for all employees
   */
  private calculateBradfordFactors(period: DateRange): BradfordFactorResult[] {
    const results: BradfordFactorResult[] = [];

    for (const employee of this.employees.values()) {
      // Get absence spells (distinct periods of absence)
      const employeeAbsences = Array.from(this.absences.values())
        .filter(a =>
          a.employeeId === employee.id &&
          a.date >= period.startDate &&
          a.date <= period.endDate
        )
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      // Count spells and days
      let spells = 0;
      let days = 0;
      let lastAbsenceDate: Date | null = null;

      for (const absence of employeeAbsences) {
        days += absence.hours / 8;

        // New spell if gap > 1 day
        if (!lastAbsenceDate || this.daysBetween(lastAbsenceDate, absence.date) > 1) {
          spells++;
        }
        lastAbsenceDate = absence.date;
      }

      if (spells > 0 || days > 0) {
        // Bradford Factor = S^2 * D (where S = spells, D = days)
        const bradfordFactor = Math.pow(spells, 2) * days;

        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        if (bradfordFactor < 50) riskLevel = 'LOW';
        else if (bradfordFactor < 200) riskLevel = 'MEDIUM';
        else if (bradfordFactor < 500) riskLevel = 'HIGH';
        else riskLevel = 'CRITICAL';

        results.push({
          employeeId: employee.id,
          employeeName: `${employee.firstName} ${employee.lastName}`,
          spells,
          days,
          bradfordFactor,
          riskLevel
        });
      }
    }

    return results.sort((a, b) => b.bradfordFactor - a.bradfordFactor);
  }

  /**
   * Calculate days between two dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
