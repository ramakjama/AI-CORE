import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { LeadGenerationService } from '../services/lead-generation.service';

@Controller('lead-generation')
export class LeadGenerationController {
  constructor(private readonly leadGenerationService: LeadGenerationService) {}

  @Post('generate')
  async generateLeads(@Body() body: { criteria: any; limit: number }) {
    return this.leadGenerationService.generateLeads(body.criteria, body.limit);
  }

  @Post('enrich/:id')
  async enrichLead(@Param('id') id: string) {
    return this.leadGenerationService.enrichLead(id);
  }

  @Get('score/:id')
  async scoreLead(@Param('id') id: string) {
    return this.leadGenerationService.scoreLead(id);
  }

  @Post('qualify/:id')
  async qualifyLead(@Param('id') id: string) {
    return this.leadGenerationService.qualifyLead(id);
  }

  @Post('bulk-import')
  async bulkImport(@Body() leads: any[]) {
    return this.leadGenerationService.bulkImportLeads(leads);
  }

  @Get('by-score')
  async getByScore(@Query('min') min: number, @Query('max') max: number) {
    return this.leadGenerationService.getLeadsByScore(min, max);
  }
}
