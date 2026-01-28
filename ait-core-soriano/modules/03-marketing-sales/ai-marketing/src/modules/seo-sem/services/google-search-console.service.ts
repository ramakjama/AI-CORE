import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleSearchConsoleService {
  private readonly logger = new Logger(GoogleSearchConsoleService.name);
  private searchConsole: any;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private async initializeClient() {
    const credentials = {
      client_email: this.configService.get('GOOGLE_CLIENT_EMAIL'),
      private_key: this.configService.get('GOOGLE_PRIVATE_KEY'),
    };

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    this.searchConsole = google.searchconsole({ version: 'v1', auth });
  }

  async getPerformanceData(siteUrl: string, days: number = 30): Promise<any> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const response = await this.searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dimensions: ['query', 'page', 'country', 'device'],
          rowLimit: 25000,
        },
      });

      const data = response.data.rows || [];

      // Process and aggregate data
      const performance = this.aggregatePerformanceData(data);

      return {
        performanceScore: this.calculatePerformanceScore(performance),
        totalClicks: performance.totalClicks,
        totalImpressions: performance.totalImpressions,
        averageCTR: performance.averageCTR,
        averagePosition: performance.averagePosition,
        topQueries: performance.topQueries,
        topPages: performance.topPages,
        deviceBreakdown: performance.deviceBreakdown,
        countryBreakdown: performance.countryBreakdown,
      };
    } catch (error) {
      this.logger.error(`Failed to get performance data: ${error.message}`);
      throw error;
    }
  }

  async getInsights(siteUrl: string, days: number = 30): Promise<any> {
    try {
      const performance = await this.getPerformanceData(siteUrl, days);
      const issues = await this.getIndexingIssues(siteUrl);
      const sitemaps = await this.getSitemaps(siteUrl);

      return {
        performance,
        issues,
        sitemaps,
        insights: this.generateInsights(performance, issues),
      };
    } catch (error) {
      this.logger.error(`Failed to get insights: ${error.message}`);
      throw error;
    }
  }

  async getIndexingIssues(siteUrl: string): Promise<any[]> {
    try {
      const response = await this.searchConsole.urlInspection.index.inspect({
        requestBody: {
          inspectionUrl: siteUrl,
          siteUrl,
        },
      });

      const issues = [];
      const inspection = response.data.inspectionResult;

      if (inspection.indexStatusResult?.coverageState !== 'Submitted and indexed') {
        issues.push({
          type: 'indexing',
          severity: 'warning',
          message: `URL not indexed: ${inspection.indexStatusResult?.verdict}`,
        });
      }

      if (inspection.mobileUsabilityResult?.issues?.length > 0) {
        inspection.mobileUsabilityResult.issues.forEach((issue) => {
          issues.push({
            type: 'mobile-usability',
            severity: 'warning',
            message: issue.issueType,
          });
        });
      }

      return issues;
    } catch (error) {
      this.logger.warn(`Could not get indexing issues: ${error.message}`);
      return [];
    }
  }

  async getSitemaps(siteUrl: string): Promise<any[]> {
    try {
      const response = await this.searchConsole.sitemaps.list({ siteUrl });
      return response.data.sitemap || [];
    } catch (error) {
      this.logger.warn(`Could not get sitemaps: ${error.message}`);
      return [];
    }
  }

  private aggregatePerformanceData(rows: any[]): any {
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalCTR = 0;
    let totalPosition = 0;

    const queries = new Map();
    const pages = new Map();
    const devices = new Map();
    const countries = new Map();

    rows.forEach((row) => {
      totalClicks += row.clicks;
      totalImpressions += row.impressions;
      totalCTR += row.ctr;
      totalPosition += row.position;

      const [query, page, country, device] = row.keys;

      // Aggregate queries
      if (!queries.has(query)) {
        queries.set(query, {
          query,
          clicks: 0,
          impressions: 0,
          ctr: 0,
          position: 0,
        });
      }
      const queryData = queries.get(query);
      queryData.clicks += row.clicks;
      queryData.impressions += row.impressions;

      // Aggregate pages
      if (!pages.has(page)) {
        pages.set(page, { page, clicks: 0, impressions: 0 });
      }
      pages.get(page).clicks += row.clicks;
      pages.get(page).impressions += row.impressions;

      // Aggregate devices
      if (!devices.has(device)) {
        devices.set(device, { device, clicks: 0, impressions: 0 });
      }
      devices.get(device).clicks += row.clicks;
      devices.get(device).impressions += row.impressions;

      // Aggregate countries
      if (!countries.has(country)) {
        countries.set(country, { country, clicks: 0, impressions: 0 });
      }
      countries.get(country).clicks += row.clicks;
      countries.get(country).impressions += row.impressions;
    });

    const count = rows.length || 1;

    return {
      totalClicks,
      totalImpressions,
      averageCTR: (totalCTR / count) * 100,
      averagePosition: totalPosition / count,
      topQueries: Array.from(queries.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20),
      topPages: Array.from(pages.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 20),
      deviceBreakdown: Array.from(devices.values()),
      countryBreakdown: Array.from(countries.values())
        .sort((a, b) => b.clicks - a.clicks)
        .slice(0, 10),
    };
  }

  private calculatePerformanceScore(performance: any): number {
    let score = 50;

    // CTR score (0-30 points)
    if (performance.averageCTR > 5) score += 30;
    else if (performance.averageCTR > 3) score += 20;
    else if (performance.averageCTR > 1) score += 10;

    // Position score (0-20 points)
    if (performance.averagePosition <= 3) score += 20;
    else if (performance.averagePosition <= 10) score += 10;
    else if (performance.averagePosition <= 20) score += 5;

    return Math.min(score, 100);
  }

  private generateInsights(performance: any, issues: any[]): string[] {
    const insights: string[] = [];

    if (performance.averageCTR < 2) {
      insights.push('Low CTR detected. Consider improving meta descriptions and titles.');
    }

    if (performance.averagePosition > 10) {
      insights.push('Average position is low. Focus on content optimization and link building.');
    }

    if (issues.length > 0) {
      insights.push(`${issues.length} indexing or mobile usability issues detected.`);
    }

    const mobileClicks = performance.deviceBreakdown.find((d) => d.device === 'MOBILE')?.clicks || 0;
    const totalClicks = performance.totalClicks || 1;
    const mobilePercentage = (mobileClicks / totalClicks) * 100;

    if (mobilePercentage > 60) {
      insights.push('Mobile traffic is dominant. Ensure mobile-first design.');
    }

    return insights;
  }
}
