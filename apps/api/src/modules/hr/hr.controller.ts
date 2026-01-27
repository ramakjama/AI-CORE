import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { HrService } from './hr.service';

@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  async getAllEmployees() {
    return this.hrService.findAll();
  }

  @Get('employees/:id')
  async getEmployee(@Param('id') id: string) {
    return this.hrService.findOne(id);
  }

  @Post('employees')
  async createEmployee(@Body() data: any) {
    return this.hrService.create(data);
  }

  @Put('employees/:id')
  async updateEmployee(@Param('id') id: string, @Body() data: any) {
    return this.hrService.update(id, data);
  }

  @Get('payroll')
  async getPayroll() {
    return this.hrService.getPayroll();
  }

  @Get('performance')
  async getPerformance() {
    return this.hrService.getPerformance();
  }
}
