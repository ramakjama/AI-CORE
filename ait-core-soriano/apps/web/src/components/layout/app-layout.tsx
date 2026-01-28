'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './app-sidebar';
import { AppHeader } from './app-header';
import { useUIStore } from '@/store/ui-store';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setIsMobile } = useUIStore();

  // Check if we're on an auth page
  const isAuthPage = pathname.startsWith('/auth');

  // Initialize auth
  useAuth(!isAuthPage);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, [setIsMobile]);

  // Don't show layout on auth pages
  if (isAuthPage) {
    return (
      <>
        {children}
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <AppSidebar />
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        <AppHeader />
        <main className="min-h-[calc(100vh-4rem)] pt-16">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
