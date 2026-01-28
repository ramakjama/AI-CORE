"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification, NotificationType } from '@/store/notifications.store';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  index: number;
}

const typeConfig: Record<
  NotificationType,
  {
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    borderColor: string;
    iconColor: string;
  }
> = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

export function NotificationToast({
  notification,
  onClose,
  index,
}: NotificationToastProps) {
  const router = useRouter();
  const [isExiting, setIsExiting] = useState(false);
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  useEffect(() => {
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification.id]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const handleClick = () => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      handleClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.95 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        x: isExiting ? 100 : 0,
        scale: isExiting ? 0.95 : 1,
        y: index * -80,
      }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{
        duration: 0.3,
        ease: 'easeOut',
      }}
      className="fixed bottom-6 right-6 z-50"
      style={{
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
      }}
    >
      <div
        className={`
          ${config.bgColor} ${config.borderColor}
          border rounded-lg shadow-lg backdrop-blur-sm
          ${notification.actionUrl ? 'cursor-pointer' : ''}
        `}
        onClick={notification.actionUrl ? handleClick : undefined}
      >
        <div className="p-4">
          <div className="flex gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                {notification.message}
              </p>

              {/* Action Button */}
              {notification.actionUrl && notification.actionLabel && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick();
                  }}
                  className={`
                    mt-2 text-sm font-medium
                    ${config.iconColor}
                    hover:underline
                  `}
                >
                  {notification.actionLabel}
                </button>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: 5, ease: 'linear' }}
          className={`h-1 ${config.iconColor.replace('text-', 'bg-')} opacity-30`}
        />
      </div>
    </motion.div>
  );
}

interface NotificationToastContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export function NotificationToastContainer({
  notifications,
  onClose,
}: NotificationToastContainerProps) {
  // Show only unread notifications
  const unreadNotifications = notifications
    .filter((n) => !n.read)
    .slice(0, 3); // Show max 3 toasts at once

  return (
    <AnimatePresence mode="sync">
      {unreadNotifications.map((notification, index) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={onClose}
          index={index}
        />
      ))}
    </AnimatePresence>
  );
}
