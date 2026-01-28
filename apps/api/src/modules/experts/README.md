# AI Experts Module

Complete AI orchestration system for managing 20+ specialized AI experts powered by Claude (Anthropic).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Creating Custom Experts](#creating-custom-experts)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Best Practices](#best-practices)

## Overview

The AI Experts Module provides a robust, scalable architecture for building and orchestrating multiple AI experts. Each expert is a specialized AI agent with specific knowledge and capabilities, all coordinated through a central orchestrator.

### Key Features

- **BaseExpert Abstract Class**: Foundation for all experts with built-in caching, rate limiting, and error handling
- **AI Orchestrator**: Intelligent routing and coordination of multiple experts
- **Anthropic Integration**: Seamless integration with Claude API (Opus, Sonnet, Haiku)
- **Redis Caching**: High-performance caching layer for responses
- **Rate Limiting**: Token bucket implementation for API rate limiting
- **Cost Tracking**: Automatic cost tracking per model and expert
- **Error Handling**: Robust error handling with retry logic
- **Multi-Expert Coordination**: Support for sequential and parallel expert execution
- **TypeScript**: Full type safety with strict mode enabled
- **Comprehensive Testing**: Unit tests for all components

## Architecture

```
ai-experts/
├── base/
│   └── base-expert.ts          # Abstract base class for all experts
├── orchestrator/
│   └── ai-orchestrator.service.ts  # Central orchestration service
├── services/
│   ├── anthropic.service.ts    # Anthropic API integration
│   └── cache.service.ts        # Redis caching service
├── config/
│   ├── anthropic.config.ts     # Anthropic configuration
│   ├── redis.config.ts         # Redis configuration
│   └── logger.config.ts        # Winston logger setup
├── types/
│   ├── expert-config.interface.ts
│   ├── expert-response.interface.ts
│   ├── expert-context.interface.ts
│   └── orchestrator-options.interface.ts
├── utils/
│   ├── error-handler.ts        # Error handling utilities
│   ├── cache-key-generator.ts  # Cache key generation
│   └── rate-limiter.ts         # Rate limiting implementation
└── ai-experts.module.ts        # NestJS module definition
```

## Installation

### 1. Install Dependencies

```bash
npm install @anthropic-ai/sdk ioredis winston winston-daily-rotate-file
npm install --save-dev @types/node
```

### 2. Environment Setup

Create a `.env` file based on `.env.example`:

```env
ANTHROPIC_API_KEY=your_api_key_here
REDIS_HOST=localhost
REDIS_PORT=6379
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Start Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using Redis CLI
redis-server
```

## Quick Start

### 1. Register the Module

```typescript
import { Module } from '@nestjs/common';
import { AIExpertsModule } from './modules/ai-experts';

@Module({
  imports: [
    AIExpertsModule.register({
      anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
      orchestrator: {
        routingStrategy: 'intelligent',
        enableMultiExpert: true,
        enableCache: true,
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Create Your First Expert

```typescript
import { BaseExpert } from './modules/ai-experts';
import {
  ExpertConfig,
  ExpertContext,
  ExpertResponse,
  AnalysisResponse,
  SuggestionResponse,
  ExecutionResponse,
} from './modules/ai-experts/types';

export class TaxExpert extends BaseExpert {
  constructor(anthropicService, cacheService) {
    const config: ExpertConfig = {
      name: 'tax-expert',
      displayName: 'Tax Expert',
      description: 'Expert in tax analysis and optimization',
      model: 'opus', // Use Opus for complex analysis
      systemPrompt: `You are an expert tax advisor with deep knowledge of
        tax laws, regulations, and optimization strategies.`,
      tags: ['tax', 'finance', 'analysis'],
      priority: 10,
      enableCache: true,
      cacheTTL: 3600,
    };

    super(config, anthropicService, cacheService);
  }

  async analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>> {
    const contextString = this.buildContextString(context);
    const query = context.request.payload.query;

    const prompt = `
      ${contextString}

      Please analyze the following tax situation:
      ${query}

      Provide:
      1. A summary of the key tax implications
      2. Insights about potential issues
      3. Recommendations for optimization
    `;

    const result = await this.callAI(prompt, context);

    // Parse the AI response
    return this.createSuccessResponse({
      summary: result,
      insights: ['Insight 1', 'Insight 2'],
      recommendations: ['Recommendation 1', 'Recommendation 2'],
    });
  }

  async suggest(context: ExpertContext): Promise<ExpertResponse<SuggestionResponse>> {
    const prompt = `Based on the tax context, provide actionable suggestions.`;
    const result = await this.callAI(prompt, context);

    return this.createSuccessResponse({
      suggestions: [
        {
          title: 'Tax Optimization',
          description: 'Optimize your tax strategy',
          priority: 'high',
          impact: 'high',
          effort: 'medium',
          steps: ['Step 1', 'Step 2'],
        },
      ],
      rationale: result,
    });
  }

  async execute(
    action: string,
    params: any,
    context: ExpertContext,
  ): Promise<ExpertResponse<ExecutionResponse>> {
    // Implement specific actions
    return this.createSuccessResponse({
      action,
      status: 'success',
      result: params,
      steps: [],
      duration: 0,
    });
  }
}
```

### 3. Register Expert with Orchestrator

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { AIOrchestratorService } from './modules/ai-experts';
import { TaxExpert } from './experts/tax-expert';

@Injectable()
export class ExpertsService implements OnModuleInit {
  constructor(
    private orchestrator: AIOrchestratorService,
    private anthropicService: AnthropicService,
    private cacheService: CacheService,
  ) {}

  async onModuleInit() {
    // Create and register experts
    const taxExpert = new TaxExpert(this.anthropicService, this.cacheService);
    this.orchestrator.registerExpert(taxExpert);
  }
}
```

### 4. Use the Orchestrator

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { AIOrchestratorService } from './modules/ai-experts';
import { createBasicContext } from './modules/ai-experts/types';

@Controller('ai')
export class AIController {
  constructor(private orchestrator: AIOrchestratorService) {}

  @Post('query')
  async query(@Body() body: { userId: string; query: string }) {
    const context = createBasicContext(body.userId, 'analysis', {
      query: body.query,
    });

    // Route to appropriate expert
    const response = await this.orchestrator.route(body.query, context);

    return response;
  }

  @Post('multi-expert')
  async multiExpert(@Body() body: { userId: string; query: string }) {
    const context = createBasicContext(body.userId, 'analysis', {
      query: body.query,
    });

    // Coordinate multiple experts
    const response = await this.orchestrator.coordinateExperts(body.query, context);

    return response;
  }
}
```

## Core Components

### BaseExpert

Abstract base class providing core functionality:

- **callAI()**: Make calls to Claude with automatic retries
- **process()**: Main entry point with caching and rate limiting
- **buildContextString()**: Build context for AI prompts
- **createSuccessResponse()**: Create standardized success responses
- **createErrorResponse()**: Create standardized error responses
- **clearCache()**: Clear cached responses for this expert

### AIOrchestratorService

Central coordination service:

- **registerExpert()**: Register an expert
- **route()**: Route queries to appropriate expert
- **coordinateExperts()**: Coordinate multiple experts
- **getStats()**: Get orchestrator statistics
- **healthCheck()**: Check health of all experts

### AnthropicService

Integration with Anthropic's Claude API:

- **sendMessage()**: Send a message to Claude
- **sendMessageWithRetry()**: Send with automatic retry logic
- **getCostStats()**: Get cost statistics
- **checkDailyBudget()**: Check daily budget limits

### CacheService

Redis-based caching:

- **get()**: Get value from cache
- **set()**: Set value in cache with TTL
- **delete()**: Delete value from cache
- **deletePattern()**: Delete multiple keys by pattern
- **getStats()**: Get cache statistics

## Configuration

### Expert Configuration

```typescript
interface ExpertConfig {
  name: string;               // Unique identifier
  displayName: string;        // Human-readable name
  description: string;        // Expert description
  model: 'opus' | 'sonnet' | 'haiku';  // Claude model
  systemPrompt: string;       // System prompt defining behavior
  tools?: string[];           // Available tools
  maxTokens?: number;         // Max tokens (default: 4096)
  temperature?: number;       // Temperature (default: 0.7)
  enableCache?: boolean;      // Enable caching (default: true)
  cacheTTL?: number;          // Cache TTL in seconds (default: 3600)
  rateLimit?: number;         // Requests per minute (default: 60)
  priority?: number;          // Priority 1-10 (default: 5)
  tags?: string[];            // Tags for routing
  retry?: {                   // Retry configuration
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
  };
  timeout?: number;           // Timeout in ms (default: 30000)
}
```

### Orchestrator Configuration

```typescript
interface OrchestratorOptions {
  routingStrategy?: 'priority' | 'round-robin' | 'least-loaded' | 'intelligent';
  enableMultiExpert?: boolean;
  maxExperts?: number;
  enableCache?: boolean;
  cacheTTL?: number;
  enableLoadBalancing?: boolean;
  costManagement?: {
    enableTracking: boolean;
    dailyBudget?: number;
    preferLowerCostModels?: boolean;
  };
  monitoring?: {
    enableMetrics: boolean;
    enableTracing: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}
```

## API Reference

### ExpertContext

Context passed to experts:

```typescript
interface ExpertContext {
  user: {
    id: string;
    email?: string;
    role?: string;
  };
  company?: {
    id: string;
    name: string;
    industry?: string;
  };
  request: {
    type: 'analysis' | 'suggestion' | 'execution' | 'query';
    payload: any;
    parameters?: Record<string, any>;
  };
  sharedContext?: {
    expertResponses?: Array<any>;
    insights?: string[];
  };
  environment?: {
    name: string;
    featureFlags?: Record<string, boolean>;
  };
}
```

### ExpertResponse

Standardized response format:

```typescript
interface ExpertResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    expertName: string;
    model: string;
    timestamp: Date;
    responseTime: number;
    tokensUsed?: {
      input: number;
      output: number;
      total: number;
    };
    cost?: number;
    cached: boolean;
  };
  confidence?: number;
  alternatives?: T[];
  followUp?: string[];
}
```

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

Example test:

```typescript
describe('TaxExpert', () => {
  let expert: TaxExpert;
  let mockAnthropicService: jest.Mocked<AnthropicService>;
  let mockCacheService: jest.Mocked<CacheService>;

  beforeEach(() => {
    mockAnthropicService = {
      sendMessageWithRetry: jest.fn(),
    } as any;

    mockCacheService = {
      get: jest.fn(),
      set: jest.fn(),
    } as any;

    expert = new TaxExpert(mockAnthropicService, mockCacheService);
  });

  it('should analyze tax situation', async () => {
    mockAnthropicService.sendMessageWithRetry.mockResolvedValue({
      content: 'Tax analysis result',
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      cost: 0.01,
    });

    const context = createBasicContext('user-123', 'analysis', {
      query: 'What are the tax implications?',
    });

    const result = await expert.analyze(context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });
});
```

## Best Practices

### 1. Expert Design

- **Single Responsibility**: Each expert should focus on one domain
- **Clear Prompts**: Write clear, specific system prompts
- **Appropriate Model**: Use Opus for complex analysis, Haiku for simple queries
- **Error Handling**: Always handle errors gracefully

### 2. Caching Strategy

- **Enable Caching**: Enable caching for frequently requested data
- **Set Appropriate TTL**: Set TTL based on data volatility
- **Cache Invalidation**: Clear cache when underlying data changes

### 3. Cost Optimization

- **Model Selection**: Choose the right model for each task
- **Token Limits**: Set appropriate maxTokens to control costs
- **Budget Monitoring**: Monitor daily costs and set budgets

### 4. Rate Limiting

- **Set Appropriate Limits**: Set rate limits based on API quotas
- **Handle Backpressure**: Implement proper error handling for rate limits

### 5. Monitoring

- **Enable Logging**: Use structured logging for debugging
- **Track Metrics**: Monitor response times, error rates, costs
- **Health Checks**: Implement health checks for all components

## Example: Complete Expert Implementation

```typescript
export class InsuranceExpert extends BaseExpert {
  constructor(anthropicService: AnthropicService, cacheService: CacheService) {
    super(
      {
        name: 'insurance-expert',
        displayName: 'Insurance Expert',
        description: 'Expert in insurance policies, claims, and risk assessment',
        model: 'sonnet',
        systemPrompt: `You are an expert insurance advisor with comprehensive
          knowledge of insurance products, underwriting, claims processing, and
          risk management. Provide clear, actionable advice.`,
        tags: ['insurance', 'risk', 'claims'],
        priority: 8,
        maxTokens: 4096,
        temperature: 0.7,
        enableCache: true,
        cacheTTL: 1800, // 30 minutes
        rateLimit: 30,
      },
      anthropicService,
      cacheService,
    );
  }

  async analyze(context: ExpertContext): Promise<ExpertResponse<AnalysisResponse>> {
    const { payload } = context.request;

    const prompt = `
      Analyze the following insurance situation:
      ${JSON.stringify(payload, null, 2)}

      Provide:
      1. Summary of coverage
      2. Key insights about the policy
      3. Risk assessment
      4. Recommendations for improvement
    `;

    try {
      const result = await this.callAI(prompt, context);

      // Parse structured response
      const analysis = this.parseAnalysis(result);

      return this.createSuccessResponse(analysis, {
        tokensUsed: { input: 500, output: 300, total: 800 },
      });
    } catch (error) {
      return this.createErrorResponse(error);
    }
  }

  private parseAnalysis(result: string): AnalysisResponse {
    // Implement parsing logic
    return {
      summary: result,
      insights: [],
      recommendations: [],
      risks: [],
      opportunities: [],
    };
  }
}
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Ensure Redis is running
   - Check REDIS_HOST and REDIS_PORT in .env

2. **Anthropic API Errors**
   - Verify ANTHROPIC_API_KEY is correct
   - Check API rate limits

3. **Rate Limit Exceeded**
   - Increase rate limit in expert config
   - Implement request queuing

4. **High Costs**
   - Use Haiku for simple queries
   - Set maxTokens limits
   - Enable caching

## Support

For issues and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

## License

MIT
