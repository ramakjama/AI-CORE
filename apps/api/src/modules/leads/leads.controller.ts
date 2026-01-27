import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async getAllLeads() {
    return this.leadsService.findAll();
  }

  @Get(':id')
  async getLead(@Param('id') id: string) {
    return this.leadsService.findOne(id);
  }

  @Post()
  async createLead(@Body() data: any) {
    return this.leadsService.create(data);
  }

  @Put(':id')
  async updateLead(@Param('id') id: string, @Body() data: any) {
    return this.leadsService.update(id, data);
  }

  @Post(':id/qualify')
  async qualifyLead(@Param('id') id: string) {
    return this.leadsService.qualify(id);
  }

  @Post(':id/convert')
  async convertLead(@Param('id') id: string) {
    return this.leadsService.convert(id);
  }
}
