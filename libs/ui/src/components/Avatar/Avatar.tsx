import React, { forwardRef } from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cva, type VariantProps } from 'class-variance-authority';
import { User } from 'lucide-react';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/format';

const avatarVariants = cva(
  [
    'relative flex shrink-0 items-center justify-center',
    'overflow-hidden rounded-full',
    'bg-secondary-100 dark:bg-secondary-800',
  ],
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
        '2xl': 'h-20 w-20 text-xl',
      },
      variant: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'circle',
    },
  }
);

const statusIndicatorVariants = cva(
  'absolute border-2 border-white dark:border-secondary-900 rounded-full',
  {
    variants: {
      status: {
        online: 'bg-success-500',
        offline: 'bg-secondary-400',
        busy: 'bg-danger-500',
        away: 'bg-warning-500',
      },
      size: {
        xs: 'h-1.5 w-1.5 bottom-0 right-0',
        sm: 'h-2 w-2 bottom-0 right-0',
        md: 'h-2.5 w-2.5 bottom-0 right-0',
        lg: 'h-3 w-3 bottom-0.5 right-0.5',
        xl: 'h-3.5 w-3.5 bottom-1 right-1',
        '2xl': 'h-4 w-4 bottom-1 right-1',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends VariantProps<typeof avatarVariants> {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Name to generate initials from */
  name?: string;
  /** Fallback content when no image or name */
  fallback?: React.ReactNode;
  /** Online status indicator */
  status?: AvatarStatus;
  /** Additional class names */
  className?: string;
}

/**
 * Avatar component built on Radix UI Avatar primitive.
 *
 * @example
 * <Avatar src="/avatar.jpg" alt="John Doe" />
 *
 * @example
 * <Avatar name="John Doe" status="online" />
 *
 * @example
 * <Avatar size="lg" variant="square" />
 */
export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(
  ({ src, alt, name, fallback, status, size, variant, className }, ref) => {
    const initials = name ? getInitials(name) : null;

    return (
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(avatarVariants({ size, variant }), className)}
      >
        <AvatarPrimitive.Image
          src={src}
          alt={alt || name}
          className="h-full w-full object-cover"
        />
        <AvatarPrimitive.Fallback
          className={cn(
            'flex h-full w-full items-center justify-center',
            'bg-secondary-200 dark:bg-secondary-700',
            'text-secondary-600 dark:text-secondary-300',
            'font-medium'
          )}
          delayMs={src ? 600 : 0}
        >
          {fallback || initials || <User className="h-1/2 w-1/2" />}
        </AvatarPrimitive.Fallback>

        {status && (
          <span
            className={cn(statusIndicatorVariants({ status, size }))}
            aria-label={`Status: ${status}`}
          />
        )}
      </AvatarPrimitive.Root>
    );
  }
);

Avatar.displayName = 'Avatar';

// Avatar Group
export interface AvatarGroupProps {
  /** Maximum number of avatars to show */
  max?: number;
  /** Avatar size */
  size?: VariantProps<typeof avatarVariants>['size'];
  /** Children avatars */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Avatar Group for displaying multiple avatars.
 *
 * @example
 * <AvatarGroup max={3}>
 *   <Avatar name="John Doe" />
 *   <Avatar name="Jane Doe" />
 *   <Avatar name="Bob Smith" />
 *   <Avatar name="Alice Johnson" />
 * </AvatarGroup>
 */
export function AvatarGroup({ max = 3, size = 'md', children, className }: AvatarGroupProps) {
  const avatars = React.Children.toArray(children);
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  return (
    <div className={cn('flex -space-x-2', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className="ring-2 ring-white dark:ring-secondary-900 rounded-full"
        >
          {React.isValidElement(avatar)
            ? React.cloneElement(avatar as React.ReactElement<AvatarProps>, { size })
            : avatar}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={cn(
            avatarVariants({ size }),
            'ring-2 ring-white dark:ring-secondary-900',
            'bg-secondary-200 dark:bg-secondary-700',
            'text-secondary-600 dark:text-secondary-300',
            'font-medium'
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export { avatarVariants };
