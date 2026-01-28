/**
 * AI Experts Module
 * NestJS module for AI experts system
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnthropicService } from './services/anthropic.service';
import { CacheService } from './services/cache.service';
import { AIOrchestratorService } from './orchestrator/ai-orchestrator.service';
import {
  AnthropicConfig,
  RedisConfig,
  defaultAnthropicConfig,
  defaultRedisConfig,
} from './config';

/**
 * AI Experts Module Configuration
 */
export interface ExpertsModuleOptions {
  anthropic?: Partial<AnthropicConfig>;
  redis?: Partial<RedisConfig>;
  orchestrator?: any;
}

@Global()
@Module({})
export class ExpertsModule {
  /**
   * Register module with configuration
   */
  static register(options?: ExpertsModuleOptions) {
    return {
      module: ExpertsModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: 'ANTHROPIC_CONFIG',
          useValue: { ...defaultAnthropicConfig, ...options?.anthropic },
        },
        {
          provide: 'REDIS_CONFIG',
          useValue: { ...defaultRedisConfig, ...options?.redis },
        },
        {
          provide: 'ORCHESTRATOR_CONFIG',
          useValue: options?.orchestrator || {},
        },
        {
          provide: AnthropicService,
          useFactory: (config: AnthropicConfig) => {
            return new AnthropicService(config);
          },
          inject: ['ANTHROPIC_CONFIG'],
        },
        {
          provide: CacheService,
          useFactory: (config: RedisConfig) => {
            return new CacheService(config);
          },
          inject: ['REDIS_CONFIG'],
        },
        {
          provide: AIOrchestratorService,
          useFactory: (cacheService: CacheService, config: any) => {
            return new AIOrchestratorService(cacheService, config);
          },
          inject: [CacheService, 'ORCHESTRATOR_CONFIG'],
        },
      ],
      exports: [AnthropicService, CacheService, AIOrchestratorService],
    };
  }

  /**
   * Register module asynchronously
   */
  static registerAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<ExpertsModuleOptions> | ExpertsModuleOptions;
    inject?: any[];
  }) {
    return {
      module: ExpertsModule,
      imports: [...(options.imports || []), ConfigModule],
      providers: [
        {
          provide: 'AI_EXPERTS_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        {
          provide: 'ANTHROPIC_CONFIG',
          useFactory: (moduleOptions: ExpertsModuleOptions) => {
            return { ...defaultAnthropicConfig, ...moduleOptions.anthropic };
          },
          inject: ['AI_EXPERTS_OPTIONS'],
        },
        {
          provide: 'REDIS_CONFIG',
          useFactory: (moduleOptions: ExpertsModuleOptions) => {
            return { ...defaultRedisConfig, ...moduleOptions.redis };
          },
          inject: ['AI_EXPERTS_OPTIONS'],
        },
        {
          provide: 'ORCHESTRATOR_CONFIG',
          useFactory: (moduleOptions: ExpertsModuleOptions) => {
            return moduleOptions.orchestrator || {};
          },
          inject: ['AI_EXPERTS_OPTIONS'],
        },
        {
          provide: AnthropicService,
          useFactory: (config: AnthropicConfig) => {
            return new AnthropicService(config);
          },
          inject: ['ANTHROPIC_CONFIG'],
        },
        {
          provide: CacheService,
          useFactory: (config: RedisConfig) => {
            return new CacheService(config);
          },
          inject: ['REDIS_CONFIG'],
        },
        {
          provide: AIOrchestratorService,
          useFactory: (cacheService: CacheService, config: any) => {
            return new AIOrchestratorService(cacheService, config);
          },
          inject: [CacheService, 'ORCHESTRATOR_CONFIG'],
        },
      ],
      exports: [AnthropicService, CacheService, AIOrchestratorService],
    };
  }
}
