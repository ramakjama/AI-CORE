import { Module } from '@nestjs/common';
import { PolicyController } from './controllers/policy.controller';
import { PolicyService } from './services/policy.service';
import { PolicyRulesService } from './services/policy-rules.service';
import { InsurerIntegrationService } from './services/insurer-integration.service';

@Module({
  imports: [],
  controllers: [PolicyController],
  providers: [
    PolicyService,
    PolicyRulesService,
    InsurerIntegrationService
  ],
  exports: [
    PolicyService,
    PolicyRulesService,
    InsurerIntegrationService
  ]
})
export class PolicyManagerModule {}
