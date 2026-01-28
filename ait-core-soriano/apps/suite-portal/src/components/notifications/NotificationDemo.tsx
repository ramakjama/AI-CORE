"use client";

import { useNotifications } from '@/hooks/use-notifications';
import { NotificationType } from '@/store/notifications.store';
import { Bell, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

/**
 * Demo component to test notifications
 * Add this to any page to test the notification system
 *
 * Example usage:
 * import { NotificationDemo } from '@/components/notifications/NotificationDemo';
 *
 * <NotificationDemo />
 */
export function NotificationDemo() {
  const { addNotification, isConnected } = useNotifications();

  const testNotifications: Array<{
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }> = [
    {
      type: 'success',
      title: 'Task Completed',
      message: 'Your export has been completed successfully.',
      actionUrl: '/tasks',
      actionLabel: 'View Tasks',
    },
    {
      type: 'error',
      title: 'Error Occurred',
      message: 'Failed to process your request. Please try again.',
      actionUrl: '/settings',
      actionLabel: 'Check Settings',
    },
    {
      type: 'warning',
      title: 'Storage Almost Full',
      message: 'You are using 95% of your storage quota.',
      actionUrl: '/storage',
      actionLabel: 'Manage Storage',
    },
    {
      type: 'info',
      title: 'New Feature Available',
      message: 'Check out our new AI-powered analytics dashboard.',
      actionUrl: '/analytics',
      actionLabel: 'Explore Now',
    },
  ];

  const handleTestNotification = (type: NotificationType) => {
    const notification = testNotifications.find((n) => n.type === type);
    if (notification) {
      addNotification(notification);
    }
  };

  const handleRandomNotification = () => {
    const random = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    addNotification(random);
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 p-4 w-80">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Notification Demo
        </h3>
      </div>

      <div className="flex items-center gap-2 mb-3 text-xs">
        <span className="text-gray-600 dark:text-gray-400">WebSocket:</span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            isConnected
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => handleTestNotification('success')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-sm font-medium"
        >
          <CheckCircle className="w-4 h-4" />
          Success Notification
        </button>

        <button
          onClick={() => handleTestNotification('error')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
        >
          <AlertCircle className="w-4 h-4" />
          Error Notification
        </button>

        <button
          onClick={() => handleTestNotification('warning')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-sm font-medium"
        >
          <AlertTriangle className="w-4 h-4" />
          Warning Notification
        </button>

        <button
          onClick={() => handleTestNotification('info')}
          className="w-full flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
        >
          <Info className="w-4 h-4" />
          Info Notification
        </button>

        <button
          onClick={handleRandomNotification}
          className="w-full px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
        >
          Random Notification
        </button>
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
        Click any button to trigger a test notification
      </p>
    </div>
  );
}
