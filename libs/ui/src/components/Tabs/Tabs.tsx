import React, { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const tabsListVariants = cva(
  'inline-flex items-center',
  {
    variants: {
      variant: {
        default: [
          'bg-secondary-100 dark:bg-secondary-800',
          'rounded-lg p-1',
        ],
        underline: [
          'border-b border-secondary-200 dark:border-secondary-700',
          'gap-4',
        ],
        pills: [
          'gap-2',
        ],
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const tabsTriggerVariants = cva(
  [
    'inline-flex items-center justify-center whitespace-nowrap',
    'font-medium transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  {
    variants: {
      variant: {
        default: [
          'px-3 py-1.5 text-sm rounded-md',
          'text-secondary-600 dark:text-secondary-400',
          'data-[state=active]:bg-white dark:data-[state=active]:bg-secondary-900',
          'data-[state=active]:text-secondary-900 dark:data-[state=active]:text-secondary-100',
          'data-[state=active]:shadow-sm',
        ],
        underline: [
          'pb-3 text-sm',
          'text-secondary-600 dark:text-secondary-400',
          'border-b-2 border-transparent -mb-px',
          'data-[state=active]:text-primary-600 dark:data-[state=active]:text-primary-400',
          'data-[state=active]:border-primary-600 dark:data-[state=active]:border-primary-400',
          'hover:text-secondary-900 dark:hover:text-secondary-200',
        ],
        pills: [
          'px-4 py-2 text-sm rounded-full',
          'text-secondary-600 dark:text-secondary-400',
          'hover:bg-secondary-100 dark:hover:bg-secondary-800',
          'data-[state=active]:bg-primary-600 data-[state=active]:text-white',
        ],
      },
      size: {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface TabsProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
    VariantProps<typeof tabsListVariants> {
  /** Additional class names */
  className?: string;
}

/**
 * Tabs component built on Radix UI Tabs primitive.
 *
 * @example
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Content 1</TabsContent>
 *   <TabsContent value="tab2">Content 2</TabsContent>
 * </Tabs>
 */
export const Tabs = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  TabsProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    className={cn('w-full', className)}
    {...props}
  />
));

Tabs.displayName = 'Tabs';

// Tabs List
export interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  TabsListProps
>(({ className, variant, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(tabsListVariants({ variant }), className)}
    {...props}
  />
));

TabsList.displayName = 'TabsList';

// Tabs Trigger
export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  /** Icon to show before the text */
  icon?: React.ReactNode;
  /** Badge or indicator to show after the text */
  badge?: React.ReactNode;
}

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, variant, size, icon, badge, children, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(tabsTriggerVariants({ variant, size }), className)}
    {...props}
  >
    {icon && <span className="mr-2">{icon}</span>}
    {children}
    {badge && <span className="ml-2">{badge}</span>}
  </TabsPrimitive.Trigger>
));

TabsTrigger.displayName = 'TabsTrigger';

// Tabs Content
export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {}

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus-visible:outline-none',
      'data-[state=inactive]:hidden',
      className
    )}
    {...props}
  />
));

TabsContent.displayName = 'TabsContent';

export { tabsListVariants, tabsTriggerVariants };
