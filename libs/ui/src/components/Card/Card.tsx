import React, { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const cardVariants = cva(
  [
    'bg-white dark:bg-secondary-900',
    'border border-secondary-200 dark:border-secondary-700',
    'transition-all duration-200',
  ],
  {
    variants: {
      variant: {
        default: '',
        elevated: 'shadow-md hover:shadow-lg',
        outline: 'shadow-none',
        ghost: 'border-transparent bg-secondary-50 dark:bg-secondary-800/50',
      },
      padding: {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-md',
        md: 'rounded-lg',
        lg: 'rounded-xl',
        full: 'rounded-2xl',
      },
      interactive: {
        true: 'cursor-pointer hover:border-primary-300 dark:hover:border-primary-700',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'md',
      rounded: 'md',
      interactive: false,
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Card content */
  children: ReactNode;
}

/**
 * Card component for containing content.
 *
 * @example
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *   </CardHeader>
 *   <CardContent>Content here</CardContent>
 * </Card>
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, rounded, interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, padding, rounded, interactive }), className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardHeader.displayName = 'CardHeader';

// Card Title
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ className, as: Tag = 'h3', children, ...props }, ref) => (
    <Tag
      ref={ref}
      className={cn(
        'text-lg font-semibold text-secondary-900 dark:text-secondary-100',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  )
);

CardTitle.displayName = 'CardTitle';

// Card Description
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-secondary-500 dark:text-secondary-400', className)}
      {...props}
    >
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

// Card Content
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

// Card Footer
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4 border-t border-secondary-200 dark:border-secondary-700', className)}
      {...props}
    >
      {children}
    </div>
  )
);

CardFooter.displayName = 'CardFooter';

export { cardVariants };
