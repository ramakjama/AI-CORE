import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SeoSemService } from './seo-sem.service';

@Controller('seo-sem')
export class SeoSemController {
  constructor(private readonly seoSemService: SeoSemService) {}

  @Post('audit')
  async performAudit(@Body() body: { url: string; companyId: string }) {
    return this.seoSemService.performFullSeoAudit(body.url, body.companyId);
  }

  @Get('rankings')
  async trackRankings(@Query('keywords') keywords: string, @Query('domain') domain: string) {
    return this.seoSemService.trackKeywordRankings(keywords.split(','), domain);
  }

  @Get('competitors/:domain')
  async analyzeCompetitors(@Param('domain') domain: string, @Query('competitors') competitors: string) {
    return this.seoSemService.analyzeCompetitors(domain, competitors.split(','));
  }

  @Post('optimize-content')
  async optimizeContent(@Body() body: { content: string; keywords: string[] }) {
    return this.seoSemService.optimizeContentForSeo(body.content, body.keywords);
  }

  @Get('backlinks/:domain')
  async monitorBacklinks(@Param('domain') domain: string) {
    return this.seoSemService.monitorBacklinks(domain);
  }

  @Get('search-console-insights')
  async getInsights(@Query('siteUrl') siteUrl: string, @Query('days') days: number = 30) {
    return this.seoSemService.getSearchConsoleInsights(siteUrl, days);
  }
}
