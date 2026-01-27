/**
 * Payroll Service - Spanish payroll calculations including IRPF and Social Security
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Payslip,
  PayrollPeriod,
  PayrollStatus,
  SalaryComponentType,
  PayslipLine,
  IRPFCalculation,
  SocialSecurityCalculation,
  SEPAPayment,
  PayrollSummary,
  DepartmentPayrollSummary,
  CostCenterPayrollSummary,
  Employee,
  Contract,
  PersonalSituation,
  Period,
  OperationResult
} from '../types';

/**
 * IRPF tax brackets for 2024 (General State + Autonomic)
 */
const IRPF_BRACKETS_2024 = [
  { min: 0, max: 12450, stateRate: 9.5, autonomicRate: 9.5 },
  { min: 12450, max: 20200, stateRate: 12, autonomicRate: 12 },
  { min: 20200, max: 35200, stateRate: 15, autonomicRate: 15 },
  { min: 35200, max: 60000, stateRate: 18.5, autonomicRate: 18.5 },
  { min: 60000, max: 300000, stateRate: 22.5, autonomicRate: 22.5 },
  { min: 300000, max: Infinity, stateRate: 24.5, autonomicRate: 22.5 }
];

/**
 * Minimum exempt amounts by family situation (2024)
 */
const MINIMUM_EXEMPT = {
  personal: 5550,
  over65: 1150,
  over75: 1400,
  descendant1: 2400,
  descendant2: 2700,
  descendant3: 4000,
  descendant4Plus: 4500,
  descendantUnder3: 2800,
  ascendant: 1150,
  ascendantOver75: 1400,
  disability33to65: 3000,
  disability65Plus: 9000,
  disabilityHelp: 3000
};

/**
 * Social Security contribution rates 2024
 */
const SS_RATES = {
  contingenciasComunes: {
    employee: 4.7,
    employer: 23.6
  },
  desempleo: {
    indefinido: { employee: 1.55, employer: 5.5 },
    temporal: { employee: 1.6, employer: 6.7 }
  },
  formacion: {
    employee: 0.1,
    employer: 0.6
  },
  fogasa: {
    employer: 0.2
  },
  mecanismoEquidad: {
    employer: 0.5
  },
  horasExtra: {
    fuerzaMayor: { employee: 2.0, employer: 12.0 },
    normal: { employee: 4.7, employer: 23.6 }
  }
};

/**
 * Contribution groups (Grupos de cotización) 2024
 */
const CONTRIBUTION_GROUPS = {
  '1': { min: 1847.40, max: 4720.50, description: 'Ingenieros y Licenciados' },
  '2': { min: 1532.10, max: 4720.50, description: 'Ingenieros Técnicos, Peritos' },
  '3': { min: 1332.90, max: 4720.50, description: 'Jefes Administrativos y de Taller' },
  '4': { min: 1323.00, max: 4720.50, description: 'Ayudantes no Titulados' },
  '5': { min: 1323.00, max: 4720.50, description: 'Oficiales Administrativos' },
  '6': { min: 1323.00, max: 4720.50, description: 'Subalternos' },
  '7': { min: 1323.00, max: 4720.50, description: 'Auxiliares Administrativos' },
  '8': { min: 44.10, max: 157.35, description: 'Oficiales 1ª y 2ª (diario)' },
  '9': { min: 44.10, max: 157.35, description: 'Oficiales 3ª y Especialistas (diario)' },
  '10': { min: 44.10, max: 157.35, description: 'Peones (diario)' },
  '11': { min: 44.10, max: 157.35, description: 'Trabajadores < 18 años (diario)' }
};

/**
 * Payroll Service implementation
 */
export class PayrollService {
  private payslips: Map<string, Payslip> = new Map();
  private payrollPeriods: Map<string, PayrollPeriod> = new Map();
  private employees: Map<string, Employee> = new Map();
  private contracts: Map<string, Contract> = new Map();

  constructor() {
    // Initialize - in production, inject repositories
  }

  /**
   * Calculate payslip for an employee and period
   */
  async calculatePayslip(
    employeeId: string,
    period: Period
  ): Promise<OperationResult<Payslip>> {
    try {
      const employee = this.employees.get(employeeId);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      const contract = this.getActiveContract(employeeId);
      if (!contract) {
        return {
          success: false,
          error: 'El empleado no tiene contrato activo',
          code: 'NO_ACTIVE_CONTRACT'
        };
      }

      // Calculate earnings (devengos)
      const earnings = this.calculateEarnings(contract, period);
      const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);

      // Calculate gross salary for SS and IRPF
      const grossSalary = this.calculateGrossForPeriod(contract, period);

      // Calculate Social Security
      const ssCalculation = this.calculateSocialSecurity(
        grossSalary,
        contract.contributionGroup.code,
        contract.type
      );

      // Calculate IRPF
      const irpfCalculation = this.calculateIRPF(
        contract.grossAnnualSalary,
        employee.personalSituation
      );

      // Build deductions
      const deductions: PayslipLine[] = [
        {
          componentType: SalaryComponentType.SEGURIDAD_SOCIAL_TRABAJADOR,
          description: 'Contingencias Comunes',
          amount: ssCalculation.contingenciasComunes.employeeAmount,
          isDeduction: true
        },
        {
          componentType: SalaryComponentType.SEGURIDAD_SOCIAL_TRABAJADOR,
          description: 'Desempleo',
          amount: ssCalculation.desempleo.employeeAmount,
          isDeduction: true
        },
        {
          componentType: SalaryComponentType.SEGURIDAD_SOCIAL_TRABAJADOR,
          description: 'Formación Profesional',
          amount: ssCalculation.formacion.employeeAmount,
          isDeduction: true
        },
        {
          componentType: SalaryComponentType.IRPF,
          description: `IRPF (${irpfCalculation.retentionPercentage.toFixed(2)}%)`,
          amount: irpfCalculation.monthlyRetention,
          isDeduction: true
        }
      ];

      const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
      const netSalary = totalEarnings - totalDeductions;

      const payslip: Payslip = {
        id: uuidv4(),
        employeeId,
        periodId: this.getPeriodId(period),
        employeeData: {
          employeeNumber: employee.employeeNumber,
          fullName: `${employee.firstName} ${employee.lastName}${employee.secondLastName ? ' ' + employee.secondLastName : ''}`,
          dni: employee.dni,
          naf: employee.naf,
          category: contract.professionalGroup,
          contributionGroup: contract.contributionGroup.code,
          startDate: contract.startDate,
          seniorityDate: employee.seniorityDate
        },
        earnings,
        totalEarnings,
        deductions,
        totalDeductions,
        grossSalary,
        socialSecurityBase: ssCalculation.contributionBase,
        irpfBase: irpfCalculation.taxableBase,
        irpfPercentage: irpfCalculation.retentionPercentage,
        irpfAmount: irpfCalculation.monthlyRetention,
        socialSecurityEmployee: ssCalculation.totalEmployee,
        socialSecurityEmployer: ssCalculation.totalEmployer,
        netSalary,
        status: PayrollStatus.CALCULATED,
        generatedAt: new Date()
      };

      this.payslips.set(payslip.id, payslip);

      return {
        success: true,
        data: payslip
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al calcular nómina: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CALCULATION_ERROR'
      };
    }
  }

  /**
   * Generate payroll for all active employees in a period
   */
  async generatePayroll(period: Period): Promise<OperationResult<PayrollPeriod>> {
    try {
      const periodId = this.getPeriodId(period);

      // Check if already exists
      if (this.payrollPeriods.has(periodId)) {
        return {
          success: false,
          error: 'Ya existe una nómina para este período',
          code: 'PAYROLL_EXISTS'
        };
      }

      const activeEmployees = Array.from(this.employees.values())
        .filter(e => e.status === 'ACTIVE' || e.status === 'PROBATION');

      let totalGross = 0;
      let totalDeductions = 0;
      let totalNet = 0;
      let successCount = 0;

      for (const employee of activeEmployees) {
        const result = await this.calculatePayslip(employee.id, period);
        if (result.success && result.data) {
          totalGross += result.data.totalEarnings;
          totalDeductions += result.data.totalDeductions;
          totalNet += result.data.netSalary;
          successCount++;
        }
      }

      const payrollPeriod: PayrollPeriod = {
        id: periodId,
        year: period.year,
        month: period.month,
        type: this.determinePayrollType(period),
        startDate: new Date(period.year, period.month - 1, 1),
        endDate: new Date(period.year, period.month, 0),
        paymentDate: this.calculatePaymentDate(period),
        status: PayrollStatus.CALCULATED,
        totalGross,
        totalDeductions,
        totalNet,
        employeeCount: successCount,
        createdAt: new Date()
      };

      this.payrollPeriods.set(periodId, payrollPeriod);

      return {
        success: true,
        data: payrollPeriod
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar nóminas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'GENERATION_ERROR'
      };
    }
  }

  /**
   * Process payroll (approve and mark for payment)
   */
  async processPayroll(payrollId: string): Promise<OperationResult<PayrollPeriod>> {
    try {
      const payroll = this.payrollPeriods.get(payrollId);
      if (!payroll) {
        return {
          success: false,
          error: 'Nómina no encontrada',
          code: 'PAYROLL_NOT_FOUND'
        };
      }

      if (payroll.status !== PayrollStatus.CALCULATED && payroll.status !== PayrollStatus.APPROVED) {
        return {
          success: false,
          error: `No se puede procesar una nómina en estado ${payroll.status}`,
          code: 'INVALID_STATUS'
        };
      }

      // Update all payslips for this period
      const payslips = Array.from(this.payslips.values())
        .filter(p => p.periodId === payrollId);

      for (const payslip of payslips) {
        payslip.status = PayrollStatus.PROCESSING;
        this.payslips.set(payslip.id, payslip);
      }

      const updatedPayroll: PayrollPeriod = {
        ...payroll,
        status: PayrollStatus.PROCESSING,
        processedAt: new Date()
      };

      this.payrollPeriods.set(payrollId, updatedPayroll);

      return {
        success: true,
        data: updatedPayroll
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al procesar nómina: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'PROCESS_ERROR'
      };
    }
  }

  /**
   * Get payslip for an employee and period
   */
  async getPayslip(employeeId: string, period: Period): Promise<OperationResult<Payslip>> {
    const periodId = this.getPeriodId(period);
    const payslip = Array.from(this.payslips.values())
      .find(p => p.employeeId === employeeId && p.periodId === periodId);

    if (!payslip) {
      return {
        success: false,
        error: 'Nómina no encontrada',
        code: 'PAYSLIP_NOT_FOUND'
      };
    }

    return {
      success: true,
      data: payslip
    };
  }

  /**
   * Calculate IRPF retention based on Spanish tax law
   */
  calculateIRPF(grossAnnualSalary: number, personalSituation: PersonalSituation): IRPFCalculation {
    // Calculate reductions
    const reductions: { concept: string; amount: number }[] = [];

    // Minimum personal amount
    let minimumPersonal = MINIMUM_EXEMPT.personal;
    if (personalSituation.disability >= 33 && personalSituation.disability < 65) {
      minimumPersonal += MINIMUM_EXEMPT.disability33to65;
    } else if (personalSituation.disability >= 65) {
      minimumPersonal += MINIMUM_EXEMPT.disability65Plus;
    }

    reductions.push({ concept: 'Mínimo personal', amount: minimumPersonal });

    // Descendants
    personalSituation.descendants.forEach((desc, index) => {
      const age = this.calculateAge(desc.birthDate);
      let amount = 0;

      if (index === 0) amount = MINIMUM_EXEMPT.descendant1;
      else if (index === 1) amount = MINIMUM_EXEMPT.descendant2;
      else if (index === 2) amount = MINIMUM_EXEMPT.descendant3;
      else amount = MINIMUM_EXEMPT.descendant4Plus;

      if (age < 3) amount += MINIMUM_EXEMPT.descendantUnder3;
      if (desc.disability >= 33) amount += MINIMUM_EXEMPT.disability33to65;
      if (desc.sharedCustody) amount /= 2;

      reductions.push({ concept: `Descendiente ${index + 1}`, amount });
    });

    // Ascendants
    personalSituation.ascendants.forEach((asc, index) => {
      if (asc.livesWithEmployee && asc.age >= 65) {
        let amount = MINIMUM_EXEMPT.ascendant;
        if (asc.age >= 75) amount += MINIMUM_EXEMPT.ascendantOver75;
        if (asc.disability >= 33) amount += MINIMUM_EXEMPT.disability33to65;

        reductions.push({ concept: `Ascendiente ${index + 1}`, amount });
      }
    });

    // Calculate work-related expenses reduction (gastos deducibles)
    const workExpenses = Math.min(2000, grossAnnualSalary * 0.05);
    reductions.push({ concept: 'Gastos trabajo', amount: workExpenses });

    // Geographic mobility bonus
    if (personalSituation.geographicMobility) {
      reductions.push({ concept: 'Movilidad geográfica', amount: 2000 });
    }

    const totalReductions = reductions.reduce((sum, r) => sum + r.amount, 0);
    const taxableBase = Math.max(0, grossAnnualSalary - workExpenses);
    const liquidBase = Math.max(0, taxableBase - (totalReductions - workExpenses));

    // Calculate tax using brackets
    let stateQuota = 0;
    let autonomicQuota = 0;
    let remainingBase = liquidBase;

    for (const bracket of IRPF_BRACKETS_2024) {
      if (remainingBase <= 0) break;

      const bracketSize = bracket.max - bracket.min;
      const taxableInBracket = Math.min(remainingBase, bracketSize);

      stateQuota += (taxableInBracket * bracket.stateRate) / 100;
      autonomicQuota += (taxableInBracket * bracket.autonomicRate) / 100;

      remainingBase -= taxableInBracket;
    }

    const totalQuota = stateQuota + autonomicQuota;

    // Calculate deductions
    const deductions: { concept: string; amount: number }[] = [];

    // Minimum exempt quota calculation
    const minimumExemptTotal = totalReductions - workExpenses;
    let minimumExemptQuota = 0;
    let remainingMinimum = minimumExemptTotal;

    for (const bracket of IRPF_BRACKETS_2024) {
      if (remainingMinimum <= 0) break;

      const bracketSize = bracket.max - bracket.min;
      const inBracket = Math.min(remainingMinimum, bracketSize);

      minimumExemptQuota += (inBracket * (bracket.stateRate + bracket.autonomicRate)) / 100;
      remainingMinimum -= inBracket;
    }

    deductions.push({ concept: 'Mínimos personales y familiares', amount: minimumExemptQuota });

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const finalQuota = Math.max(0, totalQuota - totalDeductions);

    // Calculate retention percentage
    const retentionPercentage = grossAnnualSalary > 0
      ? (finalQuota / grossAnnualSalary) * 100
      : 0;

    // Monthly retention
    const monthlyRetention = finalQuota / 12;

    return {
      grossAnnual: grossAnnualSalary,
      exemptIncome: 0,
      taxableBase,
      reductions,
      totalReductions,
      liquidBase,
      generalQuota: stateQuota,
      autonomicQuota,
      totalQuota,
      deductions,
      totalDeductions,
      finalQuota,
      retentionPercentage: Math.round(retentionPercentage * 100) / 100,
      monthlyRetention: Math.round(monthlyRetention * 100) / 100
    };
  }

  /**
   * Calculate Social Security contributions
   */
  calculateSocialSecurity(
    grossMonthlySalary: number,
    contributionGroupCode: string,
    contractType: string
  ): SocialSecurityCalculation {
    const group = CONTRIBUTION_GROUPS[contributionGroupCode as keyof typeof CONTRIBUTION_GROUPS]
      || CONTRIBUTION_GROUPS['7'];

    // Apply min/max bases
    const contributionBase = Math.max(group.min, Math.min(group.max, grossMonthlySalary));

    // Determine if contract is indefinite or temporary
    const isIndefinite = contractType.includes('INDEFINIDO');
    const desempleoRates = isIndefinite
      ? SS_RATES.desempleo.indefinido
      : SS_RATES.desempleo.temporal;

    // Calculate each component
    const contingenciasComunes = {
      base: contributionBase,
      employeeRate: SS_RATES.contingenciasComunes.employee,
      employeeAmount: this.roundCurrency(contributionBase * SS_RATES.contingenciasComunes.employee / 100),
      employerRate: SS_RATES.contingenciasComunes.employer,
      employerAmount: this.roundCurrency(contributionBase * SS_RATES.contingenciasComunes.employer / 100)
    };

    const desempleo = {
      base: contributionBase,
      employeeRate: desempleoRates.employee,
      employeeAmount: this.roundCurrency(contributionBase * desempleoRates.employee / 100),
      employerRate: desempleoRates.employer,
      employerAmount: this.roundCurrency(contributionBase * desempleoRates.employer / 100)
    };

    const formacion = {
      base: contributionBase,
      employeeRate: SS_RATES.formacion.employee,
      employeeAmount: this.roundCurrency(contributionBase * SS_RATES.formacion.employee / 100),
      employerRate: SS_RATES.formacion.employer,
      employerAmount: this.roundCurrency(contributionBase * SS_RATES.formacion.employer / 100)
    };

    // FOGASA and MEI (employer only)
    const fogasaAmount = this.roundCurrency(contributionBase * SS_RATES.fogasa.employer / 100);
    const meiAmount = this.roundCurrency(contributionBase * SS_RATES.mecanismoEquidad.employer / 100);

    const totalEmployee = contingenciasComunes.employeeAmount
      + desempleo.employeeAmount
      + formacion.employeeAmount;

    const totalEmployer = contingenciasComunes.employerAmount
      + desempleo.employerAmount
      + formacion.employerAmount
      + fogasaAmount
      + meiAmount;

    return {
      contributionBase,
      contingenciasComunes,
      desempleo,
      formacion,
      totalEmployee: this.roundCurrency(totalEmployee),
      totalEmployer: this.roundCurrency(totalEmployer)
    };
  }

  /**
   * Generate SEPA payment file for payroll
   */
  async generateSEPA(payrollId: string): Promise<OperationResult<SEPAPayment>> {
    try {
      const payroll = this.payrollPeriods.get(payrollId);
      if (!payroll) {
        return {
          success: false,
          error: 'Nómina no encontrada',
          code: 'PAYROLL_NOT_FOUND'
        };
      }

      const payslips = Array.from(this.payslips.values())
        .filter(p => p.periodId === payrollId && p.status !== PayrollStatus.CANCELLED);

      // Generate SEPA XML content
      const sepaContent = this.generateSEPAXML(payslips, payroll);

      const sepaPayment: SEPAPayment = {
        id: uuidv4(),
        payrollId,
        fileContent: sepaContent,
        fileName: `SEPA_${payroll.year}${String(payroll.month).padStart(2, '0')}.xml`,
        totalAmount: payroll.totalNet,
        numberOfTransactions: payslips.length,
        generatedAt: new Date()
      };

      return {
        success: true,
        data: sepaPayment
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al generar fichero SEPA: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SEPA_ERROR'
      };
    }
  }

  /**
   * Get payroll summary with aggregations
   */
  async getPayrollSummary(period: Period): Promise<OperationResult<PayrollSummary>> {
    try {
      const periodId = this.getPeriodId(period);
      const payroll = this.payrollPeriods.get(periodId);

      if (!payroll) {
        return {
          success: false,
          error: 'Nómina no encontrada para este período',
          code: 'PAYROLL_NOT_FOUND'
        };
      }

      const payslips = Array.from(this.payslips.values())
        .filter(p => p.periodId === periodId);

      // Calculate totals
      let totalGross = 0;
      let totalNet = 0;
      let totalIRPF = 0;
      let totalSSEmployee = 0;
      let totalSSEmployer = 0;

      const departmentMap = new Map<string, DepartmentPayrollSummary>();
      const costCenterMap = new Map<string, CostCenterPayrollSummary>();

      for (const payslip of payslips) {
        totalGross += payslip.totalEarnings;
        totalNet += payslip.netSalary;
        totalIRPF += payslip.irpfAmount;
        totalSSEmployee += payslip.socialSecurityEmployee;
        totalSSEmployer += payslip.socialSecurityEmployer;

        const employee = this.employees.get(payslip.employeeId);
        if (employee) {
          // Aggregate by department
          const deptSummary = departmentMap.get(employee.departmentId) || {
            departmentId: employee.departmentId,
            departmentName: 'Unknown',
            employeeCount: 0,
            totalGross: 0,
            totalNet: 0
          };
          deptSummary.employeeCount++;
          deptSummary.totalGross += payslip.totalEarnings;
          deptSummary.totalNet += payslip.netSalary;
          departmentMap.set(employee.departmentId, deptSummary);

          // Aggregate by cost center
          if (employee.costCenterId) {
            const ccSummary = costCenterMap.get(employee.costCenterId) || {
              costCenterId: employee.costCenterId,
              costCenterName: 'Unknown',
              totalCost: 0
            };
            ccSummary.totalCost += payslip.totalEarnings + payslip.socialSecurityEmployer;
            costCenterMap.set(employee.costCenterId, ccSummary);
          }
        }
      }

      const summary: PayrollSummary = {
        period: payroll,
        totalGross: this.roundCurrency(totalGross),
        totalNet: this.roundCurrency(totalNet),
        totalIRPF: this.roundCurrency(totalIRPF),
        totalSSEmployee: this.roundCurrency(totalSSEmployee),
        totalSSEmployer: this.roundCurrency(totalSSEmployer),
        byDepartment: Array.from(departmentMap.values()),
        byCostCenter: Array.from(costCenterMap.values())
      };

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al obtener resumen: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'SUMMARY_ERROR'
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
   * Set contract data (for service initialization)
   */
  setContract(contract: Contract): void {
    this.contracts.set(contract.id, contract);
  }

  /**
   * Get active contract for employee
   */
  private getActiveContract(employeeId: string): Contract | undefined {
    return Array.from(this.contracts.values())
      .find(c => c.employeeId === employeeId && c.isActive);
  }

  /**
   * Calculate earnings for a period
   */
  private calculateEarnings(contract: Contract, _period: Period): PayslipLine[] {
    const earnings: PayslipLine[] = [];
    const monthlyBase = contract.grossAnnualSalary / contract.numberOfPayments;

    // Base salary
    earnings.push({
      componentType: SalaryComponentType.SALARIO_BASE,
      description: 'Salario Base',
      amount: this.roundCurrency(monthlyBase * 0.7), // Base is typically 70% of total
      isDeduction: false
    });

    // Process additional components
    for (const component of contract.salaryComponents) {
      if (!component.isDeduction) {
        let amount = component.amount;

        // Handle frequency
        if (component.frequency === 'ANNUAL') {
          amount = component.amount / 12;
        } else if (component.frequency === 'QUARTERLY') {
          amount = component.amount / 3;
        }

        earnings.push({
          componentType: component.type,
          description: component.name,
          amount: this.roundCurrency(amount),
          isDeduction: false
        });
      }
    }

    return earnings;
  }

  /**
   * Calculate gross salary for period
   */
  private calculateGrossForPeriod(contract: Contract, _period: Period): number {
    return this.roundCurrency(contract.grossAnnualSalary / contract.numberOfPayments);
  }

  /**
   * Generate period ID
   */
  private getPeriodId(period: Period): string {
    return `${period.year}-${String(period.month).padStart(2, '0')}`;
  }

  /**
   * Determine payroll type
   */
  private determinePayrollType(period: Period): 'ORDINARY' | 'EXTRA_JUNE' | 'EXTRA_DECEMBER' | 'SETTLEMENT' {
    if (period.month === 6) return 'EXTRA_JUNE';
    if (period.month === 12) return 'EXTRA_DECEMBER';
    return 'ORDINARY';
  }

  /**
   * Calculate payment date (last business day of month)
   */
  private calculatePaymentDate(period: Period): Date {
    const lastDay = new Date(period.year, period.month, 0);
    const dayOfWeek = lastDay.getDay();

    // If Saturday, move to Friday
    if (dayOfWeek === 6) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    // If Sunday, move to Friday
    else if (dayOfWeek === 0) {
      lastDay.setDate(lastDay.getDate() - 2);
    }

    return lastDay;
  }

  /**
   * Calculate age from birth date
   */
  private calculateAge(birthDate: Date): number {
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Round to 2 decimal places for currency
   */
  private roundCurrency(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /**
   * Generate SEPA XML content (simplified)
   */
  private generateSEPAXML(payslips: Payslip[], payroll: PayrollPeriod): string {
    const messageId = `MSG${Date.now()}`;
    const creationDateTime = new Date().toISOString();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03">
  <CstmrCdtTrfInitn>
    <GrpHdr>
      <MsgId>${messageId}</MsgId>
      <CreDtTm>${creationDateTime}</CreDtTm>
      <NbOfTxs>${payslips.length}</NbOfTxs>
      <CtrlSum>${payroll.totalNet.toFixed(2)}</CtrlSum>
      <InitgPty>
        <Nm>Company Name</Nm>
      </InitgPty>
    </GrpHdr>
    <PmtInf>
      <PmtInfId>PMT${Date.now()}</PmtInfId>
      <PmtMtd>TRF</PmtMtd>
      <NbOfTxs>${payslips.length}</NbOfTxs>
      <CtrlSum>${payroll.totalNet.toFixed(2)}</CtrlSum>
      <ReqdExctnDt>${payroll.paymentDate.toISOString().split('T')[0]}</ReqdExctnDt>
      <Dbtr>
        <Nm>Company Name</Nm>
      </Dbtr>
      <DbtrAcct>
        <Id>
          <IBAN>ES0000000000000000000000</IBAN>
        </Id>
      </DbtrAcct>
      <DbtrAgt>
        <FinInstnId>
          <BIC>BANKESXX</BIC>
        </FinInstnId>
      </DbtrAgt>`;

    for (const payslip of payslips) {
      const employee = this.employees.get(payslip.employeeId);
      if (employee) {
        xml += `
      <CdtTrfTxInf>
        <PmtId>
          <EndToEndId>${payslip.id.substring(0, 35)}</EndToEndId>
        </PmtId>
        <Amt>
          <InstdAmt Ccy="EUR">${payslip.netSalary.toFixed(2)}</InstdAmt>
        </Amt>
        <CdtrAgt>
          <FinInstnId>
            <BIC>${employee.bankAccount.bic || 'BANKESXX'}</BIC>
          </FinInstnId>
        </CdtrAgt>
        <Cdtr>
          <Nm>${payslip.employeeData.fullName}</Nm>
        </Cdtr>
        <CdtrAcct>
          <Id>
            <IBAN>${employee.bankAccount.iban}</IBAN>
          </Id>
        </CdtrAcct>
        <RmtInf>
          <Ustrd>Nomina ${payroll.month}/${payroll.year}</Ustrd>
        </RmtInf>
      </CdtTrfTxInf>`;
      }
    }

    xml += `
    </PmtInf>
  </CstmrCdtTrfInitn>
</Document>`;

    return xml;
  }
}
