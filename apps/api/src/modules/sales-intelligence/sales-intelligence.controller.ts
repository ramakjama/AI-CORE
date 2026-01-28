import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SalesIntelligenceService } from './sales-intelligence.service';
import { Prisma } from '@prisma/client';

@Controller('sales-intelligence')
export class SalesIntelligenceController {
  constructor(
    private readonly salesIntelligenceService: SalesIntelligenceService,
  ) {}

  // ==========================================
  // CLIENT ANALYSIS
  // ==========================================

  @Get('analysis/:partyId')
  getClientAnalysis(@Param('partyId') partyId: string) {
    return this.salesIntelligenceService.getClientAnalysis(partyId);
  }

  @Post('analysis')
  createClientAnalysis(@Body() data: any) {
    return this.salesIntelligenceService.createClientAnalysis(data);
  }

  @Put('analysis/:partyId')
  updateClientAnalysis(
    @Param('partyId') partyId: string,
    @Body() data: any,
  ) {
    return this.salesIntelligenceService.updateClientAnalysis(partyId, data);
  }

  // ==========================================
  // OPPORTUNITIES
  // ==========================================

  @Get('opportunities')
  getOpportunities(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('partyId') partyId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (partyId) where.partyId = partyId;
    if (companyId) where.companyId = companyId;

    return this.salesIntelligenceService.getOpportunities({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : 50,
      where,
      orderBy: { confidenceScore: 'desc' },
    });
  }

  @Get('opportunities/:id')
  getOpportunityById(@Param('id') id: string) {
    return this.salesIntelligenceService.getOpportunityById(id);
  }

  @Post('opportunities')
  createOpportunity(@Body() data: any) {
    return this.salesIntelligenceService.createOpportunity(data);
  }

  @Put('opportunities/:id')
  updateOpportunity(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.salesIntelligenceService.updateOpportunity(id, data);
  }

  @Delete('opportunities/:id')
  deleteOpportunity(@Param('id') id: string) {
    return this.salesIntelligenceService.deleteOpportunity(id);
  }

  // ==========================================
  // COVERAGE GAPS
  // ==========================================

  @Get('gaps')
  getCoverageGaps(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
    @Query('partyId') partyId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const where: any = {};

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (partyId) where.partyId = partyId;
    if (companyId) where.companyId = companyId;

    return this.salesIntelligenceService.getCoverageGaps({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : 50,
      where,
      orderBy: { severity: 'desc' },
    });
  }

  @Post('gaps')
  createCoverageGap(@Body() data: any) {
    return this.salesIntelligenceService.createCoverageGap(data);
  }

  @Put('gaps/:id')
  updateCoverageGap(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.salesIntelligenceService.updateCoverageGap(id, data);
  }

  // ==========================================
  // CHURN PREDICTIONS
  // ==========================================

  @Get('churn')
  getChurnPredictions(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('status') status?: string,
    @Query('riskLevel') riskLevel?: string,
    @Query('partyId') partyId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const where: any = {};

    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (partyId) where.partyId = partyId;
    if (companyId) where.companyId = companyId;

    return this.salesIntelligenceService.getChurnPredictions({
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : 50,
      where,
      orderBy: { churnProbability: 'desc' },
    });
  }

  @Post('churn')
  createChurnPrediction(@Body() data: any) {
    return this.salesIntelligenceService.createChurnPrediction(data);
  }

  @Put('churn/:id')
  updateChurnPrediction(
    @Param('id') id: string,
    @Body() data: any,
  ) {
    return this.salesIntelligenceService.updateChurnPrediction(id, data);
  }

  // ==========================================
  // INSIGHTS & ANALYTICS
  // ==========================================

  @Get('insights/:partyId')
  getInsightsByParty(@Param('partyId') partyId: string) {
    return this.salesIntelligenceService.getInsightsByParty(partyId);
  }

  @Get('dashboard/stats')
  getDashboardStats(@Query('companyId') companyId?: string) {
    return this.salesIntelligenceService.getDashboardStats(companyId);
  }
}
