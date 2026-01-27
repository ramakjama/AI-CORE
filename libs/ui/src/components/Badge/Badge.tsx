import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  [
    'inline-flex items-center justify-center',
    'font-medium',
    'transition-colors duration-200',
  ],
  {
    variants: {
      variant: {
        default: [
          'bg-secondary-100 text-secondary-800',
          'dark:bg-secondary-800 dark:text-secondary-200',
        ],
        primary: [
          'bg-primary-100 text-primary-800',
          'dark:bg-primary-900/30 dark:text-primary-300',
        ],
        success: [
          'bg-success-100 text-success-800',
          'dark:bg-success-900/30 dark:text-success-300',
        ],
        warning: [
          'bg-warning-100 text-warning-800',
          'dark:bg-warning-900/30 dark:text-warning-300',
        ],
        danger: [
          'bg-danger-100 text-danger-800',
          'dark:bg-danger-900/30 dark:text-danger-300',
        ],
        info: [
          'bg-blue-100 text-blue-800',
          'dark:bg-blue-900/30 dark:text-blue-300',
        ],
        outline: [
          'bg-transparent border border-secondary-300 text-secondary-700',
          'dark:border-secondary-600 dark:text-secondary-300',
        ],
      },
      size: {
        sm: 'text-xs px-2 py-0.5 rounded',
        md: 'text-xs px-2.5 py-1 rounded-md',
        lg: 'text-sm px-3 py-1 rounded-md',
      },
      dot: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        dot: true,
        size: 'sm',
        className: 'pl-1.5',
      },
      {
        dot: true,
        size: 'md',
        className: 'pl-2',
      },
      {
        dot: true,
        size: 'lg',
        className: 'pl-2.5',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
      dot: false,
    },
  }
);

const dotVariants = cva('rounded-full', {
  variants: {
    variant: {
      default: 'bg-secondary-500',
      primary: 'bg-primary-500',
      success: 'bg-success-500',
      warning: 'bg-warning-500',
      danger: 'bg-danger-500',
      info: 'bg-blue-500',
      outline: 'bg-secondary-500',
    },
    size: {
      sm: 'w-1.5 h-1.5 mr-1',
      md: 'w-2 h-2 mr-1.5',
      lg: 'w-2 h-2 mr-2',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Badge content */
  children: ReactNode;
  /** Left icon element */
  leftIcon?: ReactNode;
  /** Right icon element */
  rightIcon?: ReactNode;
}

/**
 * Badge component for status indicators, labels, and tags.
 *
 * @example
 * <Badge variant="success">Active</Badge>
 *
 * @example
 * <Badge variant="warning" dot>Pending</Badge>
 *
 * @example
 * <Badge variant="danger" leftIcon={<AlertIcon />}>Error</Badge>
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot, leftIcon, rightIcon, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, dot }), className)}
        {...props}
      >
        {dot && (
          <span
            className={cn(dotVariants({ variant, size }))}
            aria-hidden="true"
          />
        )}
        {leftIcon && <span className="mr-1 shrink-0">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-1 shrink-0">{rightIcon}</span>}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export { badgeVariants };
