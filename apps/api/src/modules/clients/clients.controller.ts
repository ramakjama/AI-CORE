import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async findAll(@Query() filters: any) {
    return this.clientsService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.clientsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Post()
  async create(@Body() clientData: any) {
    return this.clientsService.create(clientData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() clientData: any) {
    return this.clientsService.update(id, clientData);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }
}
