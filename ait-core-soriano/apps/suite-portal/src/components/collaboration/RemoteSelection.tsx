'use client';

// ============================================================================
// RemoteSelection Component - Display Remote User Text Selections
// ============================================================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPresence } from '@/types/collaboration';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface RemoteSelectionProps {
  activeUsers: UserPresence[];
  localUserId: string;
  className?: string;
}

interface SelectionHighlightProps {
  user: UserPresence;
}

const SelectionHighlight: React.FC<SelectionHighlightProps> = ({ user }) => {
  const { selection, color, user: userData } = user;

  if (!selection) return null;

  const { start, end } = selection;

  // Calculate dimensions
  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  // Don't render if selection is too small
  if (width < 2 || height < 2) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            key={`selection-${user.userId}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'pointer-events-auto absolute rounded-sm',
              'border-2'
            )}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: color,
              borderColor: color,
              transition:
                'left 0.15s ease-out, top 0.15s ease-out, width 0.15s ease-out, height 0.15s ease-out',
            }}
          />
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs"
          style={{
            backgroundColor: color,
            borderColor: color,
          }}
        >
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-white">
              {userData?.name || 'Anonymous'}
            </div>
            {selection.content && (
              <div className="text-xs text-white/80 truncate max-w-[200px]">
                "{selection.content}"
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const RemoteSelection: React.FC<RemoteSelectionProps> = ({
  activeUsers,
  localUserId,
  className,
}) => {
  // Filter out local user and users without selections
  const remoteSelections = useMemo(() => {
    return activeUsers
      .filter(
        (user) =>
          user.userId !== localUserId &&
          user.selection &&
          user.status === 'online'
      );
  }, [activeUsers, localUserId]);

  if (remoteSelections.length === 0) return null;

  return (
    <div className={cn('absolute inset-0 z-30', className)}>
      <AnimatePresence mode="popLayout">
        {remoteSelections.map((user) => (
          <SelectionHighlight key={user.userId} user={user} />
        ))}
      </AnimatePresence>
    </div>
  );
};

RemoteSelection.displayName = 'RemoteSelection';
