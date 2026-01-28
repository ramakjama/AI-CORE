import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SemrushIntegrationService {
  private readonly logger = new Logger(SemrushIntegrationService.name);
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.semrush.com';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get('SEMRUSH_API_KEY');
  }

  async getKeywordRankings(keywords: string[], domain: string): Promise<any> {
    const rankings = [];

    for (const keyword of keywords) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/`, {
            params: {
              type: 'phrase_this',
              key: this.apiKey,
              phrase: keyword,
              export_columns: 'Ph,Po,Ur,Tr,Tc,Co,Nr,Td',
              domain,
              database: 'us',
            },
          }),
        );

        rankings.push(this.parseRankingData(response.data, keyword));
      } catch (error) {
        this.logger.error(`Failed to get rankings for ${keyword}: ${error.message}`);
      }
    }

    return rankings;
  }

  async getCompetitorAnalysis(domain: string): Promise<any> {
    try {
      const competitors = await this.getCompetitors(domain);
      const keywordGaps = await this.getKeywordGaps(domain, competitors);

      return {
        competitors,
        keywordGaps,
        topCompetitor: competitors[0]?.domain,
      };
    } catch (error) {
      this.logger.error(`Competitor analysis failed: ${error.message}`);
      return { competitors: [], keywordGaps: [] };
    }
  }

  async compareCompetitors(domain: string, competitors: string[]): Promise<any> {
    const comparisons = [];

    for (const competitor of competitors) {
      try {
        const comparison = await this.compareDomains(domain, competitor);
        comparisons.push(comparison);
      } catch (error) {
        this.logger.error(`Failed to compare with ${competitor}: ${error.message}`);
      }
    }

    return comparisons;
  }

  private async getCompetitors(domain: string): Promise<any[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/`, {
          params: {
            type: 'domain_organic_organic',
            key: this.apiKey,
            domain,
            display_limit: 10,
            export_columns: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
            database: 'us',
          },
        }),
      );

      return this.parseCompetitorData(response.data);
    } catch (error) {
      this.logger.error(`Failed to get competitors: ${error.message}`);
      return [];
    }
  }

  private async getKeywordGaps(domain: string, competitors: any[]): Promise<any[]> {
    const gaps = [];

    for (const competitor of competitors.slice(0, 3)) {
      try {
        const response = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/`, {
            params: {
              type: 'phrase_organic',
              key: this.apiKey,
              domain: competitor.domain,
              display_limit: 100,
              export_columns: 'Ph,Po,Nq,Cp,Co,Tr,Tc',
              database: 'us',
            },
          }),
        );

        const competitorKeywords = this.parseKeywordData(response.data);
        gaps.push(...competitorKeywords);
      } catch (error) {
        this.logger.error(`Failed to get keyword gaps: ${error.message}`);
      }
    }

    return gaps;
  }

  private async compareDomains(domain1: string, domain2: string): Promise<any> {
    try {
      const [domain1Data, domain2Data] = await Promise.all([
        this.getDomainOverview(domain1),
        this.getDomainOverview(domain2),
      ]);

      return {
        domain1: domain1Data,
        domain2: domain2Data,
        comparison: {
          organicKeywords: domain2Data.organicKeywords - domain1Data.organicKeywords,
          organicTraffic: domain2Data.organicTraffic - domain1Data.organicTraffic,
          authorityScore: domain2Data.authorityScore - domain1Data.authorityScore,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to compare domains: ${error.message}`);
      return null;
    }
  }

  private async getDomainOverview(domain: string): Promise<any> {
    const response = await firstValueFrom(
      this.httpService.get(`${this.baseUrl}/`, {
        params: {
          type: 'domain_ranks',
          key: this.apiKey,
          domain,
          database: 'us',
        },
      }),
    );

    return this.parseDomainData(response.data);
  }

  private parseRankingData(data: string, keyword: string): any {
    const lines = data.split('\n');
    if (lines.length < 2) return null;

    const values = lines[1].split(';');
    return {
      keyword,
      position: parseInt(values[1]) || null,
      url: values[2],
      traffic: parseFloat(values[3]) || 0,
      trafficCost: parseFloat(values[4]) || 0,
      competition: parseFloat(values[5]) || 0,
    };
  }

  private parseCompetitorData(data: string): any[] {
    const lines = data.split('\n').slice(1);
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(';');
        return {
          domain: values[0],
          competitionLevel: parseFloat(values[1]) || 0,
          commonKeywords: parseInt(values[2]) || 0,
          organicKeywords: parseInt(values[3]) || 0,
        };
      });
  }

  private parseKeywordData(data: string): any[] {
    const lines = data.split('\n').slice(1);
    return lines
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(';');
        return {
          keyword: values[0],
          position: parseInt(values[1]) || null,
          volume: parseInt(values[2]) || 0,
          cpc: parseFloat(values[3]) || 0,
          competition: parseFloat(values[4]) || 0,
          difficulty: this.calculateDifficulty(parseFloat(values[4])),
        };
      });
  }

  private parseDomainData(data: string): any {
    const lines = data.split('\n');
    if (lines.length < 2) return {};

    const values = lines[1].split(';');
    return {
      organicKeywords: parseInt(values[0]) || 0,
      organicTraffic: parseInt(values[1]) || 0,
      organicCost: parseFloat(values[2]) || 0,
      authorityScore: parseInt(values[3]) || 0,
    };
  }

  private calculateDifficulty(competition: number): 'easy' | 'medium' | 'hard' {
    if (competition < 0.3) return 'easy';
    if (competition < 0.7) return 'medium';
    return 'hard';
  }
}
