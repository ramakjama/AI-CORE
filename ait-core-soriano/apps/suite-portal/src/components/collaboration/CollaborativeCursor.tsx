'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCollaborationStore, CollaborationUser } from '@/store/collaboration.store';
import { cn } from '@/lib/utils';

/**
 * Props for CollaborativeCursor component
 */
export interface CollaborativeCursorProps {
  /** User whose cursor to render */
  user: CollaborationUser;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show the cursor */
  visible?: boolean;
}

/**
 * Single Collaborative Cursor Component
 *
 * Renders a single user's cursor with their name label
 */
export const CollaborativeCursor: React.FC<CollaborativeCursorProps> = ({
  user,
  className,
  visible = true,
}) => {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    // Mark user as idle after 30 seconds of no cursor movement
    const idleTimeout = setTimeout(() => {
      setIsIdle(true);
    }, 30000);

    return () => clearTimeout(idleTimeout);
  }, [user.cursor]);

  // Don't render if cursor position is not available or user is idle
  if (!visible || !user.cursor || isIdle || !user.isActive) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      style={{
        position: 'fixed',
        left: user.cursor.x,
        top: user.cursor.y,
        pointerEvents: 'none',
        zIndex: 9999,
        transform: 'translate(-50%, -50%)',
      }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      className={className}
    >
      {/* Cursor SVG */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
        }}
      >
        <path
          d="M5.65376 12.3673L5.46026 5.96973L15.2915 12.3673L10.5701 13.6835L8.51687 18.4053L5.65376 12.3673Z"
          fill={user.color}
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* User Name Label */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          backgroundColor: user.color,
          marginTop: '4px',
          marginLeft: '12px',
        }}
        className="px-2 py-1 rounded text-white text-xs font-medium whitespace-nowrap shadow-lg"
      >
        {user.name}
      </motion.div>
    </motion.div>
  );
};

/**
 * Props for CollaborativeCursors component
 */
export interface CollaborativeCursorsProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether to show cursors */
  visible?: boolean;
}

/**
 * Collaborative Cursors Container Component
 *
 * Renders all active users' cursors
 */
export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  className,
  visible = true,
}) => {
  const { activeUsers, isCollaborating } = useCollaborationStore();

  if (!isCollaborating || !visible) {
    return null;
  }

  return (
    <div className={cn('fixed inset-0 pointer-events-none', className)}>
      <AnimatePresence mode="popLayout">
        {activeUsers
          .filter((user) => user.cursor && user.isActive)
          .map((user) => (
            <CollaborativeCursor key={user.id} user={user} visible={visible} />
          ))}
      </AnimatePresence>
    </div>
  );
};

/**
 * Props for CursorPosition component (for debugging)
 */
export interface CursorPositionProps {
  /** Current cursor position */
  position: { x: number; y: number } | null;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Cursor Position Indicator (for debugging)
 *
 * Shows the current user's cursor position
 */
export const CursorPositionIndicator: React.FC<CursorPositionProps> = ({
  position,
  className,
}) => {
  if (!position) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 px-3 py-2 bg-black/80 text-white text-xs rounded-md font-mono',
        className
      )}
      style={{ zIndex: 10000 }}
    >
      X: {Math.round(position.x)}, Y: {Math.round(position.y)}
    </div>
  );
};

/**
 * Hook to track mouse position
 */
export const useMousePosition = () => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return position;
};

/**
 * Hook to sync cursor position with collaboration
 */
export const useCursorSync = (manager: any) => {
  const position = useMousePosition();
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    if (!manager || !position) return;

    const now = Date.now();
    // Throttle updates to every 50ms
    if (now - lastUpdate < 50) return;

    manager.updateCursorPosition({
      anchor: position.x,
      head: position.y,
    });

    setLastUpdate(now);
  }, [position, manager, lastUpdate]);

  return position;
};

export default CollaborativeCursors;
