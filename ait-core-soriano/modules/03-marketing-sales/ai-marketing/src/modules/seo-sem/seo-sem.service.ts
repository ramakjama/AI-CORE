import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeoReport } from '../../entities/seo-report.entity';
import { GoogleSearchConsoleService } from './services/google-search-console.service';
import { SemrushIntegrationService } from './services/semrush-integration.service';
import { KeywordResearchService } from './services/keyword-research.service';
import { BacklinkAnalyzerService } from './services/backlink-analyzer.service';
import { SeoAuditService } from './services/seo-audit.service';

export interface SeoAnalysisResult {
  score: number;
  issues: SeoIssue[];
  opportunities: SeoOpportunity[];
  keywords: KeywordData[];
  backlinks: BacklinkData[];
  recommendations: string[];
}

export interface SeoIssue {
  severity: 'critical' | 'warning' | 'info';
  category: string;
  message: string;
  url?: string;
  impact: number;
}

export interface SeoOpportunity {
  type: string;
  description: string;
  estimatedImpact: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  cpc: number;
  currentPosition?: number;
  potential: number;
}

export interface BacklinkData {
  url: string;
  domain: string;
  authority: number;
  anchor: string;
  isFollowed: boolean;
}

@Injectable()
export class SeoSemService {
  private readonly logger = new Logger(SeoSemService.name);

  constructor(
    @InjectRepository(SeoReport)
    private seoReportRepository: Repository<SeoReport>,
    private googleSearchConsole: GoogleSearchConsoleService,
    private semrushIntegration: SemrushIntegrationService,
    private keywordResearch: KeywordResearchService,
    private backlinkAnalyzer: BacklinkAnalyzerService,
    private seoAudit: SeoAuditService,
  ) {}

  async performFullSeoAudit(url: string, companyId: string): Promise<SeoAnalysisResult> {
    this.logger.log(`Starting full SEO audit for ${url}`);

    try {
      // Run all audits in parallel
      const [
        technicalAudit,
        keywordAnalysis,
        backlinkAnalysis,
        searchConsoleData,
        competitorAnalysis,
      ] = await Promise.all([
        this.seoAudit.performTechnicalAudit(url),
        this.keywordResearch.analyzeKeywords(url),
        this.backlinkAnalyzer.analyzeBacklinks(url),
        this.googleSearchConsole.getPerformanceData(url),
        this.semrushIntegration.getCompetitorAnalysis(url),
      ]);

      // Calculate overall SEO score
      const score = this.calculateSeoScore({
        technicalAudit,
        keywordAnalysis,
        backlinkAnalysis,
        searchConsoleData,
      });

      // Compile issues and opportunities
      const issues = this.compileIssues(technicalAudit, searchConsoleData);
      const opportunities = this.identifyOpportunities(
        keywordAnalysis,
        competitorAnalysis,
        backlinkAnalysis,
      );

      // Generate AI-powered recommendations
      const recommendations = await this.generateRecommendations(
        issues,
        opportunities,
        competitorAnalysis,
      );

      const result: SeoAnalysisResult = {
        score,
        issues,
        opportunities,
        keywords: keywordAnalysis.keywords,
        backlinks: backlinkAnalysis.backlinks,
        recommendations,
      };

      // Save report to database
      await this.saveSeoReport(url, companyId, result);

      return result;
    } catch (error) {
      this.logger.error(`SEO audit failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  async trackKeywordRankings(keywords: string[], domain: string): Promise<any> {
    this.logger.log(`Tracking rankings for ${keywords.length} keywords`);

    const rankings = await this.semrushIntegration.getKeywordRankings(
      keywords,
      domain,
    );

    return rankings;
  }

  async analyzeCompetitors(domain: string, competitors: string[]): Promise<any> {
    this.logger.log(`Analyzing competitors for ${domain}`);

    const analysis = await this.semrushIntegration.compareCompetitors(
      domain,
      competitors,
    );

    return analysis;
  }

  async optimizeContentForSeo(content: string, targetKeywords: string[]): Promise<any> {
    this.logger.log(`Optimizing content for keywords: ${targetKeywords.join(', ')}`);

    const optimization = await this.seoAudit.analyzeContentSeo(
      content,
      targetKeywords,
    );

    return {
      score: optimization.score,
      keywordDensity: optimization.keywordDensity,
      suggestions: optimization.suggestions,
      optimizedContent: optimization.optimizedContent,
    };
  }

  async monitorBacklinks(domain: string): Promise<BacklinkData[]> {
    this.logger.log(`Monitoring backlinks for ${domain}`);

    const backlinks = await this.backlinkAnalyzer.analyzeBacklinks(domain);

    // Detect and alert on toxic backlinks
    const toxicBacklinks = backlinks.backlinks.filter(
      (bl) => bl.authority < 20 || bl.spam,
    );

    if (toxicBacklinks.length > 0) {
      this.logger.warn(`Found ${toxicBacklinks.length} toxic backlinks`);
    }

    return backlinks.backlinks;
  }

  async generateMetaTags(url: string, content: string): Promise<any> {
    this.logger.log(`Generating meta tags for ${url}`);

    return this.seoAudit.generateMetaTags(url, content);
  }

  async getSearchConsoleInsights(siteUrl: string, days: number = 30): Promise<any> {
    this.logger.log(`Getting Search Console insights for ${siteUrl}`);

    return this.googleSearchConsole.getInsights(siteUrl, days);
  }

  private calculateSeoScore(data: any): number {
    const weights = {
      technical: 0.3,
      keywords: 0.25,
      backlinks: 0.25,
      performance: 0.2,
    };

    let score = 0;

    if (data.technicalAudit?.score) {
      score += data.technicalAudit.score * weights.technical;
    }

    if (data.keywordAnalysis?.score) {
      score += data.keywordAnalysis.score * weights.keywords;
    }

    if (data.backlinkAnalysis?.score) {
      score += data.backlinkAnalysis.score * weights.backlinks;
    }

    if (data.searchConsoleData?.performanceScore) {
      score += data.searchConsoleData.performanceScore * weights.performance;
    }

    return Math.round(score);
  }

  private compileIssues(technicalAudit: any, searchConsoleData: any): SeoIssue[] {
    const issues: SeoIssue[] = [];

    // Technical issues
    if (technicalAudit?.issues) {
      issues.push(...technicalAudit.issues);
    }

    // Search Console issues
    if (searchConsoleData?.errors) {
      searchConsoleData.errors.forEach((error) => {
        issues.push({
          severity: 'critical',
          category: 'Search Console',
          message: error.message,
          url: error.url,
          impact: 8,
        });
      });
    }

    return issues.sort((a, b) => b.impact - a.impact);
  }

  private identifyOpportunities(
    keywordAnalysis: any,
    competitorAnalysis: any,
    backlinkAnalysis: any,
  ): SeoOpportunity[] {
    const opportunities: SeoOpportunity[] = [];

    // Keyword opportunities
    if (keywordAnalysis?.opportunities) {
      opportunities.push(...keywordAnalysis.opportunities);
    }

    // Competitor gaps
    if (competitorAnalysis?.gaps) {
      competitorAnalysis.gaps.forEach((gap) => {
        opportunities.push({
          type: 'Competitor Gap',
          description: `Target keyword: ${gap.keyword}`,
          estimatedImpact: gap.volume,
          difficulty: gap.difficulty,
        });
      });
    }

    // Backlink opportunities
    if (backlinkAnalysis?.opportunities) {
      opportunities.push(...backlinkAnalysis.opportunities);
    }

    return opportunities;
  }

  private async generateRecommendations(
    issues: SeoIssue[],
    opportunities: SeoOpportunity[],
    competitorAnalysis: any,
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // High-priority issues
    const criticalIssues = issues.filter((i) => i.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push(
        `Address ${criticalIssues.length} critical SEO issues immediately`,
      );
    }

    // Top opportunities
    const topOpportunities = opportunities
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
      .slice(0, 5);

    topOpportunities.forEach((opp) => {
      recommendations.push(`${opp.type}: ${opp.description}`);
    });

    // Competitor insights
    if (competitorAnalysis?.topCompetitor) {
      recommendations.push(
        `Study ${competitorAnalysis.topCompetitor}'s content strategy`,
      );
    }

    return recommendations;
  }

  private async saveSeoReport(
    url: string,
    companyId: string,
    result: SeoAnalysisResult,
  ): Promise<void> {
    const report = this.seoReportRepository.create({
      url,
      companyId,
      score: result.score,
      issues: result.issues,
      opportunities: result.opportunities,
      keywords: result.keywords,
      backlinks: result.backlinks,
      recommendations: result.recommendations,
      createdAt: new Date(),
    });

    await this.seoReportRepository.save(report);
  }
}
