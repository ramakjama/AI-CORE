import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';

export enum UnderwritingDecision {
  APPROVED = 'approved',
  DECLINED = 'declined',
  REFER = 'refer'
}

export interface RiskAssessmentRequest {
  policyType: string;
  applicantData: {
    age?: number;
    occupation?: string;
    healthConditions?: string[];
    drivingRecord?: any;
  };
  coverageAmount: number;
  riskData: Record<string, any>;
}

export interface RiskAssessmentResult {
  decision: UnderwritingDecision;
  riskScore: number;
  premiumAdjustment: number;
  reasons: string[];
  recommendedPremium?: number;
}

@Injectable()
export class UnderwritingService {
  private readonly logger = new Logger(UnderwritingService.name);
  private readonly prisma: PrismaClient;
  private readonly anthropic: Anthropic;

  constructor() {
    this.prisma = new PrismaClient();
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  }

  async assessRisk(request: RiskAssessmentRequest): Promise<RiskAssessmentResult> {
    this.logger.log(`Assessing risk for ${request.policyType}`);

    // Calculate base risk score
    let riskScore = 50;
    const reasons: string[] = [];

    // Age factor
    if (request.applicantData.age) {
      if (request.applicantData.age < 25) {
        riskScore += 20;
        reasons.push('Aplicante menor de 25 años (alto riesgo)');
      } else if (request.applicantData.age > 65) {
        riskScore += 10;
        reasons.push('Aplicante mayor de 65 años (riesgo elevado)');
      } else {
        riskScore -= 10;
        reasons.push('Edad óptima');
      }
    }

    // Health conditions
    if (request.applicantData.healthConditions && request.applicantData.healthConditions.length > 0) {
      riskScore += request.applicantData.healthConditions.length * 15;
      reasons.push(`${request.applicantData.healthConditions.length} condiciones de salud preexistentes`);
    }

    // Coverage amount factor
    if (request.coverageAmount > 500000) {
      riskScore += 10;
      reasons.push('Suma asegurada alta (>500K)');
    }

    // Get AI specialist opinion
    const aiAssessment = await this.getAIAssessment(request);
    if (aiAssessment) {
      riskScore = (riskScore + aiAssessment.score) / 2;
      reasons.push(...aiAssessment.reasons);
    }

    // Determine decision
    let decision: UnderwritingDecision;
    if (riskScore > 75) {
      decision = UnderwritingDecision.DECLINED;
    } else if (riskScore > 60) {
      decision = UnderwritingDecision.REFER;
    } else {
      decision = UnderwritingDecision.APPROVED;
    }

    // Calculate premium adjustment
    const premiumAdjustment = (riskScore - 50) * 0.02; // 2% per point above 50

    return {
      decision,
      riskScore: Math.min(Math.max(riskScore, 0), 100),
      premiumAdjustment,
      reasons
    };
  }

  private async getAIAssessment(request: RiskAssessmentRequest): Promise<{ score: number; reasons: string[] } | null> {
    try {
      const prompt = `Evalúa el siguiente riesgo de seguro y proporciona un score de 0-100 y razones:

Tipo: ${request.policyType}
Edad: ${request.applicantData.age || 'N/A'}
Ocupación: ${request.applicantData.occupation || 'N/A'}
Condiciones de salud: ${JSON.stringify(request.applicantData.healthConditions || [])}
Suma asegurada: ${request.coverageAmount}

Responde en formato JSON: { "score": number, "reasons": string[] }`;

      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        temperature: 0.3,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        return parsed;
      }
    } catch (error) {
      this.logger.error(`AI assessment failed: ${error.message}`);
    }

    return null;
  }

  async saveDecision(assessment: RiskAssessmentResult, policyId: string, userId: string) {
    await this.prisma.underwritingDecision.create({
      data: {
        policyId,
        decision: assessment.decision,
        riskScore: assessment.riskScore,
        premiumAdjustment: assessment.premiumAdjustment,
        reasons: assessment.reasons,
        decidedBy: userId,
        decidedAt: new Date()
      }
    });
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
}
