"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
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
  Plus,
  Upload,
  Download,
  Share2,
  Clock,
  File,
} from 'lucide-react';
import { useAppStore } from '@/store/app.store';
import { useCommandK } from '@/hooks/use-command-k';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  keywords?: string[];
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  keywords?: string[];
}

interface RecentFile {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation';
  path: string;
  lastOpened: Date;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    keywords: ['home', 'overview'],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: FileText,
    href: '/documents',
    keywords: ['docs', 'text', 'writing'],
  },
  {
    id: 'spreadsheets',
    label: 'Spreadsheets',
    icon: Sheet,
    href: '/spreadsheets',
    keywords: ['sheets', 'excel', 'data'],
  },
  {
    id: 'presentations',
    label: 'Presentations',
    icon: Presentation,
    href: '/presentations',
    keywords: ['slides', 'powerpoint', 'deck'],
  },
  {
    id: 'calendar',
    label: 'Calendar',
    icon: Calendar,
    href: '/calendar',
    keywords: ['events', 'schedule'],
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    href: '/tasks',
    keywords: ['todos', 'checklist'],
  },
  {
    id: 'mail',
    label: 'Mail',
    icon: Mail,
    href: '/mail',
    keywords: ['email', 'inbox'],
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: HardDrive,
    href: '/storage',
    keywords: ['files', 'drive'],
  },
  {
    id: 'crm',
    label: 'CRM',
    icon: Users,
    href: '/crm',
    keywords: ['customers', 'contacts', 'clients'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/analytics',
    keywords: ['reports', 'insights', 'data'],
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: StickyNote,
    href: '/notes',
    keywords: ['memo', 'notepad'],
  },
  {
    id: 'forms',
    label: 'Forms',
    icon: FormInput,
    href: '/forms',
    keywords: ['survey', 'questionnaire'],
  },
  {
    id: 'bookings',
    label: 'Bookings',
    icon: CalendarCheck,
    href: '/bookings',
    keywords: ['appointments', 'reservations'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/settings',
    keywords: ['preferences', 'config'],
  },
];

export function CommandMenu() {
  const router = useRouter();
  const { isCommandMenuOpen, setCommandMenuOpen } = useAppStore();
  const [search, setSearch] = useState('');
  const [recentFiles] = useState<RecentFile[]>([
    {
      id: '1',
      name: 'Q4 Marketing Strategy.docx',
      type: 'document',
      path: '/documents/q4-marketing',
      lastOpened: new Date(),
    },
    {
      id: '2',
      name: 'Sales Report 2024.xlsx',
      type: 'spreadsheet',
      path: '/spreadsheets/sales-report',
      lastOpened: new Date(),
    },
    {
      id: '3',
      name: 'Product Launch.pptx',
      type: 'presentation',
      path: '/presentations/product-launch',
      lastOpened: new Date(),
    },
  ]);

  useCommandK();

  const quickActions: QuickAction[] = [
    {
      id: 'new-document',
      label: 'New Document',
      icon: Plus,
      onSelect: () => {
        router.push('/documents/new');
        setCommandMenuOpen(false);
      },
      keywords: ['create', 'doc'],
    },
    {
      id: 'upload',
      label: 'Upload Files',
      icon: Upload,
      onSelect: () => {
        setCommandMenuOpen(false);
      },
      keywords: ['import'],
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share2,
      onSelect: () => {
        setCommandMenuOpen(false);
      },
      keywords: ['collaborate'],
    },
    {
      id: 'export',
      label: 'Export',
      icon: Download,
      onSelect: () => {
        setCommandMenuOpen(false);
      },
      keywords: ['download', 'save'],
    },
  ];

  const handleClose = useCallback(() => {
    setCommandMenuOpen(false);
    setSearch('');
  }, [setCommandMenuOpen]);

  const handleNavigate = useCallback(
    (href: string) => {
      router.push(href);
      handleClose();
    },
    [router, handleClose]
  );

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCommandMenuOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isCommandMenuOpen, handleClose]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'document':
        return FileText;
      case 'spreadsheet':
        return Sheet;
      case 'presentation':
        return Presentation;
      default:
        return File;
    }
  };

  return (
    <AnimatePresence>
      {isCommandMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Command Menu */}
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="w-full max-w-2xl mx-4"
            >
              <Command
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl overflow-hidden"
                label="Command Menu"
                shouldFilter={true}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <Search className="w-5 h-5 text-gray-400" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search apps, files, or type a command..."
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 text-sm"
                  />
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                    ESC
                  </kbd>
                </div>

                {/* Command List */}
                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found.
                  </Command.Empty>

                  {/* Navigation */}
                  <Command.Group
                    heading="Navigation"
                    className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"
                  >
                    {navigationItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Command.Item
                          key={item.id}
                          value={`${item.label} ${item.keywords?.join(' ') || ''}`}
                          onSelect={() => handleNavigate(item.href)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">
                            {item.label}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  <Command.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                  {/* Quick Actions */}
                  <Command.Group
                    heading="Quick Actions"
                    className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"
                  >
                    {quickActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <Command.Item
                          key={action.id}
                          value={`${action.label} ${action.keywords?.join(' ') || ''}`}
                          onSelect={action.onSelect}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <span className="flex-1 text-sm text-gray-900 dark:text-white">
                            {action.label}
                          </span>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>

                  <Command.Separator className="h-px bg-gray-200 dark:bg-gray-700 my-2" />

                  {/* Recent Files */}
                  <Command.Group
                    heading="Recent Files"
                    className="px-2 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400"
                  >
                    {recentFiles.map((file) => {
                      const Icon = getFileIcon(file.type);
                      return (
                        <Command.Item
                          key={file.id}
                          value={file.name}
                          onSelect={() => handleNavigate(file.path)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected=true]:bg-gray-100 dark:data-[selected=true]:bg-gray-800 transition-colors"
                        >
                          <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 dark:text-white truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {file.lastOpened.toLocaleDateString()}
                            </p>
                          </div>
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                </Command.List>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                        ↑↓
                      </kbd>
                      Navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                        ↵
                      </kbd>
                      Select
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded">
                      ESC
                    </kbd>{' '}
                    to close
                  </span>
                </div>
              </Command>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
