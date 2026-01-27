/**
 * Employee Service - Manages employee lifecycle and organization structure
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Employee,
  EmployeeStatus,
  Department,
  Position,
  Contract,
  OrgChartNode,
  EmployeeSearchQuery,
  PaginatedResult,
  OperationResult,
  Address,
  PersonalSituation,
  BankAccount
} from '../types';

/**
 * Employee creation data
 */
export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  secondLastName?: string;
  dni: string;
  nie?: string;
  naf: string;
  birthDate: Date;
  nationality: string;
  gender: 'M' | 'F' | 'O';
  email: string;
  personalEmail?: string;
  phone: string;
  mobilePhone?: string;
  address: Address;
  departmentId: string;
  positionId: string;
  managerId?: string;
  hireDate: Date;
  seniorityDate?: Date;
  workCenterId: string;
  costCenterId?: string;
  personalSituation: PersonalSituation;
  bankAccount: BankAccount;
}

/**
 * Employee update data
 */
export interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  secondLastName?: string;
  email?: string;
  personalEmail?: string;
  phone?: string;
  mobilePhone?: string;
  address?: Address;
  personalSituation?: PersonalSituation;
  bankAccount?: BankAccount;
  photo?: string;
}

/**
 * Transfer data
 */
export interface TransferData {
  newDepartmentId: string;
  newPositionId: string;
  effectiveDate: Date;
  reason?: string;
  salaryChange?: number;
}

/**
 * Employee Service implementation
 */
export class EmployeeService {
  private employees: Map<string, Employee> = new Map();
  private departments: Map<string, Department> = new Map();
  private positions: Map<string, Position> = new Map();
  private contracts: Map<string, Contract> = new Map();

  constructor() {
    // Initialize with empty stores - in production, inject repositories
  }

  /**
   * Create a new employee
   */
  async create(data: CreateEmployeeData): Promise<OperationResult<Employee>> {
    try {
      // Validate DNI/NIE format
      if (!this.validateDNI(data.dni) && !this.validateNIE(data.nie)) {
        return {
          success: false,
          error: 'DNI o NIE inválido',
          code: 'INVALID_IDENTIFICATION'
        };
      }

      // Validate NAF format
      if (!this.validateNAF(data.naf)) {
        return {
          success: false,
          error: 'Número de afiliación a la Seguridad Social inválido',
          code: 'INVALID_NAF'
        };
      }

      // Validate IBAN
      if (!this.validateIBAN(data.bankAccount.iban)) {
        return {
          success: false,
          error: 'IBAN inválido',
          code: 'INVALID_IBAN'
        };
      }

      // Check for duplicate DNI
      const existingEmployee = Array.from(this.employees.values()).find(
        e => e.dni === data.dni && e.status !== EmployeeStatus.TERMINATED
      );
      if (existingEmployee) {
        return {
          success: false,
          error: 'Ya existe un empleado con este DNI',
          code: 'DUPLICATE_DNI'
        };
      }

      // Validate department exists
      if (!this.departments.has(data.departmentId)) {
        return {
          success: false,
          error: 'Departamento no encontrado',
          code: 'DEPARTMENT_NOT_FOUND'
        };
      }

      // Validate position exists
      if (!this.positions.has(data.positionId)) {
        return {
          success: false,
          error: 'Puesto no encontrado',
          code: 'POSITION_NOT_FOUND'
        };
      }

      const now = new Date();
      const employeeNumber = this.generateEmployeeNumber();

      const employee: Employee = {
        id: uuidv4(),
        firstName: data.firstName,
        lastName: data.lastName,
        secondLastName: data.secondLastName,
        dni: data.dni,
        nie: data.nie,
        naf: data.naf,
        birthDate: data.birthDate,
        nationality: data.nationality,
        gender: data.gender,
        email: data.email,
        personalEmail: data.personalEmail,
        phone: data.phone,
        mobilePhone: data.mobilePhone,
        address: data.address,
        employeeNumber,
        status: EmployeeStatus.PROBATION,
        departmentId: data.departmentId,
        positionId: data.positionId,
        managerId: data.managerId,
        hireDate: data.hireDate,
        seniorityDate: data.seniorityDate || data.hireDate,
        currentContractId: '', // Will be set when contract is created
        workCenterId: data.workCenterId,
        costCenterId: data.costCenterId,
        personalSituation: data.personalSituation,
        bankAccount: data.bankAccount,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
        updatedBy: 'system'
      };

      this.employees.set(employee.id, employee);

      return {
        success: true,
        data: employee
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al crear empleado: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'CREATE_ERROR'
      };
    }
  }

  /**
   * Update an existing employee
   */
  async update(id: string, changes: UpdateEmployeeData): Promise<OperationResult<Employee>> {
    try {
      const employee = this.employees.get(id);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      // Validate IBAN if being updated
      if (changes.bankAccount?.iban && !this.validateIBAN(changes.bankAccount.iban)) {
        return {
          success: false,
          error: 'IBAN inválido',
          code: 'INVALID_IBAN'
        };
      }

      const updatedEmployee: Employee = {
        ...employee,
        ...changes,
        address: changes.address || employee.address,
        personalSituation: changes.personalSituation || employee.personalSituation,
        bankAccount: changes.bankAccount || employee.bankAccount,
        updatedAt: new Date(),
        updatedBy: 'system'
      };

      this.employees.set(id, updatedEmployee);

      return {
        success: true,
        data: updatedEmployee
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al actualizar empleado: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'UPDATE_ERROR'
      };
    }
  }

  /**
   * Get an employee by ID
   */
  async get(id: string): Promise<OperationResult<Employee>> {
    const employee = this.employees.get(id);
    if (!employee) {
      return {
        success: false,
        error: 'Empleado no encontrado',
        code: 'EMPLOYEE_NOT_FOUND'
      };
    }

    return {
      success: true,
      data: employee
    };
  }

  /**
   * Search employees with filters
   */
  async search(query: EmployeeSearchQuery): Promise<PaginatedResult<Employee>> {
    let results = Array.from(this.employees.values());

    // Apply filters
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      results = results.filter(e =>
        e.firstName.toLowerCase().includes(searchTerm) ||
        e.lastName.toLowerCase().includes(searchTerm) ||
        e.employeeNumber.includes(searchTerm) ||
        e.email.toLowerCase().includes(searchTerm) ||
        e.dni.toLowerCase().includes(searchTerm)
      );
    }

    if (query.departmentId) {
      results = results.filter(e => e.departmentId === query.departmentId);
    }

    if (query.positionId) {
      results = results.filter(e => e.positionId === query.positionId);
    }

    if (query.status) {
      results = results.filter(e => e.status === query.status);
    }

    if (query.managerId) {
      results = results.filter(e => e.managerId === query.managerId);
    }

    if (query.hiredAfter) {
      results = results.filter(e => e.hireDate >= query.hiredAfter!);
    }

    if (query.hiredBefore) {
      results = results.filter(e => e.hireDate <= query.hiredBefore!);
    }

    // Sort
    const sortBy = query.sortBy || 'lastName';
    const sortOrder = query.sortOrder || 'ASC';
    results.sort((a, b) => {
      const aVal = (a as unknown as Record<string, unknown>)[sortBy];
      const bVal = (b as unknown as Record<string, unknown>)[sortBy];
      if (aVal == null || bVal == null) return 0;
      if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
      return 0;
    });

    // Paginate
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const items = results.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages
    };
  }

  /**
   * Get employees by department
   */
  async getByDepartment(deptId: string): Promise<Employee[]> {
    return Array.from(this.employees.values())
      .filter(e => e.departmentId === deptId && e.status !== EmployeeStatus.TERMINATED);
  }

  /**
   * Get employees by manager
   */
  async getByManager(managerId: string): Promise<Employee[]> {
    return Array.from(this.employees.values())
      .filter(e => e.managerId === managerId && e.status !== EmployeeStatus.TERMINATED);
  }

  /**
   * Terminate an employee
   */
  async terminate(
    id: string,
    reason: string,
    effectiveDate: Date
  ): Promise<OperationResult<Employee>> {
    try {
      const employee = this.employees.get(id);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      if (employee.status === EmployeeStatus.TERMINATED) {
        return {
          success: false,
          error: 'El empleado ya está dado de baja',
          code: 'ALREADY_TERMINATED'
        };
      }

      // Cannot terminate before hire date
      if (effectiveDate < employee.hireDate) {
        return {
          success: false,
          error: 'La fecha de baja no puede ser anterior a la fecha de alta',
          code: 'INVALID_TERMINATION_DATE'
        };
      }

      const updatedEmployee: Employee = {
        ...employee,
        status: EmployeeStatus.TERMINATED,
        terminationDate: effectiveDate,
        terminationReason: reason,
        updatedAt: new Date(),
        updatedBy: 'system'
      };

      this.employees.set(id, updatedEmployee);

      // TODO: Trigger settlement payroll calculation (finiquito)
      // TODO: Update contract end date
      // TODO: Cancel pending leave requests

      return {
        success: true,
        data: updatedEmployee
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al dar de baja al empleado: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'TERMINATE_ERROR'
      };
    }
  }

  /**
   * Transfer an employee to a new department/position
   */
  async transfer(id: string, transfer: TransferData): Promise<OperationResult<Employee>> {
    try {
      const employee = this.employees.get(id);
      if (!employee) {
        return {
          success: false,
          error: 'Empleado no encontrado',
          code: 'EMPLOYEE_NOT_FOUND'
        };
      }

      if (employee.status === EmployeeStatus.TERMINATED) {
        return {
          success: false,
          error: 'No se puede trasladar a un empleado dado de baja',
          code: 'EMPLOYEE_TERMINATED'
        };
      }

      // Validate new department
      if (!this.departments.has(transfer.newDepartmentId)) {
        return {
          success: false,
          error: 'Departamento de destino no encontrado',
          code: 'DEPARTMENT_NOT_FOUND'
        };
      }

      // Validate new position
      if (!this.positions.has(transfer.newPositionId)) {
        return {
          success: false,
          error: 'Puesto de destino no encontrado',
          code: 'POSITION_NOT_FOUND'
        };
      }

      // Get new department's manager
      const newDept = this.departments.get(transfer.newDepartmentId);
      const newManagerId = newDept?.managerId;

      const updatedEmployee: Employee = {
        ...employee,
        departmentId: transfer.newDepartmentId,
        positionId: transfer.newPositionId,
        managerId: newManagerId,
        updatedAt: new Date(),
        updatedBy: 'system'
      };

      this.employees.set(id, updatedEmployee);

      // TODO: Create contract addendum if salary changes
      // TODO: Record transfer in employee history

      return {
        success: true,
        data: updatedEmployee
      };
    } catch (error) {
      return {
        success: false,
        error: `Error al trasladar al empleado: ${error instanceof Error ? error.message : 'Unknown error'}`,
        code: 'TRANSFER_ERROR'
      };
    }
  }

  /**
   * Get organization chart
   */
  async getOrganizationChart(): Promise<OrgChartNode[]> {
    const employees = Array.from(this.employees.values())
      .filter(e => e.status !== EmployeeStatus.TERMINATED);

    // Find top-level employees (no manager or manager not in system)
    const topLevel = employees.filter(e =>
      !e.managerId || !this.employees.has(e.managerId)
    );

    const buildNode = (employee: Employee): OrgChartNode => {
      const position = this.positions.get(employee.positionId);
      const department = this.departments.get(employee.departmentId);

      const directReports = employees
        .filter(e => e.managerId === employee.id)
        .map(e => buildNode(e));

      return {
        employee,
        position: position || this.createDefaultPosition(),
        department: department || this.createDefaultDepartment(),
        directReports
      };
    };

    return topLevel.map(e => buildNode(e));
  }

  /**
   * Set employee status to active (end of probation period)
   */
  async activateEmployee(id: string): Promise<OperationResult<Employee>> {
    const employee = this.employees.get(id);
    if (!employee) {
      return {
        success: false,
        error: 'Empleado no encontrado',
        code: 'EMPLOYEE_NOT_FOUND'
      };
    }

    if (employee.status !== EmployeeStatus.PROBATION) {
      return {
        success: false,
        error: 'El empleado no está en período de prueba',
        code: 'NOT_IN_PROBATION'
      };
    }

    const updatedEmployee: Employee = {
      ...employee,
      status: EmployeeStatus.ACTIVE,
      updatedAt: new Date(),
      updatedBy: 'system'
    };

    this.employees.set(id, updatedEmployee);

    return {
      success: true,
      data: updatedEmployee
    };
  }

  /**
   * Calculate employee seniority in years
   */
  calculateSeniority(employee: Employee): number {
    const now = new Date();
    const seniorityDate = employee.seniorityDate;
    const years = (now.getTime() - seniorityDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years);
  }

  /**
   * Calculate employee age
   */
  calculateAge(employee: Employee): number {
    const now = new Date();
    const birthDate = employee.birthDate;
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  // ==================== DEPARTMENT MANAGEMENT ====================

  /**
   * Add or update a department
   */
  setDepartment(department: Department): void {
    this.departments.set(department.id, department);
  }

  /**
   * Get a department by ID
   */
  getDepartment(id: string): Department | undefined {
    return this.departments.get(id);
  }

  // ==================== POSITION MANAGEMENT ====================

  /**
   * Add or update a position
   */
  setPosition(position: Position): void {
    this.positions.set(position.id, position);
  }

  /**
   * Get a position by ID
   */
  getPosition(id: string): Position | undefined {
    return this.positions.get(id);
  }

  // ==================== CONTRACT MANAGEMENT ====================

  /**
   * Add or update a contract
   */
  setContract(contract: Contract): void {
    this.contracts.set(contract.id, contract);
  }

  /**
   * Get a contract by ID
   */
  getContract(id: string): Contract | undefined {
    return this.contracts.get(id);
  }

  /**
   * Get active contract for an employee
   */
  getActiveContract(employeeId: string): Contract | undefined {
    return Array.from(this.contracts.values())
      .find(c => c.employeeId === employeeId && c.isActive);
  }

  // ==================== VALIDATION HELPERS ====================

  /**
   * Validate Spanish DNI format and check digit
   */
  private validateDNI(dni: string): boolean {
    if (!dni) return false;
    const dniRegex = /^[0-9]{8}[A-Z]$/;
    if (!dniRegex.test(dni)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const number = parseInt(dni.substring(0, 8), 10);
    const letter = dni.charAt(8);

    return letters.charAt(number % 23) === letter;
  }

  /**
   * Validate Spanish NIE format and check digit
   */
  private validateNIE(nie?: string): boolean {
    if (!nie) return false;
    const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
    if (!nieRegex.test(nie)) return false;

    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    let nieNumber = nie.substring(1, 8);
    const firstLetter = nie.charAt(0);

    if (firstLetter === 'X') nieNumber = '0' + nieNumber;
    else if (firstLetter === 'Y') nieNumber = '1' + nieNumber;
    else if (firstLetter === 'Z') nieNumber = '2' + nieNumber;

    const number = parseInt(nieNumber, 10);
    const checkLetter = nie.charAt(8);

    return letters.charAt(number % 23) === checkLetter;
  }

  /**
   * Validate Spanish Social Security Number (NAF)
   */
  private validateNAF(naf: string): boolean {
    if (!naf) return false;
    // NAF format: 12 digits
    const nafRegex = /^[0-9]{12}$/;
    return nafRegex.test(naf.replace(/\s/g, ''));
  }

  /**
   * Validate IBAN format (Spanish IBANs start with ES)
   */
  private validateIBAN(iban: string): boolean {
    if (!iban) return false;
    const cleanIban = iban.replace(/\s/g, '').toUpperCase();

    // Basic Spanish IBAN check
    if (!cleanIban.startsWith('ES') || cleanIban.length !== 24) {
      return false;
    }

    // Move first 4 chars to end and convert letters to numbers
    const rearranged = cleanIban.substring(4) + cleanIban.substring(0, 4);
    let numericString = '';

    for (const char of rearranged) {
      if (char >= 'A' && char <= 'Z') {
        numericString += (char.charCodeAt(0) - 55).toString();
      } else {
        numericString += char;
      }
    }

    // Mod 97 check
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i], 10)) % 97;
    }

    return remainder === 1;
  }

  /**
   * Generate unique employee number
   */
  private generateEmployeeNumber(): string {
    const year = new Date().getFullYear().toString().substring(2);
    const count = this.employees.size + 1;
    return `EMP${year}${count.toString().padStart(5, '0')}`;
  }

  /**
   * Create default position placeholder
   */
  private createDefaultPosition(): Position {
    return {
      id: 'default',
      code: 'UNKNOWN',
      title: 'Unknown Position',
      departmentId: 'default',
      level: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Create default department placeholder
   */
  private createDefaultDepartment(): Department {
    return {
      id: 'default',
      code: 'UNKNOWN',
      name: 'Unknown Department',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}
