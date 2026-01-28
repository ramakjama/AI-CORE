import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

// Submodules
import { SeoSemModule } from './modules/seo-sem/seo-sem.module';
import { SocialMediaModule } from './modules/social-media/social-media.module';
import { AdsManagerModule } from './modules/ads-manager/ads-manager.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { FunnelModule } from './modules/funnel/funnel.module';
import { ContentManagerModule } from './modules/content-manager/content-manager.module';

// Entities
import { Campaign } from './entities/campaign.entity';
import { Content } from './entities/content.entity';
import { SeoReport } from './entities/seo-report.entity';
import { AdCampaign } from './entities/ad-campaign.entity';
import { SocialPost } from './entities/social-post.entity';
import { FunnelStage } from './entities/funnel-stage.entity';

// Services
import { MarketingOrchestratorService } from './services/marketing-orchestrator.service';
import { AiContentGeneratorService } from './services/ai-content-generator.service';
import { MarketingAutomationService } from './services/marketing-automation.service';

// Controllers
import { MarketingController } from './controllers/marketing.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([
      Campaign,
      Content,
      SeoReport,
      AdCampaign,
      SocialPost,
      FunnelStage,
    ]),
    HttpModule,
    ScheduleModule.forRoot(),
    // Submodules
    SeoSemModule,
    SocialMediaModule,
    AdsManagerModule,
    AnalyticsModule,
    FunnelModule,
    ContentManagerModule,
  ],
  controllers: [MarketingController],
  providers: [
    MarketingOrchestratorService,
    AiContentGeneratorService,
    MarketingAutomationService,
  ],
  exports: [
    MarketingOrchestratorService,
    AiContentGeneratorService,
    MarketingAutomationService,
  ],
})
export class AiMarketingModule {}
