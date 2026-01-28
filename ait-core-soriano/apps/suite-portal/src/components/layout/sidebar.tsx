"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Sheet,
  Presentation,
  Calendar,
  CheckSquare,
  Mail,
  HardDrive,
  Users,
  BarChart3,
  StickyNote,
  FormInput,
  CalendarCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import * as Tooltip from '@radix-ui/react-tooltip';

interface AppItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  gradient: string;
}

const apps: AppItem[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'documents',
    name: 'Documents',
    icon: FileText,
    href: '/documents',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    id: 'spreadsheets',
    name: 'Spreadsheets',
    icon: Sheet,
    href: '/spreadsheets',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'presentations',
    name: 'Presentations',
    icon: Presentation,
    href: '/presentations',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: Calendar,
    href: '/calendar',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'tasks',
    name: 'Tasks',
    icon: CheckSquare,
    href: '/tasks',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    id: 'mail',
    name: 'Mail',
    icon: Mail,
    href: '/mail',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: HardDrive,
    href: '/storage',
    gradient: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'crm',
    name: 'CRM',
    icon: Users,
    href: '/crm',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    gradient: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: StickyNote,
    href: '/notes',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'forms',
    name: 'Forms',
    icon: FormInput,
    href: '/forms',
    gradient: 'from-lime-500 to-green-500',
  },
  {
    id: 'bookings',
    name: 'Bookings',
    icon: CalendarCheck,
    href: '/bookings',
    gradient: 'from-sky-500 to-indigo-500',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: Settings,
    href: '/settings',
    gradient: 'from-slate-500 to-gray-500',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isSidebarOpen, toggleSidebar } = useAppStore();

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <Tooltip.Provider delayDuration={300}>
      <motion.aside
        initial={false}
        animate={{
          width: isSidebarOpen ? 280 : 80,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="relative h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <motion.div
            animate={{
              opacity: isSidebarOpen ? 1 : 0,
              display: isSidebarOpen ? 'block' : 'none',
            }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">AIT</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                AIT Suite
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Portal
              </p>
            </div>
          </motion.div>

          {!isSidebarOpen && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">AIT</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {apps.map((app) => {
            const Icon = app.icon;
            const active = isActive(app.href);

            const linkContent = (
              <Link
                href={app.href}
                className={`
                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-all duration-200 group
                  ${
                    active
                      ? 'bg-gradient-to-r ' + app.gradient + ' text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    active ? 'scale-110' : 'group-hover:scale-110'
                  }`}
                />
                <motion.span
                  animate={{
                    opacity: isSidebarOpen ? 1 : 0,
                    display: isSidebarOpen ? 'block' : 'none',
                  }}
                  transition={{ duration: 0.2 }}
                  className="font-medium text-sm whitespace-nowrap"
                >
                  {app.name}
                </motion.span>

                {active && isSidebarOpen && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 w-1 h-8 bg-white/30 rounded-r"
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );

            if (!isSidebarOpen) {
              return (
                <Tooltip.Root key={app.id}>
                  <Tooltip.Trigger asChild>
                    <div>{linkContent}</div>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content
                      side="right"
                      sideOffset={8}
                      className="px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg z-50"
                    >
                      {app.name}
                      <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              );
            }

            return <div key={app.id}>{linkContent}</div>;
          })}
        </nav>

        {/* Footer - Storage Usage */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <motion.div
            animate={{
              opacity: isSidebarOpen ? 1 : 0,
              display: isSidebarOpen ? 'block' : 'none',
            }}
            transition={{ duration: 0.2 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Storage</span>
              <span className="font-medium">15 GB / 100 GB</span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '15%' }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              85 GB available
            </p>
          </motion.div>

          {!isSidebarOpen && (
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div className="flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={8}
                  className="px-3 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg z-50"
                >
                  Storage: 15 GB / 100 GB
                  <Tooltip.Arrow className="fill-gray-900 dark:fill-gray-700" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-lg flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-10"
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isSidebarOpen ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
      </motion.aside>
    </Tooltip.Provider>
  );
}
