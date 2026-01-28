'use client';

// ============================================================================
// RemoteCursors Component - Display Remote User Cursors
// ============================================================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPresence } from '@/types/collaboration';
import { cn } from '@/lib/utils';

export interface RemoteCursorsProps {
  activeUsers: UserPresence[];
  localUserId: string;
  className?: string;
}

interface CursorProps {
  user: UserPresence;
  isIdle: boolean;
}

const Cursor: React.FC<CursorProps> = ({ user, isIdle }) => {
  const { cursor, color, user: userData } = user;

  if (!cursor || isIdle) return null;

  return (
    <motion.div
      key={user.userId}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      className="pointer-events-none absolute z-50"
      style={{
        left: `${cursor.x}px`,
        top: `${cursor.y}px`,
        transition: 'left 0.15s ease-out, top 0.15s ease-out',
      }}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <path
          d="M5.65376 12.3673L5 5L19 12.5294L11.6538 14.2941L9.11538 19.5L7.5 17.6863L10.0385 12.4811L5.65376 12.3673Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User label */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          'absolute left-5 top-2 whitespace-nowrap rounded px-2 py-1 text-xs font-medium text-white shadow-lg',
          'backdrop-blur-sm'
        )}
        style={{
          backgroundColor: color,
        }}
      >
        {userData?.name || 'Anonymous'}
      </motion.div>
    </motion.div>
  );
};

export const RemoteCursors: React.FC<RemoteCursorsProps> = ({
  activeUsers,
  localUserId,
  className,
}) => {
  // Filter out local user and calculate idle status
  const remoteCursors = useMemo(() => {
    const now = Date.now();
    const IDLE_THRESHOLD = 10000; // 10 seconds

    return activeUsers
      .filter((user) => user.userId !== localUserId)
      .map((user) => ({
        user,
        isIdle:
          now - user.lastActivity.getTime() > IDLE_THRESHOLD ||
          user.status !== 'online',
      }));
  }, [activeUsers, localUserId]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 z-40', className)}>
      <AnimatePresence mode="popLayout">
        {remoteCursors.map(({ user, isIdle }) => (
          <Cursor key={user.userId} user={user} isIdle={isIdle} />
        ))}
      </AnimatePresence>
    </div>
  );
};

RemoteCursors.displayName = 'RemoteCursors';
