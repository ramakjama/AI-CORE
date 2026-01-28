'use client';

// ============================================================================
// UserPresenceIndicator Component - User Status Indicator
// ============================================================================

import React from 'react';
import { motion } from 'framer-motion';
import { UserPresence, PresenceStatus } from '@/types/collaboration';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

export interface UserPresenceIndicatorProps {
  user: UserPresence;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const STATUS_CONFIG: Record<
  PresenceStatus,
  {
    color: string;
    bgColor: string;
    label: string;
    animate: boolean;
  }
> = {
  online: {
    color: 'bg-green-500',
    bgColor: 'bg-green-500/20',
    label: 'Online',
    animate: true,
  },
  idle: {
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-500/20',
    label: 'Idle',
    animate: false,
  },
  offline: {
    color: 'bg-gray-400',
    bgColor: 'bg-gray-400/20',
    label: 'Offline',
    animate: false,
  },
};

const SIZE_CONFIG = {
  sm: {
    dot: 'w-2 h-2',
    ring: 'w-3 h-3',
    label: 'text-xs',
  },
  md: {
    dot: 'w-3 h-3',
    ring: 'w-4 h-4',
    label: 'text-sm',
  },
  lg: {
    dot: 'w-4 h-4',
    ring: 'w-5 h-5',
    label: 'text-base',
  },
};

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  user,
  showLabel = false,
  size = 'md',
  className,
}) => {
  const statusConfig = STATUS_CONFIG[user.status];
  const sizeConfig = SIZE_CONFIG[size];

  const getLastSeenText = () => {
    if (user.status === 'online') {
      return 'Active now';
    }

    try {
      const lastSeenDistance = formatDistanceToNow(user.lastSeen, {
        addSuffix: true,
      });
      return `Last seen ${lastSeenDistance}`;
    } catch (error) {
      return 'Last seen recently';
    }
  };

  const PresenceIndicator = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative flex items-center justify-center">
        {/* Animated pulse ring for online status */}
        {statusConfig.animate && (
          <motion.div
            className={cn(
              'absolute rounded-full',
              sizeConfig.ring,
              statusConfig.bgColor
            )}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Status dot */}
        <div
          className={cn(
            'relative rounded-full',
            sizeConfig.dot,
            statusConfig.color
          )}
        />
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className={cn('font-medium', sizeConfig.label)}>
          {statusConfig.label}
        </span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{PresenceIndicator}</TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={cn('w-2 h-2 rounded-full', statusConfig.color)}
              />
              <span className="font-medium">
                {user.user?.name || 'Anonymous'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {getLastSeenText()}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

UserPresenceIndicator.displayName = 'UserPresenceIndicator';
