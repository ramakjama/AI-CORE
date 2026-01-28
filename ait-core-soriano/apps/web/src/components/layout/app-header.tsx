'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, LogOut, Moon, Search, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useNotificationStore } from '@/store/notification-store';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, sidebarCollapsed } = useUIStore();
  const { unreadCount } = useNotificationStore();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      className={cn(
        'fixed top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
        sidebarCollapsed ? 'left-16' : 'left-64'
      )}
      style={{ width: sidebarCollapsed ? 'calc(100% - 4rem)' : 'calc(100% - 16rem)' }}
    >
      <div className="flex flex-1 items-center gap-4 px-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar polizas, clientes, siniestros..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 px-6">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </Button>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 min-w-[20px] rounded-full px-1 text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notificaciones</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => router.push('/notificaciones')}
                >
                  Ver todas
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {unreadCount === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No hay notificaciones nuevas
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                <DropdownMenuItem
                  onClick={() => router.push('/notificaciones')}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Tienes {unreadCount} notificaciones nuevas</p>
                    <p className="text-xs text-muted-foreground">
                      Haz clic para ver todas
                    </p>
                  </div>
                </DropdownMenuItem>
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>
                    {user.name
                      .split(' ')
                      .map(n => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/perfil')}>
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/configuracion')}>
                <Bell className="mr-2 h-4 w-4" />
                <span>Configuración</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
