import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ClientAnalysis, OpportunityRecommendation, CoverageGap, ChurnPrediction, Prisma } from '@prisma/client';

@Injectable()
export class SalesIntelligenceService {
  constructor(private prisma: PrismaService) {}

  // ==========================================
  // CLIENT ANALYSIS
  // ==========================================

  async getClientAnalysis(partyId: string): Promise<ClientAnalysis | null> {
    return this.prisma.clientAnalysis.findUnique({
      where: { partyId },
    });
  }

  async createClientAnalysis(data: any): Promise<ClientAnalysis> {
    return this.prisma.clientAnalysis.create({ data });
  }

  async updateClientAnalysis(
    partyId: string,
    data: any,
  ): Promise<ClientAnalysis> {
    return this.prisma.clientAnalysis.update({
      where: { partyId },
      data,
    });
  }

  async upsertClientAnalysis(
    partyId: string,
    create: any,
    update: any,
  ): Promise<ClientAnalysis> {
    return this.prisma.clientAnalysis.upsert({
      where: { partyId },
      create,
      update,
    });
  }

  // ==========================================
  // OPPORTUNITY RECOMMENDATIONS
  // ==========================================

  async getOpportunities(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<OpportunityRecommendation[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.opportunityRecommendation.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async getOpportunityById(id: string): Promise<OpportunityRecommendation | null> {
    return this.prisma.opportunityRecommendation.findUnique({
      where: { id },
    });
  }

  async createOpportunity(
    data: any,
  ): Promise<OpportunityRecommendation> {
    return this.prisma.opportunityRecommendation.create({ data });
  }

  async updateOpportunity(
    id: string,
    data: any,
  ): Promise<OpportunityRecommendation> {
    return this.prisma.opportunityRecommendation.update({
      where: { id },
      data,
    });
  }

  async deleteOpportunity(id: string): Promise<OpportunityRecommendation> {
    return this.prisma.opportunityRecommendation.delete({
      where: { id },
    });
  }

  // ==========================================
  // COVERAGE GAPS
  // ==========================================

  async getCoverageGaps(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<CoverageGap[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.coverageGap.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async createCoverageGap(data: any): Promise<CoverageGap> {
    return this.prisma.coverageGap.create({ data });
  }

  async updateCoverageGap(
    id: string,
    data: any,
  ): Promise<CoverageGap> {
    return this.prisma.coverageGap.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // CHURN PREDICTIONS
  // ==========================================

  async getChurnPredictions(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }): Promise<ChurnPrediction[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.churnPrediction.findMany({
      skip,
      take,
      where,
      orderBy,
    });
  }

  async createChurnPrediction(
    data: any,
  ): Promise<ChurnPrediction> {
    return this.prisma.churnPrediction.create({ data });
  }

  async updateChurnPrediction(
    id: string,
    data: any,
  ): Promise<ChurnPrediction> {
    return this.prisma.churnPrediction.update({
      where: { id },
      data,
    });
  }

  // ==========================================
  // ANALYTICS & INSIGHTS
  // ==========================================

  async getInsightsByParty(partyId: string) {
    const [analysis, opportunities, gaps, churn] = await Promise.all([
      this.getClientAnalysis(partyId),
      this.getOpportunities({
        where: { partyId, status: 'PENDING' },
        orderBy: { confidence: 'desc' },
        take: 10,
      }),
      this.getCoverageGaps({
        where: { partyId, status: 'IDENTIFIED' },
        orderBy: { riskLevel: 'desc' },
        take: 10,
      }),
      this.prisma.churnPrediction.findFirst({
        where: { partyId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      analysis,
      opportunities,
      coverageGaps: gaps,
      churnPrediction: churn,
    };
  }

  async getDashboardStats(companyId?: string) {
    const where = companyId ? { companyId } : {};

    const [
      totalOpportunities,
      pendingOpportunities,
      highPriorityOpportunities,
      highRiskChurn,
      criticalGaps,
    ] = await Promise.all([
      this.prisma.opportunityRecommendation.count({ where }),
      this.prisma.opportunityRecommendation.count({
        where: { ...where, status: 'PENDING' },
      }),
      this.prisma.opportunityRecommendation.count({
        where: { ...where, status: 'PENDING', priority: 'HIGH' },
      }),
      this.prisma.churnPrediction.count({
        where: { ...where, churnRisk: { in: ['HIGH', 'CRITICAL'] } },
      }),
      this.prisma.coverageGap.count({
        where: { ...where, status: 'IDENTIFIED', riskLevel: 'CRITICAL' },
      }),
    ]);

    return {
      totalOpportunities,
      pendingOpportunities,
      highPriorityOpportunities,
      highRiskChurn,
      criticalGaps,
    };
  }
}
