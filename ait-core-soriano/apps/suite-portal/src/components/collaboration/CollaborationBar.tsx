'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { useCollaborationStore } from '@/store/collaboration.store';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Props for CollaborationBar component
 */
export interface CollaborationBarProps {
  /** Connection status */
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Get initials from name
 */
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Get status color
 */
const getStatusColor = (status: CollaborationBarProps['status']): string => {
  switch (status) {
    case 'connected':
      return 'bg-green-500';
    case 'connecting':
      return 'bg-yellow-500';
    case 'disconnected':
      return 'bg-gray-500';
    case 'error':
      return 'bg-red-500';
  }
};

/**
 * Get status icon
 */
const getStatusIcon = (status: CollaborationBarProps['status']) => {
  switch (status) {
    case 'connected':
      return <Wifi className="w-3 h-3" />;
    case 'connecting':
      return <Wifi className="w-3 h-3 animate-pulse" />;
    case 'disconnected':
      return <WifiOff className="w-3 h-3" />;
    case 'error':
      return <AlertCircle className="w-3 h-3" />;
  }
};

/**
 * Get status text
 */
const getStatusText = (status: CollaborationBarProps['status']): string => {
  switch (status) {
    case 'connected':
      return 'Connected';
    case 'connecting':
      return 'Connecting...';
    case 'disconnected':
      return 'Disconnected';
    case 'error':
      return 'Connection Error';
  }
};

/**
 * User Avatar Component
 */
interface UserAvatarProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    color: string;
    isActive: boolean;
  };
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar: React.FC<UserAvatarProps> = ({ user, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <Avatar className={cn(sizeClasses[size], 'border-2')} style={{ borderColor: user.color }}>
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback style={{ backgroundColor: user.color + '20', color: user.color }}>
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background',
                user.isActive ? 'bg-green-500' : 'bg-gray-400'
              )}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">
            {user.isActive ? 'Active' : 'Idle'}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * CollaborationBar Component
 *
 * Displays active users, connection status, and collaboration information
 */
export const CollaborationBar: React.FC<CollaborationBarProps> = ({ status, className }) => {
  const { activeUsers, isCollaborating } = useCollaborationStore();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Don't show if not collaborating
  if (!isCollaborating) {
    return null;
  }

  const activeUserCount = activeUsers.filter((u) => u.isActive).length;
  const statusColor = getStatusColor(status);
  const statusIcon = getStatusIcon(status);
  const statusText = getStatusText(status);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'flex items-center gap-3 px-4 py-2 bg-card border-b',
        className
      )}
    >
      {/* Connection Status Indicator */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2">
              <motion.div
                animate={status === 'connecting' ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: status === 'connecting' ? Infinity : 0, duration: 1.5 }}
                className={cn('w-2 h-2 rounded-full', statusColor)}
              />
              <div className="text-muted-foreground">{statusIcon}</div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{statusText}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Active Users */}
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent hover:bg-accent/80 transition-colors"
          >
            {/* User Avatars (first 3) */}
            <div className="flex -space-x-2">
              <AnimatePresence mode="popLayout">
                {activeUsers.slice(0, 3).map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ zIndex: 3 - index }}
                  >
                    <UserAvatar user={user} size="sm" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* User Count Badge */}
            <Badge variant="secondary" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {activeUsers.length}
            </Badge>
          </motion.button>
        </PopoverTrigger>

        {/* User List Popover */}
        <PopoverContent className="w-80" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Active Users</h3>
              <Badge variant="outline">{activeUserCount} active</Badge>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <AnimatePresence mode="popLayout">
                {activeUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors"
                  >
                    <UserAvatar user={user} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.isActive ? 'Active now' : 'Idle'}
                      </p>
                    </div>
                    <motion.div
                      animate={{
                        scale: user.isActive ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        repeat: user.isActive ? Infinity : 0,
                        duration: 2,
                      }}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        user.isActive ? 'bg-green-500' : 'bg-gray-400'
                      )}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {activeUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No other users online</p>
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Collaboration Info */}
      <div className="flex-1 text-sm text-muted-foreground">
        {activeUsers.length > 0 && (
          <span>
            Collaborating with{' '}
            <span className="font-medium text-foreground">
              {activeUsers.length === 1
                ? activeUsers[0].name
                : `${activeUsers.length} others`}
            </span>
          </span>
        )}
      </div>
    </motion.div>
  );
};

export default CollaborationBar;
