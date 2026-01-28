import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LeadScoringService {
  private readonly logger = new Logger(LeadScoringService.name);
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async calculateLeadScore(lead: any): Promise<number> {
    let score = 0;

    // Company size score (0-20 points)
    score += this.scoreCompanySize(lead.companySize);

    // Job title score (0-25 points)
    score += this.scoreJobTitle(lead.jobTitle);

    // Industry score (0-15 points)
    score += this.scoreIndustry(lead.industry);

    // Engagement score (0-20 points)
    score += this.scoreEngagement(lead.activities || []);

    // Enrichment score (0-10 points)
    score += this.scoreEnrichment(lead.enrichedData);

    // AI-enhanced scoring (0-10 points)
    const aiScore = await this.getAIScore(lead);
    score += aiScore;

    return Math.min(Math.round(score), 100);
  }

  private scoreCompanySize(size: string): number {
    const sizeMap = {
      '1-10': 5,
      '11-50': 10,
      '51-200': 15,
      '201-500': 18,
      '501-1000': 20,
      '1000+': 20,
    };
    return sizeMap[size] || 5;
  }

  private scoreJobTitle(title: string): number {
    const decisionMakerTitles = ['ceo', 'cto', 'cfo', 'vp', 'director', 'head', 'president'];
    const influencerTitles = ['manager', 'lead', 'senior'];

    const lowerTitle = title.toLowerCase();

    if (decisionMakerTitles.some((t) => lowerTitle.includes(t))) {
      return 25;
    }

    if (influencerTitles.some((t) => lowerTitle.includes(t))) {
      return 15;
    }

    return 5;
  }

  private scoreIndustry(industry: string): number {
    const highValueIndustries = [
      'technology',
      'finance',
      'healthcare',
      'insurance',
      'saas',
    ];

    return highValueIndustries.includes(industry?.toLowerCase()) ? 15 : 8;
  }

  private scoreEngagement(activities: any[]): number {
    let score = 0;

    activities.forEach((activity) => {
      switch (activity.type) {
        case 'email_open':
          score += 2;
          break;
        case 'email_click':
          score += 5;
          break;
        case 'website_visit':
          score += 3;
          break;
        case 'form_submission':
          score += 8;
          break;
        case 'demo_request':
          score += 15;
          break;
      }
    });

    return Math.min(score, 20);
  }

  private scoreEnrichment(enrichedData: any): number {
    if (!enrichedData) return 0;

    let score = 0;

    if (enrichedData.socialProfiles) score += 3;
    if (enrichedData.companyInfo) score += 3;
    if (enrichedData.fundingInfo) score += 4;

    return score;
  }

  private async getAIScore(lead: any): Promise<number> {
    try {
      const prompt = `Score this lead from 0-10 based on their profile:
Company: ${lead.company}
Job Title: ${lead.jobTitle}
Industry: ${lead.industry}
Company Size: ${lead.companySize}

Consider their potential value and fit for B2B insurance products.
Respond with only a number from 0-10.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 10,
      });

      const score = parseInt(response.choices[0].message.content.trim());
      return isNaN(score) ? 5 : score;
    } catch (error) {
      this.logger.warn(`AI scoring failed: ${error.message}`);
      return 5;
    }
  }
}
