import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialMediaService } from './social-media.service';
import { SocialMediaController } from './social-media.controller';
import { FacebookIntegrationService } from './services/facebook-integration.service';
import { TwitterIntegrationService } from './services/twitter-integration.service';
import { LinkedInIntegrationService } from './services/linkedin-integration.service';
import { InstagramIntegrationService } from './services/instagram-integration.service';
import { SocialPost } from '../../entities/social-post.entity';

@Module({
  imports: [HttpModule, TypeOrmModule.forFeature([SocialPost])],
  controllers: [SocialMediaController],
  providers: [
    SocialMediaService,
    FacebookIntegrationService,
    TwitterIntegrationService,
    LinkedInIntegrationService,
    InstagramIntegrationService,
  ],
  exports: [SocialMediaService],
})
export class SocialMediaModule {}
