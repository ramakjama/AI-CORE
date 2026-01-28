'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/ui-store';
import { useAuthStore } from '@/store/auth-store';
import {
  LayoutDashboard,
  FileText,
  Users,
  Shield,
  FileSpreadsheet,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building,
  AlertCircle,
  BarChart3,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Polizas',
    href: '/polizas',
    icon: Shield,
    roles: ['admin', 'manager', 'agent'],
  },
  {
    title: 'Clientes',
    href: '/clientes',
    icon: Users,
    roles: ['admin', 'manager', 'agent'],
  },
  {
    title: 'Siniestros',
    href: '/siniestros',
    icon: AlertCircle,
    roles: ['admin', 'manager', 'agent'],
  },
  {
    title: 'Documentos',
    href: '/documentos',
    icon: FileText,
    roles: ['admin', 'manager', 'agent'],
  },
  {
    title: 'Informes',
    href: '/informes',
    icon: BarChart3,
    roles: ['admin', 'manager'],
  },
  {
    title: 'Notificaciones',
    href: '/notificaciones',
    icon: Bell,
  },
  {
    title: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    roles: ['admin', 'manager'],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { user } = useAuthStore();

  const filteredNavItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <Building className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">AIT-CORE</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebarCollapsed}
            className={cn('h-8 w-8', sidebarCollapsed && 'mx-auto')}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  sidebarCollapsed && 'justify-center'
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1">{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="border-t p-3">
          {user && (
            <Link
              href="/perfil"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors',
                sidebarCollapsed && 'justify-center'
              )}
              title={sidebarCollapsed ? user.name : undefined}
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>
                  {user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex flex-col overflow-hidden">
                  <span className="text-sm font-medium truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate capitalize">
                    {user.role}
                  </span>
                </div>
              )}
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
