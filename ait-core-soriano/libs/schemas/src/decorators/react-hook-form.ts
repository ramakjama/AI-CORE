import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Enhanced useForm hook with Zod validation
 *
 * @example
 * ```typescript
 * const { register, handleSubmit, formState } = useZodForm(LoginSchema);
 *
 * const onSubmit = async (data: LoginInput) => {
 *   await login(data);
 * };
 *
 * return (
 *   <form onSubmit={handleSubmit(onSubmit)}>
 *     <input {...register('email')} />
 *     {formState.errors.email && <span>{formState.errors.email.message}</span>}
 *   </form>
 * );
 * ```
 */
export function useZodForm<T extends z.ZodSchema>(
  schema: T,
  options?: Omit<UseFormProps<z.infer<T>>, 'resolver'>
): UseFormReturn<z.infer<T>> {
  return useForm<z.infer<T>>({
    ...options,
    resolver: zodResolver(schema),
  });
}

/**
 * Hook for multi-step forms with Zod validation
 *
 * @example
 * ```typescript
 * const steps = [Step1Schema, Step2Schema, Step3Schema];
 * const { currentStep, nextStep, prevStep, isLastStep, form } = useZodMultiStepForm(steps);
 * ```
 */
export function useZodMultiStepForm<T extends z.ZodSchema[]>(
  schemas: T,
  options?: Omit<UseFormProps<z.infer<T[number]>>, 'resolver'>
) {
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const currentSchema = schemas[currentStepIndex];

  const form = useForm<z.infer<typeof currentSchema>>({
    ...options,
    resolver: zodResolver(currentSchema),
  });

  const nextStep = () => {
    if (currentStepIndex < schemas.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const goToStep = (index: number) => {
    if (index >= 0 && index < schemas.length) {
      setCurrentStepIndex(index);
    }
  };

  return {
    form,
    currentStep: currentStepIndex,
    totalSteps: schemas.length,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === schemas.length - 1,
    nextStep,
    prevStep,
    goToStep,
  };
}

/**
 * Helper to get form errors in a user-friendly format
 */
export function getFormErrors<T extends FieldValues>(
  formState: UseFormReturn<T>['formState']
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.entries(formState.errors).forEach(([key, error]) => {
    if (error && typeof error.message === 'string') {
      errors[key] = error.message;
    }
  });

  return errors;
}

/**
 * Helper to check if a specific field has errors
 */
export function hasFieldError<T extends FieldValues>(
  formState: UseFormReturn<T>['formState'],
  fieldName: keyof T
): boolean {
  return !!formState.errors[fieldName as string];
}

/**
 * Helper to get a specific field error message
 */
export function getFieldError<T extends FieldValues>(
  formState: UseFormReturn<T>['formState'],
  fieldName: keyof T
): string | undefined {
  const error = formState.errors[fieldName as string];
  return error?.message as string | undefined;
}

/**
 * React Hook for form validation without react-hook-form
 * Useful for simpler forms or when you don't need full form management
 */
export function useZodValidation<T extends z.ZodSchema>(schema: T) {
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (data: unknown): data is z.infer<T> => {
    const result = schema.safeParse(data);

    if (result.success) {
      setErrors({});
      return true;
    }

    const newErrors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      const field = err.path.join('.');
      newErrors[field] = err.message;
    });

    setErrors(newErrors);
    return false;
  };

  const validateField = (fieldName: string, value: unknown): boolean => {
    try {
      // Try to validate just this field
      const fieldSchema = schema.shape?.[fieldName];
      if (fieldSchema) {
        fieldSchema.parse(value);
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
        return true;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrors((prev) => ({
          ...prev,
          [fieldName]: error.errors[0]?.message || 'Validation error',
        }));
      }
      return false;
    }
    return false;
  };

  const clearErrors = () => setErrors({});

  const clearFieldError = (fieldName: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  return {
    validate,
    validateField,
    errors,
    clearErrors,
    clearFieldError,
    hasErrors: Object.keys(errors).length > 0,
  };
}

// Note: React import for hooks
declare const React: any;
