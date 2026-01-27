import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('policies')
@UseGuards(JwtAuthGuard)
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Get()
  async findAll(@Query() filters: any) {
    return this.policiesService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.policiesService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.policiesService.findOne(id);
  }

  @Post()
  async create(@Body() policyData: any) {
    return this.policiesService.create(policyData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() policyData: any) {
    return this.policiesService.update(id, policyData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.policiesService.remove(id);
  }
}
