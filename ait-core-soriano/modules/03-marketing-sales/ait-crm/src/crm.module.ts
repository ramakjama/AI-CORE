import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Services
import { LeadService } from './services/lead.service';
import { OpportunityService } from './services/opportunity.service';
import { ActivityService } from './services/activity.service';
import { CampaignService } from './services/campaign.service';
import { EmailTemplateService } from './services/email-template.service';
import { CRMAnalyticsService } from './services/crm-analytics.service';

// Controllers
import { LeadController } from './controllers/lead.controller';
import { OpportunityController } from './controllers/opportunity.controller';
import { ActivityController } from './controllers/activity.controller';
import { CampaignController } from './controllers/campaign.controller';
import { AnalyticsController } from './controllers/analytics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    })
  ],
  controllers: [
    LeadController,
    OpportunityController,
    ActivityController,
    CampaignController,
    AnalyticsController
  ],
  providers: [
    LeadService,
    OpportunityService,
    ActivityService,
    CampaignService,
    EmailTemplateService,
    CRMAnalyticsService
  ],
  exports: [
    LeadService,
    OpportunityService,
    ActivityService,
    CampaignService,
    EmailTemplateService,
    CRMAnalyticsService
  ]
})
export class CRMModule {}
