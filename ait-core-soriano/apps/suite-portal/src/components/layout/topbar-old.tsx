"use client";

import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import {
  Search,
  Sparkles,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { useAuthStore } from '@/store/auth.store';
import { useCollaborationStore } from '@/store/collaboration.store';
import { useAIAssistantStore } from '@/store/ai-assistant.store';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { NotificationToastContainer } from '@/components/notifications/NotificationToast';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { useState, useEffect } from 'react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/documents': 'Documents',
  '/spreadsheets': 'Spreadsheets',
  '/presentations': 'Presentations',
  '/calendar': 'Calendar',
  '/tasks': 'Tasks',
  '/mail': 'Mail',
  '/storage': 'Storage',
  '/crm': 'CRM',
  '/analytics': 'Analytics',
  '/notes': 'Notes',
  '/forms': 'Forms',
  '/bookings': 'Bookings',
  '/settings': 'Settings',
};

export function Topbar() {
  const pathname = usePathname();
  const { toggleCommandMenu, isDarkMode, toggleDarkMode, toggleAIAssistant } =
    useAppStore();
  const { user, logout } = useAuthStore();
  const { activeUsers } = useCollaborationStore();
  const { unreadCount: aiUnreadCount, resetUnreadCount: resetAIUnreadCount } = useAIAssistantStore();
  const { notifications, unreadCount, removeNotification } = useNotifications();
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [hasNewAIMessage, setHasNewAIMessage] = useState(false);

  // Trigger pulse animation when new notification arrives
  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      const timer = setTimeout(() => setHasNewNotification(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Trigger pulse animation when new AI message arrives
  useEffect(() => {
    if (aiUnreadCount > 0) {
      setHasNewAIMessage(true);
      const timer = setTimeout(() => setHasNewAIMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [aiUnreadCount]);

  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (!pathname) return [];

    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;
      const title = routeTitles[currentPath] || segment;
      breadcrumbs.push({
        label: title.charAt(0).toUpperCase() + title.slice(1),
        href: currentPath,
      });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const title = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  return (
    <>
      {/* Toast Notifications */}
      <NotificationToastContainer
        notifications={notifications}
        onClose={removeNotification}
      />

      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6">
        {/* Left - Title/Breadcrumbs */}
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {title}
        </h1>
        {breadcrumbs.length > 1 && (
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {breadcrumbs.slice(0, -1).map((crumb, index) => (
              <span key={index} className="flex items-center gap-2">
                <span>/</span>
                <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                  {crumb.label}
                </span>
              </span>
            ))}
          </nav>
        )}
      </div>

      {/* Center - Search */}
      <button
        onClick={toggleCommandMenu}
        className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-[300px]"
      >
        <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-sm text-gray-500 dark:text-gray-400 flex-1 text-left">
          Search or type a command...
        </span>
        <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
          ⌘K
        </kbd>
      </button>

      {/* Right - Actions */}
      <div className="flex items-center gap-3">
        {/* Collaboration Avatars */}
        {activeUsers.length > 0 && (
          <div className="flex items-center -space-x-2">
            {activeUsers.slice(0, 3).map((collaborator) => (
              <Avatar.Root
                key={collaborator.id}
                className="relative inline-flex w-8 h-8 rounded-full border-2 border-white dark:border-gray-900"
              >
                <Avatar.Image
                  src={collaborator.avatar}
                  alt={collaborator.name}
                  className="w-full h-full rounded-full object-cover"
                />
                <Avatar.Fallback
                  className="w-full h-full rounded-full flex items-center justify-center text-xs font-medium text-white"
                  style={{ backgroundColor: collaborator.color }}
                >
                  {collaborator.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </Avatar.Fallback>
                {collaborator.isActive && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                )}
              </Avatar.Root>
            ))}
            {activeUsers.length > 3 && (
              <div className="relative inline-flex w-8 h-8 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 items-center justify-center text-xs font-medium text-gray-700 dark:text-gray-300">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Button */}
        <button
          onClick={() => {
            toggleAIAssistant();
            resetAIUnreadCount();
          }}
          className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
          aria-label="AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
          {aiUnreadCount > 0 ? (
            <>
              <motion.span
                key={aiUnreadCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-purple-500 text-white text-xs font-semibold rounded-full flex items-center justify-center"
              >
                {aiUnreadCount > 99 ? '99+' : aiUnreadCount}
              </motion.span>
              {hasNewAIMessage && (
                <motion.span
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: 2,
                    ease: 'easeInOut',
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-purple-400 rounded-full"
                />
              )}
            </>
          ) : (
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1 right-1 w-2 h-2 bg-purple-500 rounded-full"
            />
          )}
        </button>

        {/* Notifications */}
        <NotificationCenter
          open={notificationCenterOpen}
          onOpenChange={setNotificationCenterOpen}
        >
          <button
            className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <>
                <motion.span
                  key={unreadCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </motion.span>
                {hasNewNotification && (
                  <motion.span
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: 2,
                      ease: 'easeInOut',
                    }}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-400 rounded-full"
                  />
                )}
              </>
            )}
          </button>
        </NotificationCenter>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* User Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <Avatar.Root className="w-8 h-8">
                <Avatar.Image
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  className="w-full h-full rounded-full object-cover"
                />
                <Avatar.Fallback className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  {user?.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase() || 'U'}
                </Avatar.Fallback>
              </Avatar.Root>
              <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="min-w-[220px] bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-1 z-50"
            >
              {/* User Info */}
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || 'user@example.com'}
                </p>
              </div>

              {/* Menu Items */}
              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </DropdownMenu.Item>

              <DropdownMenu.Item className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer outline-none">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

              <DropdownMenu.Item
                onClick={logout}
                className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded cursor-pointer outline-none"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
    </>
  );
}
