import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeoSemService } from './seo-sem.service';
import { SeoSemController } from './seo-sem.controller';
import { GoogleSearchConsoleService } from './services/google-search-console.service';
import { SemrushIntegrationService } from './services/semrush-integration.service';
import { KeywordResearchService } from './services/keyword-research.service';
import { BacklinkAnalyzerService } from './services/backlink-analyzer.service';
import { SeoAuditService } from './services/seo-audit.service';
import { SeoReport } from '../../entities/seo-report.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([SeoReport]),
  ],
  controllers: [SeoSemController],
  providers: [
    SeoSemService,
    GoogleSearchConsoleService,
    SemrushIntegrationService,
    KeywordResearchService,
    BacklinkAnalyzerService,
    SeoAuditService,
  ],
  exports: [SeoSemService],
})
export class SeoSemModule {}
