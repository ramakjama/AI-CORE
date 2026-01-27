import { Injectable } from '@nestjs/common';

@Injectable()
export class HrService {
  private employees = [
    { id: '1', name: 'Juan Pérez', position: 'Agente Senior', department: 'Ventas', salary: 35000, status: 'ACTIVE' },
    { id: '2', name: 'María García', position: 'Gerente', department: 'Operaciones', salary: 45000, status: 'ACTIVE' },
  ];

  async findAll() {
    return this.employees;
  }

  async findOne(id: string) {
    return this.employees.find(emp => emp.id === id);
  }

  async create(data: any) {
    const newEmployee = { id: Date.now().toString(), ...data, status: 'ACTIVE' };
    this.employees.push(newEmployee);
    return newEmployee;
  }

  async update(id: string, data: any) {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...data };
      return this.employees[index];
    }
    return null;
  }

  async getPayroll() {
    return {
      totalSalaries: this.employees.reduce((sum, emp) => sum + emp.salary, 0),
      employeeCount: this.employees.length,
      averageSalary: this.employees.reduce((sum, emp) => sum + emp.salary, 0) / this.employees.length,
    };
  }

  async getPerformance() {
    return this.employees.map(emp => ({
      ...emp,
      performance: Math.floor(Math.random() * 30) + 70, // 70-100
      goals: Math.floor(Math.random() * 5) + 3, // 3-8
    }));
  }
}
