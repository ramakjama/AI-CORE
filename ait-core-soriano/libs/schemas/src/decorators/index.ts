/**
 * Decorators and utilities for framework integration
 */

// NestJS decorators
export {
  ZodValidationPipe,
  safeValidate,
  ValidateBody,
  ValidateQuery,
  ValidateParams,
} from './zod-validation.decorator';

// React Hook Form utilities
export {
  useZodForm,
  useZodMultiStepForm,
  useZodValidation,
  getFormErrors,
  hasFieldError,
  getFieldError,
} from './react-hook-form';
