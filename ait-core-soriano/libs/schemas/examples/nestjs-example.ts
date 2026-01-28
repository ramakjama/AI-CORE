/**
 * NestJS Integration Examples
 *
 * Shows how to use @ait-core/schemas with NestJS for API validation
 */

import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UsePipes,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  // Schemas
  CreatePolicySchema,
  UpdatePolicySchema,
  FilterPoliciesSchema,
  CreateClaimSchema,
  LoginSchema,

  // Types
  CreatePolicyInput,
  UpdatePolicyInput,
  FilterPoliciesInput,
  CreateClaimInput,
  LoginInput,

  // Pipes
  ZodValidationPipe,
  ValidateBody,
} from '@ait-core/schemas';

// ============================================
// EXAMPLE 1: Using ZodValidationPipe
// ============================================

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreatePolicySchema))
  async create(@Body() data: CreatePolicyInput) {
    // data is fully typed and validated
    return this.policiesService.create(data);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(FilterPoliciesSchema))
  async findAll(@Query() filters: FilterPoliciesInput) {
    return this.policiesService.findAll(filters);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(UpdatePolicySchema))
  async update(
    @Param('id') id: string,
    @Body() data: UpdatePolicyInput
  ) {
    return this.policiesService.update(id, data);
  }
}

// ============================================
// EXAMPLE 2: Using ValidateBody Decorator
// ============================================

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  @ValidateBody(CreateClaimSchema)
  async create(@Body() data: CreateClaimInput) {
    // Validation happens automatically via decorator
    return this.claimsService.create(data);
  }
}

// ============================================
// EXAMPLE 3: Authentication Controller
// ============================================

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() credentials: LoginInput) {
    return this.authService.login(credentials);
  }
}

// ============================================
// EXAMPLE 4: Custom Validation in Service
// ============================================

import { Injectable, BadRequestException } from '@nestjs/common';
import { CreatePolicySchema } from '@ait-core/schemas';

@Injectable()
export class PoliciesService {
  async create(data: unknown) {
    // Manual validation in service
    const result = CreatePolicySchema.safeParse(data);

    if (!result.success) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        })),
      });
    }

    // Use validated data
    const validData = result.data;

    // Save to database...
    return this.repository.save(validData);
  }
}

// ============================================
// EXAMPLE 5: Global Validation Pipe
// ============================================

// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ZodValidationPipe } from '@ait-core/schemas';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Apply validation globally
  // Note: Each controller should specify its own schema
  // This is just an example - normally you'd use per-route validation

  await app.listen(3000);
}

// ============================================
// EXAMPLE 6: Response Schemas
// ============================================

import { createResponseSchema, PolicySchema } from '@ait-core/schemas';

const PolicyResponseSchema = createResponseSchema(PolicySchema);

@Controller('policies')
export class PoliciesController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const policy = await this.policiesService.findOne(id);

    // Validate response before sending
    return PolicyResponseSchema.parse({
      success: true,
      data: policy,
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// ============================================
// EXAMPLE 7: Error Handling
// ============================================

import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse();

    // Custom error response format
    response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: exceptionResponse['errors'] || [],
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }
}

// Apply filter globally in main.ts
app.useGlobalFilters(new ZodValidationExceptionFilter());
