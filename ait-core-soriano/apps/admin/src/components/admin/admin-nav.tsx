'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Box,
  Bot,
  Users,
  Settings,
  Activity,
  Shield,
  Database,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Modules', href: '/admin/modules', icon: Box },
  { name: 'AI Agents', href: '/admin/agents', icon: Bot },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'System Health', href: '/admin/health', icon: Activity },
  { name: 'Database', href: '/admin/database', icon: Database },
  { name: 'Security', href: '/admin/security', icon: Shield },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r">
      <div className="p-6">
        <h1 className="text-xl font-bold">AIT-CORE</h1>
        <p className="text-sm text-muted-foreground">Admin Panel</p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
