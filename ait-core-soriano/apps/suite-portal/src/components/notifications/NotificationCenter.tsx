"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCheck, Trash2, X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification, NotificationType } from '@/store/notifications.store';
import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as ScrollArea from '@radix-ui/react-scroll-area';

const typeIcons: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const typeColors: Record<NotificationType, string> = {
  success: 'text-green-600 dark:text-green-400',
  error: 'text-red-600 dark:text-red-400',
  warning: 'text-yellow-600 dark:text-yellow-400',
  info: 'text-blue-600 dark:text-blue-400',
};

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead } = useNotifications();
  const Icon = typeIcons[notification.type];

  const handleClick = () => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      onClose();
    }
  };

  const getTimeAgo = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`
        px-4 py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0
        ${notification.actionUrl ? 'cursor-pointer' : ''}
        ${!notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}
        hover:bg-gray-50 dark:hover:bg-gray-800/50
        transition-colors
      `}
      onClick={handleClick}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-4 h-4 ${typeColors[notification.type]}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            {!notification.read && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" />
            )}
          </div>
          <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
            {notification.message}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
            {getTimeAgo(notification.timestamp)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  thisWeek: Notification[];
  older: Notification[];
}

function groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  const groups: GroupedNotifications = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  };

  notifications.forEach((notification) => {
    const diff = now - notification.timestamp;

    if (diff < oneDayMs) {
      groups.today.push(notification);
    } else if (diff < 2 * oneDayMs) {
      groups.yesterday.push(notification);
    } else if (diff < oneWeekMs) {
      groups.thisWeek.push(notification);
    } else {
      groups.older.push(notification);
    }
  });

  return groups;
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NotificationCenter({
  open,
  onOpenChange,
  children,
}: NotificationCenterProps) {
  const { notifications, markAllAsRead, clearAll } = useNotifications();

  // Get last 50 notifications
  const recentNotifications = notifications.slice(0, 50);
  const grouped = groupNotificationsByDate(recentNotifications);

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;

    return (
      <div key={title}>
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {title}
          </p>
        </div>
        <AnimatePresence mode="popLayout">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClose={() => onOpenChange(false)}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <DropdownMenu.Root open={open} onOpenChange={onOpenChange}>
      <DropdownMenu.Trigger asChild>{children}</DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="w-[420px] max-w-[calc(100vw-32px)] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    title="Clear all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <ScrollArea.Root className="h-[400px] overflow-hidden">
            <ScrollArea.Viewport className="w-full h-full">
              {recentNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
                  <Bell className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No notifications</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    You're all caught up!
                  </p>
                </div>
              ) : (
                <div>
                  {renderGroup('Today', grouped.today)}
                  {renderGroup('Yesterday', grouped.yesterday)}
                  {renderGroup('This Week', grouped.thisWeek)}
                  {renderGroup('Older', grouped.older)}
                </div>
              )}
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar
              className="flex select-none touch-none p-0.5 bg-gray-100 dark:bg-gray-800 transition-colors duration-150 ease-out hover:bg-gray-200 dark:hover:bg-gray-700 data-[orientation=vertical]:w-2 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2"
              orientation="vertical"
            >
              <ScrollArea.Thumb className="flex-1 bg-gray-400 dark:bg-gray-600 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
            </ScrollArea.Scrollbar>
          </ScrollArea.Root>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
