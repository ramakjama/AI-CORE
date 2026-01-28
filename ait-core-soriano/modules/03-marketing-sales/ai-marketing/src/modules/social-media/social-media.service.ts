import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SocialPost } from '../../entities/social-post.entity';
import { FacebookIntegrationService } from './services/facebook-integration.service';
import { TwitterIntegrationService } from './services/twitter-integration.service';
import { LinkedInIntegrationService } from './services/linkedin-integration.service';
import { InstagramIntegrationService } from './services/instagram-integration.service';

@Injectable()
export class SocialMediaService {
  private readonly logger = new Logger(SocialMediaService.name);

  constructor(
    @InjectRepository(SocialPost)
    private socialPostRepository: Repository<SocialPost>,
    private facebookService: FacebookIntegrationService,
    private twitterService: TwitterIntegrationService,
    private linkedInService: LinkedInIntegrationService,
    private instagramService: InstagramIntegrationService,
  ) {}

  async schedulePost(platforms: string[], content: string, media: string[], scheduledFor: Date): Promise<any> {
    const posts = [];

    for (const platform of platforms) {
      const post = await this.createPost(platform, content, media, scheduledFor);
      posts.push(post);
    }

    return posts;
  }

  async publishPost(postId: string): Promise<any> {
    const post = await this.socialPostRepository.findOne({ where: { id: postId } });

    switch (post.platform) {
      case 'facebook':
        return this.facebookService.publishPost(post);
      case 'twitter':
        return this.twitterService.publishPost(post);
      case 'linkedin':
        return this.linkedInService.publishPost(post);
      case 'instagram':
        return this.instagramService.publishPost(post);
    }
  }

  async getAnalytics(platform: string, startDate: Date, endDate: Date): Promise<any> {
    switch (platform) {
      case 'facebook':
        return this.facebookService.getAnalytics(startDate, endDate);
      case 'twitter':
        return this.twitterService.getAnalytics(startDate, endDate);
      case 'linkedin':
        return this.linkedInService.getAnalytics(startDate, endDate);
      case 'instagram':
        return this.instagramService.getAnalytics(startDate, endDate);
    }
  }

  async monitorMentions(keywords: string[]): Promise<any> {
    const mentions = await Promise.all([
      this.twitterService.searchMentions(keywords),
      this.facebookService.searchMentions(keywords),
    ]);

    return mentions.flat();
  }

  private async createPost(platform: string, content: string, media: string[], scheduledFor: Date): Promise<any> {
    const post = this.socialPostRepository.create({
      platform,
      content,
      media,
      scheduledFor,
      status: 'scheduled',
      createdAt: new Date(),
    });

    return this.socialPostRepository.save(post);
  }
}
