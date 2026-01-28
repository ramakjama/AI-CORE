import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

import { LeadGenerationService } from './services/lead-generation.service';
import { LeadScoringService } from './services/lead-scoring.service';
import { LeadEnrichmentService } from './services/lead-enrichment.service';
import { LeadQualificationService } from './services/lead-qualification.service';
import { WebScraperService } from './services/web-scraper.service';
import { EmailFinderService } from './services/email-finder.service';

import { LeadGenerationController } from './controllers/lead-generation.controller';

import { Lead } from './entities/lead.entity';
import { LeadScore } from './entities/lead-score.entity';
import { LeadActivity } from './entities/lead-activity.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forFeature([Lead, LeadScore, LeadActivity]),
    HttpModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [LeadGenerationController],
  providers: [
    LeadGenerationService,
    LeadScoringService,
    LeadEnrichmentService,
    LeadQualificationService,
    WebScraperService,
    EmailFinderService,
  ],
  exports: [LeadGenerationService, LeadScoringService],
})
export class AiLeadGenerationModule {}
