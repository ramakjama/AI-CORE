import React, { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../utils/cn';

const selectTriggerVariants = cva(
  [
    'flex items-center justify-between gap-2',
    'w-full bg-white dark:bg-secondary-900',
    'border border-secondary-300 dark:border-secondary-700',
    'text-secondary-900 dark:text-secondary-100',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-primary-500/20 focus:border-primary-500',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'data-[placeholder]:text-secondary-400',
  ],
  {
    variants: {
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-12 px-4 text-base rounded-lg',
      },
      variant: {
        default: '',
        error: 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends VariantProps<typeof selectTriggerVariants> {
  /** Select options */
  options: SelectOption[];
  /** Selected value */
  value?: string;
  /** Default value for uncontrolled usage */
  defaultValue?: string;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Label text displayed above the select */
  label?: string;
  /** Helper text displayed below the select */
  helperText?: string;
  /** Error message */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Name attribute for form submission */
  name?: string;
  /** Change handler */
  onValueChange?: (value: string) => void;
  /** Additional class names */
  className?: string;
}

/**
 * Select component built on Radix UI Select primitive.
 *
 * @example
 * <Select
 *   label="Country"
 *   placeholder="Select a country"
 *   options={[
 *     { value: 'es', label: 'Spain' },
 *     { value: 'fr', label: 'France' },
 *   ]}
 * />
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue,
      placeholder = 'Select an option',
      label,
      helperText,
      error,
      disabled,
      required,
      name,
      onValueChange,
      size,
      variant,
      className,
    },
    ref
  ) => {
    const selectId = `select-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const computedVariant = error ? 'error' : variant;

    return (
      <div className={cn('flex flex-col gap-1.5 w-full', className)}>
        {label && (
          <label
            htmlFor={selectId}
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

        <SelectPrimitive.Root
          value={value}
          defaultValue={defaultValue}
          onValueChange={onValueChange}
          disabled={disabled}
          name={name}
        >
          <SelectPrimitive.Trigger
            ref={ref}
            id={selectId}
            className={cn(selectTriggerVariants({ size, variant: computedVariant }))}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            aria-required={required}
          >
            <SelectPrimitive.Value placeholder={placeholder} />
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="h-4 w-4 text-secondary-400" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>

          <SelectPrimitive.Portal>
            <SelectPrimitive.Content
              className={cn(
                'relative z-50 min-w-[8rem] overflow-hidden',
                'bg-white dark:bg-secondary-900',
                'border border-secondary-200 dark:border-secondary-700',
                'rounded-md shadow-lg',
                'data-[state=open]:animate-fade-in',
                'data-[state=closed]:animate-fade-out'
              )}
              position="popper"
              sideOffset={4}
            >
              <SelectPrimitive.ScrollUpButton className="flex items-center justify-center h-6 bg-white dark:bg-secondary-900 cursor-default">
                <ChevronUp className="h-4 w-4" />
              </SelectPrimitive.ScrollUpButton>

              <SelectPrimitive.Viewport className="p-1">
                {options.map((option) => (
                  <SelectPrimitive.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className={cn(
                      'relative flex items-center',
                      'px-8 py-2 text-sm',
                      'text-secondary-900 dark:text-secondary-100',
                      'cursor-pointer select-none outline-none',
                      'focus:bg-primary-50 dark:focus:bg-primary-900/20',
                      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                      'rounded'
                    )}
                  >
                    <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-600" />
                    </SelectPrimitive.ItemIndicator>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
              </SelectPrimitive.Viewport>

              <SelectPrimitive.ScrollDownButton className="flex items-center justify-center h-6 bg-white dark:bg-secondary-900 cursor-default">
                <ChevronDown className="h-4 w-4" />
              </SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
          </SelectPrimitive.Portal>
        </SelectPrimitive.Root>

        {(error || helperText) && (
          <p
            id={error ? errorId : helperId}
            className={cn(
              'text-sm',
              error
                ? 'text-danger-600 dark:text-danger-400'
                : 'text-secondary-500 dark:text-secondary-400'
            )}
            role={error ? 'alert' : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { selectTriggerVariants };
