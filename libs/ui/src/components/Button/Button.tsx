import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-primary-600 text-white',
          'hover:bg-primary-700',
          'focus-visible:ring-primary-500',
        ],
        secondary: [
          'bg-secondary-100 text-secondary-900',
          'hover:bg-secondary-200',
          'focus-visible:ring-secondary-500',
          'dark:bg-secondary-800 dark:text-secondary-100 dark:hover:bg-secondary-700',
        ],
        outline: [
          'border-2 border-primary-600 text-primary-600 bg-transparent',
          'hover:bg-primary-50',
          'focus-visible:ring-primary-500',
          'dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-950',
        ],
        ghost: [
          'text-secondary-700 bg-transparent',
          'hover:bg-secondary-100',
          'focus-visible:ring-secondary-500',
          'dark:text-secondary-300 dark:hover:bg-secondary-800',
        ],
        danger: [
          'bg-danger-600 text-white',
          'hover:bg-danger-700',
          'focus-visible:ring-danger-500',
        ],
        success: [
          'bg-success-600 text-white',
          'hover:bg-success-700',
          'focus-visible:ring-success-500',
        ],
        warning: [
          'bg-warning-500 text-white',
          'hover:bg-warning-600',
          'focus-visible:ring-warning-500',
        ],
        link: [
          'text-primary-600 bg-transparent underline-offset-4',
          'hover:underline',
          'focus-visible:ring-primary-500',
          'dark:text-primary-400',
        ],
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded',
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-11 px-6 text-base rounded-lg',
        xl: 'h-12 px-8 text-lg rounded-lg',
        icon: 'h-10 w-10 rounded-md',
        'icon-sm': 'h-8 w-8 rounded-md',
        'icon-lg': 'h-12 w-12 rounded-lg',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Content to render before the button text */
  leftIcon?: ReactNode;
  /** Content to render after the button text */
  rightIcon?: ReactNode;
  /** Show loading spinner and disable button */
  isLoading?: boolean;
  /** Loading text to show while loading */
  loadingText?: string;
  /** Use Radix Slot for composition with other elements */
  asChild?: boolean;
}

/**
 * Button component with multiple variants, sizes, and states.
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 *
 * @example
 * <Button variant="outline" leftIcon={<Plus />}>Add Item</Button>
 *
 * @example
 * <Button isLoading loadingText="Saving...">Save</Button>
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      leftIcon,
      rightIcon,
      isLoading = false,
      loadingText,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || isLoading;

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            {loadingText ?? children}
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
