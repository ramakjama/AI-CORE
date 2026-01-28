import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { z } from 'zod';

/**
 * NestJS pipe for Zod validation
 *
 * @example
 * ```typescript
 * @Post()
 * @UsePipes(new ZodValidationPipe(CreateUserSchema))
 * async create(@Body() data: CreateUserInput) {
 *   return this.service.create(data);
 * }
 * ```
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: z.ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    try {
      const parsed = this.schema.parse(value);
      return parsed;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        throw new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors,
        });
      }
      throw error;
    }
  }
}

/**
 * Safe parse with custom error handling
 */
export function safeValidate<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): { success: true; data: z.infer<T> } | { success: false; errors: Array<{ field: string; message: string }> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: result.error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Decorator for automatic Zod validation in NestJS controllers
 *
 * @example
 * ```typescript
 * @Post()
 * @ValidateBody(CreateUserSchema)
 * async create(@Body() data: CreateUserInput) {
 *   return this.service.create(data);
 * }
 * ```
 */
export function ValidateBody(schema: z.ZodSchema) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const body = args.find((arg) => typeof arg === 'object' && arg !== null);

      if (body) {
        const result = safeValidate(schema, body);

        if (!result.success) {
          throw new BadRequestException({
            statusCode: 400,
            message: 'Validation failed',
            errors: result.errors,
          });
        }

        // Replace body with validated data
        const bodyIndex = args.indexOf(body);
        args[bodyIndex] = result.data;
      }

      return originalMethod.apply(this, args);
    };

    // Store schema metadata for Swagger
    Reflect.defineMetadata('zodSchema', schema, target, propertyKey);

    return descriptor;
  };
}

/**
 * Decorator for automatic Zod validation of query parameters
 */
export function ValidateQuery(schema: z.ZodSchema) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('zodQuerySchema', schema, target, propertyKey);
    return descriptor;
  };
}

/**
 * Decorator for automatic Zod validation of route parameters
 */
export function ValidateParams(schema: z.ZodSchema) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('zodParamsSchema', schema, target, propertyKey);
    return descriptor;
  };
}
