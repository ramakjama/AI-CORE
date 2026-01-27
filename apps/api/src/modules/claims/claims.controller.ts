import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ClaimsService } from './claims.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('claims')
@UseGuards(JwtAuthGuard)
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Get()
  async findAll(@Query() filters: any) {
    return this.claimsService.findAll(filters);
  }

  @Get('stats')
  async getStats() {
    return this.claimsService.getStats();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.claimsService.findOne(id);
  }

  @Post()
  async create(@Body() claimData: any) {
    return this.claimsService.create(claimData);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() claimData: any) {
    return this.claimsService.update(id, claimData);
  }
}
