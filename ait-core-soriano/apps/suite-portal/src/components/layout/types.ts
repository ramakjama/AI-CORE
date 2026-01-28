/**
 * Shared types for layout components
 */

import { LucideIcon } from 'lucide-react';

/**
 * App item configuration for sidebar and navigation
 */
export interface AppItem {
  id: string;
  name: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  description?: string;
  keywords?: string[];
  isPinned?: boolean;
  badge?: string | number;
}

/**
 * Navigation item for breadcrumbs and command menu
 */
export interface NavigationItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  keywords?: string[];
  shortcut?: string;
}

/**
 * Quick action item for command menu
 */
export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  keywords?: string[];
  shortcut?: string;
  disabled?: boolean;
}

/**
 * Recent file item
 */
export interface RecentFile {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'presentation' | 'file';
  path: string;
  lastOpened: Date;
  size?: number;
  thumbnail?: string;
}

/**
 * Breadcrumb item for navigation
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

/**
 * User menu item
 */
export interface UserMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'danger';
  separator?: boolean;
  disabled?: boolean;
}

/**
 * Notification item
 */
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Storage usage data
 */
export interface StorageUsage {
  used: number;
  total: number;
  unit: 'GB' | 'TB';
  percentage: number;
}

/**
 * Collaboration user (extended from store)
 */
export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  isActive: boolean;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
  };
}

/**
 * Layout configuration
 */
export interface LayoutConfig {
  sidebarWidth: {
    expanded: number;
    collapsed: number;
  };
  topbarHeight: number;
  mobileBreakpoint: number;
  enableAnimations: boolean;
  defaultTheme: 'light' | 'dark' | 'system';
}

/**
 * Command menu configuration
 */
export interface CommandMenuConfig {
  maxRecentFiles: number;
  maxSearchResults: number;
  enableFuzzySearch: boolean;
  shortcuts: {
    open: string;
    close: string;
  };
}

/**
 * Default layout configuration
 */
export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  sidebarWidth: {
    expanded: 280,
    collapsed: 80,
  },
  topbarHeight: 64,
  mobileBreakpoint: 1024,
  enableAnimations: true,
  defaultTheme: 'system',
};

/**
 * Default command menu configuration
 */
export const DEFAULT_COMMAND_MENU_CONFIG: CommandMenuConfig = {
  maxRecentFiles: 5,
  maxSearchResults: 10,
  enableFuzzySearch: true,
  shortcuts: {
    open: 'cmd+k',
    close: 'esc',
  },
};

/**
 * App gradient colors mapping
 */
export const APP_GRADIENTS = {
  blue: 'from-blue-500 to-cyan-500',
  purple: 'from-purple-500 to-pink-500',
  green: 'from-green-500 to-emerald-500',
  orange: 'from-orange-500 to-red-500',
  indigo: 'from-indigo-500 to-blue-500',
  rose: 'from-rose-500 to-pink-500',
  cyan: 'from-cyan-500 to-blue-500',
  yellow: 'from-yellow-500 to-orange-500',
  violet: 'from-violet-500 to-purple-500',
  teal: 'from-teal-500 to-cyan-500',
  amber: 'from-amber-500 to-yellow-500',
  lime: 'from-lime-500 to-green-500',
  sky: 'from-sky-500 to-indigo-500',
  gray: 'from-slate-500 to-gray-500',
} as const;

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  info: {
    color: 'blue',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-400',
  },
  success: {
    color: 'green',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-400',
  },
  warning: {
    color: 'yellow',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-400',
  },
  error: {
    color: 'red',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    textColor: 'text-red-700 dark:text-red-400',
  },
} as const;

/**
 * Animation variants for Framer Motion
 */
export const ANIMATION_VARIANTS = {
  sidebar: {
    open: { width: 280 },
    closed: { width: 80 },
  },
  backdrop: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  commandMenu: {
    hidden: { opacity: 0, scale: 0.95, y: -20 },
    visible: { opacity: 1, scale: 1, y: 0 },
  },
  mobileMenu: {
    hidden: { x: -280 },
    visible: { x: 0 },
  },
  content: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  },
} as const;

/**
 * Transition configurations
 */
export const TRANSITIONS = {
  default: {
    duration: 0.3,
    ease: [0.4, 0, 0.2, 1],
  },
  fast: {
    duration: 0.15,
    ease: [0.4, 0, 0.2, 1],
  },
  slow: {
    duration: 0.5,
    ease: [0.4, 0, 0.2, 1],
  },
  spring: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
} as const;

/**
 * Z-index layers
 */
export const Z_INDEX = {
  base: 0,
  sidebar: 10,
  topbar: 20,
  dropdown: 30,
  backdrop: 40,
  modal: 50,
  commandMenu: 50,
  tooltip: 60,
} as const;

/**
 * Breakpoints (matches Tailwind)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

/**
 * Helper type for gradient keys
 */
export type GradientKey = keyof typeof APP_GRADIENTS;

/**
 * Helper type for notification types
 */
export type NotificationType = keyof typeof NOTIFICATION_TYPES;
