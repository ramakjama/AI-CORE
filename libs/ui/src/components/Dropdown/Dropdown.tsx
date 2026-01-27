import React, { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { Check, ChevronRight, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';

// Dropdown Menu Root
export const Dropdown = DropdownMenuPrimitive.Root;
export const DropdownTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownGroup = DropdownMenuPrimitive.Group;
export const DropdownPortal = DropdownMenuPrimitive.Portal;
export const DropdownSub = DropdownMenuPrimitive.Sub;
export const DropdownRadioGroup = DropdownMenuPrimitive.RadioGroup;

// Dropdown Content
export interface DropdownContentProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content> {
  sideOffset?: number;
}

export const DropdownContent = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  DropdownContentProps
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 min-w-[8rem] overflow-hidden',
        'bg-white dark:bg-secondary-900',
        'border border-secondary-200 dark:border-secondary-700',
        'rounded-md p-1 shadow-lg',
        'data-[state=open]:animate-fade-in',
        'data-[state=closed]:animate-fade-out',
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));

DropdownContent.displayName = 'DropdownContent';

// Dropdown Item
export interface DropdownItemProps
  extends React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> {
  inset?: boolean;
  variant?: 'default' | 'danger';
}

export const DropdownItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  DropdownItemProps
>(({ className, inset, variant = 'default', ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center',
      'rounded px-2 py-1.5 text-sm outline-none',
      'transition-colors',
      variant === 'default' && [
        'text-secondary-700 dark:text-secondary-300',
        'focus:bg-secondary-100 dark:focus:bg-secondary-800',
        'focus:text-secondary-900 dark:focus:text-secondary-100',
      ],
      variant === 'danger' && [
        'text-danger-600 dark:text-danger-400',
        'focus:bg-danger-50 dark:focus:bg-danger-900/20',
      ],
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));

DropdownItem.displayName = 'DropdownItem';

// Dropdown Checkbox Item
export const DropdownCheckboxItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center',
      'rounded py-1.5 pl-8 pr-2 text-sm outline-none',
      'text-secondary-700 dark:text-secondary-300',
      'focus:bg-secondary-100 dark:focus:bg-secondary-800',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownCheckboxItem.displayName = 'DropdownCheckboxItem';

// Dropdown Radio Item
export const DropdownRadioItem = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center',
      'rounded py-1.5 pl-8 pr-2 text-sm outline-none',
      'text-secondary-700 dark:text-secondary-300',
      'focus:bg-secondary-100 dark:focus:bg-secondary-800',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));

DropdownRadioItem.displayName = 'DropdownRadioItem';

// Dropdown Label
export const DropdownLabel = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      'px-2 py-1.5 text-xs font-semibold',
      'text-secondary-500 dark:text-secondary-400',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));

DropdownLabel.displayName = 'DropdownLabel';

// Dropdown Separator
export const DropdownSeparator = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn(
      '-mx-1 my-1 h-px bg-secondary-200 dark:bg-secondary-700',
      className
    )}
    {...props}
  />
));

DropdownSeparator.displayName = 'DropdownSeparator';

// Dropdown Shortcut (helper for keyboard shortcuts)
export interface DropdownShortcutProps
  extends React.HTMLAttributes<HTMLSpanElement> {}

export function DropdownShortcut({ className, ...props }: DropdownShortcutProps) {
  return (
    <span
      className={cn(
        'ml-auto text-xs tracking-widest text-secondary-400',
        className
      )}
      {...props}
    />
  );
}

// Dropdown Sub Trigger
export const DropdownSubTrigger = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center',
      'rounded px-2 py-1.5 text-sm outline-none',
      'text-secondary-700 dark:text-secondary-300',
      'focus:bg-secondary-100 dark:focus:bg-secondary-800',
      'data-[state=open]:bg-secondary-100 dark:data-[state=open]:bg-secondary-800',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));

DropdownSubTrigger.displayName = 'DropdownSubTrigger';

// Dropdown Sub Content
export const DropdownSubContent = forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[8rem] overflow-hidden',
      'bg-white dark:bg-secondary-900',
      'border border-secondary-200 dark:border-secondary-700',
      'rounded-md p-1 shadow-lg',
      'data-[state=open]:animate-fade-in',
      className
    )}
    {...props}
  />
));

DropdownSubContent.displayName = 'DropdownSubContent';
