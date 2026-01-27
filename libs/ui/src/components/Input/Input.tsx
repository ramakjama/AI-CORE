import React, { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const inputVariants = cva(
  [
    'w-full bg-white dark:bg-secondary-900',
    'border border-secondary-300 dark:border-secondary-700',
    'text-secondary-900 dark:text-secondary-100',
    'placeholder:text-secondary-400 dark:placeholder:text-secondary-500',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-secondary-50 dark:disabled:bg-secondary-800',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-12 px-4 text-base rounded-lg',
      },
      variant: {
        default: [
          'focus:border-primary-500 focus:ring-primary-500/20',
        ],
        error: [
          'border-danger-500 dark:border-danger-500',
          'focus:border-danger-500 focus:ring-danger-500/20',
        ],
        success: [
          'border-success-500 dark:border-success-500',
          'focus:border-success-500 focus:ring-success-500/20',
        ],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Label text displayed above the input */
  label?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Error message (sets variant to error automatically) */
  error?: string;
  /** Success message (sets variant to success automatically) */
  successMessage?: string;
  /** Icon or element to show on the left side of the input */
  leftElement?: ReactNode;
  /** Icon or element to show on the right side of the input */
  rightElement?: ReactNode;
  /** Makes the input full width */
  fullWidth?: boolean;
  /** Required field indicator */
  required?: boolean;
}

/**
 * Input component with labels, validation states, and icons.
 *
 * @example
 * <Input label="Email" type="email" placeholder="Enter your email" />
 *
 * @example
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * @example
 * <Input
 *   label="Search"
 *   leftElement={<SearchIcon />}
 *   placeholder="Search..."
 * />
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      variant,
      label,
      helperText,
      error,
      successMessage,
      leftElement,
      rightElement,
      fullWidth = true,
      required,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    // Determine variant based on error/success
    const computedVariant = error ? 'error' : successMessage ? 'success' : variant;

    // Determine which status icon to show
    const statusIcon = error ? (
      <AlertCircle className="h-5 w-5 text-danger-500" aria-hidden="true" />
    ) : successMessage ? (
      <CheckCircle2 className="h-5 w-5 text-success-500" aria-hidden="true" />
    ) : null;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-secondary-700 dark:text-secondary-300',
              disabled && 'opacity-50'
            )}
          >
            {label}
            {required && (
              <span className="ml-1 text-danger-500" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          {leftElement && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              inputVariants({ size, variant: computedVariant }),
              leftElement && 'pl-10',
              (rightElement || statusIcon) && 'pr-10',
              className
            )}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error ? errorId : helperText ? helperId : undefined
            }
            aria-required={required}
            {...props}
          />

          {(rightElement || statusIcon) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {statusIcon || rightElement}
            </div>
          )}
        </div>

        {(error || successMessage || helperText) && (
          <p
            id={error ? errorId : helperId}
            className={cn(
              'text-sm',
              error && 'text-danger-600 dark:text-danger-400',
              successMessage && 'text-success-600 dark:text-success-400',
              !error && !successMessage && 'text-secondary-500 dark:text-secondary-400'
            )}
            role={error ? 'alert' : undefined}
          >
            {error || successMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { inputVariants };
